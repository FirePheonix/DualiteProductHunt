import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { Product } from '../types';
import ProductCard from './ProductCard';

const ProductsSection = () => {
  const [activeTab, setActiveTab] = useState('All');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tabs = ['All', 'Today', 'This Week', 'This Month'];

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('products')
        .select(`
          *,
          profiles:user_id(full_name),
          user_has_upvoted:product_upvotes(count)
        `)
        .order('created_at', { ascending: false });

      const today = new Date();
      const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const weekStart = new Date(new Date().setDate(today.getDate() - 7)).toISOString();
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();


      switch (activeTab) {
        case 'Today':
          query = query.gte('created_at', todayStart);
          break;
        case 'This Week':
          query = query.gte('created_at', weekStart);
          break;
        case 'This Month':
          query = query.gte('created_at', monthStart);
          break;
      }
      
      query = query.limit(4);

      const { data, error } = await query;

      if (error) {
        setError(error.message);
        console.error(error);
      } else {
        const formattedData = data.map(p => ({
          ...p,
          // Supabase returns an array for the count, so we check its length
          user_has_upvoted: Array.isArray(p.user_has_upvoted) && p.user_has_upvoted.length > 0,
        })) as unknown as Product[];
        setProducts(formattedData);
      }
      setLoading(false);
    };

    fetchProducts();
  }, [activeTab]);

  return (
    <section id="products" className="py-20 bg-black">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Discover Amazing Products</h2>
          <p className="text-lg text-brand-gray">Explore the latest innovations from our creative community</p>
        </div>
        
        <div className="flex justify-center mb-12">
          <div className="bg-brand-gray-darker border border-brand-gray-dark rounded-xl p-1 flex items-center space-x-1">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab ? 'bg-brand-gray-dark text-white' : 'text-brand-gray-light hover:bg-brand-gray-dark/50'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 text-brand-green animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center text-red-400 py-12">
            Error loading products: {error}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-12">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
           <div className="text-center text-brand-gray py-12">
            No products found for this period.
          </div>
        )}

        <div className="text-center">
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-green to-brand-green/90 text-black px-8 py-4 rounded-full font-bold text-lg hover:from-brand-green/90 hover:to-brand-green hover:shadow-green-glow transition-all duration-300 group"
          >
            See All Projects
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ProductsSection;
