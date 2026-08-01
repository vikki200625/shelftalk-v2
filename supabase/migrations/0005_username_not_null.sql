-- ============================================================
-- 0005_username_not_null.sql
-- Make username required, add email to profiles (needed for
-- username-based login), update signup trigger.
--
-- Apply via Supabase dashboard SQL editor (in order after 0004).
-- ============================================================

-- 1. Add email column to profiles (for username → email lookup on login).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text;

-- 2. Backfill email from auth.users for any existing profiles.
UPDATE public.profiles
SET email = (
  SELECT email FROM auth.users
  WHERE auth.users.id = profiles.id
)
WHERE email IS NULL;

-- 3. Make email NOT NULL + UNIQUE after backfill.
ALTER TABLE public.profiles
  ALTER COLUMN email SET NOT NULL;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_email_unique UNIQUE (email);

-- 4. Backfill any existing users without username.
UPDATE public.profiles
SET username = split_part(email, '@', 1)
WHERE username IS NULL;

-- 5. Make username NOT NULL (keeps existing UNIQUE constraint).
ALTER TABLE public.profiles
  ALTER COLUMN username SET NOT NULL;

-- 6. Update handle_new_user to save username + email from signup metadata.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'username', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
