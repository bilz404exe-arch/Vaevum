# Implementation Plan: VAEVUM AI Companion Platform

## Overview

Implement the VAEVUM AI companion platform as a Next.js (pages router) + TypeScript + Tailwind CSS application. The build follows a strict bottom-up order: infrastructure first, then data layer, then UI screens in dependency order, then wiring and polish. Every task builds on the previous one — no orphaned code. The tech stack is Supabase (auth + PostgreSQL + RLS), Groq API (llama-3.3-70b-versatile), and Vercel deployment. Testing uses Vitest + fast-check.

---

## Tasks

- [x] 1. Project setup, dependencies, and client initialization
  - Initialize Next.js project with TypeScript and Tailwind CSS (pages router)
  - Install all dependencies: `@supabase/supabase-js`, `groq-sdk`, `vitest`, `@vitest/coverage-v8`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `fast-check`
  - Configure `tailwind.config.ts` with the VAEVUM color tokens (`background`, `surface`, `surface2`, `border`, `border-active`, `accent-purple`, `accent-pink`, `accent-gold`, `text`, `text-dim`, `text-muted`) and font families (`Cormorant Garamond`, `Space Mono`)
  - Add Google Fonts import for Cormorant Garamond and Space Mono in `src/pages/_document.tsx`
  - Create `src/pages/_app.tsx` — global app wrapper: initializes Supabase auth state listener, applies `cursor: none` on body, imports `globals.css`
  - Create `src/styles/globals.css` — CSS custom properties for all color tokens, base resets, Google Fonts `@import`
  - Create `src/lib/supabase.ts` — Supabase browser client initialized with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Create `src/lib/supabaseServer.ts` — Supabase server client using the service role key (server-side only, never imported by client code)
  - Create `src/lib/groq.ts` — Groq SDK client initialized with `GROQ_API_KEY`
  - Create `src/lib/utils.ts` — shared helpers: `truncate(str, n)`, `relativeTime(date)` (used by PersonaCard for "2h ago" timestamps)
  - Create `vitest.config.ts` with `environment: 'jsdom'` and `setupFiles: ['./src/test/setup.ts']`
  - Create `src/test/setup.ts` with jsdom setup and mock Supabase client
  - Create `src/test/arbitraries.ts` with shared fast-check arbitraries: `personaArbitrary`, `messageArbitrary`, `modeArbitrary`, `personaRoleArbitrary`
  - Create `.env.local.example` documenting all required environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY`, `NEXT_PUBLIC_APP_URL`
  - _Requirements: 10.12_

- [ ] 2. TypeScript types, database schema, and RLS policies
  - [x] 2.1 Create `src/types/index.ts` with all TypeScript interfaces and union types
    - Define `Persona`, `Conversation`, `Message`, `MessagePage`, `ChatRequest`, `ChatResponse`, `CreatePersonaInput`
    - Define union types: `PersonaRole`, `GenderEnergy`, `PersonalityTone`, `ContentMode`
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ] 2.2 Create `database.md` steering file at `.kiro/steering/database.md`
    - Document Supabase client usage rules (browser client vs server client)
    - Document RLS enforcement requirements and soft delete patterns
    - Document data ownership policies (`auth.uid() = user_id` on every query)
    - Document cursor-based pagination pattern for messages
    - _Requirements: 12.3_

  - [x] 2.3 Write SQL migration file `supabase/migrations/001_initial_schema.sql`
    - Create `personas` table with all columns per spec (uuid pk, user_id, name, role, gender, tone, mode, created_at, updated_at, deleted_at)
    - Create `conversations` table (uuid pk, user_id, persona_id FK, created_at, last_message, last_active, deleted_at)
    - Create `messages` table (uuid pk, conversation_id FK, user_id FK, role CHECK IN ('user','assistant'), content, mode_at_time, created_at)
    - Create indexes: `idx_personas_user_id`, `idx_conversations_user_persona`, `idx_messages_conversation_created`
    - Enable RLS on all three tables
    - Create all 12 RLS policies (SELECT, INSERT, UPDATE, DELETE × 3 tables) using `auth.uid() = user_id`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11_

  - [ ]\* 2.4 Write property test for soft delete round-trip (P5)
    - **Property 5: Soft delete preserves data but removes it from active queries**
    - Use `fc.record({ name, role, gender, tone, mode })` arbitrary
    - Assert: after soft-delete, `deleted_at` is non-null AND record is absent from `WHERE deleted_at IS NULL` query
    - **Validates: Requirements 3.12, 3.13**

- [ ] 3. System prompt engine (`buildSystemPrompt`)
  - [x] 3.1 Create `src/lib/systemPrompt.ts` with all instruction maps and `buildSystemPrompt` function
    - Define `GENDER_INSTRUCTIONS` const map for all 4 gender energies
    - Define `TONE_INSTRUCTIONS` const map for all 5 personality tones
    - Define `MODE_INSTRUCTIONS` const map for all 8 content modes
    - Define `OPENING_MESSAGES` const map for all 10 persona roles
    - Implement `buildSystemPrompt(persona: Persona, currentMode: ContentMode): string` assembling the full system prompt per the spec structure (name, role, gender energy + instruction, tone + instruction, mode + instruction, core rules)
    - Export `OPENING_MESSAGES` for use in the chat screen
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ]\* 3.2 Write property test for buildSystemPrompt completeness (P16)
    - **Property 16: buildSystemPrompt always includes all persona fields and their mapped instructions**
    - Use `fc.record({ name, role, gender, tone, mode })` and `modeArbitrary`
    - Assert: returned string contains persona.name, persona.role, persona.gender, GENDER_INSTRUCTIONS[persona.gender], persona.tone, TONE_INSTRUCTIONS[persona.tone], currentMode, MODE_INSTRUCTIONS[currentMode]
    - Tag: `// Feature: vaevum-ai-companion, Property 16: buildSystemPrompt completeness`
    - **Validates: Requirements 7.2, 7.3, 7.4, 7.5**

  - [ ]\* 3.3 Write property test for Groq API params invariant (P17)
    - **Property 17: Groq API calls always use the correct model parameters**
    - Use `personaArbitrary` and `modeArbitrary`
    - Mock the Groq client; assert every call uses `model: 'llama-3.3-70b-versatile'`, `max_tokens: 1024`, `temperature: 0.85`
    - Tag: `// Feature: vaevum-ai-companion, Property 17: Groq params invariant`
    - **Validates: Requirements 7.7**

- [ ] 4. Global layout, design system components, and custom cursor
  - [x] 4.1 Create `src/components/layout/PageWrapper.tsx`
    - Render noise texture SVG overlay (fractalNoise, opacity 0.03, z-index 9999, pointer-events none)
    - Render three ambient glow blobs (purple top-left, pink bottom-right, gold mid-left) at z-index 0
    - Apply `cursor: none` to body
    - Render custom cursor: 8px dot + 28px lagging ring, both `mix-blend-mode: difference`, ring follows with ~80ms CSS transition
    - Wrap all children in a `position: relative; z-index: 1` container
    - _Requirements: 1.7, 1.8, 1.10, 11.7, 11.8, 11.9_

  - [x] 4.2 Create shared UI components in `src/components/ui/`
    - `Button.tsx` — transparent background, 1px border, Space Mono uppercase, zero border-radius, hover letter-spacing transition; `variant` prop supports `default`, `gradient` (purple→pink), `danger`; `loading` prop shows pulsing opacity on label
    - `Input.tsx` — transparent background, bottom border only, zero border-radius, Space Mono; focus shifts border to `rgba(157,140,255,0.6)`; `error` prop renders inline error text; `fontStyle` prop supports `mono` (default) and `serif` (Cormorant for name input)
    - `Modal.tsx` — z-index 100, surface background, zero border-radius, opacity fade in/out; `confirmDisabled` prop gates the confirm button
    - `ModeBadge.tsx` — purple tinted background, 1px purple border, Space Mono uppercase, zero border-radius, 0.65rem font size
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.11, 11.12_

  - [x] 4.3 Create `src/components/layout/Header.tsx`
    - VAEVUM logo (Cormorant Garamond, gradient shimmer animation), user email (Space Mono, text-dim), logout button
    - Used on dashboard and settings pages
    - _Requirements: 8.1_

- [ ] 5. Landing page (`/`)
  - [x] 5.1 Create `src/pages/index.tsx` — landing page
    - Render VAEVUM logo in Cormorant Garamond with animated gradient shimmer (background-position shift, 6s ease-in-out infinite)
    - Render tagline "Dark enough to hold your secrets. Real enough to understand them." below the logo
    - Render a single ENTER button (Space Mono, uppercase, 1px border, zero border-radius)
    - Render a rotating decorative ring element behind the logo
    - On mount: check Supabase session — if authenticated, redirect to `/dashboard`; if not, render the page
    - ENTER button navigates to `/auth`
    - Animate logo fade-up on load: `opacity 0→1`, `translateY 20px→0`, 0.8s ease
    - Wrap in `PageWrapper` for noise, blobs, and cursor
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.9, 1.11, 1.12_

  - [ ]\* 5.2 Write unit tests for landing page
    - Test: tagline text renders correctly
    - Test: exactly one CTA button is rendered
    - Test: ENTER button navigates to `/auth` when session is null
    - Test: authenticated user is redirected to `/dashboard` without clicking ENTER
    - _Requirements: 1.2, 1.3, 1.4, 1.5_

- [x] 6. Checkpoint — core infrastructure complete
  - Ensure all tests pass, ask the user if questions arise.
  - Verify: Supabase client initializes without errors, `buildSystemPrompt` is callable and returns a non-empty string, all shared UI components render without TypeScript errors

- [ ] 7. Authentication — `useAuth` hook and auth page (`/auth`)
  - [x] 7.1 Create `src/hooks/useAuth.ts`
    - Implement `useAuth()` returning `{ user, session, loading, signIn, signUp, signOut }`
    - `signIn` calls `supabase.auth.signInWithPassword()`; `signUp` calls `supabase.auth.signUp()`
    - `signOut` calls `supabase.auth.signOut()` then navigates to `/`
    - Subscribe to `supabase.auth.onAuthStateChange` to keep `user` and `session` in sync
    - Never store passwords in component state or localStorage
    - _Requirements: 2.1, 2.7, 2.8, 2.12_

  - [x] 7.2 Create `src/pages/auth.tsx` — login and signup forms
    - Render toggle between Login and Signup views
    - Signup form: email, password, confirm password fields; enforce minimum 8-character password with inline validation error
    - Login form: email, password fields
    - On successful signup: navigate to `/builder`; on successful login: navigate to `/dashboard`
    - On auth failure: display inline error message in the DOM — never `window.alert()`
    - Show loading state on submit button while request is in flight
    - Wrap in `PageWrapper`; apply VAEVUM design system throughout
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 2.9, 2.10, 2.11_

  - [ ]\* 7.3 Write property test for auth navigation (P1)
    - **Property 1: Successful auth always navigates to the correct destination**
    - Use `fc.emailAddress()` and `fc.string({ minLength: 8 })` arbitraries
    - Mock Supabase to return success; assert signup → `/builder`, login → `/dashboard`
    - Tag: `// Feature: vaevum-ai-companion, Property 1: Auth navigation`
    - **Validates: Requirements 2.4, 2.5**

  - [ ]\* 7.4 Write property test for auth errors inline (P2)
    - **Property 2: Auth failures always produce inline errors, never alerts**
    - Use `fc.constantFrom(...supabaseErrorTypes)` arbitrary
    - Assert: error message appears in DOM; `window.alert` is never called
    - Tag: `// Feature: vaevum-ai-companion, Property 2: Auth errors inline`
    - **Validates: Requirements 2.6**

  - [ ]\* 7.5 Write property test for short password validation (P3)
    - **Property 3: Short passwords always fail validation**
    - Use `fc.string({ maxLength: 7 })` arbitrary
    - Assert: inline validation error shown; Supabase `signUp` is never called
    - Tag: `// Feature: vaevum-ai-companion, Property 3: Short password validation`
    - **Validates: Requirements 2.9**

- [ ] 8. Auth guards and routing
  - [x] 8.1 Create `src/lib/withAuth.ts` — higher-order component / utility for protected routes
    - On every protected page (`/builder`, `/dashboard`, `/chat/[id]`, `/settings`): call `supabase.auth.getSession()` in `getServerSideProps` or a client-side `useEffect`
    - If session is null, redirect to `/auth`
    - Export a `useRequireAuth()` hook that performs the redirect check on the client side
    - _Requirements: 2.13_

  - [ ]\* 8.2 Write property test for protected route redirects (P4)
    - **Property 4: All protected routes redirect unauthenticated users to /auth**
    - Use `fc.constantFrom('/builder', '/dashboard', '/chat/test-id', '/settings')` arbitrary
    - Mock session as null; assert each route redirects to `/auth`
    - Tag: `// Feature: vaevum-ai-companion, Property 4: Protected route redirects`
    - **Validates: Requirements 2.13**

- [ ] 9. Persona builder — components and page (`/builder`)
  - [x] 9.1 Create `src/components/builder/OptionGrid.tsx`
    - Render option cards with `surface` background, 1px border, zero border-radius
    - Selected state: `border-active` border + purple glow `box-shadow`
    - Accept `options`, `selected`, `onSelect`, `columns` (1 or 2) props
    - Enforce single-selection: selecting one option deselects all others in the same group
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 9.2 Create builder step components `src/components/builder/StepOne.tsx` through `StepFive.tsx`
    - StepOne: text input for persona name, max 24 chars, Cormorant Garamond italic, bottom border only, placeholder "Name your Vaevum..."
    - StepTwo: `OptionGrid` (1 col) for Role — 10 options with emoji prefixes
    - StepThree: `OptionGrid` (1 col) for Gender Energy — 4 options
    - StepFour: `OptionGrid` (1 col) for Personality Tone — 5 options
    - StepFive: `OptionGrid` (2 col) for Content Mode — 8 options with icon, name, and one-line description
    - Each step receives `value` and `onChange` props
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.11_

  - [x] 9.3 Create `src/hooks/usePersona.ts`
    - Implement `usePersona()` returning `{ personas, loading, createPersona, updatePersona, deletePersona }`
    - `createPersona` POSTs to `/api/personas`; `deletePersona` calls `DELETE /api/personas/:id`
    - `updatePersona` calls `PATCH /api/personas/:id`
    - _Requirements: 4.7, 4.8_

  - [x] 9.4 Create `src/pages/builder.tsx` — 5-step persona builder page
    - Render all five step components sequentially on a single scrollable page
    - Manage form state for all five fields
    - BEGIN button: disabled until all five fields are filled; shows loading state while saving
    - On BEGIN click with missing fields: display inline validation error identifying the missing field(s)
    - On successful persona save: create conversation via `GET /api/conversations/:personaId`, then navigate to `/chat/[conversationId]`
    - On save failure: display inline error on BEGIN button
    - Apply `useRequireAuth()` guard; wrap in `PageWrapper`
    - _Requirements: 4.7, 4.8, 4.9, 4.10, 4.12_

  - [ ]\* 9.5 Write property test for builder selection exclusivity (P6)
    - **Property 6: Builder selection state is exclusive within each step**
    - Use `fc.constantFrom(...allOptionValues)` arbitrary for each step
    - Render `OptionGrid`; select an option; assert only that option has selected state
    - Tag: `// Feature: vaevum-ai-companion, Property 6: Builder selection exclusivity`
    - **Validates: Requirements 4.6**

  - [ ]\* 9.6 Write property test for valid persona submission (P7)
    - **Property 7: Valid persona submission always calls the API with correct fields**
    - Use `fc.record({ name: fc.string({ minLength: 1, maxLength: 24 }), role, gender, tone, mode })` arbitrary
    - Mock fetch; assert POST to `/api/personas` contains exactly those field values
    - Tag: `// Feature: vaevum-ai-companion, Property 7: Valid persona submission`
    - **Validates: Requirements 4.7**

  - [ ]\* 9.7 Write property test for incomplete form blocking (P8)
    - **Property 8: Incomplete builder form always blocks submission**
    - Use `fc.subarray(['name','role','gender','tone','mode'], { minLength: 0, maxLength: 4 })` arbitrary (at least one field missing)
    - Assert: inline validation error shown; navigation does not occur
    - Tag: `// Feature: vaevum-ai-companion, Property 8: Incomplete form blocks submit`
    - **Validates: Requirements 4.9**

- [x] 10. Checkpoint — auth, builder, and routing complete
  - Ensure all tests pass, ask the user if questions arise.
  - Verify: auth flow navigates correctly, builder saves a persona and redirects to chat, protected routes redirect unauthenticated users

- [ ] 11. API routes — personas, conversations, messages, user
  - [x] 11.1 Create `src/pages/api/personas/index.ts` — GET and POST handlers
    - GET: verify session (401 if missing); query `personas WHERE user_id = auth.uid() AND deleted_at IS NULL` ordered by last_active DESC via join; return `Persona[]`
    - POST: verify session; validate required fields; insert into `personas`; return created `Persona`
    - _Requirements: 10.2, 10.3, 10.11_

  - [x] 11.2 Create `src/pages/api/personas/[id].ts` — PATCH and DELETE handlers
    - PATCH: verify session; update persona fields WHERE `user_id = auth.uid()`; return updated `Persona`
    - DELETE: verify session; set `deleted_at = now()` WHERE `user_id = auth.uid()`; return `{ success: true }`
    - _Requirements: 10.4, 10.5, 10.11_

  - [x] 11.3 Create `src/pages/api/conversations/[personaId].ts` — GET handler
    - Verify session (401 if missing)
    - Query existing conversation for `(user_id, persona_id)` WHERE `deleted_at IS NULL`
    - If none exists, create a new conversation record
    - Return the `Conversation` object
    - _Requirements: 10.6, 10.11_

  - [x] 11.4 Create `src/pages/api/messages/[conversationId].ts` — GET handler
    - Verify session (401 if missing)
    - Accept `cursor` (ISO timestamp) and `limit` (default 50) query params
    - Query messages WHERE `conversation_id = :id AND user_id = auth.uid()` ordered by `created_at ASC`
    - Apply cursor: `WHERE created_at < :cursor` for pagination
    - Return `MessagePage` with `messages`, `nextCursor`, `hasMore`
    - _Requirements: 10.7, 10.11_

  - [x] 11.5 Create `src/pages/api/messages/index.ts` — POST handler
    - Verify session (401 if missing)
    - Insert message into `messages` table
    - Return created `Message`
    - _Requirements: 10.8, 10.11_

  - [x] 11.6 Create `src/pages/api/user/password.ts` — PATCH handler
    - Verify session (401 if missing)
    - Call `supabase.auth.updateUser({ password: newPassword })`
    - Return `{ success: true }`
    - _Requirements: 10.9, 10.11_

  - [x] 11.7 Create `src/pages/api/user/index.ts` — DELETE handler
    - Verify session (401 if missing)
    - Disable the Supabase auth account using the service role client
    - Return `{ success: true }`
    - _Requirements: 10.10, 10.11_

  - [ ]\* 11.8 Write property test for API auth enforcement (P22)
    - **Property 22: Every API endpoint returns 401 for unauthenticated requests**
    - Use `fc.constantFrom('/api/chat', '/api/personas', '/api/messages/test', '/api/conversations/test', '/api/user')` arbitrary
    - Send requests without a session token; assert HTTP 401 response for every endpoint
    - Tag: `// Feature: vaevum-ai-companion, Property 22: API auth enforcement`
    - **Validates: Requirements 10.11**

- [ ] 12. Chat API route (`POST /api/chat`) and message persistence
  - [x] 12.1 Create `src/pages/api/chat.ts` — POST handler
    - Verify session (401 if missing)
    - Accept `ChatRequest`: `{ conversationId, message, persona, currentMode }`
    - Call `buildSystemPrompt(persona, currentMode)` to assemble the system prompt
    - Fetch full conversation history from `messages` table for the `conversationId`
    - Call Groq API: `model: 'llama-3.3-70b-versatile'`, `max_tokens: 1024`, `temperature: 0.85`, messages array = `[system, ...history, userMessage]`
    - On success: INSERT user message and assistant message into `messages` with correct `conversation_id`, `user_id`, `role`, `content`, `mode_at_time`
    - UPDATE `conversations.last_message` (assistant content truncated to 60 chars) and `last_active = now()`
    - Return `ChatResponse`: `{ content, messageId }`
    - On Groq failure: log error server-side; return 502 with `{ error: 'AI service unavailable' }`
    - On DB save failure: log error; return AI response to client anyway — do not block chat
    - _Requirements: 6.1, 6.2, 6.4, 6.5, 7.7, 7.8, 10.1, 10.11_

  - [ ]\* 12.2 Write property test for message persistence (P13)
    - **Property 13: Every successful chat exchange persists both messages with correct metadata**
    - Use `fc.string({ minLength: 1 })` and `personaArbitrary`
    - Mock Groq and Supabase; assert both user and assistant messages are inserted with correct `role`, `conversation_id`, `user_id`, `mode_at_time`
    - Tag: `// Feature: vaevum-ai-companion, Property 13: Message persistence`
    - **Validates: Requirements 6.1**

  - [ ]\* 12.3 Write property test for conversation metadata update (P14)
    - **Property 14: Conversation metadata is updated after every message exchange**
    - Use `fc.string({ minLength: 1, maxLength: 500 })` arbitrary for assistant content
    - Assert: `last_message` equals content truncated to 60 chars; `last_active` is no earlier than the start of the save operation
    - Tag: `// Feature: vaevum-ai-companion, Property 14: Conversation metadata update`
    - **Validates: Requirements 6.2**

  - [ ]\* 12.4 Write property test for full history passed to Groq (P15)
    - **Property 15: Full conversation history is always passed to the Groq API**
    - Use `fc.array(messageArbitrary, { minLength: 0, maxLength: 100 })` arbitrary
    - Mock Groq client; assert the `messages` array passed to Groq contains all N prior messages (after system prompt, before new user message)
    - Tag: `// Feature: vaevum-ai-companion, Property 15: Full history passed to Groq`
    - **Validates: Requirements 6.4**

- [ ] 13. Chat screen — components and page (`/chat/[id]`)
  - [x] 13.1 Create `src/components/chat/MessageBubble.tsx`
    - AI bubbles: Cormorant Garamond, left-aligned, `surface` background, AI avatar glyph; fade-up entry animation (0.3s)
    - User bubbles: Space Mono, right-aligned, `surface2` background, user glyph; fade-up entry animation (0.3s)
    - Accept `role`, `content`, `modeAtTime` props
    - _Requirements: 5.6, 5.7_

  - [x] 13.2 Create `src/components/chat/TypingIndicator.tsx`
    - Three dots: purple (`#9d8cff`), pink (`#ff6b9d`), gold (`#ffb347`)
    - Staggered pulse animation at 0.4s intervals (scale or opacity)
    - Renders in the AI bubble position (left-aligned, `surface` background)
    - _Requirements: 5.10_

  - [x] 13.3 Create `src/components/chat/ModeBar.tsx` and `ModeDivider.tsx`
    - `ModeBar`: renders all 8 mode buttons; active mode highlighted with `border-active` and accent-purple text; fires `onModeChange(mode)` on click
    - `ModeDivider`: centered text "— mode: [name] —", Cormorant Garamond italic, text-dim color; fades in at 0.3s
    - _Requirements: 5.3, 5.4_

  - [x] 13.4 Create `src/components/layout/Sidebar.tsx`
    - Fixed 220px left panel; z-index 10
    - Contains: VAEVUM logo mark, persona card (avatar glyph, name in Cormorant Garamond italic, role label), `ModeBar`, Rebuild Persona button at bottom
    - On mobile (< 768px): collapses to hidden or bottom drawer
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 13.5 Create `src/hooks/useMessages.ts`
    - Implement `useMessages(conversationId)` returning `{ messages, loading, sending, hasMore, sendMessage, loadMore }`
    - `sendMessage`: append user message to state immediately (optimistic UI); append typing indicator placeholder; POST to `/api/chat`; replace placeholder with AI response on success; on error, replace placeholder with error bubble
    - On 429 rate limit response: show "Give me a moment..." in AI bubble, wait 2 seconds, then automatically retry the same message once
    - `loadMore`: fetch next page using cursor from `GET /api/messages/:conversationId?cursor=...`
    - Initial load: fetch most recent 50 messages
    - _Requirements: 5.9, 5.10, 5.11, 5.14, 5.17, 6.3_

  - [x] 13.6 Create `src/pages/chat/[id].tsx` — chat screen
    - Apply `useRequireAuth()` guard
    - Load persona and conversation data on mount
    - Display opening message (from `OPENING_MESSAGES[persona.role]`) when conversation has no prior messages
    - Render `Sidebar` with persona info and `ModeBar`; render message feed with `MessageBubble` components
    - Render input area: dark textarea (auto-resize up to 120px), italic placeholder "Say anything...", gradient send button, hint text "everything stays between you and vaevum"
    - Enter key submits; Shift+Enter inserts newline
    - Smooth-scroll to latest message on every new message
    - On mode change: update active mode state, inject `ModeDivider` into feed, rebuild system prompt for next call
    - On Groq error: display error string in AI bubble — never throw unhandled exception
    - On network offline: disable send button, show offline indicator in input area
    - Rebuild Persona button navigates to `/builder`
    - Wrap in `PageWrapper`
    - _Requirements: 5.1, 5.2, 5.4, 5.5, 5.8, 5.12, 5.13, 5.15, 5.16, 5.17, 5.18_

  - [ ]\* 13.7 Write property test for opening message by role (P9)
    - **Property 9: Opening message always matches persona role**
    - Use `fc.constantFrom('Girlfriend','Boyfriend','Best Friend','Therapist','Dominant','Submissive','Protector','Villain','Mentor','Custom')` arbitrary
    - Assert: for each role, the displayed opening message equals `OPENING_MESSAGES[role]` and no other role's message is shown
    - Tag: `// Feature: vaevum-ai-companion, Property 9: Opening message by role`
    - **Validates: Requirements 5.8**

  - [ ]\* 13.8 Write property test for optimistic UI (P10)
    - **Property 10: User messages appear in the feed before the API responds**
    - Use `fc.string({ minLength: 1 })` arbitrary
    - Mock `sendMessage` to delay resolution; assert user message is in the DOM before the mock resolves
    - Tag: `// Feature: vaevum-ai-companion, Property 10: Optimistic UI`
    - **Validates: Requirements 5.9**

  - [ ]\* 13.9 Write property test for API errors in AI bubble (P12)
    - **Property 12: API errors always surface in an AI bubble, never as unhandled exceptions**
    - Use `fc.constantFrom('network_error','rate_limit','server_error','timeout')` arbitrary
    - Mock Groq to throw each error type; assert error message appears in an AI bubble; assert no unhandled exception propagates
    - Tag: `// Feature: vaevum-ai-companion, Property 12: API errors in AI bubble`
    - **Validates: Requirements 5.17**

- [ ] 14. Message pagination
  - [x] 14.1 Wire cursor-based pagination into `useMessages` and the message feed
    - On initial load: fetch 50 most recent messages; set `hasMore` based on `MessagePage.hasMore`
    - On scroll to top of feed: call `loadMore()` using `nextCursor` from previous page
    - Prepend older messages to the top of the feed without losing scroll position
    - _Requirements: 5.14, 6.3_

  - [ ]\* 14.2 Write property test for message pagination ordering (P11)
    - **Property 11: Message retrieval is ordered and paginated correctly**
    - Use `fc.array(messageArbitrary, { minLength: 1, maxLength: 200 })` arbitrary
    - Assert: initial load returns most recent min(N, 50) messages ordered by `created_at` ASC; each subsequent page returns the next batch without duplicates or gaps
    - Tag: `// Feature: vaevum-ai-companion, Property 11: Message pagination ordering`
    - **Validates: Requirements 5.14, 6.3**

- [x] 15. Checkpoint — chat screen complete
  - Ensure all tests pass, ask the user if questions arise.
  - Verify: full chat flow works end-to-end (send message → typing indicator → AI response → both messages persisted), mode switching injects divider and rebuilds prompt, pagination loads older messages correctly

- [ ] 16. Dashboard — components and page (`/dashboard`)
  - [x] 16.1 Create `src/components/dashboard/PersonaCard.tsx`
    - Display: role emoji avatar (square, zero border-radius), persona name (Cormorant Garamond italic), role label (Space Mono), last message preview truncated to 60 chars, relative timestamp (e.g., "2h ago"), `ModeBadge`
    - Reveal delete icon on hover / long-press
    - Accept `persona`, `lastMessage`, `lastActive`, `conversationId`, `onDelete` props
    - _Requirements: 8.5, 8.7_

  - [x] 16.2 Create `src/components/dashboard/EmptyState.tsx`
    - Centered message "You haven't built your Vaevum yet." with CTA button navigating to `/builder`
    - _Requirements: 8.10_

  - [x] 16.3 Create `src/pages/dashboard.tsx` — dashboard page
    - Apply `useRequireAuth()` guard
    - Fetch all personas via `GET /api/personas` (returns only `deleted_at IS NULL`, sorted by `last_active DESC`)
    - Render `Header` with logo, user email, logout button
    - Render 2-column grid on desktop, 1-column on mobile
    - First grid item: "+ New Persona" card navigating to `/builder`
    - Remaining items: `PersonaCard` for each persona
    - On persona card click: navigate to `/chat/[conversationId]`
    - On delete icon click: show `Modal` with "Remove [name]? This hides them from your dashboard."
    - On modal confirm: call `DELETE /api/personas/:id`; remove card from grid
    - If no active personas: render `EmptyState`
    - Wrap in `PageWrapper`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.6, 8.7, 8.8, 8.9, 8.10_

  - [ ]\* 16.4 Write property test for dashboard query correctness (P18)
    - **Property 18: Dashboard only shows non-deleted personas sorted by recency**
    - Use `fc.array(personaArbitrary)` with varying `deleted_at` and `last_active` values
    - Assert: only personas with `deleted_at === null` are rendered; they appear in descending `last_active` order
    - Tag: `// Feature: vaevum-ai-companion, Property 18: Dashboard query correctness`
    - **Validates: Requirements 8.4**

  - [ ]\* 16.5 Write property test for persona card rendering (P19)
    - **Property 19: Persona cards always render all required display fields**
    - Use `personaArbitrary` combined with conversation data arbitrary
    - Assert: rendered card contains role emoji, persona name, role label, last message preview ≤ 60 chars, a relative timestamp string, and a mode badge
    - Tag: `// Feature: vaevum-ai-companion, Property 19: Persona card rendering`
    - **Validates: Requirements 8.5**

- [ ] 17. Settings page (`/settings`)
  - [x] 17.1 Create `src/pages/settings.tsx` — settings page
    - Apply `useRequireAuth()` guard
    - Display user email as read-only field (Space Mono, text-dim)
    - Render change password form: current password, new password, confirm new password fields
    - On submit with matching passwords: call `PATCH /api/user/password`; show inline "Password updated" confirmation
    - On mismatched passwords: show inline validation error; do not submit
    - List all active personas (name, role, created date) with a delete button per persona; on delete: call `DELETE /api/personas/:id` (soft delete)
    - Render Danger Zone section with "Delete Account" button
    - On "Delete Account" click: show `Modal` with title "Delete Account" and body copy: "Your account will be deactivated immediately. Your conversations and data will be permanently deleted within 30 days." — require user to type "DELETE" (case-sensitive) before confirm button becomes active
    - On confirmed deletion: call `DELETE /api/user`; navigate to `/`
    - Wrap in `PageWrapper`; apply VAEVUM design system
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 9.10_

  - [ ]\* 17.2 Write property test for password mismatch validation (P20)
    - **Property 20: Mismatched passwords always block form submission**
    - Use `fc.tuple(fc.string(), fc.string()).filter(([a, b]) => a !== b)` arbitrary
    - Assert: inline validation error shown; `PATCH /api/user/password` is never called
    - Tag: `// Feature: vaevum-ai-companion, Property 20: Password mismatch validation`
    - **Validates: Requirements 9.4**

  - [ ]\* 17.3 Write property test for DELETE confirmation gate (P21)
    - **Property 21: Account deletion confirm button is disabled for any input other than "DELETE"**
    - Use `fc.string().filter(s => s !== 'DELETE')` arbitrary
    - Assert: confirm button has `disabled` attribute for every non-"DELETE" string
    - Tag: `// Feature: vaevum-ai-companion, Property 21: DELETE confirmation gate`
    - **Validates: Requirements 9.8**

- [x] 18. Checkpoint — all screens complete
  - Ensure all tests pass, ask the user if questions arise.
  - Verify: dashboard loads and displays persona cards correctly, settings page updates password and soft-deletes personas, account deletion flow works end-to-end

- [ ] 19. Loading states, empty states, and error boundaries
  - [x] 19.1 Add loading states throughout the application
    - Dashboard: skeleton cards while personas are loading
    - Chat screen: loading spinner while conversation and initial messages are fetching
    - Builder: loading state on BEGIN button during save
    - Auth page: loading state on submit button during auth call
    - Settings: loading state on password update button
    - _Requirements: 2.10, 4.10_

  - [x] 19.2 Add error boundaries and graceful error handling
    - Create `src/components/ErrorBoundary.tsx` — React error boundary wrapping page-level components
    - Chat screen: display Groq error copy in AI bubble on any API failure; never propagate unhandled exceptions
    - All API routes: return structured JSON errors (400, 401, 404, 500, 502) — never expose stack traces
    - Network offline detection: disable send button and show offline indicator in chat input area
    - _Requirements: 5.17, 5.18_

  - [x] 19.3 Add empty states
    - Dashboard: `EmptyState` component when no active personas exist
    - Chat screen: opening message displayed when conversation has no prior messages
    - _Requirements: 5.8, 8.10_

- [ ] 20. Integration wiring — `_app.tsx`, navigation, and session persistence
  - [x] 20.1 Configure `src/pages/_app.tsx`
    - Wrap all pages in `PageWrapper` for global noise overlay, ambient blobs, and custom cursor
    - Initialize Supabase auth state listener at the app level
    - Apply global CSS: `cursor: none` on body, CSS custom properties for color tokens, Google Fonts import
    - _Requirements: 1.10, 11.7, 11.8, 11.9_

  - [x] 20.2 Wire navigation flows end-to-end
    - Landing → `/auth` (unauthenticated) or `/dashboard` (authenticated)
    - Auth signup → `/builder`; auth login → `/dashboard`
    - Builder → `/chat/[conversationId]` after persona save
    - Dashboard persona card → `/chat/[conversationId]`
    - Dashboard "+ New Persona" → `/builder`
    - Chat "Rebuild Persona" → `/builder`
    - Logout → `/`
    - Settings "Delete Account" → `/`
    - _Requirements: 1.4, 1.5, 2.4, 2.5, 2.8, 4.8, 8.3, 8.6, 5.16, 9.9_

  - [x] 20.3 Verify session persistence across page reloads
    - Confirm Supabase session token is stored and restored correctly on browser refresh
    - Protected pages do not flash unauthenticated content before redirect
    - _Requirements: 2.7, 2.13_

- [ ] 21. Design system compliance and mobile responsiveness audit
  - [x] 21.1 Audit all components for design system compliance
    - Verify: only the 10 defined color tokens are used — no other colors introduced
    - Verify: Cormorant Garamond used for all display text, headings, AI bubbles; Space Mono used for all UI labels, buttons, user bubbles
    - Verify: zero `border-radius` on all containers, cards, buttons, and inputs
    - Verify: all animations are opacity/translate fades only — no bounce, spring, or slide-in-from-sides
    - Verify: noise overlay, ambient blobs, and custom cursor are present on every page
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.10_

  - [x] 21.2 Audit mobile responsiveness
    - Dashboard: 2-column grid on desktop (≥ 768px), 1-column on mobile (< 768px)
    - Chat screen: sidebar collapses to hidden or bottom drawer on mobile
    - Builder: single-column layout on mobile
    - Auth and settings: full-width forms on mobile
    - _Requirements: 1.12, 4.12, 5.1_

  - [ ]\* 21.3 Write snapshot tests for zero border-radius compliance
    - Snapshot test key UI components (Button, Input, Card, Modal, OptionGrid, PersonaCard)
    - Assert: no `border-radius` value other than `0` appears in rendered styles
    - _Requirements: 11.6_

- [x] 22. Final checkpoint — full review
  - Ensure all tests pass, ask the user if questions arise.
  - Verify: all 22 correctness properties have corresponding property-based tests; RLS policies are applied to all three tables; design system tokens are used consistently; mobile layouts render correctly; no Supabase service role key is exposed to client code; all API endpoints return 401 for unauthenticated requests

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints at tasks 6, 10, 15, 18, and 22 ensure incremental validation
- Property tests validate universal correctness invariants; unit tests validate specific examples and edge cases
- The `database.md` steering file (task 2.2) must be created before any Supabase query work begins
- All 22 correctness properties from the design document are covered by property-based tests (P1–P22)
- The service role key (`SUPABASE_SERVICE_ROLE_KEY`) is used only in server-side API routes — never imported by any file under `src/pages/` that is not under `src/pages/api/`
