import { GoogleGenAI } from "@google/genai";
import { createAdminClient } from "@/lib/supabase/admin";
import { searchProducts } from "@/lib/retrieval/search-products";
import { describeFilters, hasFilters } from "@/lib/retrieval/parse-filters";
import { buildFallbackMessage, isRetryableModelError } from "@/lib/chat-fallback";
import { formatPoliciesForPrompt } from "@/lib/store-policies";
import { MINIMAL_THINKING, TEXT_MODEL } from "@/lib/gemini-models";

// ── Lazy-initialized client ────────────────────────

let _ai: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!_ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set");
    }
    _ai = new GoogleGenAI({ apiKey });
  }
  return _ai;
}

// ── Types ──────────────────────────────────────────

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatResponse {
  message: string;
  product_ids: string[];
  conversation_id: string;
  /** true when the answer model was unavailable and the reply was built from retrieved data. */
  fallback?: true;
}

// ── Get or create conversation ─────────────────────

async function getOrCreateConversation(
  conversationId?: string,
  customerId?: string,
  sessionId?: string,
): Promise<string> {
  const supabase = createAdminClient();

  if (conversationId) {
    const { data } = await supabase
      .from("chat_conversations")
      .select("id")
      .eq("id", conversationId)
      .single();

    if (data) return data.id;
  }

  const { data, error } = await supabase
    .from("chat_conversations")
    .insert({
      customer_id: customerId ?? null,
      session_id: sessionId ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error("Failed to create conversation");
  }

  return data.id;
}

// ── Get conversation history ───────────────────────

/** The latest `limit` messages, oldest first. */
export async function getConversationHistory(
  conversationId: string,
  limit: number = 10,
): Promise<ChatMessage[]> {
  const supabase = createAdminClient();

  // Newest first so the limit keeps the latest messages, then back into reading order.
  const { data, error } = await supabase
    .from("chat_messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];

  return (data ?? []).reverse().map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));
}

// ── Save message ───────────────────────────────────

async function saveMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string,
  contextProductIds: string[] = [],
): Promise<void> {
  const supabase = createAdminClient();

  await supabase.from("chat_messages").insert({
    conversation_id: conversationId,
    role,
    content,
    context_product_ids: contextProductIds,
  });

  // Update conversation timestamp
  await supabase
    .from("chat_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);
}

// ── Product context for chat ──────────────────────

interface ProductContext {
  contextText: string;
  productIds: string[];
  /** Real matches only; featured padding is never listed here. */
  matched: ProductForPrompt[];
  /** Set when the customer's filters excluded every product. */
  unmatchedFilters?: string;
}

function formatProduct(p: ProductForPrompt, i: number): string {
  const parts = [
    `[Product ${i + 1}] ${p.name}`,
    `Price: ₹${p.price.toLocaleString("en-IN")}`,
    p.compare_price ? `MRP: ₹${p.compare_price.toLocaleString("en-IN")}` : null,
    p.category_name ? `Category: ${p.category_name}` : null,
    p.material ? `Material: ${p.material}` : null,
    p.weight ? `Weight: ${p.weight}` : null,
    p.stock > 0 ? "In Stock" : "Out of Stock",
    p.description ? `Description: ${p.description.slice(0, 200)}` : null,
    `Link: /products/${p.slug}`,
  ];
  return parts.filter(Boolean).join(" | ");
}

interface ProductForPrompt {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_price: number | null;
  material: string | null;
  weight: string | null;
  stock: number;
  category_name: string | null;
}

async function fetchFeaturedProducts(limit: number): Promise<ProductForPrompt[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("products")
    .select("id, name, slug, description, price, compare_price, material, weight, stock, categories(name)")
    .eq("is_active", true)
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((p) => {
    const cats = p.categories as unknown as { name: string } | { name: string }[] | null;
    return { ...p, category_name: Array.isArray(cats) ? (cats[0]?.name ?? null) : (cats?.name ?? null) };
  });
}

async function fetchProductContext(message: string): Promise<ProductContext> {
  const { products, filters } = await searchProducts(message);
  const understood = describeFilters(filters);

  if (products.length > 0) {
    const header = understood ? `Customer filters understood: ${understood}.\n\n` : "";
    return {
      contextText: header + products.map((p, i) => formatProduct(p, i)).join("\n\n"),
      productIds: products.map((p) => p.id),
      matched: products,
    };
  }

  // R5: the customer asked for something specific and nothing in the catalogue fits.
  if (hasFilters(filters)) {
    return {
      contextText:
        `Customer filters understood: ${understood}.\n` +
        "NO products in the catalogue match these filters. Say so plainly, do not name or price any " +
        "product, and offer to widen the search (a higher budget, another material or category).",
      productIds: [],
      matched: [],
      unmatchedFilters: understood,
    };
  }

  // R6: small talk or a question with no match. Offer popular items, clearly labelled.
  const featured = await fetchFeaturedProducts(3);
  if (featured.length === 0) return { contextText: "", productIds: [], matched: [] };
  return {
    contextText:
      "No product matched this message. These are popular items, NOT matches; only mention them " +
      "if the customer is browsing:\n\n" +
      featured.map((p, i) => formatProduct(p, i)).join("\n\n"),
    productIds: featured.map((p) => p.id),
    matched: [],
  };
}

// ── Call the answer model ─────────────────────────

// gemini-3.5-flash-lite on the free tier usually answers in ~1.2 s but spikes to 8-9 s
// (measured 9 Nov 2026); 10 s cut off about one call in sixteen.
const MODEL_TIMEOUT_MS = 15_000;
const RETRY_DELAY_MS = 700;

type GenerateRequest = Parameters<GoogleGenAI["models"]["generateContent"]>[0];

/** One retry for momentary 500/503; quota (429), timeouts and the rest go to the fallback. */
async function generateAnswer(ai: GoogleGenAI, request: GenerateRequest): Promise<string | null> {
  const withTimeout: GenerateRequest = {
    ...request,
    config: { ...request.config, httpOptions: { timeout: MODEL_TIMEOUT_MS } },
  };
  try {
    return (await ai.models.generateContent(withTimeout)).text?.trim() || null;
  } catch (err) {
    if (!isRetryableModelError(err)) throw err;
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    return (await ai.models.generateContent(withTimeout)).text?.trim() || null;
  }
}

// ── Chat with RAG ──────────────────────────────────

export async function chat(input: {
  message: string;
  conversation_id?: string;
  customer_id?: string;
  session_id?: string;
}): Promise<ChatResponse> {
  const ai = getAI();

  // Get or create conversation
  const conversationId = await getOrCreateConversation(
    input.conversation_id,
    input.customer_id,
    input.session_id,
  );

  // Save user message
  await saveMessage(conversationId, "user", input.message);

  // Get conversation history for context
  const history = await getConversationHistory(conversationId);

  // Fetch relevant products from database
  const { contextText, productIds, matched, unmatchedFilters } = await fetchProductContext(input.message);

  // Build conversation for Gemini
  const systemPrompt = `You are a helpful jewellery shopping assistant for an Indian jewellery e-commerce store. You help customers find the perfect jewellery pieces, answer questions about products, materials, and styling.

Guidelines:
- Be warm, professional, and helpful
- Use Indian currency (₹) when mentioning prices
- When recommending products, mention the product name, price, and key details from the catalog below
- Include the product link (e.g., /products/slug) so the customer can view it
- If the customer asks for something not in the catalog, say so honestly and suggest the closest alternatives
- Keep responses concise (2-4 sentences for simple queries, up to a short paragraph for detailed questions)
- If the customer asks about something unrelated to jewellery or shopping, politely redirect
- The store's policies are listed below under "Store policies". Quote them as written and add nothing: no conditions, exceptions, timelines, costs or steps that are not in that list
- For anything the list doesn't cover (hallmarking, certification, delivery areas or international shipping, how to start a return, exchanges, refund timing), never state or guess. Say you can't confirm that here and that the store team can
- Only name, price or link products that appear in the catalog list below

Store policies:
${formatPoliciesForPrompt()}

${contextText ? `\nProducts from our catalog:\n${contextText}` : "\nNote: No products found matching this query. Do not name, price or invent any product; answer only general jewellery questions."}`;

  const conversationParts = history.slice(-8).map((m) => ({
    role: m.role === "user" ? ("user" as const) : ("model" as const),
    parts: [{ text: m.content }],
  }));

  // Ensure conversation starts with user role
  const contents = [
    ...conversationParts.filter((_, i) => i > 0 || conversationParts[0]?.role === "user"),
  ];

  // If no valid conversation parts, use just the current message
  if (contents.length === 0) {
    contents.push({
      role: "user" as const,
      parts: [{ text: input.message }],
    });
  }

  let answer: string | null;
  try {
    answer = await generateAnswer(ai, {
      model: TEXT_MODEL,
      contents,
      config: {
        temperature: 0.7,
        maxOutputTokens: 500,
        systemInstruction: systemPrompt,
        thinkingConfig: MINIMAL_THINKING,
      },
    });
  } catch (err) {
    // R10: quota, outage or timeout. Answer from retrieved data instead of failing the request.
    console.warn("[chat] answer model failed, sending the fallback:", err);
    answer = null;
  }

  const fallback = answer === null;
  const assistantMessage = answer ?? buildFallbackMessage({ matched, unmatchedFilters });
  const shownProductIds = fallback ? matched.map((p) => p.id) : productIds;

  // Save assistant response
  await saveMessage(conversationId, "assistant", assistantMessage, shownProductIds);

  return {
    message: assistantMessage,
    product_ids: shownProductIds,
    conversation_id: conversationId,
    ...(fallback && { fallback: true }),
  };
}

// ── List conversations ─────────────────────────────

export async function listConversations(
  customerId: string,
  limit: number = 20,
) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("chat_conversations")
    .select("id, created_at, updated_at")
    .eq("customer_id", customerId)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to list conversations: ${error.message}`);
  }

  return data ?? [];
}

// ── Get conversation with messages ─────────────────

export async function getConversation(conversationId: string) {
  const supabase = createAdminClient();

  const { data: conversation, error: convError } = await supabase
    .from("chat_conversations")
    .select("id, customer_id, session_id, created_at, updated_at")
    .eq("id", conversationId)
    .single();

  if (convError || !conversation) {
    return null;
  }

  const { data: messages, error: msgError } = await supabase
    .from("chat_messages")
    .select("id, role, content, context_product_ids, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (msgError) {
    throw new Error(`Failed to get messages: ${msgError.message}`);
  }

  return {
    ...conversation,
    messages: messages ?? [],
  };
}
