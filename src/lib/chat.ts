import { GoogleGenAI } from "@google/genai";
import { createAdminClient } from "@/lib/supabase/admin";
import { vectorSearch } from "@/lib/embeddings";

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

  // Perform vector search to find relevant products
  let contextText = "";
  let productIds: string[] = [];

  try {
    const results = await vectorSearch(input.message, 5);
    if (results.length > 0) {
      productIds = results.map((r) => r.product_id);
      contextText = results
        .map((r, i) => `[Product ${i + 1}]: ${r.chunk_text}`)
        .join("\n\n");
    }
  } catch {
    // Vector search may fail if no embeddings exist yet — continue without context
  }

  // Build conversation for Gemini
  const systemPrompt = `You are a helpful jewellery shopping assistant for an Indian jewellery e-commerce store. You help customers find the perfect jewellery pieces, answer questions about products, materials, and styling.

Guidelines:
- Be warm, professional, and helpful
- Use Indian currency (₹) when mentioning prices
- Recommend products based on the context provided
- If you don't have product information to answer a question, say so honestly
- Keep responses concise (2-4 sentences for simple queries, up to a short paragraph for detailed questions)
- If the customer asks about something unrelated to jewellery or shopping, politely redirect

${contextText ? `\nRelevant products from our catalog:\n${contextText}` : "\nNote: No specific product matches found for this query. Answer based on general jewellery knowledge."}`;

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
