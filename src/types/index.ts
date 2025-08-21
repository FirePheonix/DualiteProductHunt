export interface Profile {
  id: string;
  full_name: string;
}

export interface TeamMember {
  name: string;
  role: string;
  avatar_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
}

export interface ProductComment {
  id: string;
  product_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  parent_id?: string;
  is_edited: boolean;
  profiles: Profile | null;
  replies?: ProductComment[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  image_url: string;
  tags: string[];
  created_at: string;
  user_id: string;
  profiles: Profile | null;
  upvotes_count: number;
  user_has_upvoted: boolean;
  
  // New enhanced fields
  website_url?: string;
  tagline?: string;
  pricing_type?: string;
  pricing_details?: string;
  github_url?: string;
  twitter_url?: string;
  linkedin_url?: string;
  youtube_url?: string;
  launch_date?: string;
  featured_image_url?: string;
  gallery_images?: string[];
  long_description?: string;
  company_name?: string;
  team_members?: TeamMember[];
  views_count?: number;
  comments_count?: number;
  followers_count?: number;
  user_has_followed?: boolean;
}
