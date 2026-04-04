-- Function to auto-create user record on first sign-in
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  super_user_email TEXT := 'grosfeldofer@gmail.com'; -- ⚠️ REPLACE WITH YOUR ACTUAL EMAIL
BEGIN
  INSERT INTO public.users (id, email, display_name, avatar_url, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    CASE
      WHEN NEW.email = super_user_email THEN 'super_user'::TEXT
      ELSE 'viewer'::TEXT
    END,
    CASE
      WHEN NEW.email = super_user_email THEN 'approved'::TEXT
      ELSE 'pending'::TEXT
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
