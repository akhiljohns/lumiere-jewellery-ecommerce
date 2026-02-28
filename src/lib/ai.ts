import { GoogleGenAI } from "@google/genai";

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

// ── Generate Product Description ───────────────────

interface GenerateDescriptionInput {
  name: string;
  category?: string | null;
  material?: string | null;
  price?: number | null;
  weight?: string | null;
}

interface GenerateDescriptionOutput {
  description: string;
  meta_description: string;
  tags: string[];
}

export async function generateProductDescription(
  input: GenerateDescriptionInput,
): Promise<GenerateDescriptionOutput> {
  const ai = getAI();

  const prompt = `You are a professional jewellery copywriter for an Indian jewellery e-commerce store.

Generate a product description for the following jewellery item:
- Name: ${input.name}
${input.category ? `- Category: ${input.category}` : ""}
${input.material ? `- Material: ${input.material}` : ""}
${input.price ? `- Price: ₹${input.price}` : ""}
${input.weight ? `- Weight: ${input.weight}` : ""}

Return a JSON object with exactly these fields:
1. "description" — A compelling 2-3 sentence product description highlighting craftsmanship, beauty, and occasion. Use elegant, luxury tone.
2. "meta_description" — A 150-160 character SEO meta description for the product page.
3. "tags" — An array of 5-8 relevant tags (e.g., "wedding", "gold", "traditional", "daily wear").

Return ONLY valid JSON, no markdown fences or extra text.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
    config: {
      temperature: 0.7,
      maxOutputTokens: 500,
    },
  });

  const text = response.text?.trim() ?? "";

  // Strip markdown fences if present
  const cleaned = text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();

  try {
    const parsed = JSON.parse(cleaned) as GenerateDescriptionOutput;
    return {
      description: parsed.description ?? "",
      meta_description: parsed.meta_description ?? "",
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
    };
  } catch {
    throw new Error("Failed to parse AI response as JSON");
  }
}

// ── Generate Image Alt Text ────────────────────────

export async function generateImageAltText(
  imageUrl: string,
): Promise<string> {
  const ai = getAI();

  const prompt = `You are writing alt text for a jewellery product image on an e-commerce website.

Describe this jewellery image in a concise, descriptive alt text (15-25 words) suitable for screen readers and SEO. Focus on the type of jewellery, material, design elements, and any gemstones visible.

Return ONLY the alt text string, no quotes, no extra text.`;

  // Fetch the image and convert to base64
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`Failed to fetch image: ${imageResponse.status}`);
  }
  const imageBuffer = await imageResponse.arrayBuffer();
  const base64Image = Buffer.from(imageBuffer).toString("base64");
  const mimeType = imageResponse.headers.get("content-type") ?? "image/jpeg";

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64Image,
            },
          },
          { text: prompt },
        ],
      },
    ],
    config: {
      temperature: 0.3,
      maxOutputTokens: 100,
    },
  });

  const altText = response.text?.trim() ?? "";
  if (!altText) {
    throw new Error("AI returned empty alt text");
  }

  return altText;
}
