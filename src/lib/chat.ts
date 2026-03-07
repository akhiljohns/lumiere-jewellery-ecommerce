import { GoogleGenAI } from "@google/genai";
import { createAdminClient } from "@/lib/supabase/admin";

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

async function getConversationHistory(
  conversationId: string,
  limit: number = 10,
): Promise<ChatMessage[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("chat_messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) return [];

  return (data ?? []).map((m) => ({
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

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_price: number | null;
  material: string | null;
  weight: string | null;
  stock: number;
  is_featured: boolean;
  categories: { name: string } | { name: string }[] | null;
}

function formatProduct(p: ProductRow, i: number): string {
  const cat = Array.isArray(p.categories) ? p.categories[0]?.name : p.categories?.name;
  const parts = [
    `[Product ${i + 1}] ${p.name}`,
    `Price: ₹${p.price.toLocaleString("en-IN")}`,
    p.compare_price ? `MRP: ₹${p.compare_price.toLocaleString("en-IN")}` : null,
    cat ? `Category: ${cat}` : null,
    p.material ? `Material: ${p.material}` : null,
    p.weight ? `Weight: ${p.weight}` : null,
    p.stock > 0 ? "In Stock" : "Out of Stock",
    p.description ? `Description: ${p.description.slice(0, 200)}` : null,
    `Link: /products/${p.slug}`,
  ];
  return parts.filter(Boolean).join(" | ");
}

async function fetchProductContext(
  message: string,
): Promise<{ contextText: string; productIds: string[] }> {
  const supabase = createAdminClient();
  const selectFields = "id, name, slug, description, price, compare_price, material, weight, stock, is_featured, categories(name)";

  // 1. Search for products matching the user's query using full-text + ILIKE
  const sanitized = message
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");

  const { data: searchResults } = await supabase
    .from("products")
    .select(selectFields)
    .eq("is_active", true)
    .or(`name.ilike.%${sanitized}%,search_vector.wfts(english).${sanitized}`)
    .order("is_featured", { ascending: false })
    .limit(5);

  const matched = (searchResults ?? []) as unknown as ProductRow[];

  // 2. If fewer than 3 search results, pad with featured/popular products
  let featured: ProductRow[] = [];
  if (matched.length < 3) {
    const excludeIds = matched.map((p) => p.id);
    let query = supabase
      .from("products")
      .select(selectFields)
      .eq("is_active", true)
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(5 - matched.length);

    if (excludeIds.length > 0) {
      query = query.not("id", "in", `(${excludeIds.join(",")})`);
    }

    const { data: featuredResults } = await query;
    featured = (featuredResults ?? []) as unknown as ProductRow[];
  }

  const allProducts = [...matched, ...featured];

  if (allProducts.length === 0) {
    return { contextText: "", productIds: [] };
  }

  const contextText = allProducts.map((p, i) => formatProduct(p, i)).join("\n\n");
  const productIds = allProducts.map((p) => p.id);

  return { contextText, productIds };
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
  const { contextText, productIds } = await fetchProductContext(input.message);

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

${contextText ? `\nProducts from our catalog:\n${contextText}` : "\nNote: No products found matching this query. Answer based on general jewellery knowledge."}`;

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

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents,
    config: {
      temperature: 0.7,
      maxOutputTokens: 500,
      systemInstruction: systemPrompt,
      thinkingConfig: { thinkingBudget: 0 },
    },
  });

  const assistantMessage = response.text?.trim() ?? "I apologize, I'm having trouble responding right now. Please try again.";

  // Save assistant response
  await saveMessage(conversationId, "assistant", assistantMessage, productIds);

  return {
    message: assistantMessage,
    product_ids: productIds,
    conversation_id: conversationId,
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
