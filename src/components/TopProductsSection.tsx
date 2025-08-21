import { Crown, Award, Trophy, ExternalLink, Loader2 } from 'lucide-react';
import { Product } from '../types';
import { supabase } from '../lib/supabaseClient';
import { useEffect, useState } from 'react';

interface WeeklyStats {
  totalVotes: number;
  productsCompeting: number;
  communityVotes: number;
}

const TopProductsSection = () => {
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({
    totalVotes: 0,
    productsCompeting: 0,
    communityVotes: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopProducts = async () => {
      setLoading(true);
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      try {
        // Fetch top products from the last week
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('*, profiles:user_id(full_name)')
          .gte('created_at', oneWeekAgo.toISOString())
          .order('upvotes_count', { ascending: false })
          .limit(3);

        if (productsError) {
          console.error("Error fetching top products:", productsError);
        } else {
          setTopProducts(products as Product[]);
        }

        // Fetch weekly statistics
        const [
          { count: totalVotes },
          { count: productsCompeting },
          { count: communityVotes }
        ] = await Promise.all([
          // Total upvotes this week
          supabase
            .from('product_upvotes')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', oneWeekAgo.toISOString()),
          
          // Products created this week
          supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', oneWeekAgo.toISOString()),
          
          // Total upvotes (all time for community engagement)
          supabase
            .from('product_upvotes')
            .select('*', { count: 'exact', head: true })
        ]);

        setWeeklyStats({
          totalVotes: totalVotes || 0,
          productsCompeting: productsCompeting || 0,
          communityVotes: communityVotes || 0
        });

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopProducts();
  }, []);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const statsData = [
    { value: formatNumber(weeklyStats.totalVotes), label: "Total Votes This Week" },
    { value: formatNumber(weeklyStats.productsCompeting), label: "Products Competing" },
    { value: formatNumber(weeklyStats.communityVotes), label: "Community Votes" },
  ];

  const PlaceIcon = ({ place }: { place: number }) => {
    if (place === 1) return <Crown className="w-5 h-5 text-brand-yellow" />;
    if (place === 2) return <Award className="w-5 h-5 text-gray-400" />;
    return <Trophy className="w-5 h-5 text-brand-orange" />;
  };

  const getPlaceLabel = (place: number) => {
    if (place === 1) return "Winner!";
    if (place === 2) return "2nd Place";
    return "3rd Place";
  };

  const getPlaceColor = (place: number) => {
    if (place === 1) return "text-brand-yellow";
    if (place === 2) return "text-gray-400";
    return "text-brand-orange";
  };
  
  const winner = topProducts[0];
  const secondPlace = topProducts[1];
  const thirdPlace = topProducts[2];

  return (
    <section id="leaderboard" className="py-20 bg-black">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Crown className="w-8 h-8 text-brand-green" />
            <h2 className="text-4xl md:text-5xl font-bold">Top Products This Week</h2>
          </div>
          <p className="text-lg text-brand-gray">The most upvoted products by our amazing community</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-96">
            <Loader2 className="w-12 h-12 text-brand-green animate-spin" />
          </div>
        ) : topProducts.length < 3 ? (
          <div className="text-center text-brand-gray h-96 flex items-center justify-center">
            Not enough products this week to form a leaderboard.
          </div>
        ) : (
          <>
            <div className="flex items-center justify-center gap-2 mb-8">
              <Crown className="w-6 h-6 text-brand-yellow" />
              <span className="text-xl font-bold text-brand-yellow">Winner!</span>
            </div>

            <div className="flex flex-col lg:flex-row items-stretch justify-center gap-8 mb-16">
              {/* 2nd Place */}
              {secondPlace && (
                <div className="lg:order-1 flex-shrink-0">
                  <div className="flex items-center gap-2 mb-4">
                    <PlaceIcon place={2} />
                    <span className={`font-bold ${getPlaceColor(2)}`}>{getPlaceLabel(2)}</span>
                  </div>
                  <div className="bg-brand-gray-darker border border-brand-gray-dark rounded-xl overflow-hidden w-full lg:w-80 group hover:border-gray-400/50 transition-all duration-300">
                    <div className="relative h-48 overflow-hidden">
                      <img src={secondPlace.image_url} alt={secondPlace.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      <div className="absolute top-3 right-3 bg-gray-400 text-black text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1"><Award className="w-3 h-3" />2nd</div>
                    </div>
                    <div className="p-5">
                      <h3 className="text-lg font-bold mb-2">{secondPlace.name}</h3>
                      <p className="text-brand-gray-light text-sm mb-4 line-clamp-2">{secondPlace.description}</p>
                      <div className="flex justify-between items-center pt-4 border-t border-brand-gray-dark/50">
                        <p className="text-xs text-brand-gray">by {secondPlace.profiles?.full_name || '...'}</p>
                        <div className="flex items-center gap-2"><ExternalLink className="w-4 h-4 text-brand-gray" /><span className="text-lg font-bold">{secondPlace.upvotes_count}</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Winner (1st Place) */}
              {winner && (
                <div className="lg:order-2 flex-shrink-0">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <PlaceIcon place={1} />
                    <span className={`font-bold ${getPlaceColor(1)}`}>{getPlaceLabel(1)}</span>
                  </div>
                  <div className="bg-brand-gray-darker border border-brand-yellow/30 rounded-xl overflow-hidden w-full lg:w-96 group hover:border-brand-yellow/60 hover:shadow-yellow-400/20 hover:shadow-lg transition-all duration-300">
                    <div className="relative h-56 overflow-hidden">
                      <img src={winner.image_url} alt={winner.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      <div className="absolute top-3 right-3 bg-brand-yellow text-black text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1"><Crown className="w-3 h-3" />1st</div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-3">{winner.name}</h3>
                      <p className="text-brand-gray-light text-sm mb-4">{winner.description}</p>
                      <div className="flex justify-between items-center pt-4 border-t border-brand-gray-dark/50">
                        <p className="text-xs text-brand-gray">by {winner.profiles?.full_name || '...'}</p>
                        <div className="flex items-center gap-2"><ExternalLink className="w-4 h-4 text-brand-gray" /><span className="text-xl font-bold text-brand-yellow">{winner.upvotes_count}</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {thirdPlace && (
                <div className="lg:order-3 flex-shrink-0">
                  <div className="flex items-center gap-2 mb-4">
                    <PlaceIcon place={3} />
                    <span className={`font-bold ${getPlaceColor(3)}`}>{getPlaceLabel(3)}</span>
                  </div>
                  <div className="bg-brand-gray-darker border border-brand-gray-dark rounded-xl overflow-hidden w-full lg:w-80 group hover:border-brand-orange/50 transition-all duration-300">
                    <div className="relative h-48 overflow-hidden">
                      <img src={thirdPlace.image_url} alt={thirdPlace.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      <div className="absolute top-3 right-3 bg-brand-orange text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1"><Trophy className="w-3 h-3" />3rd</div>
                    </div>
                    <div className="p-5">
                      <h3 className="text-lg font-bold mb-2">{thirdPlace.name}</h3>
                      <p className="text-brand-gray-light text-sm mb-4 line-clamp-2">{thirdPlace.description}</p>
                      <div className="flex justify-between items-center pt-4 border-t border-brand-gray-dark/50">
                        <p className="text-xs text-brand-gray">by {thirdPlace.profiles?.full_name || '...'}</p>
                        <div className="flex items-center gap-2"><ExternalLink className="w-4 h-4 text-brand-gray" /><span className="text-lg font-bold">{thirdPlace.upvotes_count}</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <div className="flex justify-center items-center gap-8 md:gap-16 flex-wrap">
          {statsData.map((stat, index) => (
            <div key={index} className="bg-brand-gray-darker border border-brand-gray-dark rounded-lg px-6 py-4 text-center">
              <p className="text-2xl md:text-3xl font-bold">{stat.value}</p>
              <p className="text-sm text-brand-gray">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TopProductsSection;
