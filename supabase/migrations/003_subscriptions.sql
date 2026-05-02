-- ============================================================
-- VAEVUM — Subscriptions Table
-- Migration: 003_subscriptions.sql
-- ============================================================

CREATE TABLE subscriptions (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id   text,
  stripe_subscription_id text,
  status               text        NOT NULL DEFAULT 'free',
  -- status values: 'free', 'active', 'canceled', 'past_due'
  plan                 text        NOT NULL DEFAULT 'free',
  -- plan values: 'free', 'premium'
  current_period_end   timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id),
  UNIQUE (stripe_customer_id),
  UNIQUE (stripe_subscription_id)
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only read their own subscription
CREATE POLICY "subscriptions_select" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
-- Only service role can insert/update (done via webhook, not client)
-- No INSERT/UPDATE/DELETE policies for anon/authenticated — webhook uses service role

-- ─── Message usage tracking ───────────────────────────────────────────────

CREATE TABLE message_usage (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date         date        NOT NULL DEFAULT CURRENT_DATE,
  count        integer     NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

CREATE INDEX idx_message_usage_user_date ON message_usage(user_id, date);

ALTER TABLE message_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "message_usage_select" ON message_usage FOR SELECT USING (auth.uid() = user_id);
-- Usage is updated server-side via service role only
