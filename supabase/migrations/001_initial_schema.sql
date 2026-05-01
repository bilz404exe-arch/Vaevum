-- ============================================================
-- VAEVUM AI Companion Platform — Initial Schema
-- Migration: 001_initial_schema.sql
-- ============================================================

-- ------------------------------------------------------------
-- personas
-- ------------------------------------------------------------
CREATE TABLE personas (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  role        text        NOT NULL,
  gender      text        NOT NULL,
  tone        text        NOT NULL,
  mode        text        NOT NULL DEFAULT '💬 Default',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  deleted_at  timestamptz
);

CREATE INDEX idx_personas_user_id ON personas(user_id);

-- ------------------------------------------------------------
-- conversations
-- ------------------------------------------------------------
CREATE TABLE conversations (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  persona_id   uuid        NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  last_message text,
  last_active  timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz
);

CREATE INDEX idx_conversations_user_persona ON conversations(user_id, persona_id);

-- ------------------------------------------------------------
-- messages
-- ------------------------------------------------------------
CREATE TABLE messages (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid        NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role            text        NOT NULL CHECK (role IN ('user', 'assistant')),
  content         text        NOT NULL,
  mode_at_time    text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at);

-- ------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------
ALTER TABLE personas      ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages      ENABLE ROW LEVEL SECURITY;

-- personas policies
CREATE POLICY "personas_select" ON personas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "personas_insert" ON personas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "personas_update" ON personas
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "personas_delete" ON personas
  FOR DELETE USING (auth.uid() = user_id);

-- conversations policies
CREATE POLICY "conversations_select" ON conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "conversations_insert" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "conversations_update" ON conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "conversations_delete" ON conversations
  FOR DELETE USING (auth.uid() = user_id);

-- messages policies
CREATE POLICY "messages_select" ON messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "messages_insert" ON messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "messages_update" ON messages
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "messages_delete" ON messages
  FOR DELETE USING (auth.uid() = user_id);
