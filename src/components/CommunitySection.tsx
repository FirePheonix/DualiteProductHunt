import { Users, Heart, MessageCircle, Zap, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface CommunityStats {
  totalUsers: number;
  totalUpvotes: number;
  totalComments: number;
  totalProducts: number;
}

interface RecentCreator {
  id: string;
  full_name: string;
  created_at: string;
  products_count: number;
  upvotes_received: number;
}

const CommunitySection = () => {
  const [communityStats, setCommunityStats] = useState<CommunityStats>({
    totalUsers: 0,
    totalUpvotes: 0,
    totalComments: 0,
    totalProducts: 0
  });
  const [recentCreators, setRecentCreators] = useState<RecentCreator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCommunityData = async () => {
      setLoading(true);
      try {
        // Fetch community stats
        const [
          { count: usersCount },
          { count: productsCount },
          { count: commentsCount },
          { count: upvotesCount }
        ] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('products').select('*', { count: 'exact', head: true }),
          supabase.from('product_comments').select('*', { count: 'exact', head: true }),
          supabase.from('product_upvotes').select('*', { count: 'exact', head: true })
        ]);

        setCommunityStats({
          totalUsers: usersCount || 0,
          totalProducts: productsCount || 0,
          totalComments: commentsCount || 0,
          totalUpvotes: upvotesCount || 0
        });

        // Fetch recent creators (users who recently added their latest project)
        const { data: creators } = await supabase
          .from('products')
          .select(`
            user_id,
            created_at,
            profiles:user_id(
              id,
              full_name
            )
          `)
          .order('created_at', { ascending: false })
          .limit(5);

        if (creators) {
          // Remove duplicates and get unique creators based on user_id
          const uniqueCreators = creators.reduce((acc, creator) => {
            if (!acc.find(c => c.user_id === creator.user_id)) {
              acc.push(creator);
            }
            return acc;
          }, [] as typeof creators);

          const creatorsWithStats = await Promise.all(
            uniqueCreators.slice(0, 5).map(async (creator) => {
              // Get products count for this creator
              const { count: productsCount } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', creator.user_id);

              // Get total upvotes received by this creator's products
              const { data: upvotesData } = await supabase
                .from('products')
                .select('upvotes_count')
                .eq('user_id', creator.user_id);

              const upvotesReceived = upvotesData?.reduce((sum, product) => sum + (product.upvotes_count || 0), 0) || 0;

              return {
                id: creator.user_id,
                full_name: creator.profiles?.[0]?.full_name || 'Unknown User',
                created_at: creator.created_at,
                products_count: productsCount || 0,
                upvotes_received: upvotesReceived
              };
            })
          );

          setRecentCreators(creatorsWithStats);
        }
      } catch (error) {
        console.error('Error fetching community data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunityData();
  }, []);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const statsData = [
    {
      icon: Users,
      value: formatNumber(communityStats.totalUsers),
      label: "Active Members",
      color: "text-brand-blue",
      bgColor: "bg-brand-blue/10",
    },
    {
      icon: Heart,
      value: formatNumber(communityStats.totalUpvotes),
      label: "Products Loved",
      color: "text-red-400",
      bgColor: "bg-red-400/10",
    },
    {
      icon: MessageCircle,
      value: formatNumber(communityStats.totalComments),
      label: "Comments",
      color: "text-brand-green",
      bgColor: "bg-brand-green/10",
    },
    {
      icon: Zap,
      value: formatNumber(communityStats.totalProducts),
      label: "Products Created",
      color: "text-brand-yellow",
      bgColor: "bg-brand-yellow/10",
    },
  ];

  const whyJoinPoints = [
    "Get valuable feedback from real users",
    "Connect with potential collaborators",
    "Gain exposure for your products",
    "Learn from successful creators",
  ];

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return `${Math.floor(diffInDays / 7)}w ago`;
  };

  if (loading) {
    return (
      <section id="community" className="py-20 bg-black">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-lg text-brand-gray max-w-3xl mx-auto">
              Connect with creators, innovators, and product enthusiasts from around the world
            </p>
          </div>
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-12 h-12 text-brand-green animate-spin" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="community" className="py-20 bg-black">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-lg text-brand-gray max-w-3xl mx-auto">
            Connect with creators, innovators, and product enthusiasts from around the world
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left Column - Stats and Why Join */}
          <div className="space-y-8">
            {/* Community Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              {statsData.map((stat, index) => (
                <div 
                  key={index}
                  className="bg-brand-gray-darker border border-brand-gray-dark rounded-xl p-6 text-center hover:border-brand-green/30 transition-all duration-300 group"
                >
                  <div className={`w-12 h-12 mx-auto mb-3 ${stat.bgColor} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-brand-gray">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Why Join Dualite */}
            <div className="bg-brand-gray-darker border border-brand-gray-dark rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Why Join Dualite?</h3>
              <ul className="space-y-3">
                {whyJoinPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-brand-green rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-brand-gray-light text-sm">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Column - Recently Active Creators */}
          <div className="bg-brand-gray-darker border border-brand-gray-dark rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-6">Recently Active Creators</h3>
            
            <div className="space-y-4 mb-8">
              {recentCreators.length > 0 ? (
                recentCreators.map((creator, index) => (
                  <div key={creator.id} className="flex items-center justify-between group hover:bg-brand-gray-dark/30 rounded-lg p-2 transition-colors duration-200">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-brand-gray-dark rounded-full flex items-center justify-center text-white font-medium text-sm">
                          {getInitials(creator.full_name)}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-brand-green rounded-full border-2 border-brand-gray-darker"></div>
                      </div>
                                             <div>
                         <div className="text-white font-medium text-sm">{creator.full_name}</div>
                         <div className="text-brand-gray text-xs">
                           {creator.products_count} products • {formatNumber(creator.upvotes_received)} upvotes
                         </div>
                         <div className="text-brand-gray text-xs">
                           Last project: {getTimeAgo(creator.created_at)}
                         </div>
                       </div>
                    </div>
                    <div className="bg-brand-green/20 text-brand-green text-xs px-2 py-1 rounded-md font-medium">
                      Creator
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-brand-gray">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No creators yet. Be the first to join!</p>
                </div>
              )}
            </div>

            {/* Join Creators CTA */}
            <div className="text-center pt-4 border-t border-brand-gray-dark/50">
              <div className="text-brand-gray text-sm mb-2">
                Join over {formatNumber(communityStats.totalUsers)} creators
              </div>
              <div className="flex items-center justify-center gap-1">
                {recentCreators.slice(0, 4).map((creator, index) => (
                  <div 
                    key={creator.id}
                    className="w-6 h-6 bg-brand-gray-dark rounded-full border border-brand-gray-dark flex items-center justify-center text-white text-xs font-bold"
                    style={{ marginLeft: index > 0 ? '-4px' : '0' }}
                    title={creator.full_name}
                  >
                    {getInitials(creator.full_name)}
                  </div>
                ))}
                <div className="w-6 h-6 bg-brand-gray-dark rounded-full border border-brand-gray-dark flex items-center justify-center text-brand-gray text-xs font-bold ml-1">
                  +
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CommunitySection;
