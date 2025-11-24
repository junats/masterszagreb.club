import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Shield, FileText } from 'lucide-react';
import { User, SubscriptionTier } from '../types';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // SIMULATION: Simulate API call delay
    setTimeout(() => {
        setLoading(false);
        // Mock User Data
        const mockUser: User = {
            id: 'u_12345',
            name: email.split('@')[0] || 'Single Father',
            email: email,
            tier: SubscriptionTier.FREE, // Default to free
            avatarUrl: undefined
        };
        onLogin(mockUser);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-background">
        {/* Background Gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-secondary/10 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="w-full max-w-sm z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="text-center mb-10">
                {/* Logo Composition */}
                <div className="relative w-20 h-20 mx-auto mb-4">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl"></div>
                    <div className="relative w-full h-full flex items-center justify-center">
                        <Shield className="w-20 h-20 text-[#0f172a] fill-white" strokeWidth={1.5} />
                        <FileText className="w-8 h-8 text-[#0f172a] absolute" strokeWidth={2.5} />
                    </div>
                </div>
                
                <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">TrueTrack</h1>
                <p className="text-slate-400 font-medium">Protecting fathers. Verifying provision.</p>
                <p className="text-xs text-slate-500 mt-2 max-w-[280px] mx-auto">
                    Secure your legal standing with AI-powered record keeping and restricted item filtering.
                </p>
            </div>

            <div className="bg-surface/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 shadow-2xl">
                {/* Social Login Buttons */}
                <div className="space-y-3 mb-6">
                    <button 
                        onClick={() => handleAuth({ preventDefault: () => {} } as any)}
                        className="w-full bg-white hover:bg-slate-100 text-slate-900 font-medium py-3 rounded-xl flex items-center justify-center gap-3 transition-colors relative overflow-hidden group"
                    >
                        {/* Google SVG Icon */}
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Continue with Google
                    </button>
                    <button 
                         onClick={() => handleAuth({ preventDefault: () => {} } as any)}
                        className="w-full bg-[#000000] hover:bg-[#1a1a1a] text-white font-medium py-3 rounded-xl flex items-center justify-center gap-3 transition-colors border border-slate-700"
                    >
                         {/* Apple SVG Icon */}
                         <svg className="w-5 h-5 fill-white" viewBox="0 0 384 512">
                            <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 52.3-11.4 69.5-34.3z"/>
                        </svg>
                        Continue with Apple
                    </button>
                </div>

                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-700"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-[#1e293b] px-2 text-slate-500">Or continue with email</span>
                    </div>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 text-slate-500 w-5 h-5" />
                            <input 
                                type="email" 
                                placeholder="Email address" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary transition-all"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 text-slate-500 w-5 h-5" />
                            <input 
                                type="password" 
                                placeholder="Password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary transition-all"
                                required
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-primary hover:bg-sky-400 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Authenticating...' : (isLogin ? 'Sign In' : 'Create Account')}
                        {!loading && <ArrowRight size={18} />}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button 
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-slate-400 hover:text-white text-sm transition-colors"
                    >
                        {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                    </button>
                </div>
            </div>

            <p className="text-center text-slate-600 text-xs mt-6">
                Your data is encrypted and secure. By continuing, you agree to our Terms of Service.
            </p>
        </div>
    </div>
  );
};

export default AuthScreen;