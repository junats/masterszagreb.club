import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Shield, FileText, User as UserIcon, AlertCircle } from 'lucide-react';
import { User } from '../types';
import { authService } from '../services/authService';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
        let result;
        if (isLogin) {
            result = await authService.signIn(email, password);
        } else {
            result = await authService.signUp(email, password, name);
        }

        if (result.error) {
            setError(result.error);
        } else if (result.user) {
            onLogin(result.user);
        }
    } catch (err) {
        setError("An unexpected error occurred.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-background font-sans">
        {/* Background Gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-secondary/10 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="w-full max-w-sm z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="text-center mb-10">
                {/* Logo Composition */}
                <div className="relative w-24 h-24 mx-auto mb-6">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
                    <div className="relative w-full h-full flex items-center justify-center">
                        <Shield className="w-24 h-24 text-[#020617] fill-white" strokeWidth={1.5} />
                        <FileText className="w-9 h-9 text-[#020617] absolute" strokeWidth={2.5} />
                    </div>
                </div>
                
                <h1 className="text-4xl font-heading font-bold text-white mb-2 tracking-tighter">TrueTrack</h1>
                <p className="text-slate-400 font-medium tracking-tight">Protecting fathers. Verifying provision.</p>
                <p className="text-xs text-slate-500 mt-3 max-w-[280px] mx-auto leading-relaxed">
                    Secure your legal standing with AI-powered record keeping and restricted item filtering.
                </p>
            </div>

            <div className="bg-surface/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
                
                {error && (
                    <div className="mb-4 bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-start gap-2">
                        <AlertCircle className="text-red-400 shrink-0 w-4 h-4 mt-0.5" />
                        <p className="text-red-200 text-xs font-medium">{error}</p>
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-4">
                    {!isLogin && (
                        <div>
                             <div className="relative">
                                <UserIcon className="absolute left-3.5 top-3.5 text-slate-500 w-5 h-5" />
                                <input 
                                    type="text" 
                                    placeholder="Full Name" 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all font-medium"
                                    required={!isLogin}
                                />
                            </div>
                        </div>
                    )}
                    <div>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-3.5 text-slate-500 w-5 h-5" />
                            <input 
                                type="email" 
                                placeholder="Email address" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all font-medium"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-3.5 text-slate-500 w-5 h-5" />
                            <input 
                                type="password" 
                                placeholder="Password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all font-medium"
                                required
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-primary hover:bg-sky-400 text-white font-heading font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed tracking-wide mt-2"
                    >
                        {loading ? 'Authenticating...' : (isLogin ? 'Sign In' : 'Create Account')}
                        {!loading && <ArrowRight size={18} />}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button 
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError(null);
                        }}
                        className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
                    >
                        {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                    </button>
                </div>
            </div>

            <p className="text-center text-slate-600 text-[10px] mt-8 font-medium">
                Your data is encrypted and secure. By continuing, you agree to our Terms of Service.
            </p>
        </div>
    </div>
  );
};

export default AuthScreen;