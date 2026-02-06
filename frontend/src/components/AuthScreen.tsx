import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, User as UserIcon, AlertCircle, Eye, EyeOff, ScanFace, Check, Trash2, Apple } from 'lucide-react';
import { biometricService } from '../services/biometricService';
import { HapticsService } from '../services/haptics';
import { User } from '@common/types';
import { authService } from '../services/authService';
import { useUser } from '../contexts/UserContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Preferences } from '@capacitor/preferences';

const AuthScreen: React.FC = () => {
    const { t } = useLanguage();
    const { signIn } = useUser();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isBiometricError, setIsBiometricError] = useState(false);
    const [biometricAvailable, setBiometricAvailable] = useState(false);
    const [biometricEnabled, setBiometricEnabled] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);

    // Initial Biometric Check
    React.useEffect(() => {
        let mounted = true;
        const checkBiometric = async () => {
            try {
                // Parallelize checks for maximum speed
                const [
                    { value: logoutAtStr },
                    { available },
                    enabled
                ] = await Promise.all([
                    Preferences.get({ key: 'manual_logout_at' }),
                    biometricService.isAvailable(),
                    biometricService.isEnabled()
                ]);

                if (!mounted) return;

                setBiometricAvailable(available);
                setBiometricEnabled(enabled);

                const logoutAt = logoutAtStr ? parseInt(logoutAtStr) : 0;
                const now = Date.now();
                const recentlyLoggedOut = logoutAt > 0 && (now - logoutAt < 5 * 60 * 1000);

                // Auto-trigger biometric login if conditions are met
                if (available && enabled && isLogin && !loading && !recentlyLoggedOut) {
                    handleBiometricLogin();
                }
            } catch (err) {
                console.error("AuthScreen: Biometric Check Failed:", err);
            }
        };
        const loadStoredEmail = async () => {
            const { value } = await Preferences.get({ key: 'remembered_email' });
            if (value && mounted) {
                setEmail(value);
            }
        };

        checkBiometric();
        loadStoredEmail();
        return () => { mounted = false; };
    }, [isLogin]);

    const handleBiometricLogin = async () => {
        console.log("AuthScreen: handleBiometricLogin triggered.");
        setLoading(true);
        setError(null);
        setIsBiometricError(false);
        try {
            // NEW: Explicitly verify identity first to force the OS prompt
            console.log("AuthScreen: Verifying identity...");
            const verified = await biometricService.verifyIdentity();
            console.log("AuthScreen: Identity verification result:", verified);
            if (!verified) {
                console.log("AuthScreen: Identity verification failed or cancelled.");
                setLoading(false);
                return;
            }

            // Once user explicitly triggers biometric, we can clear the manual logout flag
            await Preferences.remove({ key: 'manual_logout_at' });

            const credentials = await biometricService.getCredentials();
            if (credentials) {
                const storedEmail = credentials.email.trim();
                const storedPassword = credentials.password;

                // PROTECTION: If email is already typed and doesn't match, warn user
                const currentEmail = email.trim();
                if (currentEmail && currentEmail.toLowerCase() !== storedEmail.toLowerCase()) {
                    console.warn(`AuthScreen: Biometric email mismatch. Stored: ${storedEmail}, Entered: ${currentEmail}`);
                    setError(t('auth.errors.faceIdMismatch', { email: storedEmail }));
                    setLoading(false);
                    return;
                }

                console.log(`AuthScreen: Biometric attempt for ${storedEmail}... (len: ${storedPassword.length})`);
                const { user: authUser, error: authError } = await authService.signIn(storedEmail, storedPassword);

                if (authUser && authUser.id) {
                    console.log("AuthScreen: BIOMETRIC LOGIN SUCCESS. Updating UserContext...");
                    HapticsService.notificationSuccess();
                    signIn(authUser);
                    // SUCCESS PATH: We don't call setLoading(false) here to keep the spinner/overlay 
                    // visible while App.tsx unmounts this screen.
                    return;
                } else {
                    console.error("AuthScreen: Biometric signIn rejected:", authError);
                    setError(authError || t('auth.errors.biometricFail'));
                    if (authError?.toLowerCase().includes('incorrect password')) {
                        setIsBiometricError(true);
                    }
                }
            } else {
                console.log("AuthScreen: No biometric credentials found (empty keychain).");
                setError(t('auth.errors.faceIdNotSet'));
            }
        } catch (err: any) {
            console.error("AuthScreen: Biometric Exception:", err);
            const errMsg = err?.message || String(err);
            if (errMsg.toLowerCase().includes('cancel') || errMsg.toLowerCase().includes('user canceled')) {
                console.log("AuthScreen: User cancelled biometric prompt.");
            } else if (errMsg.toLowerCase().includes('not set up') || errMsg.toLowerCase().includes('no credentials')) {
                setError(t('auth.errors.faceIdNotSet'));
            } else {
                setError(t('auth.errors.biometricFail'));
            }
        } finally {
            // Only stop loading if we didn't succeed (success path has early return)
            setLoading(false);
        }
    };

    const handleEmailLogin = async () => {
        const trimmedEmail = email.trim().toLowerCase();
        // Standard practice: Passwords should NOT be trimmed to allow for intentional whitespace
        const rawPassword = password;

        const mode = await authService.getServiceMode();
        console.log(`AuthScreen: handleEmailLogin [${mode.toUpperCase()}] triggered for ${trimmedEmail}. Password length: ${rawPassword.length}`);

        const { user: authUser, error: authError } = await authService.signIn(trimmedEmail, rawPassword);

        if (authUser) {
            console.log("AuthScreen: Manual login successful.");
            await Preferences.remove({ key: 'manual_logout_at' });

            // Sync "Remember Me"
            if (rememberMe) {
                await Preferences.set({ key: 'remembered_email', value: trimmedEmail });
            } else {
                await Preferences.remove({ key: 'remembered_email' });
            }

            // Sync credentials for Face ID
            const { available } = await biometricService.isAvailable();
            if (available) {
                try {
                    console.log(`AuthScreen: Syncing fresh biometric credentials for ${trimmedEmail} (len: ${rawPassword.length})...`);
                    // IMPORTANT: Explicitly await this to ensure it's saved before session starts
                    await biometricService.saveCredentials(trimmedEmail, rawPassword);
                    await biometricService.setEnabled(true);
                    console.log("AuthScreen: Biometric sync successful.");
                } catch (bErr) {
                    console.warn("AuthScreen: Biometric sync failed", bErr);
                }
            }

            HapticsService.impactMedium();
            signIn(authUser);
        } else {
            console.error("AuthScreen: Manual login failed:", authError);
            const lowError = authError?.toLowerCase() || "";
            if (lowError.includes('invalid login credentials')) {
                setError(t('auth.errors.invalidCredentials'));
            } else {
                setError(authError || t('auth.errors.default'));
            }
        }
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                HapticsService.impactLight();
                await handleEmailLogin();
            } else {
                HapticsService.impactLight();
                const trimmedEmail = email.trim().toLowerCase();
                const rawPassword = password;

                console.log(`AuthScreen: handleAuth SignUp triggered. Email: ${trimmedEmail}, PassLen: ${rawPassword.length}`);
                const result = await authService.signUp(trimmedEmail, rawPassword, name);
                if (result.error) {
                    const lowError = result.error.toLowerCase();
                    if (lowError.includes('user already exists') || lowError.includes('already registered')) {
                        console.log("AuthScreen: User exists, auto-switching to login mode.");
                        setIsLogin(true);
                        setError(t('auth.errors.accountExists'));
                        HapticsService.notificationWarning();
                        setLoading(false);
                        return;
                    }
                    setError(result.error);
                    if (lowError.includes('success') || lowError.includes('check your email')) {
                        setLoading(false);
                        return;
                    }
                } else if (result.user) {
                    // Try to setup biometric automatically on sign-up
                    const { available } = await biometricService.isAvailable();
                    if (available) {
                        try {
                            console.log(`AuthScreen: Auto-syncing biometric credentials on signup for ${trimmedEmail}...`);
                            await biometricService.saveCredentials(trimmedEmail, rawPassword);
                            await biometricService.setEnabled(true);
                        } catch (bErr) {
                            console.warn("Auto biometric setup failed on signup", bErr);
                        }
                    }
                    signIn(result.user);
                }
            }
        } catch (err: any) {
            console.error("Auth Error:", err);
            setError(t('auth.errors.default'));
        } finally {
            setLoading(false);
        }
    };

    // ... rest of component until return ...

    const handleSocialLogin = async (provider: 'google' | 'apple') => {
        setLoading(true);
        setError(null);
        try {
            let result;
            if (provider === 'google') {
                HapticsService.impactLight();
                result = await authService.signInWithGoogle();
            } else {
                HapticsService.impactLight();
                result = await authService.signInWithApple();
            }

            if (result.error) {
                setError(result.error);
                setLoading(false);
            } else if (result.user) {
                // If successful, redirect happens, so no need to stop loading usually,
                // but if we get a user back:
                signIn(result.user);
            }
        } catch (err) {
            setError(t('auth.errors.default'));
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center p-6 relative bg-background font-sans overflow-x-hidden overflow-y-auto custom-scrollbar">
            {/* Background Gradients */}
            <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[80px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-secondary/10 rounded-full blur-[80px] pointer-events-none"></div>

            <div className="w-full max-w-sm z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="text-center mb-10">
                    {/* Logo Composition */}
                    <div className="flex justify-center mb-6">
                        <div className="w-24 h-24 bg-gradient-to-br from-primary to-blue-600 rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(56,189,248,0.3)] ring-1 ring-white/20">
                            <img src="/logo.png" alt="TrueTrack Logo" className="w-16 h-16 drop-shadow-md" />
                        </div>
                    </div>

                    <h1 className="text-4xl font-heading font-bold text-white mb-2 tracking-tighter">
                        {isLogin ? t('auth.welcomeBack') : t('auth.letsGetStarted')}
                    </h1>
                    <p className="text-emerald-400 font-medium tracking-wide uppercase text-xs mb-4">{t('auth.tagline')}</p>
                    <p className="text-slate-400 font-medium tracking-tight">
                        {isLogin ? t('auth.loginDesc') : t('auth.signupDesc')}
                    </p>
                    <p className="text-xs text-slate-500 mt-3 max-w-[280px] mx-auto leading-relaxed">
                        {t('auth.legalDisclaimer')}
                    </p>
                </div>

                <div className="bg-card border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
                    {/* Manual Check Button for Stuck Users */}


                    <form onSubmit={handleAuth} className="space-y-4">
                        {!isLogin && (
                            <div>
                                <div className="relative">
                                    <UserIcon className="absolute left-3.5 top-3.5 text-slate-500 w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder={t('auth.labels.fullName')}
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all font-medium"
                                        required={!isLogin}
                                        autoComplete="name"

                                    />
                                </div>
                            </div>
                        )}
                        <div>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-3.5 text-slate-500 w-5 h-5" />
                                <input
                                    type="email"
                                    placeholder={t('auth.labels.email')}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all font-medium"
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-3.5 text-slate-500 w-5 h-5" />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder={t('auth.labels.password')}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3.5 pl-11 pr-12 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all font-medium"
                                required
                                onFocus={async () => {
                                    const { value: logoutAtStr } = await Preferences.get({ key: 'manual_logout_at' });
                                    const logoutAt = logoutAtStr ? parseInt(logoutAtStr) : 0;
                                    const recentlyLoggedOut = logoutAt > 0 && (Date.now() - logoutAt < 5 * 60 * 1000);

                                    if (biometricAvailable && biometricEnabled && isLogin && !password && !recentlyLoggedOut) {
                                        handleBiometricLogin();
                                    }
                                }}
                                autoComplete={isLogin ? "current-password" : "new-password"}

                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3.5 top-3.5 text-slate-500 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        {isLogin && (
                            <div className="flex items-center justify-between px-1 mt-2 mb-2">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div
                                        onClick={() => {
                                            HapticsService.selection();
                                            setRememberMe(!rememberMe);
                                        }}
                                        className={`w-4 h-4 rounded border transition-all flex items-center justify-center ${rememberMe ? 'bg-primary border-primary' : 'bg-slate-950/50 border-white/10'}`}
                                    >
                                        {rememberMe && <Check size={10} className="text-white" />}
                                    </div>
                                    <span className="text-[11px] text-slate-500 group-hover:text-slate-400 transition-colors font-medium">{t('auth.labels.rememberMe')}</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setError(t('auth.errors.passwordReset'))}
                                    className="text-[11px] text-slate-500 hover:text-primary transition-colors font-medium"
                                >
                                    {t('auth.labels.forgotPassword')}
                                </button>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary/90 text-slate-900 font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group relative overflow-hidden"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                {loading ? t('auth.labels.connecting') : (isLogin ? t('auth.labels.signIn') : t('auth.labels.createAccount'))}
                                {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                            </span>
                        </button>

                        {biometricAvailable && biometricEnabled && isLogin && (
                            <div className="mt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        HapticsService.impactLight();
                                        handleBiometricLogin();
                                    }}
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-3 bg-indigo-600/25 hover:bg-indigo-600/35 border border-indigo-500/40 rounded-xl py-3.5 transition-all disabled:opacity-50 group shadow-lg shadow-indigo-900/20"
                                >
                                    <ScanFace className="w-6 h-6 text-indigo-300 group-hover:scale-110 transition-transform" />
                                    <span className="text-indigo-200 font-bold text-sm">{t('auth.labels.faceId')}</span>
                                </button>
                            </div>
                        )}
                    </form>

                    {error && (
                        <div className={`mt-4 p-3 rounded-xl flex flex-col gap-2 ${error.toLowerCase().includes('success') || error.toLowerCase().includes('check your email') ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'}`}>
                            <div className="flex items-start gap-2">
                                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                <p className="text-xs font-medium leading-relaxed flex-1">{error}</p>
                            </div>

                            {/* Smart Transition: If user already exists on signup, offer to switch to login */}
                            {!isLogin && (error.toLowerCase().includes('user already exists') || error.toLowerCase().includes('already registered')) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsLogin(true);
                                        setError(null);
                                        HapticsService.impactLight();
                                    }}
                                    className="mt-1 text-xs font-bold text-primary hover:text-sky-400 text-left transition-colors flex items-center gap-1 self-start ml-6"
                                >
                                    {t('auth.prompts.signInWithAccount')} <ArrowRight size={12} />
                                </button>
                            )}

                            {/* Reset Face ID Option: If biometric auth failed with wrong password */}
                            {isLogin && isBiometricError && (
                                <button
                                    type="button"
                                    onClick={async () => {
                                        HapticsService.impactMedium();
                                        await biometricService.deleteCredentials();
                                        setBiometricEnabled(false); // UI State Sync
                                        setError(t('auth.errors.faceIdReset'));
                                        setIsBiometricError(false);
                                    }}
                                    className="mt-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 text-left transition-colors flex items-center gap-1.5 self-start ml-6"
                                >
                                    <Trash2 size={12} /> {t('auth.labels.resetFaceId')}
                                </button>
                            )}
                        </div>
                    )}

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-[#0f172a] px-2 text-slate-500 font-medium">{t('auth.labels.orContinue')}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => handleSocialLogin('google')}
                            disabled={loading}
                            className="flex items-center justify-center gap-2.5 bg-white text-slate-900 rounded-xl py-3 transition-all hover:bg-slate-100 active:scale-[0.98] disabled:opacity-50 shadow-sm"
                        >
                            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            <span className="font-bold text-sm tracking-tight">{t('auth.social.google')}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSocialLogin('apple')}
                            disabled={loading}
                            className="flex items-center justify-center gap-2.5 bg-white text-slate-900 rounded-xl py-3 transition-all hover:bg-slate-100 active:scale-[0.98] disabled:opacity-50 shadow-sm"
                        >
                            <svg className="w-5 h-5 shrink-0 text-black fill-current" viewBox="0 0 24 24">
                                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24.02-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.45-1.02 3.67-1.06 1.6-.05 2.8.6 3.46 1.54-2.9 1.49-2.26 5.09.28 6.32-.52 1.63-1.29 3.17-2.49 5.43zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                            </svg>
                            <span className="font-bold text-sm tracking-tight">{t('auth.social.apple')}</span>
                        </button>
                    </div>


                    <div className="mt-8 text-center px-4">
                        <p className="text-slate-500 text-sm mb-2">
                            {isLogin ? t('auth.prompts.newToTrueTrack') : t('auth.prompts.alreadyHaveAccount')}
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError(null);
                                setIsBiometricError(false);
                                HapticsService.impactLight();
                            }}
                            className="text-white font-bold text-lg hover:text-primary transition-all active:scale-95 underline underline-offset-8 decoration-primary/30 hover:decoration-primary"
                        >
                            {isLogin ? t('auth.prompts.createAccountLink') : t('auth.prompts.signInLink')}
                        </button>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-4 mt-8">
                    <p className="text-slate-600 text-[10px] font-medium text-center">
                        {t('auth.footer.encrypted')}
                    </p>

                    <button
                        type="button"
                        onClick={async () => {
                            if (window.confirm(t('auth.troubleshoot.confirmReset'))) {
                                await Preferences.clear();
                                await biometricService.deleteCredentials();
                                window.location.reload();
                            }
                        }}
                        className="text-slate-700 text-[9px] uppercase tracking-widest hover:text-slate-500 transition-colors"
                    >
                        {t('auth.troubleshoot.resetData')}
                    </button>
                </div>
            </div>
        </div >
    );
};

export default AuthScreen;