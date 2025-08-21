/*
# [Feature: Comments & Replies System]
This migration adds a comprehensive comments system with nested replies support for products.

## Query Description:
- Creates product_comments table with support for nested replies
- Adds RLS policies for secure comment management
- Creates functions for comment operations
- Adds triggers for comment count updates

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Tables Created: `public.product_comments`
- Functions Created: `public.handle_comment_change`, `public.add_comment`, `public.update_comment`, `public.delete_comment`
- Triggers Created: `on_comment_change` on `product_comments` table

## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [Yes] - New policies for comment CRUD operations
- Auth Requirements: [Users must be authenticated to comment]

## Performance Impact:
- Indexes: [Primary keys and foreign keys are indexed by default]
- Triggers: [Adds lightweight triggers for comment count updates]
- Estimated Impact: [Low]
*/

-- 1. CREATE PRODUCT COMMENTS TABLE
CREATE TABLE public.product_comments (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_id uuid REFERENCES public.product_comments(id) ON DELETE CASCADE,
    content text NOT NULL,
    is_edited boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX idx_product_comments_product_id ON public.product_comments(product_id);
CREATE INDEX idx_product_comments_parent_id ON public.product_comments(parent_id);
CREATE INDEX idx_product_comments_user_id ON public.product_comments(user_id);
CREATE INDEX idx_product_comments_created_at ON public.product_comments(created_at);

ALTER TABLE public.product_comments ENABLE ROW LEVEL SECURITY;

-- 2. RLS POLICIES FOR PRODUCT COMMENTS TABLE
CREATE POLICY "Allow public read access to comments" ON public.product_comments
FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert their own comments" ON public.product_comments
FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

CREATE POLICY "Allow comment owners to update their own comments" ON public.product_comments
FOR UPDATE USING (auth.role() = 'authenticated' AND user_id = auth.uid());

CREATE POLICY "Allow comment owners to delete their own comments" ON public.product_comments
FOR DELETE USING (auth.role() = 'authenticated' AND user_id = auth.uid());

-- 3. TRIGGER FUNCTION TO UPDATE COMMENTS COUNT
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

-- 4. TRIGGER ON PRODUCT COMMENTS TABLE
CREATE TRIGGER on_comment_change
AFTER INSERT OR DELETE ON public.product_comments
FOR EACH ROW EXECUTE FUNCTION public.handle_comment_change();

-- 5. FUNCTION TO ADD A COMMENT
CREATE OR REPLACE FUNCTION public.add_comment(
    product_id_param uuid,
    content_param text,
    parent_id_param uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    comment_id uuid;
    current_user_id uuid := auth.uid();
BEGIN
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated to add comments';
    END IF;
    
    INSERT INTO public.product_comments (product_id, user_id, content, parent_id)
    VALUES (product_id_param, current_user_id, content_param, parent_id_param)
    RETURNING id INTO comment_id;
    
    RETURN comment_id;
END;
$$;

-- 6. FUNCTION TO UPDATE A COMMENT
CREATE OR REPLACE FUNCTION public.update_comment(
    comment_id_param uuid,
    new_content_param text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id uuid := auth.uid();
    comment_owner_id uuid;
BEGIN
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated to update comments';
    END IF;
    
    SELECT user_id INTO comment_owner_id
    FROM public.product_comments
    WHERE id = comment_id_param;
    
    IF comment_owner_id != current_user_id THEN
        RAISE EXCEPTION 'Only comment owners can update their comments';
    END IF;
    
    UPDATE public.product_comments
    SET content = new_content_param, 
        is_edited = true,
        updated_at = now()
    WHERE id = comment_id_param;
    
    RETURN FOUND;
END;
$$;

-- 7. FUNCTION TO DELETE A COMMENT
CREATE OR REPLACE FUNCTION public.delete_comment(comment_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id uuid := auth.uid();
    comment_owner_id uuid;
BEGIN
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated to delete comments';
    END IF;
    
    SELECT user_id INTO comment_owner_id
    FROM public.product_comments
    WHERE id = comment_id_param;
    
    IF comment_owner_id != current_user_id THEN
        RAISE EXCEPTION 'Only comment owners can delete their comments';
    END IF;
    
    DELETE FROM public.product_comments
    WHERE id = comment_id_param;
    
    RETURN FOUND;
END;
$$;

-- 8. FUNCTION TO GET COMMENTS WITH REPLIES
CREATE OR REPLACE FUNCTION public.get_product_comments(product_id_param uuid)
RETURNS TABLE (
    id uuid,
    product_id uuid,
    user_id uuid,
    parent_id uuid,
    content text,
    is_edited boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    user_full_name text,
    user_avatar_url text,
    replies_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pc.id,
        pc.product_id,
        pc.user_id,
        pc.parent_id,
        pc.content,
        pc.is_edited,
        pc.created_at,
        pc.updated_at,
        p.full_name as user_full_name,
        p.avatar_url as user_avatar_url,
        COALESCE(replies.replies_count, 0) as replies_count
    FROM public.product_comments pc
    LEFT JOIN public.profiles p ON pc.user_id = p.id
    LEFT JOIN (
        SELECT parent_id, COUNT(*) as replies_count
        FROM public.product_comments
        WHERE parent_id IS NOT NULL
        GROUP BY parent_id
    ) replies ON pc.id = replies.parent_id
    WHERE pc.product_id = product_id_param
    ORDER BY pc.created_at ASC;
END;
$$;
