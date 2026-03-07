import { GoogleGenAI } from "@google/genai";
import { AppError, ErrorCode } from "@/lib/errors";

// ── Lazy-initialized client ────────────────────────

let _ai: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!_ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new AppError(
        ErrorCode.BAD_REQUEST,
        "AI features are not configured. Please set the GEMINI_API_KEY environment variable.",
      );
    }
    _ai = new GoogleGenAI({ apiKey });
  }
  return _ai;
}

/**
 * Wraps Gemini API calls with user-friendly error handling.
 */
async function callGemini<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err: unknown) {
    // Re-throw AppErrors as-is
    if (err instanceof AppError) throw err;

    const message = err instanceof Error ? err.message : String(err);

    // Rate limit / quota exceeded
    if (message.includes("429") || message.includes("RESOURCE_EXHAUSTED") || message.includes("quota")) {
      throw new AppError(
        ErrorCode.RATE_LIMITED,
        "AI rate limit reached. Please wait a minute and try again. If this is a new API key, it may take a few minutes for your quota to activate.",
      );
    }

    // Invalid API key
    if (message.includes("401") || message.includes("API_KEY_INVALID") || message.includes("UNAUTHENTICATED")) {
      throw new AppError(
        ErrorCode.UNAUTHORIZED,
        "Invalid Gemini API key. Please check your GEMINI_API_KEY environment variable.",
      );
    }

    // Permission denied
    if (message.includes("403") || message.includes("PERMISSION_DENIED")) {
      throw new AppError(
        ErrorCode.FORBIDDEN,
        "Gemini API access denied. Please check your API key permissions.",
      );
    }

    // Model not found / unavailable
    if (message.includes("404") || message.includes("NOT_FOUND")) {
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        "AI model is currently unavailable. Please try again later.",
      );
    }

    // Generic fallback — don't leak raw Gemini error details
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "AI service encountered an error. Please try again.",
    );
  }
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

Respond with a JSON object containing:
1. "description" — A compelling 2-3 sentence product description highlighting craftsmanship, beauty, and occasion. Use elegant, luxury tone.
2. "meta_description" — A 150-160 character SEO meta description for the product page.
3. "tags" — An array of 5-8 relevant tags (e.g., "wedding", "gold", "traditional", "daily wear").`;

  return callGemini(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 500,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const text = response.text?.trim() ?? "";

    try {
      const parsed = JSON.parse(text) as GenerateDescriptionOutput;
      return {
        description: parsed.description ?? "",
        meta_description: parsed.meta_description ?? "",
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      };
    } catch {
      throw new AppError(ErrorCode.INTERNAL_ERROR, "Failed to parse AI response. Please try again.");
    }
  });
}

// ── Generate Image Alt Text ────────────────────────

export async function generateImageAltText(
  imageUrl: string,
): Promise<string> {
  const ai = getAI();

  const prompt = `You are writing alt text for a jewellery product image on an e-commerce website.

Describe this jewellery image in a concise, descriptive alt text (15-25 words) suitable for screen readers and SEO. Focus on the type of jewellery, material, design elements, and any gemstones visible. Return only the alt text string.`;

  // Fetch the image and convert to base64
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`Failed to fetch image: ${imageResponse.status}`);
  }
  const imageBuffer = await imageResponse.arrayBuffer();
  const base64Image = Buffer.from(imageBuffer).toString("base64");
  const mimeType = imageResponse.headers.get("content-type") ?? "image/jpeg";

  return callGemini(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const altText = response.text?.trim() ?? "";
    if (!altText) {
      throw new AppError(ErrorCode.INTERNAL_ERROR, "AI returned empty alt text. Please try again.");
    }

    return altText;
  });
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

Respond with a JSON object containing:
1. "suggested_category" — The best matching category from the available list, or null if none match well.
2. "suggested_material" — The most likely material based on the product name/description.
3. "confidence" — A number from 0 to 1 indicating how confident you are in the classification.
4. "tags" — An array of 3-6 relevant attribute tags (e.g., "handcrafted", "traditional", "lightweight", "statement piece").`;

  return callGemini(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.3,
        maxOutputTokens: 300,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const text = response.text?.trim() ?? "";

    try {
      const parsed = JSON.parse(text) as SuggestCategoryOutput;
      return {
        suggested_category: parsed.suggested_category ?? null,
        suggested_material: parsed.suggested_material ?? null,
        confidence: typeof parsed.confidence === "number" ? Math.min(1, Math.max(0, parsed.confidence)) : 0,
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      };
    } catch {
      throw new AppError(ErrorCode.INTERNAL_ERROR, "Failed to parse AI response. Please try again.");
    }
  });
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

Respond with a JSON object containing:
1. "occasions" — Array of 2-5 occasion tags from: wedding, engagement, anniversary, festival, daily wear, party, office, puja, mehendi, sangeet, reception, casual, formal, bridal
2. "styles" — Array of 2-4 style tags from: traditional, modern, contemporary, ethnic, indo-western, minimalist, statement, vintage, bohemian, classic, royal, temple
3. "gifting" — Array of 1-3 gifting tags from: birthday gift, valentine gift, anniversary gift, wedding gift, mothers day, diwali gift, rakhi gift, housewarming, self purchase, bridesmaids gift`;

  return callGemini(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.4,
        maxOutputTokens: 300,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const text = response.text?.trim() ?? "";

    try {
      const parsed = JSON.parse(text) as AutoTagOutput;
      return {
        occasions: Array.isArray(parsed.occasions) ? parsed.occasions : [],
        styles: Array.isArray(parsed.styles) ? parsed.styles : [],
        gifting: Array.isArray(parsed.gifting) ? parsed.gifting : [],
      };
    } catch {
      throw new AppError(ErrorCode.INTERNAL_ERROR, "Failed to parse AI response. Please try again.");
    }
  });
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
  suggested_price: { min: number; max: number } | null;
  suggested_fields: {
    name: string | null;
    category: string | null;
    material: string | null;
    weight: string | null;
    tags: string[];
  };
}

async function fetchImageAsBase64(url: string): Promise<{ data: string; mimeType: string }> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new AppError(ErrorCode.BAD_REQUEST, `Failed to fetch image (HTTP ${res.status}).`);
  }
  const buf = await res.arrayBuffer();
  return {
    data: Buffer.from(buf).toString("base64"),
    mimeType: res.headers.get("content-type") ?? "image/jpeg",
  };
}

export async function analyzeImage(
  imageUrl: string,
  additionalImageUrls?: string[],
  categories?: string[],
): Promise<AnalyzeImageOutput> {
  const ai = getAI();

  const imageCount = 1 + (additionalImageUrls?.length ?? 0);
  const imageNote = imageCount > 1
    ? `You are provided ${imageCount} images of the same jewellery product from different angles. Analyze all images together.`
    : "Analyze this jewellery image and extract structured attributes.";

  const categoryInstruction = categories && categories.length > 0
    ? `Available categories in our store: ${categories.join(", ")}. You MUST pick "category" from this list. Choose the best match.`
    : "";

  const prompt = `You are a jewellery expert analyzing product images for an Indian jewellery e-commerce store.

${imageNote}

${categoryInstruction}

Respond with a JSON object containing:
1. "type" — The type of jewellery (e.g., "ring", "necklace", "earring", "bracelet", "bangle", "pendant", "chain", "anklet", "nose pin", "mangalsutra", "toe ring", "brooch", "hair accessory")
2. "metal_color" — The visible metal color (e.g., "gold", "silver", "rose gold", "white gold", "oxidized", "two-tone") or null if unclear
3. "gemstones" — Array of visible gemstones/stones (e.g., ["diamond", "ruby", "emerald", "pearl", "kundan", "american diamond", "meenakari"]). Empty array if none visible.
4. "style" — The overall style (e.g., "traditional", "modern", "contemporary", "ethnic", "indo-western", "minimalist", "statement", "vintage", "temple", "bohemian")
5. "material" — Best guess at material (e.g., "22K Gold", "Sterling Silver", "Gold Plated", "Brass", "Kundan") or null if unclear
6. "occasion" — Array of 2-4 suitable occasions (e.g., ["wedding", "festival", "daily wear", "party", "office", "bridal"])
7. "description" — A brief 1-2 sentence visual description of the piece
8. "suggested_price" — An object with "min" and "max" fields representing a realistic INR price range for this piece based on the material, craftsmanship, gemstones, and Indian market rates. Use whole numbers. Return null only if you truly cannot estimate.
9. "suggested_fields" — An object with:
   - "name" — A suggested product name based on what you see, or null
   - "category" — Suggested category from the available list above (must match exactly), or null
   - "material" — Suggested material for the product listing, or null
   - "weight" — Estimated weight as a string (e.g., "5g", "12g"), or null if unclear
   - "tags" — Array of 4-8 relevant product tags`;

  // Fetch all images in parallel
  const allUrls = [imageUrl, ...(additionalImageUrls ?? [])];
  const imageResults = await Promise.all(allUrls.map(fetchImageAsBase64));

  const imageParts = imageResults.map((img) => ({
    inlineData: { mimeType: img.mimeType, data: img.data },
  }));

  return callGemini(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [...imageParts, { text: prompt }],
        },
      ],
      config: {
        temperature: 0.3,
        maxOutputTokens: 800,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const text = response.text?.trim() ?? "";

    try {
      const parsed = JSON.parse(text) as AnalyzeImageOutput;
      const sp = parsed.suggested_price;
      return {
        type: parsed.type ?? "unknown",
        metal_color: parsed.metal_color ?? null,
        gemstones: Array.isArray(parsed.gemstones) ? parsed.gemstones : [],
        style: parsed.style ?? "unknown",
        material: parsed.material ?? null,
        occasion: Array.isArray(parsed.occasion) ? parsed.occasion : [],
        description: parsed.description ?? "",
        suggested_price: sp && typeof sp.min === "number" && typeof sp.max === "number"
          ? { min: Math.round(sp.min), max: Math.round(sp.max) }
          : null,
        suggested_fields: {
          name: parsed.suggested_fields?.name ?? null,
          category: parsed.suggested_fields?.category ?? null,
          material: parsed.suggested_fields?.material ?? null,
          weight: parsed.suggested_fields?.weight ?? null,
          tags: Array.isArray(parsed.suggested_fields?.tags) ? parsed.suggested_fields.tags : [],
        },
      };
    } catch {
      throw new AppError(ErrorCode.INTERNAL_ERROR, "Failed to parse AI response. Please try again.");
    }
  });
}
