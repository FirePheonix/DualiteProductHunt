/*
# [Fix Products User Relationship]
This migration fixes the foreign key relationship in the products table to properly reference the profiles table instead of auth.users directly. This enables proper joins in Supabase queries.

## Query Description:
- Drops the existing foreign key constraint from products.user_id to auth.users(id)
- Adds a new foreign key constraint from products.user_id to profiles(id)
- This allows Supabase to properly understand the relationship for PostgREST queries

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Table Affected: `public.products`
- Constraint Dropped: `products_user_id_fkey` (to auth.users)
- Constraint Added: `products_user_id_profiles_fkey` (to profiles)

## Security Implications:
- RLS Status: [Unaffected]
- Policy Changes: [No]
- Auth Requirements: [None]

## Performance Impact:
- Indexes: [Foreign key indexes updated]
- Estimated Impact: [Low, positive impact on query performance]
*/

-- Drop the existing foreign key constraint to auth.users
ALTER TABLE public.products
DROP CONSTRAINT products_user_id_fkey;

-- Add the new foreign key constraint to profiles
ALTER TABLE public.products
ADD CONSTRAINT products_user_id_profiles_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id)
ON DELETE CASCADE;
