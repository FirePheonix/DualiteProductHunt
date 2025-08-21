import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  ThumbsUp, 
  Share2, 
  MessageCircle, 
  Eye, 
  Users, 
  Calendar, 
  ExternalLink, 
  Github, 
  Twitter, 
  Linkedin, 
  Heart,
  Loader2,
  Play,
  ChevronLeft,
  ChevronRight,
  Star,
  Award,
  Youtube
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { Product, ProductComment } from '../types';
import { useAuth } from '../contexts/AuthContext';
import CommentsSection from '../components/CommentsSection';

const ProjectPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user, openAuthModal } = useAuth();
  
  const [product, setProduct] = useState<Product | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpvoted, setIsUpvoted] = useState(false);
  const [isFollowed, setIsFollowed] = useState(false);
  const [upvotesCount, setUpvotesCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [isVoting, setIsVoting] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (id) {
      fetchProduct();
      incrementViews();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          profiles:user_id(full_name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // Check if current user has upvoted this product
      const { data: userUpvote, error: upvoteError } = await supabase
        .from('product_upvotes')
        .select('product_id')
        .eq('product_id', id)
        .eq('user_id', user?.id)
        .single();

      if (upvoteError && upvoteError.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error checking user upvote:', upvoteError);
      }

      // Check if current user has followed this product
      const { data: userFollow, error: followError } = await supabase
        .from('product_follows')
        .select('product_id')
        .eq('product_id', id)
        .eq('user_id', user?.id)
        .single();

      if (followError && followError.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error checking user follow:', followError);
      }

      const formattedProduct = {
        ...data,
        user_has_upvoted: !!userUpvote,
        user_has_followed: !!userFollow,
      } as Product;

      setProduct(formattedProduct);
      setIsUpvoted(formattedProduct.user_has_upvoted);
      setIsFollowed(formattedProduct.user_has_followed);
      setUpvotesCount(formattedProduct.upvotes_count);
      setFollowersCount(formattedProduct.followers_count || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };



  const incrementViews = async () => {
    try {
      await supabase.rpc('increment_product_views', { product_id_to_increment: id });
    } catch (err) {
      console.error('Error incrementing views:', err);
    }
  };

  const handleUpvote = async () => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    if (isVoting) return;

    setIsVoting(true);
    const previousUpvotedState = isUpvoted;
    const previousUpvotesCount = upvotesCount;
    
    setIsUpvoted(!isUpvoted);
    setUpvotesCount(currentCount => isUpvoted ? currentCount - 1 : currentCount + 1);

    try {
      const { error } = await supabase.rpc('toggle_upvote', { product_id_to_toggle: id });
      if (error) throw error;
    } catch (err) {
      setIsUpvoted(previousUpvotedState);
      setUpvotesCount(previousUpvotesCount);
      console.error('Error upvoting:', err);
    } finally {
      setIsVoting(false);
    }
  };

  const handleFollow = async () => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    if (isFollowing) return;

    setIsFollowing(true);
    const previousFollowedState = isFollowed;
    const previousFollowersCount = followersCount;
    
    setIsFollowed(!isFollowed);
    setFollowersCount(currentCount => isFollowed ? currentCount - 1 : currentCount + 1);

    try {
      const { error } = await supabase.rpc('toggle_product_follow', { product_id_to_toggle: id });
      if (error) throw error;
    } catch (err) {
      setIsFollowed(previousFollowedState);
      setFollowersCount(previousFollowersCount);
      console.error('Error following:', err);
    } finally {
      setIsFollowing(false);
    }
  };



  const nextImage = () => {
    if (product?.gallery_images && product.gallery_images.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === product.gallery_images!.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (product?.gallery_images && product.gallery_images.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? product.gallery_images!.length - 1 : prev - 1
      );
    }
  };

  if (loading) {
    return (
      <div className="pt-20 min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-brand-green animate-spin" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="pt-20 min-h-screen bg-black">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
            <p className="text-brand-gray mb-6">{error || 'The product you are looking for does not exist.'}</p>
            <Link to="/projects" className="inline-flex items-center gap-2 bg-brand-green text-black px-6 py-3 rounded-lg font-medium hover:bg-brand-green/90 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Projects
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isNew = new Date(product.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const isLaunchingToday = product.launch_date && new Date(product.launch_date).toDateString() === new Date().toDateString();

  // Helper function to extract YouTube video ID
  const getYouTubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const youtubeVideoId = product.youtube_url ? getYouTubeVideoId(product.youtube_url) : null;

  return (
    <div className="pt-20 min-h-screen bg-black">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Navigation */}
        <div className="mb-8">
          <Link to="/projects" className="inline-flex items-center gap-2 text-brand-gray hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Back to Projects
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Product Header */}
            <div className="bg-brand-gray-darker border border-brand-gray-dark rounded-xl p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold">{product.name}</h1>
                    {isNew && (
                      <span className="bg-brand-green text-black text-xs font-bold px-2 py-1 rounded-md">NEW</span>
                    )}
                    {isLaunchingToday && (
                      <span className="bg-brand-blue text-white text-xs font-bold px-2 py-1 rounded-md">LAUNCHING TODAY</span>
                    )}
                  </div>
                  {product.tagline && (
                    <p className="text-xl text-brand-gray-light mb-4">{product.tagline}</p>
                  )}
                  <p className="text-brand-gray mb-4">{product.description}</p>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {product.tags.map(tag => (
                      <span key={tag} className="bg-brand-gray-dark text-white text-xs px-3 py-1 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Pricing */}
                  {product.pricing_type && (
                    <div className="flex items-center gap-2 text-sm text-brand-gray mb-4">
                      <span className="font-medium">Pricing:</span>
                      <span className="bg-brand-gray-dark px-2 py-1 rounded">
                        {product.pricing_type}
                        {product.pricing_details && ` - ${product.pricing_details}`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Visit Website Button */}
                {product.website_url && (
                  <a 
                    href={product.website_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-brand-green text-black px-6 py-3 rounded-lg font-medium hover:bg-brand-green/90 transition-colors flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Visit Website
                  </a>
                )}
              </div>
            </div>

            {/* Media Gallery */}
            <div className="bg-brand-gray-darker border border-brand-gray-dark rounded-xl p-6 mb-6">
              <div className="relative">
                {youtubeVideoId ? (
                  <div className="aspect-video bg-brand-gray-dark rounded-lg overflow-hidden mb-4">
                    <iframe
                      src={`https://www.youtube.com/embed/${youtubeVideoId}`}
                      title={`${product.name} - YouTube Video`}
                      className="w-full h-full"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-brand-gray-dark rounded-lg overflow-hidden mb-4">
                    {product.featured_image_url ? (
                      <img 
                        src={product.featured_image_url} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <button className="bg-white/20 backdrop-blur-sm rounded-full p-4 hover:bg-white/30 transition-colors">
                        <Play className="w-8 h-8 text-white" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Gallery Navigation */}
                {product.gallery_images && product.gallery_images.length > 0 && (
                  <div className="relative">
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {product.gallery_images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                            index === currentImageIndex 
                              ? 'border-brand-green' 
                              : 'border-brand-gray-dark hover:border-brand-gray-medium'
                          }`}
                        >
                          <img src={image} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Long Description */}
            {product.long_description && (
              <div className="bg-brand-gray-darker border border-brand-gray-dark rounded-xl p-6 mb-6">
                <h2 className="text-xl font-bold mb-4">About {product.name}</h2>
                <div className="prose prose-invert max-w-none">
                  <p className="text-brand-gray-light leading-relaxed whitespace-pre-wrap">
                    {product.long_description}
                  </p>
                </div>
              </div>
            )}

            {/* Team Section */}
            {product.team_members && product.team_members.length > 0 && (
              <div className="bg-brand-gray-darker border border-brand-gray-dark rounded-xl p-6 mb-6">
                <h2 className="text-xl font-bold mb-4">Built by</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {product.team_members.map((member, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-brand-gray-dark rounded-lg">
                      <div className="w-10 h-10 bg-brand-green rounded-full flex items-center justify-center text-black font-bold">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-brand-gray">{member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments Section */}
            <CommentsSection productId={product.id} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Launch Status */}
            <div className="bg-brand-gray-darker border border-brand-gray-dark rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">Launch Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-brand-gray">Rank</span>
                  <span className="font-bold text-brand-green">#1 Today</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-brand-gray">Upvotes</span>
                  <span className="font-bold">{upvotesCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-brand-gray">Views</span>
                  <span className="font-bold">{product.views_count || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-brand-gray">Followers</span>
                  <span className="font-bold">{followersCount}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-brand-gray-darker border border-brand-gray-dark rounded-xl p-6">
              <div className="space-y-3">
                <button
                  onClick={handleUpvote}
                  disabled={isVoting}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-colors ${
                    isUpvoted 
                      ? 'bg-brand-green text-black' 
                      : 'bg-brand-gray-dark text-white hover:bg-brand-gray-medium'
                  }`}
                >
                  {isVoting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ThumbsUp className="w-4 h-4" />
                  )}
                  {isUpvoted ? 'Upvoted' : 'Upvote'}
                </button>

                <button
                  onClick={handleFollow}
                  disabled={isFollowing}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-colors ${
                    isFollowed 
                      ? 'bg-brand-blue text-white' 
                      : 'bg-brand-gray-dark text-white hover:bg-brand-gray-medium'
                  }`}
                >
                  {isFollowing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Heart className="w-4 h-4" />
                  )}
                  {isFollowed ? 'Following' : 'Follow'}
                </button>

                <button className="w-full flex items-center justify-center gap-2 py-3 bg-brand-gray-dark text-white rounded-lg font-medium hover:bg-brand-gray-medium transition-colors">
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              </div>
            </div>

            {/* Company Info */}
            <div className="bg-brand-gray-darker border border-brand-gray-dark rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">Company</h3>
              <div className="space-y-3">
                {product.company_name && (
                  <div>
                    <span className="text-brand-gray text-sm">Company</span>
                    <p className="font-medium">{product.company_name}</p>
                  </div>
                )}
                
                {product.website_url && (
                  <a 
                    href={product.website_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-brand-green hover:text-brand-green/80 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Website
                  </a>
                )}

                {product.github_url && (
                  <a 
                    href={product.github_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-brand-gray hover:text-white transition-colors"
                  >
                    <Github className="w-4 h-4" />
                    GitHub
                  </a>
                )}

                {product.twitter_url && (
                  <a 
                    href={product.twitter_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-brand-gray hover:text-white transition-colors"
                  >
                    <Twitter className="w-4 h-4" />
                    Twitter
                  </a>
                )}

                {product.linkedin_url && (
                  <a 
                    href={product.linkedin_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-brand-gray hover:text-white transition-colors"
                  >
                    <Linkedin className="w-4 h-4" />
                    LinkedIn
                  </a>
                )}

                {product.youtube_url && (
                  <a 
                    href={product.youtube_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-brand-gray hover:text-white transition-colors"
                  >
                    <Youtube className="w-4 h-4" />
                    YouTube
                  </a>
                )}
              </div>
            </div>

            {/* Product Info */}
            <div className="bg-brand-gray-darker border border-brand-gray-dark rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">Product Info</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-brand-gray">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Launched {new Date(product.created_at).toLocaleDateString()}</span>
                </div>
                
                <div className="flex items-center gap-2 text-brand-gray">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">by {product.profiles?.full_name || 'Unknown Author'}</span>
                </div>

                {product.launch_date && (
                  <div className="flex items-center gap-2 text-brand-gray">
                    <Star className="w-4 h-4" />
                    <span className="text-sm">Launch date: {new Date(product.launch_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Awards */}
            <div className="bg-brand-gray-darker border border-brand-gray-dark rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">Awards</h3>
              <div className="flex items-center gap-2 text-brand-gray">
                <Award className="w-4 h-4" />
                <span className="text-sm">No awards yet</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectPage;
