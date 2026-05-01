import Groq from "groq-sdk";

const groqApiKey = process.env.GROQ_API_KEY;

if (!groqApiKey) {
  throw new Error(
    "Missing Groq environment variable: GROQ_API_KEY is required.",
  );
}

/**
 * Groq SDK client.
 * Use ONLY in Next.js API routes (src/pages/api/).
 * Model: llama-3.3-70b-versatile
 * Max tokens: 1024
 * Temperature: 0.85
 */
export const groq = new Groq({ apiKey: groqApiKey });

/** Standard Groq model parameters — never change these values */
export const GROQ_MODEL = "llama-3.3-70b-versatile" as const;
export const GROQ_MAX_TOKENS = 1024 as const;
export const GROQ_TEMPERATURE = 0.85 as const;
