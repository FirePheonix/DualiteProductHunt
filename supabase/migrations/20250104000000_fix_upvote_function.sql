/*
# [Fix: Upvote Function Foreign Key Issue]
This migration fixes the toggle_upvote function to work with the corrected foreign key relationships.

## Query Description:
- Updates the toggle_upvote function to properly handle the user_id references
- Ensures the function works with the profiles table relationship

## Metadata:
- Schema-Category: ["Functional"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Function Updated: `public.toggle_upvote`

## Security Implications:
- RLS Status: [Unaffected]
- Policy Changes: [No]
- Auth Requirements: [None]

## Performance Impact:
- Estimated Impact: [Low, positive impact on upvote functionality]
*/

-- Fix the toggle_upvote function to work with the corrected foreign key relationships
CREATE OR REPLACE FUNCTION public.toggle_upvote(product_id_to_toggle uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid := auth.uid();
BEGIN
  -- Check if user exists in profiles table
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = current_user_id) THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;
  
  -- Check if product exists
  IF NOT EXISTS (SELECT 1 FROM public.products WHERE id = product_id_to_toggle) THEN
    RAISE EXCEPTION 'Product not found';
  END IF;
  
  -- Toggle the upvote
  IF EXISTS (SELECT 1 FROM public.product_upvotes WHERE product_id = product_id_to_toggle AND user_id = current_user_id) THEN
    DELETE FROM public.product_upvotes WHERE product_id = product_id_to_toggle AND user_id = current_user_id;
  ELSE
    INSERT INTO public.product_upvotes (product_id, user_id) VALUES (product_id_to_toggle, current_user_id);
  END IF;
END;
$$;
