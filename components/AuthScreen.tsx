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

    const handleSocialLogin = async (provider: 'google' | 'apple') => {
        setLoading(true);
        setError(null);
        try {
            let result;
            if (provider === 'google') {
                result = await authService.signInWithGoogle();
            } else {
                result = await authService.signInWithApple();
            }

            if (result.error) {
                setError(result.error);
                setLoading(false);
            }
            // If successful, redirect happens, so no need to stop loading
        } catch (err) {
            setError("An unexpected error occurred.");
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

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-[#0f172a] px-2 text-slate-500 font-medium">Or continue with</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => handleSocialLogin('google')}
                            disabled={loading}
                            className="flex items-center justify-center gap-2 bg-slate-950/50 hover:bg-slate-900 border border-white/10 hover:border-white/20 rounded-xl py-2.5 transition-all disabled:opacity-50"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            <span className="text-white font-medium text-sm">Google</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSocialLogin('apple')}
                            disabled={loading}
                            className="flex items-center justify-center gap-2 bg-slate-950/50 hover:bg-slate-900 border border-white/10 hover:border-white/20 rounded-xl py-2.5 transition-all disabled:opacity-50"
                        >
                            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24.02-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.45-1.02 3.67-1.06 1.6-.05 2.8.6 3.46 1.54-2.9 1.49-2.26 5.09.28 6.32-.52 1.63-1.29 3.17-2.49 5.43zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                            </svg>
                            <span className="text-white font-medium text-sm">Apple</span>
                        </button>
                    </div>

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