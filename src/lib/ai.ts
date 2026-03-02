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

// ── Suggest Category & Material ────────────────────

interface SuggestCategoryInput {
  name: string;
  description?: string | null;
  categories: string[];
}

interface SuggestCategoryOutput {
  suggested_category: string | null;
  suggested_material: string | null;
  confidence: number;
  tags: string[];
}

export async function suggestCategory(
  input: SuggestCategoryInput,
): Promise<SuggestCategoryOutput> {
  const ai = getAI();

  const categoryList = input.categories.length > 0
    ? input.categories.join(", ")
    : "Rings, Necklaces, Earrings, Bracelets, Bangles, Pendants, Chains, Anklets, Nose Pins, Mangalsutras, Toe Rings";

  const prompt = `You are a jewellery product classification expert for an Indian jewellery e-commerce store.

Given this product information, classify it:
- Name: ${input.name}
${input.description ? `- Description: ${input.description}` : ""}

Available categories: ${categoryList}

Common jewellery materials: Gold, Silver, Platinum, Diamond, Rose Gold, White Gold, 22K Gold, 18K Gold, 14K Gold, Sterling Silver, Kundan, Meenakari, Pearl, Ruby, Emerald, Sapphire, American Diamond, Oxidized Silver, Brass, Copper

Return a JSON object with exactly these fields:
1. "suggested_category" — The best matching category from the available list, or null if none match well.
2. "suggested_material" — The most likely material based on the product name/description.
3. "confidence" — A number from 0 to 1 indicating how confident you are in the classification.
4. "tags" — An array of 3-6 relevant attribute tags (e.g., "handcrafted", "traditional", "lightweight", "statement piece").

Return ONLY valid JSON, no markdown fences or extra text.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
    config: {
      temperature: 0.3,
      maxOutputTokens: 300,
    },
  });

  const text = response.text?.trim() ?? "";
  const cleaned = text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();

  try {
    const parsed = JSON.parse(cleaned) as SuggestCategoryOutput;
    return {
      suggested_category: parsed.suggested_category ?? null,
      suggested_material: parsed.suggested_material ?? null,
      confidence: typeof parsed.confidence === "number" ? Math.min(1, Math.max(0, parsed.confidence)) : 0,
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
    };
  } catch {
    throw new Error("Failed to parse AI response as JSON");
  }
}

// ── Auto-Tag by Occasion ───────────────────────────

interface AutoTagInput {
  name: string;
  category?: string | null;
  material?: string | null;
  description?: string | null;
}

interface AutoTagOutput {
  occasions: string[];
  styles: string[];
  gifting: string[];
}

export async function autoTagProduct(
  input: AutoTagInput,
): Promise<AutoTagOutput> {
  const ai = getAI();

  const prompt = `You are a jewellery merchandising expert for an Indian jewellery e-commerce store.

Analyze this product and generate occasion-based, style, and gifting tags:
- Name: ${input.name}
${input.category ? `- Category: ${input.category}` : ""}
${input.material ? `- Material: ${input.material}` : ""}
${input.description ? `- Description: ${input.description}` : ""}

Return a JSON object with exactly these fields:
1. "occasions" — Array of 2-5 occasion tags from: wedding, engagement, anniversary, festival, daily wear, party, office, puja, mehendi, sangeet, reception, casual, formal, bridal
2. "styles" — Array of 2-4 style tags from: traditional, modern, contemporary, ethnic, indo-western, minimalist, statement, vintage, bohemian, classic, royal, temple
3. "gifting" — Array of 1-3 gifting tags from: birthday gift, valentine gift, anniversary gift, wedding gift, mothers day, diwali gift, rakhi gift, housewarming, self purchase, bridesmaids gift

Return ONLY valid JSON, no markdown fences or extra text.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
    config: {
      temperature: 0.4,
      maxOutputTokens: 300,
    },
  });

  const text = response.text?.trim() ?? "";
  const cleaned = text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();

  try {
    const parsed = JSON.parse(cleaned) as AutoTagOutput;
    return {
      occasions: Array.isArray(parsed.occasions) ? parsed.occasions : [],
      styles: Array.isArray(parsed.styles) ? parsed.styles : [],
      gifting: Array.isArray(parsed.gifting) ? parsed.gifting : [],
    };
  } catch {
    throw new Error("Failed to parse AI response as JSON");
  }
}

// ── Analyze Image (Visual Search) ─────────────────

interface AnalyzeImageOutput {
  type: string;
  metal_color: string | null;
  gemstones: string[];
  style: string;
  material: string | null;
  occasion: string[];
  description: string;
  suggested_fields: {
    name: string | null;
    category: string | null;
    material: string | null;
    tags: string[];
  };
}

export async function analyzeImage(
  imageUrl: string,
): Promise<AnalyzeImageOutput> {
  const ai = getAI();

  const prompt = `You are a jewellery expert analyzing a product image for an Indian jewellery e-commerce store.

Analyze this jewellery image and extract structured attributes.

Return a JSON object with exactly these fields:
1. "type" — The type of jewellery (e.g., "ring", "necklace", "earring", "bracelet", "bangle", "pendant", "chain", "anklet", "nose pin", "mangalsutra", "toe ring", "brooch", "hair accessory")
2. "metal_color" — The visible metal color (e.g., "gold", "silver", "rose gold", "white gold", "oxidized", "two-tone") or null if unclear
3. "gemstones" — Array of visible gemstones/stones (e.g., ["diamond", "ruby", "emerald", "pearl", "kundan", "american diamond", "meenakari"]). Empty array if none visible.
4. "style" — The overall style (e.g., "traditional", "modern", "contemporary", "ethnic", "indo-western", "minimalist", "statement", "vintage", "temple", "bohemian")
5. "material" — Best guess at material (e.g., "22K Gold", "Sterling Silver", "Gold Plated", "Brass", "Kundan") or null if unclear
6. "occasion" — Array of 2-4 suitable occasions (e.g., ["wedding", "festival", "daily wear", "party", "office", "bridal"])
7. "description" — A brief 1-2 sentence visual description of the piece
8. "suggested_fields" — An object with:
   - "name" — A suggested product name based on what you see, or null
   - "category" — Suggested category, or null
   - "material" — Suggested material for the product listing, or null
   - "tags" — Array of 4-8 relevant product tags

Return ONLY valid JSON, no markdown fences or extra text.`;

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
      maxOutputTokens: 600,
    },
  });

  const text = response.text?.trim() ?? "";
  const cleaned = text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();

  try {
    const parsed = JSON.parse(cleaned) as AnalyzeImageOutput;
    return {
      type: parsed.type ?? "unknown",
      metal_color: parsed.metal_color ?? null,
      gemstones: Array.isArray(parsed.gemstones) ? parsed.gemstones : [],
      style: parsed.style ?? "unknown",
      material: parsed.material ?? null,
      occasion: Array.isArray(parsed.occasion) ? parsed.occasion : [],
      description: parsed.description ?? "",
      suggested_fields: {
        name: parsed.suggested_fields?.name ?? null,
        category: parsed.suggested_fields?.category ?? null,
        material: parsed.suggested_fields?.material ?? null,
        tags: Array.isArray(parsed.suggested_fields?.tags) ? parsed.suggested_fields.tags : [],
      },
    };
  } catch {
    throw new Error("Failed to parse AI response as JSON");
  }
}
