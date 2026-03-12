-- Normalize phone numbers stored in the email column to digits only.
-- Before the hotfix, the frontend sent raw phone (e.g. +79013443527).
-- After the hotfix, login sends digits only (79013443527).
-- This aligns existing data with the new format.
UPDATE users
SET email = regexp_replace(email, '[^0-9]', '', 'g')
WHERE email ~ '^\+?[0-9]+$';
