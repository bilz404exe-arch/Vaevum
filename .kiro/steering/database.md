# Database Rules

Always follow these rules when writing any Supabase queries, migrations, or data access code.

---

## Supabase Client Usage

- **Browser client** (`src/lib/supabase.ts`): initialized with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Use this in all React components, hooks, and client-side code.
- **Server client** (`src/lib/supabaseServer.ts`): initialized with `SUPABASE_SERVICE_ROLE_KEY`. Use this **only** in Next.js API routes (`src/pages/api/`). Never import it from any client-side file.
- The service role key bypasses RLS — it must never be exposed to the browser.

---

## RLS is Mandatory

- Every table (`personas`, `conversations`, `messages`) must have RLS enabled.
- Every policy must check: `auth.uid() = user_id`
- Never disable RLS for convenience or testing.
- All four policy types must exist per table: SELECT, INSERT, UPDATE, DELETE.

---

## Soft Delete Pattern

- User-facing deletions set `deleted_at = now()` — never hard-delete rows.
- All active-record queries must filter: `WHERE deleted_at IS NULL`
- Hard deletes are admin-only via the Supabase dashboard.
- Tables with soft delete: `personas`, `conversations`.
- The `messages` table does not have `deleted_at` — messages are deleted via cascade when their conversation is hard-deleted by an admin.

---

## Data Ownership

- Every row in `personas`, `conversations`, and `messages` must have a `user_id` column referencing `auth.users(id)`.
- All queries must be scoped to the authenticated user: `WHERE user_id = auth.uid()` (enforced by RLS, but also explicit in query logic for clarity).
- When a user deletes their account:
  - Access is revoked immediately (Supabase auth account disabled, `deleted_at` set on user record)
  - The user is shown: _"Your account will be deactivated immediately. Your conversations and data will be permanently deleted within 30 days."_
  - All data (personas, conversations, messages) stays in the DB for 30 days — this window is intentional for abuse review and future account recovery features
  - Purge is admin-controlled via the Supabase dashboard — do not auto-delete on account deletion
  - After purge, hard-delete all rows in `messages`, `conversations`, `personas` WHERE `user_id = <deleted_user_id>`

---

## Query Patterns

- Always select only needed columns — never use `SELECT *`.
- Always add `.limit()` to message queries (default 50).
- Use cursor-based pagination for messages: order by `created_at ASC`, use `created_at` timestamp as the cursor value.
- Cursor pagination query pattern:
  ```sql
  SELECT * FROM messages
  WHERE conversation_id = :id
    AND user_id = auth.uid()
    AND created_at < :cursor   -- for loading older messages
  ORDER BY created_at ASC
  LIMIT 50
  ```
- For the initial load (no cursor), fetch the 50 most recent messages ordered ascending.

---

## Local Development

- Use `supabase start` (Supabase CLI + Docker) to run a full local Postgres + Auth + Studio stack.
- Local env vars go in `.env.local` — never commit this file.
- Run migrations with `supabase db push` or `supabase migration up`.
- The local and cloud environments use identical client code — only the env vars differ.

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=        # Supabase project URL (safe to expose)
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Supabase anon key (safe to expose, RLS enforces security)
SUPABASE_SERVICE_ROLE_KEY=       # Service role key — server-side only, never expose to client
```
