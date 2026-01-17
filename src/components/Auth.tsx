import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AuthService } from '../services/auth';
import { AuthState, User as UserType } from '../types';
import { Loader2, Mail, Lock, User, ArrowRight, CheckCircle, Leaf, Sparkles, X, ChevronRight } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

interface AuthProps {
  onLogin?: (state: AuthState) => void;
  onToggle?: () => void;
}

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const AuthLayout: React.FC<{ children: React.ReactNode; title: string; subtitle: string }> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#00796B] via-teal-600 to-emerald-600 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
        <div className="hidden md:block text-white space-y-6 p-8">
          <div className="mb-6 w-16 h-1 bg-white/30 rounded-full"></div>
          <h2 className="text-5xl font-black leading-tight mb-2">SaveBite</h2>
          <p className="text-xl font-bold text-teal-200 uppercase tracking-widest mb-6">The right choice before waste</p>
          <p className="text-lg text-white/90 leading-relaxed mb-8">Turn your excess food into meals, not waste. Track inventory, donate to NGOs, and save the planet—one bite at a time.</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 md:p-10">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-[#212121] dark:text-white mb-2">{title}</h1>
            <p className="text-[#757575] dark:text-slate-400">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

export const Login: React.FC<AuthProps> = ({ onLogin, onToggle }) => {
  let authContext;
  try {
    authContext = useAuth();
  } catch (error) {
    console.error('Auth context error:', error);
    // Fallback: use AuthService directly
    authContext = null;
  }

  const { signIn, signInWithGoogle, resetPassword, authState } = authContext || {
    signIn: async () => { throw new Error('Auth not available'); },
    signInWithGoogle: async () => { throw new Error('Auth not available'); },
    resetPassword: async () => { throw new Error('Auth not available'); },
    authState: { isAuthenticated: false, user: null, token: null }
  };

  const navigate = useNavigate();
  const location = useLocation();
  const goToSignup = () => {
    if (onToggle) onToggle();
    else navigate('/signup');
  };
  const goToLogin = () => {
    if (onToggle) onToggle();
    else navigate('/login');
  };
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [showMockAccountPicker, setShowMockAccountPicker] = useState(false);
  const [mockAccounts, setMockAccounts] = useState<any[]>([]);
  const [isDemoActive, setIsDemoActive] = useState(true);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    setMockAccounts(AuthService.getMockGoogleAccounts());
    setIsDemoActive(!AuthService.isDemoDeleted());
  }, [showMockAccountPicker]);

  // Redirect if already authenticated
  useEffect(() => {
    if (authState.isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [authState.isAuthenticated, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Check for demo account first
      if (email === 'demo@ecotable.dev' && password === 'password123') {
        const state = await AuthService.login(email, password);
        if (onLogin) onLogin(state);
        const from = (location.state as any)?.from?.pathname || '/';
        navigate(from, { replace: true });
        return;
      }

      // Use Firebase Auth for real accounts
      try {
        await signIn(email, password);
        const from = (location.state as any)?.from?.pathname || '/';
        navigate(from, { replace: true });
      } catch (firebaseError: any) {
        // If Firebase Auth fails, try AuthService as fallback
        console.warn('Firebase Auth failed, trying AuthService:', firebaseError);
        const state = await AuthService.login(email, password);
        if (onLogin) onLogin(state);
        const from = (location.state as any)?.from?.pathname || '/';
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      // Use Firebase Google Auth
      await signInWithGoogle();
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error("Google Login Error:", err);
      // Only show mock picker if it's explicitly a missing configuration error (which shouldn't happen now)
      // or if the user cancels and we want to offer an alternative (optional)
      if (err.message && (err.message.includes("configuration") || err.message.includes("client"))) {
        setShowMockAccountPicker(true);
      } else {
        setError(err.message || "Google Login failed");
      }
      setGoogleLoading(false);
    }
  };

  const selectMockAccount = (mockUser: UserType) => {
    const authState: AuthState = {
      user: mockUser,
      token: 'mock-google-token',
      isAuthenticated: true
    };
    localStorage.setItem('savebite_session', JSON.stringify(authState));
    if (onLogin) onLogin(authState);
    const from = (location.state as any)?.from?.pathname || '/';
    navigate(from, { replace: true });
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await resetPassword(resetEmail);
      setResetSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email');
    }
  };

  if (showPasswordReset) {
    return (
      <AuthLayout title="Reset Password" subtitle="Enter your email to receive a password reset link.">
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium flex items-center gap-3 animate-in slide-in-from-top-2 border border-red-100 dark:border-red-900/30">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></div>
            {error}
          </div>
        )}

        {resetSent ? (
          <div className="space-y-4">
            <div className="p-6 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl text-sm font-medium flex items-center gap-3 border border-green-100 dark:border-green-900/30">
              <CheckCircle size={20} />
              Password reset email sent! Check your inbox.
            </div>
            <button
              onClick={() => {
                setShowPasswordReset(false);
                setResetSent(false);
                setResetEmail('');
              }}
              className="w-full bg-[#00796B] text-white py-3.5 rounded-xl font-semibold hover:bg-[#00695C] transition-colors"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-[#212121] dark:text-slate-200 ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 text-[#9E9E9E] dark:text-slate-500" size={20} />
                <input
                  type="email"
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-[#F5F5F5] dark:bg-slate-900 border border-transparent focus:bg-white dark:focus:bg-slate-800 focus:border-[#00796B] rounded-xl outline-none transition-all text-[#212121] dark:text-white placeholder:text-[#BDBDBD] dark:placeholder:text-slate-600"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-[#00796B] text-white py-3.5 rounded-xl font-semibold hover:bg-[#00695C] transition-colors flex items-center justify-center gap-2"
            >
              Send Reset Link
            </button>
            <button
              type="button"
              onClick={() => setShowPasswordReset(false)}
              className="w-full text-[#757575] dark:text-slate-400 py-2 text-sm hover:text-[#212121] dark:hover:text-slate-200 transition-colors"
            >
              Back to Login
            </button>
          </form>
        )}
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Welcome Back" subtitle="Log in to manage your inventory.">
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium flex items-center gap-3 animate-in slide-in-from-top-2 border border-red-100 dark:border-red-900/30">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></div>
          {error}
        </div>
      )}

      {showMockAccountPicker ? (
        <div className="space-y-4">
          <div className="text-center mb-4">
            <p className="text-sm text-[#757575] dark:text-slate-400 mb-4">Select a demo account:</p>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {mockAccounts.map((account) => (
              <button
                key={account.id}
                onClick={() => selectMockAccount(account)}
                className="w-full p-4 bg-[#F5F5F5] dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-3 border border-transparent hover:border-[#00796B]/20"
              >
                <img src={account.avatar} alt={account.name} className="w-10 h-10 rounded-full" />
                <div className="flex-1 text-left">
                  <p className="font-semibold text-[#212121] dark:text-white">{account.name}</p>
                  <p className="text-sm text-[#757575] dark:text-slate-400">{account.email}</p>
                </div>
                <ChevronRight className="text-[#9E9E9E] dark:text-slate-500" size={20} />
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowMockAccountPicker(false)}
            className="w-full text-[#757575] dark:text-slate-400 py-2 text-sm hover:text-[#212121] dark:hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading || loading}
              className="w-full bg-white dark:bg-slate-800 text-[#757575] dark:text-slate-300 border border-slate-200 dark:border-slate-700 py-3.5 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-3 relative overflow-hidden active:scale-95"
            >
              {googleLoading ? <Loader2 className="animate-spin text-[#00796B]" /> : <><GoogleIcon /><span>Sign in with Google</span></>}
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
              <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-medium uppercase">Or email</span>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-[#212121] dark:text-slate-200 ml-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 text-[#9E9E9E] dark:text-slate-500" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-[#F5F5F5] dark:bg-slate-900 border border-transparent focus:bg-white dark:focus:bg-slate-800 focus:border-[#00796B] rounded-xl outline-none transition-all text-[#212121] dark:text-white placeholder:text-[#BDBDBD] dark:placeholder:text-slate-600"
                    placeholder="name@example.com"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-[#212121] dark:text-slate-200 ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 text-[#9E9E9E] dark:text-slate-500" size={20} />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-[#F5F5F5] dark:bg-slate-900 border border-transparent focus:bg-white dark:focus:bg-slate-800 focus:border-[#00796B] rounded-xl outline-none transition-all text-[#212121] dark:text-white placeholder:text-[#BDBDBD] dark:placeholder:text-slate-600"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowPasswordReset(true)}
                  className="text-sm text-[#00796B] hover:text-[#00695C] dark:text-teal-400 dark:hover:text-teal-300 transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#00796B] text-white py-3.5 rounded-xl font-semibold hover:bg-[#00695C] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <><ArrowRight size={20} /> Log In</>}
              </button>
            </form>

            {isDemoActive && (
              <div className="mt-6 p-4 bg-teal-50 dark:bg-teal-900/20 rounded-xl border border-teal-100 dark:border-teal-900/30">
                <p className="text-xs font-bold text-teal-700 dark:text-teal-300 uppercase tracking-wider mb-2">Hackathon Demo Credential</p>
                <button
                  onClick={() => {
                    setEmail('demo@ecotable.dev');
                    setPassword('password123');
                  }}
                  className="text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium"
                >
                  demo@ecotable.dev / password123
                </button>
              </div>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-[#757575] dark:text-slate-400">
                Don't have an account?{' '}
                <button
                  onClick={goToSignup}
                  className="text-[#00796B] hover:text-[#00695C] dark:text-teal-400 dark:hover:text-teal-300 font-semibold transition-colors"
                >
                  Sign Up
                </button>
              </p>
            </div>
          </div>
        </>
      )}
    </AuthLayout>
  );
};

export const Signup: React.FC<AuthProps> = ({ onLogin, onToggle }) => {
  const { signUp, signInWithGoogle, authState } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const goToLogin = () => {
    if (onToggle) onToggle();
    else navigate('/login');
  };
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [showMockAccountPicker, setShowMockAccountPicker] = useState(false);
  const [mockAccounts, setMockAccounts] = useState<any[]>([]);

  useEffect(() => {
    setMockAccounts(AuthService.getMockGoogleAccounts());
  }, [showMockAccountPicker]);

  // Redirect if already authenticated
  useEffect(() => {
    if (authState.isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [authState.isAuthenticated, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, name);
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      // Use Firebase Google Auth
      await signInWithGoogle();
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error("Google Signup Error:", err);
      if (err.message && (err.message.includes("configuration") || err.message.includes("client"))) {
        setShowMockAccountPicker(true);
      } else {
        setError(err.message || "Google Sign Up failed");
      }
      setGoogleLoading(false);
    }
  };

  const selectMockAccount = (mockUser: UserType) => {
    const authState: AuthState = {
      user: mockUser,
      token: 'mock-google-token',
      isAuthenticated: true
    };
    localStorage.setItem('savebite_session', JSON.stringify(authState));
    if (onLogin) onLogin(authState);
    const from = (location.state as any)?.from?.pathname || '/';
    navigate(from, { replace: true });
  };

  return (
    <AuthLayout title="Create Account" subtitle="Join SaveBite and start reducing food waste today.">
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium flex items-center gap-3 animate-in slide-in-from-top-2 border border-red-100 dark:border-red-900/30">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></div>
          {error}
        </div>
      )}

      {showMockAccountPicker ? (
        <div className="space-y-4">
          <div className="text-center mb-4">
            <p className="text-sm text-[#757575] dark:text-slate-400 mb-4">Select a demo account:</p>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {mockAccounts.map((account) => (
              <button
                key={account.id}
                onClick={() => selectMockAccount(account)}
                className="w-full p-4 bg-[#F5F5F5] dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-3 border border-transparent hover:border-[#00796B]/20"
              >
                <img src={account.avatar} alt={account.name} className="w-10 h-10 rounded-full" />
                <div className="flex-1 text-left">
                  <p className="font-semibold text-[#212121] dark:text-white">{account.name}</p>
                  <p className="text-sm text-[#757575] dark:text-slate-400">{account.email}</p>
                </div>
                <ChevronRight className="text-[#9E9E9E] dark:text-slate-500" size={20} />
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowMockAccountPicker(false)}
            className="w-full text-[#757575] dark:text-slate-400 py-2 text-sm hover:text-[#212121] dark:hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading || loading}
              className="w-full bg-white dark:bg-slate-800 text-[#757575] dark:text-slate-300 border border-slate-200 dark:border-slate-700 py-3.5 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-3 relative overflow-hidden active:scale-95"
            >
              {googleLoading ? <Loader2 className="animate-spin text-[#00796B]" /> : <><GoogleIcon /><span>Sign up with Google</span></>}
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
              <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-medium uppercase">Or email</span>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-[#212121] dark:text-slate-200 ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 text-[#9E9E9E] dark:text-slate-500" size={20} />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-[#F5F5F5] dark:bg-slate-900 border border-transparent focus:bg-white dark:focus:bg-slate-800 focus:border-[#00796B] rounded-xl outline-none transition-all text-[#212121] dark:text-white placeholder:text-[#BDBDBD] dark:placeholder:text-slate-600"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-[#212121] dark:text-slate-200 ml-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 text-[#9E9E9E] dark:text-slate-500" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-[#F5F5F5] dark:bg-slate-900 border border-transparent focus:bg-white dark:focus:bg-slate-800 focus:border-[#00796B] rounded-xl outline-none transition-all text-[#212121] dark:text-white placeholder:text-[#BDBDBD] dark:placeholder:text-slate-600"
                    placeholder="name@example.com"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-[#212121] dark:text-slate-200 ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 text-[#9E9E9E] dark:text-slate-500" size={20} />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-[#F5F5F5] dark:bg-slate-900 border border-transparent focus:bg-white dark:focus:bg-slate-800 focus:border-[#00796B] rounded-xl outline-none transition-all text-[#212121] dark:text-white placeholder:text-[#BDBDBD] dark:placeholder:text-slate-600"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-[#212121] dark:text-slate-200 ml-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 text-[#9E9E9E] dark:text-slate-500" size={20} />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-[#F5F5F5] dark:bg-slate-900 border border-transparent focus:bg-white dark:focus:bg-slate-800 focus:border-[#00796B] rounded-xl outline-none transition-all text-[#212121] dark:text-white placeholder:text-[#BDBDBD] dark:placeholder:text-slate-600"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#00796B] text-white py-3.5 rounded-xl font-semibold hover:bg-[#00695C] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <><Sparkles size={20} /> Create Account</>}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-[#757575] dark:text-slate-400">
                Already have an account?{' '}
                <button
                  onClick={goToLogin}
                  className="text-[#00796B] hover:text-[#00695C] dark:text-teal-400 dark:hover:text-teal-300 font-semibold transition-colors"
                >
                  Log In
                </button>
              </p>
            </div>
          </div>
        </>
      )}
    </AuthLayout>
  );
};
