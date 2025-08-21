import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Share2, ThumbsUp, Calendar, Loader2 } from 'lucide-react';
import { Product } from '../types';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
}

const ProductCard = ({ product, viewMode = 'grid' }: ProductCardProps) => {
  const { user, openAuthModal } = useAuth();
  const [isUpvoted, setIsUpvoted] = useState(product.user_has_upvoted);
  const [upvotesCount, setUpvotesCount] = useState(product.upvotes_count);
  const [isVoting, setIsVoting] = useState(false);

  const handleUpvote = async () => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    if (isVoting) return;

    setIsVoting(true);

    // Optimistic UI update
    const previousUpvotedState = isUpvoted;
    const previousUpvotesCount = upvotesCount;
    setIsUpvoted(!isUpvoted);
    setUpvotesCount(currentCount => isUpvoted ? currentCount - 1 : currentCount + 1);

    const { error } = await supabase.rpc('toggle_upvote', {
      product_id_to_toggle: product.id,
    });

    if (error) {
      // Revert on error
      setIsUpvoted(previousUpvotedState);
      setUpvotesCount(previousUpvotesCount);
      console.error('Error upvoting:', error);
    }
    
    setIsVoting(false);
  };
  
  const isNew = new Date(product.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  if (viewMode === 'list') {
    return (
      <div className="bg-brand-gray-darker border border-brand-gray-dark rounded-xl overflow-hidden flex flex-col md:flex-row group transition-all duration-300 hover:border-brand-green/50 hover:shadow-green-glow">
        <Link to={`/projects/${product.id}`} className="relative w-full md:w-64 h-48 md:h-auto overflow-hidden flex-shrink-0">
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
          {isNew && (
            <div className="absolute top-3 right-3 bg-brand-green text-black text-xs font-bold px-2 py-1 rounded-md">NEW</div>
          )}
        </Link>
        <div className="p-6 flex-grow flex flex-col">
          <Link to={`/projects/${product.id}`} className="hover:text-brand-green transition-colors">
            <h3 className="text-xl font-bold mb-2">{product.name}</h3>
          </Link>
          <p className="text-brand-gray-light text-sm mb-4 line-clamp-2">{product.description}</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {product.tags.map(tag => (
              <span key={tag} className="bg-brand-gray-dark text-white text-xs px-2.5 py-1 rounded-full">{tag}</span>
            ))}
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-auto pt-4 border-t border-brand-gray-dark/50">
            <div className="flex items-center gap-4 mb-3 md:mb-0">
              <p className="text-sm text-brand-gray">by {product.profiles?.full_name || 'Unknown Author'}</p>
              <div className="flex items-center gap-1 text-xs text-brand-gray">
                <Calendar className="w-3 h-3" />
                {new Date(product.created_at).toLocaleDateString()}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-md bg-brand-gray-dark/50 hover:bg-brand-gray-dark transition-colors">
                <Share2 className="w-4 h-4 text-white" />
              </button>
              <button onClick={handleUpvote} disabled={isVoting} className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${ isUpvoted ? 'bg-brand-green/20 text-brand-green' : 'bg-brand-gray-dark/50 hover:bg-brand-gray-dark'}`}>
                {isVoting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />}
                <span className="text-sm font-medium">{upvotesCount}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-brand-gray-darker border border-brand-gray-dark rounded-xl overflow-hidden flex flex-col group transition-all duration-300 hover:border-brand-green/50 hover:shadow-green-glow">
      <Link to={`/projects/${product.id}`} className="relative h-52 overflow-hidden">
        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
        {isNew && (
          <div className="absolute top-3 right-3 bg-brand-green text-black text-xs font-bold px-2 py-1 rounded-md">NEW</div>
        )}
      </Link>
      <div className="p-5 flex-grow flex flex-col">
        <Link to={`/projects/${product.id}`} className="hover:text-brand-green transition-colors">
          <h3 className="text-lg font-bold mb-2">{product.name}</h3>
        </Link>
        <p className="text-brand-gray-light text-sm mb-4 flex-grow line-clamp-3">{product.description}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {product.tags.slice(0, 3).map(tag => (
            <span key={tag} className="bg-brand-gray-dark text-white text-xs px-2.5 py-1 rounded-full">{tag}</span>
          ))}
          {product.tags.length > 3 && (
            <span className="bg-brand-gray-dark text-brand-gray text-xs px-2.5 py-1 rounded-full">+{product.tags.length - 3}</span>
          )}
        </div>
        <div className="flex flex-col gap-3 mt-auto pt-4 border-t border-brand-gray-dark/50">
          <div className="flex items-center gap-2 text-xs text-brand-gray">
            <Calendar className="w-3 h-3" />
            {new Date(product.created_at).toLocaleDateString()}
          </div>
          <div className="flex justify-between items-center">
            <p className="text-xs text-brand-gray">by {product.profiles?.full_name || 'Unknown Author'}</p>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-md bg-brand-gray-dark/50 hover:bg-brand-gray-dark transition-colors">
                <Share2 className="w-4 h-4 text-white" />
              </button>
              <button onClick={handleUpvote} disabled={isVoting} className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${ isUpvoted ? 'bg-brand-green/20 text-brand-green' : 'bg-brand-gray-dark/50 hover:bg-brand-gray-dark'}`}>
                {isVoting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />}
                <span className="text-sm font-medium">{upvotesCount}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
