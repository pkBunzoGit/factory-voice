-- Customer display name captured at chat start (alongside phone)
alter table leads add column if not exists name text;
