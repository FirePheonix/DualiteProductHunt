import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { X, Loader2 } from 'lucide-react';

const AuthModal = () => {
  const { closeAuthModal, authMode: initialMode } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) {
      setError(error.message);
    } else if (data.user?.identities?.length === 0) {
      setError("This user already exists.");
    } else {
      setMessage('Check your email for the confirmation link!');
    }
    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(error.message);
    } else {
      closeAuthModal();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-brand-gray-darker border border-brand-gray-dark rounded-xl p-8 w-full max-w-md m-4 relative">
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 text-brand-gray hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">{mode === 'login' ? 'Welcome Back' : 'Create an Account'}</h2>
          <p className="text-brand-gray">
            {mode === 'login' 
              ? 'Log in to continue to Dualite.' 
              : 'Join the community of creators.'}
          </p>
        </div>

        {error && <p className="bg-red-500/20 text-red-400 text-sm p-3 rounded-md mb-4 text-center">{error}</p>}
        {message && <p className="bg-green-500/20 text-brand-green text-sm p-3 rounded-md mb-4 text-center">{message}</p>}

        <form onSubmit={mode === 'login' ? handleSignIn : handleSignUp}>
          <div className="space-y-4">
            {mode === 'signup' && (
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full bg-brand-gray-dark border border-brand-gray-medium rounded-lg px-4 py-3 text-white placeholder-brand-gray focus:outline-none focus:border-brand-green transition-colors"
              />
            )}
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-brand-gray-dark border border-brand-gray-medium rounded-lg px-4 py-3 text-white placeholder-brand-gray focus:outline-none focus:border-brand-green transition-colors"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-brand-gray-dark border border-brand-gray-medium rounded-lg px-4 py-3 text-white placeholder-brand-gray focus:outline-none focus:border-brand-green transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-brand-green text-black font-bold py-3 rounded-lg hover:bg-brand-green/90 transition-colors flex items-center justify-center disabled:opacity-50"
          >
            {loading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
            {mode === 'login' ? 'Log In' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-sm text-brand-gray mt-6">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
          <button
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="text-brand-green font-medium ml-2 hover:underline"
          >
            {mode === 'login' ? 'Sign Up' : 'Log In'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthModal;
