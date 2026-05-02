-- ============================================================
-- VAEVUM — Add Instagram fields to profiles
-- Migration: 004_profiles_extra_fields.sql
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS instagram_username text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS instagram_password text;
