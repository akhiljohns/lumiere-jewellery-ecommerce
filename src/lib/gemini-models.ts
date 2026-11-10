import { ThinkingLevel } from "@google/genai";

// ── Which Gemini model the app uses for text ───────
//
// gemini-2.5-flash shuts down on 1 Dec 2026 (requests then route to gemini-3.5-flash-lite).
// The 3.x models reject thinkingBudget, so the old { thinkingBudget: 0 } would fail with a 400
// after the switch. MINIMAL thinking measured 1.4 s for a one-word reply, against 9 s at the
// default level (9 Nov 2026).

export const TEXT_MODEL = "gemini-3.5-flash-lite";

export const MINIMAL_THINKING = { thinkingLevel: ThinkingLevel.MINIMAL };
