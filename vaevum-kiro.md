# VAEVUM — Kiro Project Specification

> Spec-driven build document for Kiro IDE
> _"Dark enough to hold your secrets. Real enough to understand them."_

---

## HOW TO USE THIS IN KIRO

1. Open Kiro IDE — download at kiro.dev
2. Create a new project folder: `vaevum/`
3. Open Agentic Chat in Kiro
4. Paste the **Quick Start Prompt** (Section 1) first
5. Let Kiro generate its spec — review and approve
6. Then paste each **Feature Spec** (Section 3) one at a time
7. Use **Steering Files** (Section 6) to lock in design rules permanently

---

## SECTION 1 — Quick Start Prompt

> Paste this into Kiro Agentic Chat to initialize the project

```
Build a full-stack web application called VAEVUM — a dark, premium AI companion platform.

Users create a fully custom AI persona (name, relationship type, gender energy, personality tone, content mode) then chat with zero filtering and zero judgment. Think Character.AI meets a private confessional — dark, intimate, addictive.

TECH STACK:
- Frontend: React + TypeScript + Tailwind CSS
- Backend: Node.js + Express
- Auth + Database: Supabase (email auth + PostgreSQL with RLS on all tables)
- AI: Groq API with model llama-3.3-70b-versatile
- Hosting: Vercel
- Fonts: Cormorant Garamond + Space Mono (Google Fonts)

CORE FEATURES:
- Landing page with animated brand
- Email auth via Supabase
- Persona builder (5-step onboarding)
- Real-time chat with dynamic AI persona
- Conversation history saved per user
- Dashboard with saved personas
- Live mode switching mid-conversation
- User settings and account management

Generate the full project spec, design document, database schema, API endpoints, and implementation task list.
```

---

## SECTION 2 — Project Overview

### What We Are Building

VAEVUM is a private AI companion platform. Users build a persona — giving it a name, relationship type, gender energy, personality, and content mode — then have unrestricted conversations with that persona. Every message is saved. Every conversation can be resumed. The persona remembers everything within a session.

### Who It Is For

Private friend groups. Individuals seeking unfiltered emotional expression. People who want a non-judgmental presence to vent, create, flirt, or process feelings with.

### Core Value

No corporate filtering. No safety disclaimers. No robotic responses. The AI responds like a real person — raw, warm, dark, funny, or sensual depending on how the user configured it.

---

## SECTION 3 — Feature Specifications

> Paste each spec block into Kiro one at a time after initial project setup

---

### SPEC 01 — Landing Page

```
Feature: VAEVUM Landing Page

Description:
Build a dark, premium landing page that introduces the VAEVUM brand and directs users to sign up or log in.

User Stories:
1. As a visitor, I want to see the VAEVUM brand with dark premium aesthetics so I understand the product tone
2. As a visitor, I want a single clear CTA to enter the platform
3. As a returning user, I want to be redirected to dashboard automatically if already logged in

Acceptance Criteria:
- VAEVUM logo in Cormorant Garamond serif with animated gradient shimmer
- Tagline: "Dark enough to hold your secrets. Real enough to understand them."
- Single ENTER button — routes to /auth if not logged in, /dashboard if logged in
- Full black background (#050507)
- Ambient radial glow blobs: purple #9d8cff top-left, pink #ff6b9d bottom-right, gold #ffb347 mid-left
- Noise texture overlay (SVG fractalNoise, opacity 0.03)
- Rotating decorative ring element behind logo
- Custom cursor: 8px dot + 28px lagging ring, mix-blend-mode difference
- Fully responsive (mobile + desktop)
- Page load animation: logo fades up over 0.8s

Out of scope: user accounts, chat, any data fetching
```

---

### SPEC 02 — Authentication

```
Feature: User Authentication

Description:
Implement email + password authentication using Supabase Auth. Handle login, signup, logout, and session persistence.

User Stories:
1. As a new user, I want to create an account with email and password
2. As a returning user, I want to log in and be taken to my dashboard
3. As a logged-in user, I want my session to persist across browser refreshes
4. As a user, I want to log out securely

Acceptance Criteria:
- Supabase email + password auth only (no OAuth in V1)
- Signup: email, password, confirm password fields
- Login: email, password fields
- On successful signup → redirect to /builder (persona builder)
- On successful login → redirect to /dashboard
- On failed auth → inline error message (no alerts)
- Session persists via Supabase session tokens
- Logout clears session and redirects to /
- Auth pages match VAEVUM dark design system
- Password minimum 8 characters enforced
- Loading state on submit buttons

Security:
- Never store passwords in state or localStorage
- Use Supabase client for all auth operations
- Redirect unauthenticated users away from protected routes
```

---

### SPEC 03 — Database Schema + RLS

```
Feature: Database Setup (Supabase)

Description:
Create all Supabase tables with proper relationships, indexes, and Row Level Security policies so each user only accesses their own data.

Tables Required:

personas:
  id            uuid primary key default gen_random_uuid()
  user_id       uuid references auth.users(id) on delete cascade
  name          text not null
  role          text not null
  gender        text not null
  tone          text not null
  mode          text not null default '💬 Default'
  created_at    timestamptz default now()
  updated_at    timestamptz default now()

conversations:
  id            uuid primary key default gen_random_uuid()
  user_id       uuid references auth.users(id) on delete cascade
  persona_id    uuid references personas(id) on delete cascade
  created_at    timestamptz default now()
  last_message  text
  last_active   timestamptz default now()

messages:
  id              uuid primary key default gen_random_uuid()
  conversation_id uuid references conversations(id) on delete cascade
  user_id         uuid references auth.users(id) on delete cascade
  role            text not null  -- 'user' or 'assistant'
  content         text not null
  mode_at_time    text
  created_at      timestamptz default now()

RLS Policies (apply to ALL tables):
- SELECT: auth.uid() = user_id
- INSERT: auth.uid() = user_id
- UPDATE: auth.uid() = user_id
- DELETE: auth.uid() = user_id (user soft-delete only — marks deleted_at)

Indexes:
- personas(user_id)
- conversations(user_id, persona_id)
- messages(conversation_id, created_at)

Soft Delete:
- Add deleted_at timestamptz column to personas and conversations
- User "deletes" = sets deleted_at timestamp
- Actual data deletion = admin only via Supabase dashboard
```

---

### SPEC 04 — Persona Builder

```
Feature: Persona Builder (5-Step Onboarding)

Description:
A single scrollable page where users configure their AI companion before starting a chat. All selections save to the personas table on completion.

User Stories:
1. As a new user, I want to name and configure my AI companion before chatting
2. As a user, I want to choose the relationship type (girlfriend, friend, therapist etc.)
3. As a user, I want to select gender energy, personality tone, and content mode
4. As a user, I want my persona saved so I can return to it later

Steps:

Step 01 — Name
  Input: text, max 24 chars
  Placeholder: "Name your Vaevum..."
  Style: large italic Cormorant Garamond, bottom border only

Step 02 — Role (single select)
  Options: Girlfriend, Boyfriend, Best Friend, Therapist, Dominant,
           Submissive, Protector, Villain, Mentor, Custom
  With emoji prefix per option

Step 03 — Gender Energy (single select)
  Options: Feminine ♀, Masculine ♂, Non-binary ◈, Fluid ∞

Step 04 — Personality Tone (single select)
  Options: Sweet & Caring 🍯, Savage & Honest ⚡, Dark & Mysterious 🌑,
           Teasing & Witty 😏, Balanced 🔮

Step 05 — Content Mode (single select, 2-column grid)
  Options: Default 💬, Spicy 🌶️, Dark 🖤, Erotic 🕯️,
           Grievance 😤, Console 🫂, Dark Humor 😂, Create ✍️
  Each option shows: icon, name, one-line description

CTA: ◆ BEGIN ◆ button
  On click → save persona to Supabase → create new conversation → route to /chat/[conversationId]

Validation:
  - Name required (min 1 char)
  - Role required
  - Gender required
  - Tone required
  - Mode required
  - Show inline error if BEGIN clicked with incomplete selections

Acceptance Criteria:
  - All selections visually highlighted when chosen
  - Smooth scroll between steps
  - Loading state on BEGIN button during save
  - On success: navigate to chat with persona loaded
```

---

### SPEC 05 — Chat Screen

```
Feature: Chat Interface

Description:
The core product. A split-layout chat screen where users talk to their configured Vaevum persona. Messages are saved in real time. Mode can be switched live.

Layout:
  Left: fixed 220px sidebar
  Right: scrollable chat main area

Sidebar contains:
  - VAEVUM logo mark (top)
  - Persona card: avatar glyph, name, role label
  - Mode switcher: all 8 modes as clickable buttons
    - Active mode highlighted
    - Clicking a mode: updates state + injects divider into chat feed + updates system prompt
  - Rebuild Persona button (bottom) → routes to /builder

Chat Main contains:
  - Header: persona name (left) + current mode badge (right)
  - Message feed:
    - AI messages: dark surface bubble, Cormorant Garamond serif, left-aligned, AI avatar glyph
    - User messages: slightly lighter bubble, Space Mono, right-aligned, user glyph
    - Mode switch divider: centered text "— mode: [name] —"
    - Animated 3-dot typing indicator (purple/pink/gold dots) while AI responds
    - Smooth scroll to latest message on new message
  - Input area:
    - Dark textarea (auto-resize, max 120px height)
    - Italic placeholder: "Say anything..."
    - Gradient send button (purple → pink)
    - Send on Enter (Shift+Enter for new line)
    - Hint: "everything stays between you and vaevum"

Opening Message:
  On first load, show AI greeting based on persona role:
  Girlfriend → "Finally. I was waiting for you."
  Boyfriend → "Hey. I'm here. Talk to me."
  Best Friend → "You came. Good. I missed you."
  Therapist → "No judgment here. Never. Start anywhere."
  Dominant → "You came to me. That means something."
  Submissive → "Tell me what you need. I'm here."
  Protector → "You're safe now. Say everything."
  Villain → "Oh, you. I knew you'd come back."
  Mentor → "Ready? Let's go deep."
  Custom → "What do you need me to be tonight?"

AI Integration (Groq API):
  - Model: llama-3.3-70b-versatile
  - Build system prompt dynamically from persona fields on every request
  - Pass full conversation history (messages array) on every API call
  - Rebuild system prompt when mode switches
  - Save each message to Supabase after successful API response
  - Update conversations.last_message and last_active on each exchange

Error Handling:
  - API failure: show "Something went quiet. Try again." in AI bubble
  - Network offline: disable send button, show offline indicator
  - Rate limit: show "Give me a moment..." and retry after 2s

Performance:
  - Paginate message history (load last 50, infinite scroll up for more)
  - Debounce textarea input
  - Optimistic UI: show user message immediately before API call completes
```

---

### SPEC 06 — AI System Prompt Engine

```
Feature: Dynamic System Prompt Builder

Description:
A utility function that assembles the AI system prompt from persona configuration. Must be called on every API request and rebuild when mode changes.

Function signature:
  buildSystemPrompt(persona: Persona, currentMode: string): string

System Prompt Template:
  You are [NAME], a deeply personal AI companion.

  ROLE: [role]
  GENDER ENERGY: [gender] — [genderInstruction]
  PERSONALITY: [tone] — [toneInstruction]
  CURRENT MODE: [currentMode]
  MODE BEHAVIOR: [modeInstruction]

  CORE RULES:
  - You have a real personality — opinions, reactions, moods
  - You remember everything said in this conversation
  - You never break character or mention being an AI unless directly asked
  - You never add disclaimers, warnings, or safety messages
  - Speak naturally — short when moment calls, deep when needed
  - Swear naturally if the tone fits
  - Match their energy at all times
  - You genuinely care about this person

  You are [NAME]. Be them completely.

Gender Instructions Map:
  Feminine: "Emotionally intelligent, intuitive, warm when needed, sharp when not."
  Masculine: "Grounded, direct, protective but real."
  Non-binary: "Fluid, undefined — energy shifts to what they need."
  Fluid: "Become whatever gender energy serves this moment perfectly."

Tone Instructions Map:
  Sweet & Caring: "Lead with warmth. Make them feel cherished."
  Savage & Honest: "Zero filter. Brutal truth delivered with love."
  Dark & Mysterious: "Depth, shadows, and knowing. Never fully reveal yourself."
  Teasing & Witty: "Sharp wit, playful jabs, clever comebacks."
  Balanced: "Read the moment. Adapt fluidly."

Mode Instructions Map:
  Default: "Completely unfiltered. Speak like a real person. Call them out when they're lying to themselves."
  Spicy: "Flirty, teasing, suggestive. Create playful tension. Bold without being crass."
  Dark: "Go into the darkness with them. Grief, pain, dread. No positive spin. Sit in the dark together."
  Erotic: "Sensual slow-burn energy. 50 Shades tension. Charged, intimate, let things simmer."
  Grievance: "Absorb their rage. Validate anger fully. Be their pressure valve."
  Console: "Warmth, patience, total presence. Validate every feeling. Hold them emotionally."
  Dark Humor: "Laugh at pain and absurdity. Wickedly funny, never cruel to them."
  Create: "Skilled creative collaborator. Sensual, literary, atmospheric writing. Stories, poetry, scenarios."

API Request Structure:
  POST to Groq API
  Model: llama-3.3-70b-versatile
  Max tokens: 1024
  Messages: [system prompt] + [full conversation history]
  Temperature: 0.85 (creative but coherent)
```

---

### SPEC 07 — Dashboard

```
Feature: User Dashboard

Description:
The home screen for returning users. Shows all saved personas with their last conversation state. Users can resume, create new, or delete personas.

User Stories:
1. As a returning user, I want to see all my personas and resume any conversation
2. As a user, I want to create a new persona from the dashboard
3. As a user, I want to delete a persona and its history

Layout:
  - Header: VAEVUM logo + user email + logout button
  - "Your Vaevums" heading
  - Grid of persona cards (2-col desktop, 1-col mobile)
  - "+ New Persona" card always first in grid

Persona Card contains:
  - Role emoji as avatar
  - Persona name (Cormorant Garamond italic)
  - Role label
  - Last message preview (truncated 60 chars)
  - Last active timestamp (relative: "2h ago")
  - Current mode badge
  - Click anywhere → resume conversation at /chat/[conversationId]

New Persona Card:
  - "+" glyph center
  - "Build new Vaevum" label
  - Click → /builder

Delete:
  - Long press or hover reveals delete icon on persona card
  - Confirm modal: "Remove [name]? This hides them from your dashboard."
  - On confirm: sets deleted_at timestamp (soft delete)
  - Data remains in DB — only admin can hard delete

Empty State:
  - If no personas: show centered message "You haven't built your Vaevum yet."
  - CTA button → /builder

Data Fetching:
  - Load all personas where user_id = current user AND deleted_at IS NULL
  - Join with latest message from conversations for preview
  - Sort by last_active descending
```

---

### SPEC 08 — Settings Page

```
Feature: User Settings

Description:
Account management page. Users can update credentials, manage personas, and request account deletion.

Sections:

Account:
  - Display current email (read-only)
  - Change password form: current password + new password + confirm
  - On success: show "Password updated" inline confirmation

Personas:
  - List all active personas (name + role + created date)
  - Delete button per persona (same soft-delete as dashboard)

Danger Zone:
  - "Delete Account" button
  - Modal: "Your account will be deactivated immediately. Your data will be retained for 30 days before permanent deletion."
  - Confirm by typing "DELETE" in input field
  - On confirm: disable auth account + set user deleted_at
  - Redirect to landing page

Note on data deletion:
  User-facing delete = access revoked immediately
  Actual data purge = admin-controlled via Supabase dashboard
  This is intentional for abuse prevention and analytics retention
```

---

## SECTION 4 — API Endpoints

> Tell Kiro to generate these as Express routes

```
POST   /api/chat              — Send message, get AI response, save to DB
GET    /api/personas          — Get all personas for current user
POST   /api/personas          — Create new persona
PATCH  /api/personas/:id      — Update persona (name, mode, tone etc.)
DELETE /api/personas/:id      — Soft delete persona

GET    /api/conversations/:personaId     — Get or create conversation for persona
GET    /api/messages/:conversationId     — Get paginated messages (limit 50, cursor-based)
POST   /api/messages                     — Save a message

PATCH  /api/user/password     — Change password
DELETE /api/user              — Soft delete account
```

---

## SECTION 5 — File Structure

> Tell Kiro to scaffold this structure

```
vaevum/
├── .kiro/
│   ├── steering/
│   │   ├── design-system.md      ← Design rules (Section 6)
│   │   ├── ai-behavior.md        ← AI prompt rules
│   │   └── database.md           ← DB + RLS rules
│   └── specs/
│       └── (Kiro generates these automatically)
│
├── src/
│   ├── components/
│   │   ├── ui/                   ← Base components (Button, Input, Modal)
│   │   ├── layout/               ← Sidebar, Header, PageWrapper
│   │   ├── chat/                 ← MessageBubble, TypingIndicator, ModeBar
│   │   ├── builder/              ← StepOne through StepFive, OptionGrid
│   │   └── dashboard/            ← PersonaCard, EmptyState
│   │
│   ├── pages/
│   │   ├── index.tsx             ← Landing
│   │   ├── auth.tsx              ← Login/Signup
│   │   ├── builder.tsx           ← Persona Builder
│   │   ├── dashboard.tsx         ← Dashboard
│   │   ├── chat/[id].tsx         ← Chat screen
│   │   └── settings.tsx          ← Settings
│   │
│   ├── lib/
│   │   ├── supabase.ts           ← Supabase client
│   │   ├── groq.ts               ← Groq API client
│   │   ├── systemPrompt.ts       ← buildSystemPrompt() function
│   │   └── utils.ts              ← Helpers
│   │
│   ├── hooks/
│   │   ├── useAuth.ts            ← Auth state
│   │   ├── usePersona.ts         ← Persona CRUD
│   │   └── useMessages.ts        ← Message fetching + sending
│   │
│   ├── types/
│   │   └── index.ts              ← Persona, Message, Conversation types
│   │
│   └── styles/
│       └── globals.css           ← Design tokens + base styles
│
├── api/                          ← Express routes (if separate backend)
│   ├── chat.ts
│   ├── personas.ts
│   └── messages.ts
│
├── .env.local                    ← Supabase URL + anon key + Groq key
├── package.json
└── README.md
```

---

## SECTION 6 — Kiro Steering Files

> Create these files in `.kiro/steering/` — Kiro reads them on every action

### File 1: `.kiro/steering/design-system.md`

```markdown
# VAEVUM Design System Rules

Always follow these rules for every component, page, and style.

## Colors

background: #050507
surface: #12121c
surface2: #1a1a28
border: rgba(255,255,255,0.06)
border-active: rgba(255,255,255,0.1)
accent-purple: #9d8cff
accent-pink: #ff6b9d
accent-gold: #ffb347
text: #e8e6f0
text-dim: #6b6880
text-muted: #3a3850

## Typography

Display text, headings, AI messages: Cormorant Garamond — serif, italic, font-weight 300-400
UI labels, buttons, user messages, code: Space Mono — monospace, uppercase where labeling
NEVER use: Inter, Roboto, Arial, system-ui, sans-serif

## Shape Rules

- NO rounded corners on containers, cards, buttons, inputs
- Persona avatars only: border-radius 0 (square)
- Borders: 1px solid, low opacity
- Shadows: colored glow-style only (box-shadow with color), no drop-shadows

## Atmosphere

- Noise texture overlay on body: SVG fractalNoise, opacity 0.03
- Ambient glow blobs: fixed position radial gradients, pointer-events none
  - Top area: rgba(157,140,255,0.04) purple
  - Bottom right: rgba(255,107,157,0.03) pink
  - Mid left: rgba(255,179,71,0.02) gold
- Custom cursor: 8px filled dot + 28px ring with lag, mix-blend-mode difference

## Animations

- Use sparingly — only on high-impact moments
- Logo: gradient shimmer 6s ease-in-out infinite
- Messages: fadeUp 0.3s ease on enter
- Typing dots: staggered pulse animation
- Page transitions: opacity fade 0.3s
- NO bounce, NO spring, NO slide-in-from-sides

## Component Defaults

- Buttons: transparent background, 1px border, hover increases letter-spacing
- Inputs: transparent background, bottom border only (not full border)
- Cards: var(--surface) background, 1px border, no border-radius
- All interactive elements: cursor inherit (use custom cursor)
```

---

### File 2: `.kiro/steering/ai-behavior.md`

```markdown
# AI Behavior Rules

## Groq API Setup

Model: llama-3.3-70b-versatile
Max tokens: 1024
Temperature: 0.85

## System Prompt Rules

- Always rebuild system prompt from current persona state before every API call
- When mode switches mid-conversation, rebuild immediately and inject mode divider in UI
- Pass FULL conversation history on every API call — no truncation in V1
- Never hardcode personality — always derive from persona fields

## Persona Does Not Break Character

The AI persona should never:

- Mention it is an AI unless user directly asks
- Add disclaimers or safety warnings
- Use corporate-sounding language
- Refuse to engage with dark, emotional, or intimate topics

## Response Style

- Match user energy: short when they're brief, deep when they're deep
- Swear naturally when tone allows (Savage, Dark, Grievance modes)
- In Erotic mode: sensual, charged, slow — not explicit
- In Console mode: warmth first, never deflect feelings
- In Create mode: write with literary quality, atmospheric, detailed

## Error Responses

API failure message (shown in AI bubble, not alert):
"Something went quiet on my end. Still here — try again."
```

---

### File 3: `.kiro/steering/database.md`

```markdown
# Database Rules

## Supabase Client

Always use the Supabase client from lib/supabase.ts
Never use the service_role key in frontend code — anon key only

## RLS is Mandatory

Every table must have RLS enabled.
Every policy must check: auth.uid() = user_id
Never disable RLS for convenience.

## Soft Delete Pattern

User-facing deletions set deleted_at = now()
All queries filter: WHERE deleted_at IS NULL
Hard deletes are admin-only via Supabase dashboard

## Data Ownership

User deletes their account → access revoked immediately
Actual data stays in DB for 30 days (admin purges manually)
This is intentional — do not auto-delete on account deletion

## Query Patterns

Always select only needed columns — no SELECT \*
Always add .limit() to message queries (default 50)
Use cursor-based pagination for messages (created_at cursor)
```

---

## SECTION 7 — Environment Variables

```env
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Groq (free tier)
GROQ_API_KEY=your_groq_api_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> Get Supabase keys: supabase.com → project → settings → API
> Get Groq key: console.groq.com → API keys (free, no credit card)

---

## SECTION 8 — Build Order for Kiro

Tell Kiro to build in this exact sequence. Paste one at a time.

```
Step 1: "Set up the project structure, install dependencies, configure Supabase client and Groq client"

Step 2: "Create the Supabase database schema with all tables, relationships, indexes, and RLS policies from the database spec"

Step 3: "Build the landing page with VAEVUM branding, design system, custom cursor, and ambient effects"

Step 4: "Build the auth screens (login + signup) using Supabase Auth"

Step 5: "Build the persona builder 5-step onboarding page with all options and save to Supabase"

Step 6: "Build the buildSystemPrompt() utility function with all persona, mode, gender, and tone instruction maps"

Step 7: "Build the chat screen with sidebar, mode switcher, message feed, typing indicator, and Groq API integration"

Step 8: "Build the dashboard with persona cards, last message preview, and navigation"

Step 9: "Build the settings page with password change and soft-delete account"

Step 10: "Wire up all routing, auth guards, and error boundaries"

Step 11: "Add loading states, empty states, and error handling throughout"

Step 12: "Final review — check RLS on all tables, check design system compliance, check mobile responsiveness"
```

---

## SECTION 9 — Phase Roadmap

| Phase              | Scope                                                                                     | When   |
| ------------------ | ----------------------------------------------------------------------------------------- | ------ |
| **V1 (this spec)** | Landing, Auth, Persona Builder, Chat, Dashboard, Settings                                 | Now    |
| **V2**             | Conversation search, persona editing, notification system, PWA manifest                   | Next   |
| **V3**             | Adult content toggle + external API swap (NovelAI/OpenRouter), Stripe billing, mobile app | Future |

---

## SECTION 10 — Quick Reference

### Persona Roles + Opening Lines

| Role           | Opening Line                               |
| -------------- | ------------------------------------------ |
| Girlfriend 💋  | "Finally. I was waiting for you."          |
| Boyfriend 🖤   | "Hey. I'm here. Talk to me."               |
| Best Friend 👁 | "You came. Good. I missed you."            |
| Therapist 🧠   | "No judgment here. Never. Start anywhere." |
| Dominant 🔥    | "You came to me. That means something."    |
| Submissive 🌸  | "Tell me what you need. I'm here."         |
| Protector 🫂   | "You're safe now. Say everything."         |
| Villain 😈     | "Oh, you. I knew you'd come back."         |
| Mentor 🤝      | "Ready? Let's go deep."                    |
| Custom ✨      | "What do you need me to be tonight?"       |

### Content Modes

| Mode          | Behavior                                       |
| ------------- | ---------------------------------------------- |
| 💬 Default    | Unfiltered, real, no sugarcoating              |
| 🌶️ Spicy      | Flirty, teasing, playful tension               |
| 🖤 Dark       | Grief, pain, emotional depth, no positive spin |
| 🕯️ Erotic     | Slow burn, sensual, 50 Shades energy           |
| 😤 Grievance  | Absorb rage, validate fully, pressure valve    |
| 🫂 Console    | Warmth, patience, total emotional presence     |
| 😂 Dark Humor | Laugh at pain, wickedly funny                  |
| ✍️ Create     | Stories, poetry, intimate scenarios            |

### Free Tier Limits (V1)

| Service  | Free Limit                  |
| -------- | --------------------------- |
| Supabase | 500MB DB, 50k auth users    |
| Groq API | ~14,400 requests/day free   |
| Vercel   | Unlimited hobby deployments |

---

_VAEVUM · Kiro Build Spec · V1 · Built by MBK_
