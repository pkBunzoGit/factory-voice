-- Seed data for local development
-- Run after 001_initial.sql in Supabase SQL Editor

-- Test agent (PIN: 123456 — bcrypt hash)
insert into agents (id, email, name, pin_hash) values (
  'a0000000-0000-0000-0000-000000000001',
  'agent@factoryvoice.app',
  'Test Agent',
  '$2b$10$xJ5KwCn7CYk5GqK1J1N3YeJ5KwCn7CYk5GqK1J1N3YeJ5KwCn7CY'
);

-- Test factory
insert into factories (id, slug, name, city, agent_id, is_active, visit_status) values (
  'f0000000-0000-0000-0000-000000000001',
  'sharma-steels',
  'Sharma Steel Fabricators',
  'Mumbai',
  'a0000000-0000-0000-0000-000000000001',
  false,
  'draft'
);

-- Test owner (password: test123 — will need proper hash in real setup)
insert into owners (id, factory_id, email, password_hash, name) values (
  'o0000000-0000-0000-0000-000000000001',
  'f0000000-0000-0000-0000-000000000001',
  'owner@sharma-steels.com',
  '$2b$10$placeholder_hash_replace_with_real',
  'Mr. Sharma'
);
