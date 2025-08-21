import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, Filter, Grid, List, ChevronDown, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';

const AllProjectsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('Most Upvoted');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const categories = useMemo(() => {
    const allTags = products.flatMap(p => p.tags);
    return ['All', ...Array.from(new Set(allTags))];
  }, [products]);

  const timeFilters = ['All', 'Today', 'This Week', 'This Month'];
  const sortOptions = ['Most Upvoted', 'Newest', 'Oldest', 'A-Z', 'Z-A'];

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          profiles:user_id(full_name)
        `);

      if (error) {
        setError(error.message);
      } else {
        // Check if current user has upvoted each product
        const { data: userUpvotes, error: upvotesError } = await supabase
          .from('product_upvotes')
          .select('product_id')
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

        if (upvotesError) {
          console.error('Error fetching user upvotes:', upvotesError);
        }

        const userUpvotedProductIds = new Set(userUpvotes?.map(u => u.product_id) || []);

        const formattedData = data.map(p => ({
          ...p,
          user_has_upvoted: userUpvotedProductIds.has(p.id),
          user_has_followed: false, // We'll implement this later if needed
        })) as unknown as Product[];
        setProducts(formattedData);
      }
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const filteredAndSortedProjects = useMemo(() => {
    return products
      .filter(project => {
        const today = new Date();
        const projectDate = new Date(project.created_at);

        const matchesTime = (() => {
          if (timeFilter === 'All') return true;
          if (timeFilter === 'Today') return projectDate.toDateString() === today.toDateString();
          if (timeFilter === 'This Week') {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(today.getDate() - 7);
            return projectDate >= oneWeekAgo;
          }
          if (timeFilter === 'This Month') {
            return projectDate.getMonth() === today.getMonth() && projectDate.getFullYear() === today.getFullYear();
          }
          return true;
        })();

        const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             project.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
        
        const matchesCategory = selectedCategory === 'All' || project.tags.includes(selectedCategory);
        
        return matchesTime && matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'Most Upvoted':
            return b.upvotes_count - a.upvotes_count;
          case 'Newest':
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          case 'Oldest':
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          case 'A-Z':
            return a.name.localeCompare(b.name);
          case 'Z-A':
            return b.name.localeCompare(a.name);
          default:
            return 0;
        }
      });
  }, [products, searchQuery, timeFilter, selectedCategory, sortBy]);

  return (
    <div className="pt-20 min-h-screen bg-black">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/" className="flex items-center gap-2 text-brand-gray hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </Link>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">All Projects</h1>
          <p className="text-lg text-brand-gray max-w-2xl mx-auto">
            Discover all the amazing products built by our creative community
          </p>
        </div>

        <div className="bg-brand-gray-darker border border-brand-gray-dark rounded-xl p-6 mb-8">
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-brand-gray" />
            <input type="text" placeholder="Search projects, tags, or descriptions..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-brand-gray-dark border border-brand-gray-medium rounded-lg pl-12 pr-4 py-3 text-white placeholder-brand-gray focus:outline-none focus:border-brand-green transition-colors" />
          </div>
          
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-brand-gray-light mr-2">Date:</span>
              {timeFilters.map(filter => (
                <button key={filter} onClick={() => setTimeFilter(filter)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${timeFilter === filter ? 'bg-brand-blue text-white' : 'bg-brand-gray-dark text-brand-gray hover:text-white hover:bg-brand-gray-medium'}`}>
                  {filter}
                </button>
              ))}
            </div>

            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm font-medium text-brand-gray-light mr-2">Category:</span>
                {categories.slice(0, 8).map(category => (
                  <button key={category} onClick={() => setSelectedCategory(category)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedCategory === category ? 'bg-brand-green text-black' : 'bg-brand-gray-dark text-brand-gray hover:text-white hover:bg-brand-gray-medium'}`}>
                    {category}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-4 items-center">
                <div className="relative">
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-brand-gray-dark border border-brand-gray-medium rounded-lg px-4 py-2 text-white appearance-none pr-8 focus:outline-none focus:border-brand-green transition-colors">
                    {sortOptions.map(option => (<option key={option} value={option}>{option}</option>))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-brand-gray pointer-events-none" />
                </div>
                <div className="flex items-center bg-brand-gray-dark rounded-lg p-1">
                  <button onClick={() => setViewMode('grid')} className={`p-2 rounded transition-colors ${viewMode === 'grid' ? 'bg-brand-green text-black' : 'text-brand-gray hover:text-white'}`}><Grid className="w-4 h-4" /></button>
                  <button onClick={() => setViewMode('list')} className={`p-2 rounded transition-colors ${viewMode === 'list' ? 'bg-brand-green text-black' : 'text-brand-gray hover:text-white'}`}><List className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-8">
          <p className="text-brand-gray">Showing {filteredAndSortedProjects.length} of {products.length} projects</p>
          {(searchQuery || timeFilter !== 'All' || selectedCategory !== 'All') && (
            <button onClick={() => { setSearchQuery(''); setTimeFilter('All'); setSelectedCategory('All'); }} className="text-brand-green hover:text-brand-green/80 transition-colors text-sm">Clear filters</button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-16"><Loader2 className="w-10 h-10 text-brand-green animate-spin" /></div>
        ) : error ? (
          <div className="text-center py-16 text-red-400">Error: {error}</div>
        ) : filteredAndSortedProjects.length > 0 ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8' : 'space-y-6'}>
            {filteredAndSortedProjects.map(project => (<ProductCard key={project.id} product={project} viewMode={viewMode}/>))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-brand-gray-dark rounded-full flex items-center justify-center"><Search className="w-12 h-12 text-brand-gray" /></div>
            <h3 className="text-xl font-bold mb-2">No projects found</h3>
            <p className="text-brand-gray mb-6">Try adjusting your search terms or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllProjectsPage;
