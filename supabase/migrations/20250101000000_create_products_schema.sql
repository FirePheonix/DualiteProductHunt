/*
          # [Feature: Product & Upvote System]
          This migration sets up the complete database structure for managing user-submitted products and their upvotes. It includes tables for products, a system for tracking upvotes, and automated counters.

          ## Query Description: [This script creates new tables (`products`, `product_upvotes`), a storage bucket (`product-images`), and associated security policies. It will not affect any existing data but is essential for the new project submission feature. No backups are required as this only adds new objects.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Tables Created: `public.products`, `public.product_upvotes`
          - Functions Created: `public.handle_upvote_change`, `public.toggle_upvote`
          - Triggers Created: `on_upvote_change` on `product_upvotes` table
          - Storage Buckets Created: `product-images`
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [Yes] - New policies are created for the `products` and `product_upvotes` tables, and for the `product-images` storage bucket.
          - Auth Requirements: [Users must be authenticated to create products or upvote.]
          
          ## Performance Impact:
          - Indexes: [Primary keys and foreign keys are indexed by default.]
          - Triggers: [Adds a trigger to `product_upvotes` to efficiently update counts on the `products` table.]
          - Estimated Impact: [Low. The trigger is lightweight and operations are indexed.]
          */

-- 1. CREATE PRODUCTS TABLE
-- This table will store all the information about user-submitted products.
CREATE TABLE public.products (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    name text NOT NULL,
    description text NOT NULL,
    image_url text,
    tags text[],
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    upvotes_count integer NOT NULL DEFAULT 0
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 2. CREATE PRODUCT UPVOTES TABLE
-- This table tracks which user has upvoted which product, preventing duplicate votes.
CREATE TABLE public.product_upvotes (
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (product_id, user_id)
);
ALTER TABLE public.product_upvotes ENABLE ROW LEVEL SECURITY;

-- 3. CREATE STORAGE BUCKET FOR PRODUCT IMAGES
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- 4. RLS POLICIES FOR PRODUCTS TABLE
CREATE POLICY "Allow public read access to products" ON public.products
FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert their own products" ON public.products
FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

CREATE POLICY "Allow owners to update their own products" ON public.products
FOR UPDATE USING (auth.role() = 'authenticated' AND user_id = auth.uid());

CREATE POLICY "Allow owners to delete their own products" ON public.products
FOR DELETE USING (auth.role() = 'authenticated' AND user_id = auth.uid());

-- 5. RLS POLICIES FOR PRODUCT UPVOTES TABLE
CREATE POLICY "Allow authenticated users to view upvotes" ON public.product_upvotes
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert their own upvote" ON public.product_upvotes
FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

CREATE POLICY "Allow authenticated users to delete their own upvote" ON public.product_upvotes
FOR DELETE USING (auth.role() = 'authenticated' AND user_id = auth.uid());

-- 6. RLS POLICIES FOR STORAGE BUCKET
CREATE POLICY "Allow public read access to product images" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Allow authenticated users to upload product images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Allow owners to update their product images" ON storage.objects
FOR UPDATE USING (bucket_id = 'product-images' AND auth.uid() = owner);

CREATE POLICY "Allow owners to delete their product images" ON storage.objects
FOR DELETE USING (bucket_id = 'product-images' AND auth.uid() = owner);

-- 7. TRIGGER FUNCTION TO UPDATE UPVOTES COUNT
CREATE OR REPLACE FUNCTION public.handle_upvote_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.products
    SET upvotes_count = upvotes_count + 1
    WHERE id = NEW.product_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.products
    SET upvotes_count = upvotes_count - 1
    WHERE id = OLD.product_id;
  END IF;
  RETURN NULL;
END;
$$;

-- 8. TRIGGER ON PRODUCT UPVOTES TABLE
CREATE TRIGGER on_upvote_change
AFTER INSERT OR DELETE ON public.product_upvotes
FOR EACH ROW EXECUTE FUNCTION public.handle_upvote_change();

-- 9. RPC FUNCTION TO TOGGLE AN UPVOTE
CREATE OR REPLACE FUNCTION public.toggle_upvote(product_id_to_toggle uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  current_user_id uuid := auth.uid();
BEGIN
  IF EXISTS (SELECT 1 FROM public.product_upvotes WHERE product_id = product_id_to_toggle AND user_id = current_user_id) THEN
    DELETE FROM public.product_upvotes WHERE product_id = product_id_to_toggle AND user_id = current_user_id;
  ELSE
    INSERT INTO public.product_upvotes (product_id, user_id) VALUES (product_id_to_toggle, current_user_id);
  END IF;
END;
$$;
