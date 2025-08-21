import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useEffect, useState } from 'react';

const Hero = () => {
  const { user, openAuthModal, openAddProjectModal } = useAuth();
  const [stats, setStats] = useState([
    { value: "...", label: "Products Listed" },
    { value: "...", label: "Total Upvotes" },
    { value: "...", label: "Active Creators" },
  ]);

  useEffect(() => {
    const fetchStats = async () => {
      const { count: productsCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
      const { data: upvotesData } = await supabase.from('products').select('upvotes_count');
      const { count: creatorsCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      
      const totalUpvotes = upvotesData?.reduce((acc, p) => acc + p.upvotes_count, 0) || 0;

      setStats([
        { value: productsCount?.toLocaleString() || '0', label: "Products Listed" },
        { value: totalUpvotes > 1000 ? `${(totalUpvotes / 1000).toFixed(1)}K` : totalUpvotes.toLocaleString(), label: "Total Upvotes" },
        { value: creatorsCount?.toLocaleString() || '0', label: "Active Creators" },
      ]);
    };
    fetchStats();
  }, []);
  
  const handleAuthAction = () => {
    if (user) {
      openAddProjectModal();
    } else {
      openAuthModal('signup');
    }
  };

  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 text-center overflow-hidden">
      <div className="absolute inset-0 bg-grid"></div>
      <div className="absolute top-1/2 left-1/4 w-1/2 h-1/2 gradient-blur-1 transform -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute top-1/2 right-1/4 w-1/3 h-1/3 gradient-blur-2 transform translate-x-1/2 -translate-y-1/2"></div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="inline-block bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm mb-6">
          Projects built with Dualite
        </div>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-4">
          Discover. Build. Upvote.
        </h1>
        <p className="max-w-2xl mx-auto text-lg md:text-xl text-brand-gray mb-8">
          A place for creators to showcase products and get recognized by the community
        </p>
        <div className="flex justify-center items-center gap-4 mb-16 flex-wrap">
          <button onClick={handleAuthAction} className="bg-[#104077] text-white px-6 py-3 rounded-full text-base font-medium flex items-center gap-2 hover:opacity-90 transition-opacity">
            List Your Product <ArrowRight className="w-4 h-4" />
          </button>
          <Link to="/projects" className="bg-white/10 text-brand-green px-6 py-3 rounded-full text-base font-medium border border-white/20 backdrop-blur-sm hover:bg-white/20 transition-colors">
            Explore Top Products
          </Link>
        </div>
        <div className="flex justify-center items-start gap-8 md:gap-16 flex-wrap">
          {stats.map((stat, index) => (
            <div key={index}>
              <p className="text-2xl md:text-3xl font-bold">{stat.value}</p>
              <p className="text-sm text-brand-gray">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;
