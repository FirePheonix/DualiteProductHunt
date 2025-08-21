/*
# [User Profiles Setup]
This script sets up a public 'profiles' table to store user data that is linked to the authentication users. It also includes a trigger to automatically create a profile for new users upon signup.

## Query Description:
This operation creates a new table 'profiles' to store public user information like full names. It also sets up a trigger so that whenever a new user signs up via Supabase Auth, a corresponding profile entry is automatically created for them. This is a standard and safe pattern for managing user data alongside Supabase's built-in authentication.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- **Tables Created:**
  - `public.profiles`: Stores user profile information.
    - `id` (uuid, PK, FK to auth.users.id): The user's unique identifier.
    - `updated_at` (timestamptz): Timestamp of the last update.
    - `full_name` (text): The user's full name.
    - `avatar_url` (text): URL for the user's avatar image.
- **Functions Created:**
  - `public.handle_new_user()`: A trigger function to create a profile for a new user.
- **Triggers Created:**
  - `on_auth_user_created`: An event trigger that calls `handle_new_user()` after a new user is inserted into `auth.users`.

## Security Implications:
- **RLS Status:** Enabled on the `profiles` table.
- **Policy Changes:** Yes, new policies are added to the `profiles` table.
  - **Select Policy:** Users can view all profiles (you can restrict this later if needed).
  - **Insert Policy:** Users can insert a profile for themselves (handled by the trigger).
  - **Update Policy:** Users can update their own profile.
- **Auth Requirements:** These changes are dependent on Supabase Auth.

## Performance Impact:
- **Indexes:** A primary key index is created on `profiles.id`.
- **Triggers:** Adds a minor, negligible overhead on new user creation.
- **Estimated Impact:** Low. This is a highly optimized and standard procedure for Supabase.
*/

-- Create a table for public profiles
CREATE TABLE public.profiles (
  id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  updated_at timestamp with time zone,
  full_name text,
  avatar_url text,
  PRIMARY KEY (id)
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile." ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- This trigger automatically creates a profile for new users.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function after a new user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
