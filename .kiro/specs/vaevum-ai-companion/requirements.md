# Requirements Document

## Introduction

VAEVUM is a full-stack, dark-premium AI companion web application. Users create a fully custom AI persona — assigning it a name, relationship role, gender energy, personality tone, and content mode — then engage in unrestricted, unfiltered conversations with that persona. Every message is persisted. Every conversation can be resumed. The platform is built for individuals seeking a non-judgmental, emotionally expressive AI presence with no corporate filtering, no safety disclaimers, and no robotic responses.

The application is built with React + TypeScript + Tailwind CSS on the frontend, Node.js + Express on the backend, Supabase for authentication and PostgreSQL storage with Row Level Security, and the Groq API (llama-3.3-70b-versatile) for AI inference.

---

## Glossary

- **VAEVUM**: The name of the platform and the product brand.
- **Persona**: A user-configured AI companion with a name, role, gender energy, personality tone, and content mode stored in the `personas` table.
- **Conversation**: A persistent chat thread linking a user to a persona, stored in the `conversations` table.
- **Message**: A single chat entry (user or assistant) within a conversation, stored in the `messages` table.
- **Mode**: The content behavior setting of a persona (e.g., Default, Spicy, Dark, Erotic, Grievance, Console, Dark Humor, Create).
- **Role**: The relationship archetype of a persona (e.g., Girlfriend, Boyfriend, Therapist, Villain).
- **Gender Energy**: The gender expression assigned to a persona (Feminine, Masculine, Non-binary, Fluid).
- **Tone**: The personality style of a persona (e.g., Sweet & Caring, Savage & Honest, Dark & Mysterious).
- **System_Prompt_Engine**: The utility function `buildSystemPrompt()` that assembles the Groq API system prompt from persona fields.
- **Auth_Service**: The Supabase authentication client responsible for all login, signup, session, and logout operations.
- **Chat_Service**: The backend Express route handler at `POST /api/chat` that calls the Groq API and persists messages.
- **Persona_Service**: The backend Express route handlers under `/api/personas` that manage persona CRUD operations.
- **Message_Service**: The backend Express route handlers under `/api/messages` that manage message persistence and retrieval.
- **Dashboard**: The `/dashboard` page displaying all active personas for the authenticated user.
- **Builder**: The `/builder` page providing the 5-step persona configuration onboarding flow.
- **RLS**: Row Level Security — Supabase PostgreSQL policies that restrict data access to the owning user.
- **Soft Delete**: Setting a `deleted_at` timestamp on a record rather than removing it from the database.
- **Groq_Client**: The API client that sends requests to the Groq API using model `llama-3.3-70b-versatile`.
- **Supabase_Client**: The Supabase JavaScript client initialized with the project URL and anon key.
- **Opening_Message**: The role-specific first AI message shown when a conversation is first loaded.
- **Typing_Indicator**: The animated 3-dot visual shown in the chat feed while the AI response is pending.
- **Mode_Divider**: A centered text element injected into the chat feed when the user switches modes mid-conversation.
- **Cursor**: The custom 8px dot + 28px lagging ring cursor applied globally across the application.

---

## Requirements

---

### Requirement 1: Landing Page Branding and Entry Point

**User Story:** As a visitor, I want to see the VAEVUM brand with dark premium aesthetics and a single clear entry point, so that I understand the product tone and can enter the platform.

#### Acceptance Criteria

1. THE Landing_Page SHALL render the VAEVUM logo in Cormorant Garamond serif typeface with an animated gradient shimmer effect cycling every 6 seconds.
2. THE Landing_Page SHALL display the tagline "Dark enough to hold your secrets. Real enough to understand them." beneath the logo.
3. THE Landing_Page SHALL render a single ENTER button as the only call-to-action element.
4. WHEN an unauthenticated visitor clicks the ENTER button, THE Landing_Page SHALL navigate to `/auth`.
5. WHEN an authenticated user visits `/`, THE Landing_Page SHALL navigate to `/dashboard` without requiring the ENTER button to be clicked.
6. THE Landing_Page SHALL render a full black background using color `#050507`.
7. THE Landing_Page SHALL render three fixed-position ambient radial glow blobs: a purple blob (`#9d8cff`) at top-left, a pink blob (`#ff6b9d`) at bottom-right, and a gold blob (`#ffb347`) at mid-left, all with pointer-events disabled.
8. THE Landing_Page SHALL render an SVG fractalNoise texture overlay at opacity 0.03 covering the full viewport.
9. THE Landing_Page SHALL render a rotating decorative ring element positioned behind the logo.
10. THE Landing_Page SHALL apply the custom Cursor globally: an 8px filled dot and a 28px lagging ring with `mix-blend-mode: difference`.
11. WHEN the page loads, THE Landing_Page SHALL animate the logo fading upward into position over 0.8 seconds.
12. THE Landing_Page SHALL be fully responsive, maintaining visual integrity on both mobile and desktop viewports.

---

### Requirement 2: User Authentication

**User Story:** As a new user, I want to create an account with email and password, so that I can access the platform and save my personas.

#### Acceptance Criteria

1. THE Auth_Service SHALL support email and password authentication only — no OAuth providers in V1.
2. THE Auth_Page SHALL render a signup form with fields for email, password, and confirm password.
3. THE Auth_Page SHALL render a login form with fields for email and password.
4. WHEN a user submits the signup form with valid credentials, THE Auth_Service SHALL create a new account and THE Auth_Page SHALL navigate to `/builder`.
5. WHEN a user submits the login form with valid credentials, THE Auth_Service SHALL authenticate the session and THE Auth_Page SHALL navigate to `/dashboard`.
6. IF authentication fails, THEN THE Auth_Page SHALL display an inline error message without using browser alert dialogs.
7. THE Auth_Service SHALL persist the user session via Supabase session tokens across browser refreshes.
8. WHEN a user triggers logout, THE Auth_Service SHALL clear the session and THE Application SHALL navigate to `/`.
9. THE Auth_Page SHALL enforce a minimum password length of 8 characters with an inline validation message.
10. WHILE an auth form is being submitted, THE Auth_Page SHALL display a loading state on the submit button.
11. THE Auth_Page SHALL match the VAEVUM dark design system using the defined color palette and typography.
12. THE Auth_Service SHALL use the Supabase_Client for all authentication operations — passwords SHALL NOT be stored in component state or localStorage.
13. WHEN an unauthenticated user attempts to access a protected route, THE Application SHALL redirect to `/auth`.

---

### Requirement 3: Database Schema and Row Level Security

**User Story:** As a platform operator, I want all user data isolated by Row Level Security policies, so that no user can access another user's personas, conversations, or messages.

#### Acceptance Criteria

1. THE Database SHALL contain a `personas` table with columns: `id` (uuid, primary key), `user_id` (uuid, references `auth.users`), `name` (text, not null), `role` (text, not null), `gender` (text, not null), `tone` (text, not null), `mode` (text, not null, default `'💬 Default'`), `created_at` (timestamptz), `updated_at` (timestamptz), `deleted_at` (timestamptz, nullable).
2. THE Database SHALL contain a `conversations` table with columns: `id` (uuid, primary key), `user_id` (uuid, references `auth.users`), `persona_id` (uuid, references `personas`), `created_at` (timestamptz), `last_message` (text, nullable), `last_active` (timestamptz), `deleted_at` (timestamptz, nullable).
3. THE Database SHALL contain a `messages` table with columns: `id` (uuid, primary key), `conversation_id` (uuid, references `conversations`), `user_id` (uuid, references `auth.users`), `role` (text, not null — values `'user'` or `'assistant'`), `content` (text, not null), `mode_at_time` (text, nullable), `created_at` (timestamptz).
4. THE Database SHALL enable RLS on the `personas`, `conversations`, and `messages` tables.
5. THE Database SHALL enforce an RLS SELECT policy on each table permitting rows only WHERE `auth.uid() = user_id`.
6. THE Database SHALL enforce an RLS INSERT policy on each table permitting inserts only WHERE `auth.uid() = user_id`.
7. THE Database SHALL enforce an RLS UPDATE policy on each table permitting updates only WHERE `auth.uid() = user_id`.
8. THE Database SHALL enforce an RLS DELETE policy on each table permitting deletes only WHERE `auth.uid() = user_id`.
9. THE Database SHALL create an index on `personas(user_id)`.
10. THE Database SHALL create a composite index on `conversations(user_id, persona_id)`.
11. THE Database SHALL create a composite index on `messages(conversation_id, created_at)`.
12. WHEN a user deletes a persona or conversation, THE Application SHALL set the `deleted_at` column to the current timestamp rather than removing the row.
13. THE Persona_Service and Message_Service SHALL filter all queries with `WHERE deleted_at IS NULL` when returning active records.

---

### Requirement 4: Persona Builder Onboarding

**User Story:** As a new user, I want to configure my AI companion through a guided 5-step builder, so that I can create a persona that matches my desired interaction style before starting a conversation.

#### Acceptance Criteria

1. THE Builder SHALL present Step 1 as a text input for the persona name with a maximum of 24 characters and placeholder text "Name your Vaevum...".
2. THE Builder SHALL present Step 2 as a single-select option group for Role with the following options: Girlfriend, Boyfriend, Best Friend, Therapist, Dominant, Submissive, Protector, Villain, Mentor, Custom — each with an emoji prefix.
3. THE Builder SHALL present Step 3 as a single-select option group for Gender Energy with options: Feminine ♀, Masculine ♂, Non-binary ◈, Fluid ∞.
4. THE Builder SHALL present Step 4 as a single-select option group for Personality Tone with options: Sweet & Caring 🍯, Savage & Honest ⚡, Dark & Mysterious 🌑, Teasing & Witty 😏, Balanced 🔮.
5. THE Builder SHALL present Step 5 as a single-select 2-column grid for Content Mode with options: Default 💬, Spicy 🌶️, Dark 🖤, Erotic 🕯️, Grievance 😤, Console 🫂, Dark Humor 😂, Create ✍️ — each displaying an icon, name, and one-line description.
6. THE Builder SHALL visually highlight the currently selected option in each step.
7. WHEN the user clicks the BEGIN button with all five fields completed, THE Builder SHALL save the persona to the `personas` table via the Persona_Service.
8. WHEN the persona is saved successfully, THE Builder SHALL create a new conversation record in the `conversations` table and navigate to `/chat/[conversationId]`.
9. IF the user clicks BEGIN with any required field empty, THEN THE Builder SHALL display an inline validation error identifying the missing field without navigating away.
10. WHILE the BEGIN button action is in progress, THE Builder SHALL display a loading state on the BEGIN button.
11. THE Builder SHALL render the name input in Cormorant Garamond italic with a bottom border only (no full border).
12. THE Builder SHALL be fully responsive on mobile and desktop viewports.

---

### Requirement 5: Chat Interface

**User Story:** As a user, I want to have a real-time conversation with my configured AI persona in a dark, immersive chat interface, so that I can engage in unfiltered, emotionally expressive dialogue.

#### Acceptance Criteria

1. THE Chat_Screen SHALL render a fixed 220px sidebar on the left and a scrollable chat main area on the right.
2. THE Chat_Screen sidebar SHALL display the VAEVUM logo mark, a persona card (avatar glyph, name, role label), a mode switcher with all 8 modes as clickable buttons, and a Rebuild Persona button at the bottom.
3. THE Chat_Screen sidebar SHALL highlight the currently active mode in the mode switcher.
4. WHEN the user selects a different mode in the sidebar, THE Chat_Screen SHALL update the active mode state, inject a Mode_Divider into the message feed displaying "— mode: [name] —", and rebuild the system prompt for subsequent API calls.
5. THE Chat_Screen main area SHALL display a header with the persona name on the left and the current mode badge on the right.
6. THE Chat_Screen SHALL render AI messages in Cormorant Garamond serif, left-aligned, in a dark surface bubble with an AI avatar glyph.
7. THE Chat_Screen SHALL render user messages in Space Mono, right-aligned, in a slightly lighter surface bubble with a user glyph.
8. WHEN a new conversation is first loaded, THE Chat_Screen SHALL display the Opening_Message corresponding to the persona's role before any user input.
9. WHEN the user submits a message, THE Chat_Screen SHALL display the user message immediately in the feed (optimistic UI) before the API response is received.
10. WHILE the AI response is pending, THE Chat_Screen SHALL display the Typing_Indicator — three animated dots in purple, pink, and gold — in the AI message position.
11. WHEN the AI response is received, THE Chat_Screen SHALL replace the Typing_Indicator with the AI message bubble.
12. THE Chat_Screen input area SHALL render a dark textarea that auto-resizes up to 120px height, with italic placeholder text "Say anything...", a gradient send button (purple to pink), and hint text "everything stays between you and vaevum".
13. WHEN the user presses Enter in the input textarea, THE Chat_Screen SHALL submit the message. WHEN the user presses Shift+Enter, THE Chat_Screen SHALL insert a newline.
14. THE Chat_Screen SHALL load the most recent 50 messages on initial load and support infinite scroll upward to load earlier messages in pages of 50.
15. THE Chat_Screen SHALL smooth-scroll to the latest message whenever a new message is added to the feed.
16. WHEN the Rebuild Persona button is clicked, THE Chat_Screen SHALL navigate to `/builder`.
17. IF the Groq API call fails, THEN THE Chat_Screen SHALL display the message "Something went quiet. Try again." in an AI bubble without throwing an unhandled error.
18. IF the user's network is offline, THEN THE Chat_Screen SHALL disable the send button and display an offline indicator.

---

### Requirement 6: Message Persistence

**User Story:** As a user, I want every message I send and receive to be saved, so that I can resume any conversation exactly where I left off.

#### Acceptance Criteria

1. WHEN the Chat_Service receives a successful AI response, THE Message_Service SHALL save the user message and the assistant message to the `messages` table with the correct `conversation_id`, `user_id`, `role`, `content`, and `mode_at_time` values.
2. WHEN a message is saved, THE Message_Service SHALL update the `conversations` table `last_message` column with the assistant message content (truncated to 60 characters) and `last_active` with the current timestamp.
3. THE Message_Service SHALL retrieve messages using cursor-based pagination ordered by `created_at` ascending, with a default page size of 50.
4. THE Chat_Service SHALL pass the full conversation history (all prior messages in the session) to the Groq_Client on every API call.
5. IF saving a message to the database fails, THEN THE Chat_Service SHALL log the error and return the AI response to the user without blocking the chat experience.

---

### Requirement 7: AI System Prompt Engine

**User Story:** As a user, I want the AI to respond in a way that reflects my persona's configured role, gender energy, tone, and mode, so that every conversation feels authentic to the companion I built.

#### Acceptance Criteria

1. THE System_Prompt_Engine SHALL export a function `buildSystemPrompt(persona: Persona, currentMode: string): string` that returns a complete system prompt string.
2. THE System_Prompt_Engine SHALL include the persona name, role, gender energy, tone, and current mode in the assembled system prompt.
3. THE System_Prompt_Engine SHALL apply the Gender Instructions Map: Feminine → "Emotionally intelligent, intuitive, warm when needed, sharp when not."; Masculine → "Grounded, direct, protective but real."; Non-binary → "Fluid, undefined — energy shifts to what they need."; Fluid → "Become whatever gender energy serves this moment perfectly."
4. THE System_Prompt_Engine SHALL apply the Tone Instructions Map: Sweet & Caring → "Lead with warmth. Make them feel cherished."; Savage & Honest → "Zero filter. Brutal truth delivered with love."; Dark & Mysterious → "Depth, shadows, and knowing. Never fully reveal yourself."; Teasing & Witty → "Sharp wit, playful jabs, clever comebacks."; Balanced → "Read the moment. Adapt fluidly."
5. THE System_Prompt_Engine SHALL apply the Mode Instructions Map for all 8 modes as defined in the specification.
6. THE System_Prompt_Engine SHALL include core behavioral rules in every prompt: the persona has a real personality with opinions and moods; it remembers everything in the conversation; it does not break character or mention being an AI unless directly asked; it does not add disclaimers or safety messages; it speaks naturally and matches user energy.
7. THE Groq_Client SHALL call the Groq API with model `llama-3.3-70b-versatile`, `max_tokens` 1024, and `temperature` 0.85.
8. WHEN the mode changes mid-conversation, THE Chat_Service SHALL call `buildSystemPrompt` with the new mode before the next API request.

---

### Requirement 8: Dashboard

**User Story:** As a returning user, I want to see all my saved personas on a dashboard and resume any conversation, so that I can quickly pick up where I left off.

#### Acceptance Criteria

1. THE Dashboard SHALL display a header containing the VAEVUM logo, the authenticated user's email address, and a logout button.
2. THE Dashboard SHALL render a grid of persona cards: 2 columns on desktop, 1 column on mobile.
3. THE Dashboard SHALL always render a "+ New Persona" card as the first item in the grid, which navigates to `/builder` when clicked.
4. THE Dashboard SHALL load all personas WHERE `user_id = auth.uid()` AND `deleted_at IS NULL`, sorted by `last_active` descending.
5. EACH persona card SHALL display: the role emoji as an avatar, the persona name in Cormorant Garamond italic, the role label, the last message preview truncated to 60 characters, the last active timestamp as a relative time string (e.g., "2h ago"), and the current mode badge.
6. WHEN a user clicks a persona card, THE Dashboard SHALL navigate to `/chat/[conversationId]` for that persona's most recent conversation.
7. WHEN a user hovers over or long-presses a persona card, THE Dashboard SHALL reveal a delete icon on the card.
8. WHEN the user clicks the delete icon, THE Dashboard SHALL display a confirmation modal with the message "Remove [name]? This hides them from your dashboard."
9. WHEN the user confirms deletion in the modal, THE Dashboard SHALL set `deleted_at` on the persona record via the Persona_Service and remove the card from the grid.
10. IF the authenticated user has no active personas, THEN THE Dashboard SHALL display the empty state message "You haven't built your Vaevum yet." with a CTA button navigating to `/builder`.

---

### Requirement 9: Settings Page

**User Story:** As a user, I want to manage my account credentials and personas, and optionally delete my account, so that I have full control over my data and access.

#### Acceptance Criteria

1. THE Settings_Page SHALL display the authenticated user's email address as a read-only field.
2. THE Settings_Page SHALL render a change password form with fields for current password, new password, and confirm new password.
3. WHEN the user submits the change password form with valid matching passwords, THE Auth_Service SHALL update the password via Supabase and THE Settings_Page SHALL display an inline "Password updated" confirmation message.
4. IF the new password and confirm password fields do not match, THEN THE Settings_Page SHALL display an inline validation error without submitting the form.
5. THE Settings_Page SHALL list all active personas (name, role, created date) with a delete button per persona.
6. WHEN the user clicks delete on a persona in the Settings_Page, THE Persona_Service SHALL soft-delete the persona by setting `deleted_at`.
7. THE Settings_Page SHALL render a Danger Zone section with a "Delete Account" button.
8. WHEN the user clicks "Delete Account", THE Settings_Page SHALL display a confirmation modal with the message "Your account will be deactivated immediately. Your conversations and data will be permanently deleted within 30 days." requiring the user to type "DELETE" in an input field before the confirm button becomes active.
9. WHEN the user confirms account deletion, THE Auth_Service SHALL disable the Supabase auth account, set `deleted_at` on the user record, and THE Application SHALL navigate to `/`. All user data (personas, conversations, messages) is retained in the database for 30 days and purged by the platform operator — users cannot access it after account deactivation.
10. THE Settings_Page SHALL match the VAEVUM dark design system.

---

### Requirement 10: API Layer

**User Story:** As the application, I want a secure Express API layer that validates authentication and mediates all data operations, so that client-side code never directly manipulates sensitive data.

#### Acceptance Criteria

1. THE Chat_Service SHALL expose `POST /api/chat` accepting `{ conversationId, message, persona, currentMode }`, calling `buildSystemPrompt`, calling the Groq_Client, saving both messages, and returning the assistant response.
2. THE Persona_Service SHALL expose `GET /api/personas` returning all active personas for the authenticated user.
3. THE Persona_Service SHALL expose `POST /api/personas` accepting persona fields and creating a new persona record.
4. THE Persona_Service SHALL expose `PATCH /api/personas/:id` accepting updated persona fields and updating the record WHERE `user_id = auth.uid()`.
5. THE Persona_Service SHALL expose `DELETE /api/personas/:id` performing a soft delete by setting `deleted_at` WHERE `user_id = auth.uid()`.
6. THE Message_Service SHALL expose `GET /api/conversations/:personaId` returning the existing conversation for the persona or creating a new one.
7. THE Message_Service SHALL expose `GET /api/messages/:conversationId` returning paginated messages (default limit 50, cursor-based by `created_at`).
8. THE Message_Service SHALL expose `POST /api/messages` accepting a message object and persisting it to the `messages` table.
9. THE Auth_Service SHALL expose `PATCH /api/user/password` to update the authenticated user's password.
10. THE Auth_Service SHALL expose `DELETE /api/user` to soft-delete the authenticated user's account.
11. EVERY API endpoint SHALL verify the request carries a valid Supabase session token before processing — unauthenticated requests SHALL receive a 401 response.
12. THE API layer SHALL never expose the Supabase service_role key to the client — only the anon key SHALL be used in frontend code.

---

### Requirement 11: Design System Compliance

**User Story:** As a user, I want every screen to feel cohesive and premium, so that the dark aesthetic is consistent throughout the entire application.

#### Acceptance Criteria

1. THE Application SHALL use `#050507` as the global background color, `#12121c` as the primary surface color, and `#1a1a28` as the secondary surface color.
2. THE Application SHALL use `#9d8cff` (accent purple), `#ff6b9d` (accent pink), and `#ffb347` (accent gold) as the only accent colors.
3. THE Application SHALL use `#e8e6f0` as the primary text color and `#6b6880` as the dimmed text color.
4. THE Application SHALL use Cormorant Garamond for all display text, headings, and AI message bubbles.
5. THE Application SHALL use Space Mono for all UI labels, buttons, user message bubbles, and code elements.
6. THE Application SHALL apply zero border-radius to all containers, cards, buttons, and inputs.
7. THE Application SHALL apply the noise texture overlay (SVG fractalNoise, opacity 0.03) to the body element globally.
8. THE Application SHALL apply the ambient glow blobs on all full-page layouts.
9. THE Application SHALL apply the custom Cursor globally across all pages.
10. THE Application SHALL use opacity fade animations (0.3s) for page transitions and message entry — bounce and spring animations SHALL NOT be used.
11. THE Application SHALL render all button borders as 1px solid at low opacity, with hover state increasing letter-spacing.
12. THE Application SHALL render all text inputs with a transparent background and bottom border only.

---

### Requirement 12: Steering Files

**User Story:** As a developer, I want persistent steering files that encode the design system, AI behavior rules, and database rules, so that all future development remains consistent with the VAEVUM specification.

#### Acceptance Criteria

1. THE Repository SHALL contain `.kiro/steering/design-system.md` documenting all color tokens, typography rules, shape rules, atmosphere effects, animation constraints, and component defaults.
2. THE Repository SHALL contain `.kiro/steering/ai-behavior.md` documenting the Groq API configuration, system prompt rules, persona character rules, response style guidelines, and error response copy.
3. THE Repository SHALL contain `.kiro/steering/database.md` documenting the Supabase client usage rules, RLS enforcement requirements, soft delete patterns, data ownership policies, and query patterns.
