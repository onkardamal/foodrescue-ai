import React, { useState, useEffect } from 'react';
import { AuthService } from '../services/auth';
import { AuthState, User as UserType } from '../types';
import { Loader2, Mail, Lock, User, ArrowRight, CheckCircle, Leaf, Sparkles, X, ChevronRight } from 'lucide-react';

interface AuthProps {
  onLogin: (state: AuthState) => void;
  onToggle: () => void;
}

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';

const performGoogleLogin = async (): Promise<AuthState> => {
    return new Promise((resolve, reject) => {
        if (!window.google) {
            reject(new Error("Google Identity Services script not detected."));
            return;
        }

        const client = window.google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
            callback: async (tokenResponse: any) => {
                if (tokenResponse.error) {
                    reject(new Error("Google Login Failed: " + tokenResponse.error));
                    return;
                }

                if (tokenResponse.access_token) {
                    try {
                        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                            headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                        });
                        
                        if (!userInfoResponse.ok) {
                            throw new Error('Failed to fetch user profile from Google');
                        }

                        const userInfo = await userInfoResponse.json();

                        const authState: AuthState = {
                            user: {
                                id: userInfo.sub, 
                                name: userInfo.name,
                                email: userInfo.email,
                                avatar: userInfo.picture
                            },
                            token: tokenResponse.access_token,
                            isAuthenticated: true
                        };
                        
                        localStorage.setItem('savebite_session', JSON.stringify(authState));
                        resolve(authState);
                    } catch (err) {
                        reject(err);
                    }
                }
            },
        });

        client.requestAccessToken({ prompt: 'select_account' });
    });
};

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 4.63c1.61 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.09 14.97 0 12 0 7.7 0 3.99 2.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const AuthLayout: React.FC<{ children: React.ReactNode, title: string, subtitle: string }> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen w-full flex bg-white dark:bg-slate-950 transition-colors duration-300">
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 lg:px-20 py-10 bg-white dark:bg-slate-950">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-[#00796B] rounded-xl flex items-center justify-center text-white shadow-md shadow-teal-200 dark:shadow-teal-900/30">
              <Leaf size={20} fill="white" />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight text-[#212121] dark:text-white leading-none">SaveBite</h1>
              <p className="text-[9px] text-[#757575] dark:text-slate-500 font-bold uppercase tracking-tighter mt-1">The right choice before waste</p>
            </div>
          </div>
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[#212121] dark:text-white mb-2">{title}</h2>
            <p className="text-[#757575] dark:text-slate-400">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
      <div className="hidden lg:flex w-1/2 relative bg-[#F0FDF4] dark:bg-slate-900 overflow-hidden items-center justify-center">
        <div className="absolute inset-0 z-0" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2574&auto=format&fit=crop")', backgroundSize: 'cover', backgroundPosition: 'center' }}>
           <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
        </div>
        <div className="relative z-10 p-12 text-white max-w-lg">
          <div className="mb-6 w-16 h-1 bg-[#00796B] rounded-full"></div>
          <h2 className="text-5xl font-black leading-tight mb-2">SaveBite</h2>
          <p className="text-xl font-bold text-teal-400 uppercase tracking-widest mb-6">The right choice before waste</p>
          <p className="text-lg text-white/90 leading-relaxed mb-8">Turn your excess food into meals, not waste. Track inventory, donate to NGOs, and save the planet—one bite at a time.</p>
        </div>
      </div>
    </div>
  );
};

export const Login: React.FC<AuthProps> = ({ onLogin, onToggle }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [showMockAccountPicker, setShowMockAccountPicker] = useState(false);
  const [mockAccounts, setMockAccounts] = useState<any[]>([]);
  const [isDemoActive, setIsDemoActive] = useState(true);

  useEffect(() => {
    setMockAccounts(AuthService.getMockGoogleAccounts());
    setIsDemoActive(!AuthService.isDemoDeleted());
  }, [showMockAccountPicker]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const state = await AuthService.login(email, password);
      onLogin(state);
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
        if (GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID') {
            setShowMockAccountPicker(true);
            return;
        }
        const authState = await performGoogleLogin();
        onLogin(authState);
    } catch (err: any) {
        setError(err.message || "Google Login failed");
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
      onLogin(authState);
  };

  return (
    <AuthLayout title="Welcome Back" subtitle="Log in to manage your inventory.">
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium flex items-center gap-3 animate-in slide-in-from-top-2 border border-red-100 dark:border-red-900/30">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></div>
            {error}
          </div>
        )}

        <div className="space-y-4">
            <button 
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading || loading}
                className="w-full bg-white dark:bg-slate-800 text-[#757575] dark:text-slate-300 border border-slate-200 dark:border-slate-700 py-3.5 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-3 relative overflow-hidden active:scale-95"
            >
                {googleLoading && !showMockAccountPicker ? <Loader2 className="animate-spin text-[#00796B]" /> : <><GoogleIcon /><span>Sign in with Google</span></>}
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
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-12 pr-4 py-3.5 bg-[#F5F5F5] dark:bg-slate-900 border border-transparent focus:bg-white dark:focus:bg-slate-800 focus:border-[#00796B] rounded-xl outline-none transition-all text-[#212121] dark:text-white placeholder:text-[#BDBDBD] dark:placeholder:text-slate-600" placeholder="name@example.com" required />
                </div>
            </div>
            <div className="space-y-1.5">
                <label className="text-sm font-bold text-[#212121] dark:text-slate-200 ml-1">Password</label>
                <div className="relative">
                <Lock className="absolute left-4 top-3.5 text-[#9E9E9E] dark:text-slate-500" size={20} />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-12 pr-4 py-3.5 bg-[#F5F5F5] dark:bg-slate-900 border border-transparent focus:bg-white dark:focus:bg-slate-800 focus:border-[#00796B] rounded-xl outline-none transition-all text-[#212121] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600" placeholder="••••••••" required />
                </div>
            </div>
            <button type="submit" disabled={loading || googleLoading} className="w-full bg-[#00796B] text-white py-4 rounded-xl font-bold shadow-lg shadow-teal-200 dark:shadow-teal-900/40 hover:bg-[#00695C] transition-all active:scale-95 flex items-center justify-center gap-2">
                {loading ? <Loader2 className="animate-spin" /> : <>Log In <ArrowRight size={20} /></>}
            </button>
            </form>
        </div>

        <div className="mt-8 text-center"><p className="text-[#757575] dark:text-slate-400">Don't have an account? <button onClick={onToggle} className="text-[#00796B] font-bold hover:underline">Sign Up</button></p></div>
        
        {isDemoActive && (
            <div className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-500">
               <p className="text-xs text-center text-[#9E9E9E] dark:text-slate-500 mb-3 uppercase tracking-wider font-bold flex items-center justify-center gap-2"><Sparkles size={12} fill="currentColor" /> Hackathon Demo Shortcut <Sparkles size={12} fill="currentColor" /></p>
               <button onClick={() => { setEmail('demo@ecotable.dev'); setPassword('password123'); }} className="w-full py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-mono border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"><span>demo@ecotable.dev</span><span className="w-1 h-1 bg-slate-400 rounded-full"></span><span>password123</span></button>
            </div>
        )}

        {/* Mock Account Picker Overlay */}
        {showMockAccountPicker && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="p-8">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-2"><GoogleIcon /><span className="text-sm font-bold text-slate-600 dark:text-slate-300">Sign in with Google</span></div>
                            <button onClick={() => {setShowMockAccountPicker(false); setGoogleLoading(false);}} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Choose an account</h3>
                        <p className="text-sm text-slate-500 mb-6">to continue to <span className="text-[#00796B] font-bold">SaveBite</span></p>
                        
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                            {mockAccounts.length > 0 ? mockAccounts.map(acc => (
                                <button key={acc.id} onClick={() => selectMockAccount(acc)} className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                                    <img src={acc.avatar} className="w-10 h-10 rounded-full bg-slate-100" alt={acc.name} />
                                    <div className="flex-1 text-left"><p className="text-sm font-bold text-slate-900 dark:text-white leading-none">{acc.name}</p><p className="text-xs text-slate-500 mt-1">{acc.email}</p></div>
                                    <ChevronRight className="text-slate-300 group-hover:text-[#00796B]" size={18} />
                                </button>
                            )) : (
                                <div className="text-center py-8">
                                    <p className="text-sm text-slate-500 italic">No linked accounts found.</p>
                                </div>
                            )}
                            <button onClick={() => {setShowMockAccountPicker(false); onToggle(); setGoogleLoading(false);}} className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border border-transparent mt-2 border-t border-slate-100 pt-4">
                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400"><User size={20} /></div>
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Use another account</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </AuthLayout>
  );
};

export const Signup: React.FC<AuthProps> = ({ onLogin, onToggle }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [showMockAccountPicker, setShowMockAccountPicker] = useState(false);
  const [mockAccounts, setMockAccounts] = useState<any[]>([]);

  useEffect(() => {
    setMockAccounts(AuthService.getMockGoogleAccounts());
  }, [showMockAccountPicker]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const state = await AuthService.signup(name, email, password);
      onLogin(state);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    setError('');
    try {
        if (GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID') {
            setShowMockAccountPicker(true);
            return;
        }
        const authState = await performGoogleLogin();
        onLogin(authState);
    } catch (err: any) {
        setError(err.message || "Google Signup failed");
        setGoogleLoading(false);
    }
  };

  return (
    <AuthLayout title="Create Account" subtitle="Join the zero-waste movement today.">
         {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium flex items-center gap-3 animate-in slide-in-from-top-2 border border-red-100 dark:border-red-900/30">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></div>
            {error}
          </div>
        )}

        <div className="space-y-4">
             <button type="button" onClick={handleGoogleSignup} disabled={googleLoading || loading} className="w-full bg-white dark:bg-slate-800 text-[#757575] dark:text-slate-300 border border-slate-200 dark:border-slate-700 py-3.5 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-3 relative overflow-hidden active:scale-95">
                {googleLoading && !showMockAccountPicker ? <Loader2 className="animate-spin text-[#00796B]" /> : <><GoogleIcon /><span>Sign up with Google</span></>}
            </button>

            <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-medium uppercase">Or use email</span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
                <label className="text-sm font-bold text-[#212121] dark:text-slate-200 ml-1">Full Name</label>
                <div className="relative">
                <User className="absolute left-4 top-3.5 text-[#9E9E9E] dark:text-slate-500" size={20} />
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full pl-12 pr-4 py-3.5 bg-[#F5F5F5] dark:bg-slate-900 border border-transparent focus:bg-white dark:focus:bg-slate-800 focus:border-[#00796B] rounded-xl outline-none transition-all text-[#212121] dark:text-white placeholder:text-[#BDBDBD] dark:placeholder:text-slate-600" placeholder="Jane Doe" required />
                </div>
            </div>
            <div className="space-y-1.5">
                <label className="text-sm font-bold text-[#212121] dark:text-slate-200 ml-1">Email</label>
                <div className="relative">
                <Mail className="absolute left-4 top-3.5 text-[#9E9E9E] dark:text-slate-500" size={20} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-12 pr-4 py-3.5 bg-[#F5F5F5] dark:bg-slate-900 border border-transparent focus:bg-white dark:focus:bg-slate-800 focus:border-[#00796B] rounded-xl outline-none transition-all text-[#212121] dark:text-white placeholder:text-[#BDBDBD] dark:placeholder:text-slate-600" placeholder="chef@example.com" required />
                </div>
            </div>
            <div className="space-y-1.5">
                <label className="text-sm font-bold text-[#212121] dark:text-slate-200 ml-1">Password</label>
                <div className="relative">
                <Lock className="absolute left-4 top-3.5 text-[#9E9E9E] dark:text-slate-500" size={20} />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-12 pr-4 py-3.5 bg-[#F5F5F5] dark:bg-slate-900 border border-transparent focus:bg-white dark:focus:bg-slate-800 focus:border-[#00796B] rounded-xl outline-none transition-all text-[#212121] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600" placeholder="••••••••" required />
                </div>
            </div>
            <button type="submit" disabled={loading || googleLoading} className="w-full bg-[#00796B] text-white py-4 rounded-xl font-bold shadow-lg shadow-teal-200 dark:shadow-teal-900/40 hover:bg-[#00695C] transition-colors flex items-center justify-center gap-2 active:scale-95">
                {loading ? <Loader2 className="animate-spin" /> : <>Create Account <CheckCircle size={20} /></>}
            </button>
            </form>
        </div>
        <div className="mt-8 text-center"><p className="text-[#757575] dark:text-slate-400">Already have an account? <button onClick={onToggle} className="text-[#00796B] font-bold hover:underline">Log In</button></p></div>
        
        {/* Mock Account Picker Overlay for Signup */}
        {showMockAccountPicker && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="p-8">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-2"><GoogleIcon /><span className="text-sm font-bold text-slate-600 dark:text-slate-300">Sign up with Google</span></div>
                            <button onClick={() => {setShowMockAccountPicker(false); setGoogleLoading(false);}} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Choose an account</h3>
                        <p className="text-sm text-slate-500 mb-6">to create a <span className="text-[#00796B] font-bold">SaveBite</span> account</p>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                            {mockAccounts.length > 0 ? mockAccounts.map(acc => (
                                <button key={acc.id} onClick={() => {const authState: AuthState = {user: acc, token: 'mock-google-token', isAuthenticated: true}; localStorage.setItem('savebite_session', JSON.stringify(authState)); onLogin(authState);}} className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                                    <img src={acc.avatar} className="w-10 h-10 rounded-full bg-slate-100" alt={acc.name} />
                                    <div className="flex-1 text-left"><p className="text-sm font-bold text-slate-900 dark:text-white leading-none">{acc.name}</p><p className="text-xs text-slate-500 mt-1">{acc.email}</p></div>
                                    <ChevronRight className="text-slate-300 group-hover:text-[#00796B]" size={18} />
                                </button>
                            )) : (
                                <div className="text-center py-8">
                                    <p className="text-sm text-slate-500 italic">No linked accounts found.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )}
    </AuthLayout>
  );
};