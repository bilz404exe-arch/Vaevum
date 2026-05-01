// ─── Union Types ──────────────────────────────────────────────────────────

export type PersonaRole =
  | "Girlfriend"
  | "Boyfriend"
  | "Best Friend"
  | "Therapist"
  | "Dominant"
  | "Submissive"
  | "Protector"
  | "Villain"
  | "Mentor"
  | "Custom";

export type GenderEnergy = "Feminine" | "Masculine" | "Non-binary" | "Fluid";

export type PersonalityTone =
  | "Sweet & Caring"
  | "Savage & Honest"
  | "Dark & Mysterious"
  | "Teasing & Witty"
  | "Balanced";

export type ContentMode =
  | "💬 Default"
  | "🌶️ Spicy"
  | "🖤 Dark"
  | "🕯️ Erotic"
  | "😤 Grievance"
  | "🫂 Console"
  | "😂 Dark Humor"
  | "✍️ Create";

// ─── Database Models ──────────────────────────────────────────────────────

export interface Persona {
  id: string;
  user_id: string;
  name: string;
  role: PersonaRole;
  gender: GenderEnergy;
  tone: PersonalityTone;
  mode: ContentMode;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Conversation {
  id: string;
  user_id: string;
  persona_id: string;
  created_at: string;
  last_message: string | null;
  last_active: string;
  deleted_at: string | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  mode_at_time: string | null;
  created_at: string;
}

// ─── API Shapes ───────────────────────────────────────────────────────────

export interface ChatRequest {
  conversationId: string;
  message: string;
  persona: Persona;
  currentMode: ContentMode;
}

export interface ChatResponse {
  content: string;
  messageId: string;
}

export interface CreatePersonaInput {
  name: string;
  role: PersonaRole;
  gender: GenderEnergy;
  tone: PersonalityTone;
  mode: ContentMode;
}

// ─── Pagination ───────────────────────────────────────────────────────────

/** Cursor-based pagination result for messages */
export interface MessagePage {
  messages: Message[];
  nextCursor: string | null; // created_at of oldest message in page
  hasMore: boolean;
}
