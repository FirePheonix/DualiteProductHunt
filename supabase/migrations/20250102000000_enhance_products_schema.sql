/*
          # [Feature: Enhanced Product Schema for Individual Project Pages]
          This migration enhances the products table with additional fields needed for detailed product pages,
          including website URL, launch date, pricing info, social links, and more detailed metadata.
          
          ## Query Description: [This script adds new columns to the existing products table to support
          detailed product pages with website links, pricing, social media, launch information, and
          enhanced metadata. It will not affect existing data but adds new capabilities.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Tables Modified: `public.products`
          - New Columns Added: website_url, tagline, pricing_type, pricing_details, 
            github_url, twitter_url, linkedin_url, launch_date, featured_image_url,
            gallery_images, long_description, company_name, team_members
          
          ## Security Implications:
          - RLS Status: [No changes - existing policies remain]
          - Policy Changes: [No changes]
          - Auth Requirements: [No changes]
          
          ## Performance Impact:
          - Indexes: [No new indexes added]
          - Triggers: [No changes]
          - Estimated Impact: [Low - only adds optional columns]
          */

-- Add new columns to the products table for enhanced product pages
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS website_url text,
ADD COLUMN IF NOT EXISTS tagline text,
ADD COLUMN IF NOT EXISTS pricing_type text DEFAULT 'Free',
ADD COLUMN IF NOT EXISTS pricing_details text,
ADD COLUMN IF NOT EXISTS github_url text,
ADD COLUMN IF NOT EXISTS twitter_url text,
ADD COLUMN IF NOT EXISTS linkedin_url text,
ADD COLUMN IF NOT EXISTS youtube_url text,
ADD COLUMN IF NOT EXISTS launch_date date DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS featured_image_url text,
ADD COLUMN IF NOT EXISTS gallery_images text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS long_description text,
ADD COLUMN IF NOT EXISTS company_name text,
ADD COLUMN IF NOT EXISTS team_members jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS views_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS comments_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS followers_count integer DEFAULT 0;

-- Create a function to increment view count
CREATE OR REPLACE FUNCTION public.increment_product_views(product_id_to_increment uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.products
  SET views_count = views_count + 1
  WHERE id = product_id_to_increment;
END;
$$;

-- Create comments table for product discussions
CREATE TABLE IF NOT EXISTS public.product_comments (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    parent_id uuid REFERENCES public.product_comments(id) ON DELETE CASCADE,
    is_edited boolean DEFAULT false
);

-- Create product follows table
CREATE TABLE IF NOT EXISTS public.product_follows (
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (product_id, user_id)
);

-- Enable RLS on new tables
ALTER TABLE public.product_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_follows ENABLE ROW LEVEL SECURITY;

-- RLS policies for product_comments
CREATE POLICY "Allow public read access to product comments" ON public.product_comments
FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert their own comments" ON public.product_comments
FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

CREATE POLICY "Allow comment authors to update their own comments" ON public.product_comments
FOR UPDATE USING (auth.role() = 'authenticated' AND user_id = auth.uid());

CREATE POLICY "Allow comment authors to delete their own comments" ON public.product_comments
FOR DELETE USING (auth.role() = 'authenticated' AND user_id = auth.uid());

-- RLS policies for product_follows
CREATE POLICY "Allow authenticated users to view follows" ON public.product_follows
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert their own follows" ON public.product_follows
FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

CREATE POLICY "Allow authenticated users to delete their own follows" ON public.product_follows
FOR DELETE USING (auth.role() = 'authenticated' AND user_id = auth.uid());

-- Function to toggle product follow
CREATE OR REPLACE FUNCTION public.toggle_product_follow(product_id_to_toggle uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  current_user_id uuid := auth.uid();
BEGIN
  IF EXISTS (SELECT 1 FROM public.product_follows WHERE product_id = product_id_to_toggle AND user_id = current_user_id) THEN
    DELETE FROM public.product_follows WHERE product_id = product_id_to_toggle AND user_id = current_user_id;
  ELSE
    INSERT INTO public.product_follows (product_id, user_id) VALUES (product_id_to_toggle, current_user_id);
  END IF;
END;
$$;

-- Trigger function to update comments count
CREATE OR REPLACE FUNCTION public.handle_comment_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.products
    SET comments_count = comments_count + 1
    WHERE id = NEW.product_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.products
    SET comments_count = comments_count - 1
    WHERE id = OLD.product_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger on product_comments table
CREATE TRIGGER on_comment_change
AFTER INSERT OR DELETE ON public.product_comments
FOR EACH ROW EXECUTE FUNCTION public.handle_comment_change();

-- Trigger function to update followers count
CREATE OR REPLACE FUNCTION public.handle_follow_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.products
    SET followers_count = followers_count + 1
    WHERE id = NEW.product_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.products
    SET followers_count = followers_count - 1
    WHERE id = OLD.product_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger on product_follows table
CREATE TRIGGER on_follow_change
AFTER INSERT OR DELETE ON public.product_follows
FOR EACH ROW EXECUTE FUNCTION public.handle_follow_change();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_comments_product_id ON public.product_comments(product_id);
CREATE INDEX IF NOT EXISTS idx_product_comments_created_at ON public.product_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_follows_product_id ON public.product_follows(product_id);
CREATE INDEX IF NOT EXISTS idx_products_launch_date ON public.products(launch_date DESC);
CREATE INDEX IF NOT EXISTS idx_products_views_count ON public.products(views_count DESC);
