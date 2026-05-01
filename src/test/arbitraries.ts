import * as fc from "fast-check";
import type {
  Persona,
  Message,
  ContentMode,
  PersonaRole,
  GenderEnergy,
  PersonalityTone,
} from "@/types";

// ─── Union type value arrays ───────────────────────────────────────────────

export const PERSONA_ROLES: PersonaRole[] = [
  "Girlfriend",
  "Boyfriend",
  "Best Friend",
  "Therapist",
  "Dominant",
  "Submissive",
  "Protector",
  "Villain",
  "Mentor",
  "Custom",
];

export const GENDER_ENERGIES: GenderEnergy[] = [
  "Feminine",
  "Masculine",
  "Non-binary",
  "Fluid",
];

export const PERSONALITY_TONES: PersonalityTone[] = [
  "Sweet & Caring",
  "Savage & Honest",
  "Dark & Mysterious",
  "Teasing & Witty",
  "Balanced",
];

export const CONTENT_MODES: ContentMode[] = [
  "💬 Default",
  "🌶️ Spicy",
  "🖤 Dark",
  "🕯️ Erotic",
  "😤 Grievance",
  "🫂 Console",
  "😂 Dark Humor",
  "✍️ Create",
];

// ─── Arbitraries ──────────────────────────────────────────────────────────

/**
 * Arbitrary for PersonaRole union type.
 */
export const personaRoleArbitrary: fc.Arbitrary<PersonaRole> = fc.constantFrom(
  ...PERSONA_ROLES,
);

/**
 * Arbitrary for GenderEnergy union type.
 */
export const genderEnergyArbitrary: fc.Arbitrary<GenderEnergy> =
  fc.constantFrom(...GENDER_ENERGIES);

/**
 * Arbitrary for PersonalityTone union type.
 */
export const personalityToneArbitrary: fc.Arbitrary<PersonalityTone> =
  fc.constantFrom(...PERSONALITY_TONES);

/**
 * Arbitrary for ContentMode union type.
 */
export const modeArbitrary: fc.Arbitrary<ContentMode> = fc.constantFrom(
  ...CONTENT_MODES,
);

/**
 * Arbitrary for a valid Persona object.
 * Generates personas with all required fields populated.
 */
export const personaArbitrary: fc.Arbitrary<Persona> = fc.record({
  id: fc.uuid(),
  user_id: fc.uuid(),
  name: fc
    .string({ minLength: 1, maxLength: 24 })
    .filter((s) => s.trim().length > 0),
  role: personaRoleArbitrary,
  gender: genderEnergyArbitrary,
  tone: personalityToneArbitrary,
  mode: modeArbitrary,
  created_at: fc
    .date({ min: new Date("2020-01-01") })
    .map((d) => d.toISOString()),
  updated_at: fc
    .date({ min: new Date("2020-01-01") })
    .map((d) => d.toISOString()),
  deleted_at: fc.option(
    fc.date({ min: new Date("2020-01-01") }).map((d) => d.toISOString()),
    { nil: null },
  ),
});

/**
 * Arbitrary for a valid Message object.
 * Generates messages with all required fields populated.
 */
export const messageArbitrary: fc.Arbitrary<Message> = fc.record({
  id: fc.uuid(),
  conversation_id: fc.uuid(),
  user_id: fc.uuid(),
  role: fc.constantFrom("user" as const, "assistant" as const),
  content: fc.string({ minLength: 1, maxLength: 2000 }),
  mode_at_time: fc.option(modeArbitrary, { nil: null }),
  created_at: fc
    .date({ min: new Date("2020-01-01") })
    .map((d) => d.toISOString()),
});
