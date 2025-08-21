import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Infinity, User as UserIcon, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === '/';
  const { user, signOut, openAuthModal, openAddProjectModal } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToSection = (sectionId: string) => {
    if (!isHomePage) {
      navigate(`/#${sectionId}`);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        const headerHeight = 80;
        const elementPosition = element.offsetTop - headerHeight;
        window.scrollTo({
          top: elementPosition,
          behavior: 'smooth'
        });
      }
    }
  };
  
  const handleSignOut = async () => {
    await signOut();
  };

  const handleAuthAction = () => {
    if (user) {
      openAddProjectModal();
    } else {
      openAuthModal('signup');
    }
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-black/80 border-b border-brand-gray-dark backdrop-blur-lg' : 'bg-transparent'}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <Infinity className="h-8 w-8 text-white" />
              <span className="text-2xl font-bold">DUALITE</span>
            </Link>
            <nav className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => scrollToSection('products')}
                className="text-brand-gray hover:text-white transition-colors cursor-pointer"
              >
                Products
              </button>
              <button 
                onClick={() => scrollToSection('leaderboard')}
                className="text-brand-gray hover:text-white transition-colors cursor-pointer"
              >
                Leaderboard
              </button>
              <button 
                onClick={() => scrollToSection('community')}
                className="text-brand-gray hover:text-white transition-colors cursor-pointer"
              >
                Community
              </button>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <UserIcon className="w-5 h-5 text-brand-green" />
                  <span>{user.user_metadata.full_name || user.email}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="bg-brand-gray-dark/50 p-2 rounded-lg text-brand-gray hover:text-white hover:bg-brand-gray-dark transition-all"
                  title="Log out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <>
                <button onClick={() => openAuthModal('login')} className="text-brand-white hover:text-brand-green transition-colors hidden sm:block">Log in</button>
                <button onClick={handleAuthAction} className="bg-gradient-to-b from-[#454545] to-[#212121] text-white px-4 py-2 rounded-md text-sm font-medium border border-white/20 hover:border-white/40 transition-all">
                  Try Dualite Now
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
