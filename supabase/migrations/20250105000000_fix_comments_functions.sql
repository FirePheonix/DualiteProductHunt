-- Fix Comments Functions - Simplified Version
-- This migration ensures all comment functions are properly created

-- 1. First, let's make sure the table exists
CREATE TABLE IF NOT EXISTS public.product_comments (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_id uuid REFERENCES public.product_comments(id) ON DELETE CASCADE,
    content text NOT NULL,
    is_edited boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.product_comments ENABLE ROW LEVEL SECURITY;

-- 3. Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_product_comments_product_id ON public.product_comments(product_id);
CREATE INDEX IF NOT EXISTS idx_product_comments_parent_id ON public.product_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_product_comments_user_id ON public.product_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_product_comments_created_at ON public.product_comments(created_at);

-- 4. Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to comments" ON public.product_comments;
DROP POLICY IF EXISTS "Allow authenticated users to insert their own comments" ON public.product_comments;
DROP POLICY IF EXISTS "Allow comment owners to update their own comments" ON public.product_comments;
DROP POLICY IF EXISTS "Allow comment owners to delete their own comments" ON public.product_comments;

-- 5. Create RLS policies
CREATE POLICY "Allow public read access to comments" ON public.product_comments
FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert their own comments" ON public.product_comments
FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

CREATE POLICY "Allow comment owners to update their own comments" ON public.product_comments
FOR UPDATE USING (auth.role() = 'authenticated' AND user_id = auth.uid());

CREATE POLICY "Allow comment owners to delete their own comments" ON public.product_comments
FOR DELETE USING (auth.role() = 'authenticated' AND user_id = auth.uid());

-- 6. Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.handle_comment_change();
DROP FUNCTION IF EXISTS public.add_comment(uuid, text, uuid);
DROP FUNCTION IF EXISTS public.update_comment(uuid, text);
DROP FUNCTION IF EXISTS public.delete_comment(uuid);
DROP FUNCTION IF EXISTS public.get_product_comments(uuid);

-- 7. Create trigger function
CREATE OR REPLACE FUNCTION public.handle_comment_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.products
    SET comments_count = COALESCE(comments_count, 0) + 1
    WHERE id = NEW.product_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.products
    SET comments_count = GREATEST(COALESCE(comments_count, 0) - 1, 0)
    WHERE id = OLD.product_id;
  END IF;
  RETURN NULL;
END;
$$;

-- 8. Create trigger
DROP TRIGGER IF EXISTS on_comment_change ON public.product_comments;
CREATE TRIGGER on_comment_change
AFTER INSERT OR DELETE ON public.product_comments
FOR EACH ROW EXECUTE FUNCTION public.handle_comment_change();

-- 9. Create add_comment function
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

-- 10. Create update_comment function
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

-- 11. Create delete_comment function
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

-- 12. Create get_product_comments function
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
        COALESCE(p.full_name, 'Unknown User') as user_full_name,
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
