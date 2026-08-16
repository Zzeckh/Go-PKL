import React, { useState } from 'react';
import {
  Eye, EyeOff, ArrowRight, Sparkles, MapPin, CheckCircle2,
  Users, LineChart, Loader2, Lock, Mail, WifiOff, AlertCircle, X
} from 'lucide-react';
import { AuthMode } from '../types';

interface AuthScreenProps {
  authMode: AuthMode;
  setAuthMode: (mode: AuthMode) => void;
  onSubmit: (payload: { name: string; email: string; password: string; institution?: string }) => void | Promise<void>;
}

// ─── Error Classification Helper ───
type ErrorType = 'wrong-password' | 'wrong-email' | 'technical';

interface AuthError {
  type: ErrorType;
  title: string;
  message: string;
  icon: React.ElementType;
}

function classifyAuthError(error: any, isRegister: boolean): AuthError {
  const msg = error?.message?.toLowerCase() || '';
  const status = error?.status;

  // Technical / Network error
  if (status >= 500 || !status || msg.includes('network') || msg.includes('fetch') || msg.includes('connect')) {
    return {
      type: 'technical',
      title: 'Kesalahan Teknis',
      message: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda atau coba lagi nanti.',
      icon: WifiOff,
    };
  }

  // Email already registered (register flow)
  if (status === 409 || msg.includes('sudah terdaftar') || msg.includes('already')) {
    return {
      type: 'wrong-email',
      title: 'Email Sudah Terdaftar',
      message: 'Email ini sudah memiliki akun. Silakan login atau gunakan email lain.',
      icon: Mail,
    };
  }

  // Wrong credentials
  if (status === 401 || msg.includes('salah') || msg.includes('invalid')) {
    return {
      type: 'wrong-password',
      title: 'Login Gagal',
      message: 'Email atau password yang Anda masukkan salah. Periksa kembali kredensial Anda.',
      icon: Lock,
    };
  }

  // Validation error — email related
  if (status === 400 && msg.includes('email')) {
    return {
      type: 'wrong-email',
      title: 'Format Email Salah',
      message: 'Email yang Anda masukkan tidak valid. Contoh: user@domain.com',
      icon: Mail,
    };
  }

  // Generic validation error
  if (status === 400) {
    return {
      type: 'technical',
      title: 'Data Tidak Lengkap',
      message: error?.message || 'Pastikan semua field terisi dengan benar.',
      icon: AlertCircle,
    };
  }

  // Fallback
  return {
    type: 'technical',
    title: 'Terjadi Kesalahan',
    message: error?.message || 'Silakan coba lagi dalam beberapa saat.',
    icon: AlertCircle,
  };
}

// ─── Error Banner Component ───
const ErrorBanner = ({
  error,
  onClose,
}: {
  error: AuthError;
  onClose: () => void;
}) => {
  const Icon = error.icon;
  return (
    <div className="animate-in fade-in slide-in-from-top-2 duration-300 bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
      <div className="w-9 h-9 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
        <Icon className="w-4.5 h-4.5 text-rose-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-rose-900 leading-tight">{error.title}</p>
        <p className="text-xs text-rose-700 mt-1 leading-relaxed">{error.message}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="w-7 h-7 rounded-lg hover:bg-rose-100 flex items-center justify-center text-rose-600 hover:text-rose-800 transition-colors shrink-0"
        aria-label="Tutup"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export const AuthScreen: React.FC<AuthScreenProps> = ({
  authMode,
  setAuthMode,
  onSubmit,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [institution, setInstitution] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<AuthError | null>(null);

  const isLogin = authMode === 'login';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);

    try {
      await onSubmit({
        name,
        email,
        password,
        institution: !isLogin ? institution : undefined,
      });
    } catch (error: any) {
      setAuthError(classifyAuthError(error, !isLogin));
    } finally {
      setIsLoading(false);
    }
  };

  // Clear error saat user mulai typing
  const clearError = () => setAuthError(null);

  const handleSwitch = () => {
    setAuthError(null);
    setAuthMode(isLogin ? 'register' : 'login');
  };

  const formProps = {
    mode: authMode,
    showPassword,
    setShowPassword,
    name, setName,
    email, setEmail,
    password, setPassword,
    institution, setInstitution,
    onSubmit: handleSubmit,
    onSwitch: handleSwitch,
    isLoading,
    authError,
    clearError,
  };

  return (
    <div className="flex-1 w-full h-full relative overflow-hidden rounded-[24px] bg-white/40 backdrop-blur-xl border border-white/60 shadow-sm">

      {/* MOBILE VIEW */}
      <div className="lg:hidden w-full h-full relative overflow-hidden">
        <div
          className="absolute inset-0 overflow-y-auto"
          style={{
            opacity: isLogin ? 1 : 0,
            transform: isLogin ? 'translateX(0)' : 'translateX(-28px)',
            transition: isLogin
              ? 'opacity 380ms ease 120ms, transform 440ms cubic-bezier(0.34,1.1,0.64,1) 120ms'
              : 'opacity 220ms ease, transform 220ms ease',
            pointerEvents: isLogin ? 'auto' : 'none',
          }}
        >
          <div className="min-h-full flex flex-col justify-center px-5 py-8">
            <MobileForm {...formProps} mode="login" />
          </div>
        </div>
        <div
          className="absolute inset-0 overflow-y-auto"
          style={{
            opacity: !isLogin ? 1 : 0,
            transform: !isLogin ? 'translateX(0)' : 'translateX(28px)',
            transition: !isLogin
              ? 'opacity 380ms ease 120ms, transform 440ms cubic-bezier(0.34,1.1,0.64,1) 120ms'
              : 'opacity 220ms ease, transform 220ms ease',
            pointerEvents: !isLogin ? 'auto' : 'none',
          }}
        >
          <div className="min-h-full flex flex-col justify-center px-5 py-8">
            <MobileForm {...formProps} mode="register" />
          </div>
        </div>
      </div>

      {/* DESKTOP VIEW */}
      <div className="hidden lg:block w-full h-full relative overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full w-1/2 p-8 xl:p-12 flex flex-col justify-center"
          style={{
            opacity: isLogin ? 1 : 0,
            transform: isLogin ? 'scale(1) translateY(0px)' : 'scale(0.97) translateY(10px)',
            transition: isLogin
              ? 'opacity 420ms ease 320ms, transform 500ms cubic-bezier(0.34,1.2,0.64,1) 320ms'
              : 'opacity 200ms ease 0ms, transform 200ms ease 0ms',
            pointerEvents: isLogin ? 'auto' : 'none',
            zIndex: isLogin ? 20 : 10,
          }}
        >
          <div className="max-w-md w-full mx-auto">
            <AuthForm {...formProps} mode="login" />
          </div>
        </div>

        <div
          className="absolute top-0 right-0 h-full w-1/2 p-8 xl:p-12 flex flex-col justify-center"
          style={{
            opacity: !isLogin ? 1 : 0,
            transform: !isLogin ? 'scale(1) translateY(0px)' : 'scale(0.97) translateY(10px)',
            transition: !isLogin
              ? 'opacity 420ms ease 320ms, transform 500ms cubic-bezier(0.34,1.2,0.64,1) 320ms'
              : 'opacity 200ms ease 0ms, transform 200ms ease 0ms',
            pointerEvents: !isLogin ? 'auto' : 'none',
            zIndex: !isLogin ? 20 : 10,
          }}
        >
          <div className="max-w-md w-full mx-auto">
            <AuthForm {...formProps} mode="register" />
          </div>
        </div>

        {/* SLIDING CARD — solid steel */}
        <div
          className="absolute top-0 left-0 w-1/2 h-full z-30"
          style={{
            transform: isLogin ? 'translateX(100%)' : 'translateX(0%)',
            transition: 'transform 680ms cubic-bezier(0.65,0,0.35,1)',
            willChange: 'transform',
          }}
        >
          <div className="w-full h-full p-4">
            <div className="w-full h-full bg-steel/95 backdrop-blur-md rounded-[24px] overflow-hidden border border-white/20 shadow-2xl shadow-steel/30 relative">
              <div
                className="absolute inset-0 p-10 flex flex-col justify-between"
                style={{
                  opacity: isLogin ? 1 : 0,
                  transform: isLogin ? 'translateX(0px)' : 'translateX(-24px)',
                  transition: isLogin
                    ? 'opacity 380ms ease 380ms, transform 460ms cubic-bezier(0.34,1.1,0.64,1) 360ms'
                    : 'opacity 180ms ease 0ms, transform 180ms ease 0ms',
                  pointerEvents: isLogin ? 'auto' : 'none',
                }}
              >
                <DecorativeGraphic mode="login" />
              </div>

              <div
                className="absolute inset-0 p-10 flex flex-col justify-between"
                style={{
                  opacity: !isLogin ? 1 : 0,
                  transform: !isLogin ? 'translateX(0px)' : 'translateX(24px)',
                  transition: !isLogin
                    ? 'opacity 380ms ease 380ms, transform 460ms cubic-bezier(0.34,1.1,0.64,1) 360ms'
                    : 'opacity 180ms ease 0ms, transform 180ms ease 0ms',
                  pointerEvents: !isLogin ? 'auto' : 'none',
                }}
              >
                <DecorativeGraphic mode="register" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════
// DESKTOP FORM COMPONENT
// ════════════════════════════════════
const AuthForm = ({
  mode, showPassword, setShowPassword,
  name, setName, email, setEmail, password, setPassword,
  institution, setInstitution,
  onSubmit, onSwitch, isLoading,
  authError, clearError,
}: any) => {
  const isLogin = mode === 'login';

  return (
    <div className="space-y-5">
      <div>
        <div className="w-12 h-12 bg-navy text-white rounded-2xl flex items-center justify-center font-bold text-xl mb-6 shadow-lg border border-steel/20">
          Go
        </div>
        <h2 className="text-3xl font-extrabold text-navy tracking-tight">
          {isLogin ? 'Welcome back' : 'Create an account'}
        </h2>
        <p className="text-sm text-navy/60 mt-2 font-medium">
          {isLogin
            ? 'Enter your credentials to access your dashboard'
            : 'Register using your official school/company email'}
        </p>
      </div>

      {/* ERROR BANNER */}
      {authError && (
        <ErrorBanner error={authError} onClose={clearError} />
      )}

      <form onSubmit={onSubmit} className="space-y-4 pt-2">
        {!isLogin && (
          <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-bottom-2">
            <div>
              <label className="block text-xs uppercase tracking-wider font-bold text-navy/60 mb-1.5">
                Full Name
              </label>
              <input
                value={name}
                onChange={(e) => { setName(e.target.value); clearError(); }}
                type="text"
                placeholder="John Doe"
                className="w-full bg-white/90 border border-mist shadow-sm rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-steel/30 focus:border-steel outline-none transition-all placeholder:text-navy/40 text-navy"
                required
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider font-bold text-navy/60 mb-1.5">
                Institution
              </label>
              <input
                value={institution}
                onChange={(e) => { setInstitution(e.target.value); clearError(); }}
                type="text"
                placeholder="School / Company"
                className="w-full bg-white/90 border border-mist shadow-sm rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-steel/30 focus:border-steel outline-none transition-all placeholder:text-navy/40 text-navy"
                required
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs uppercase tracking-wider font-bold text-navy/60 mb-1.5">
            Email address
          </label>
          <input
            value={email}
            onChange={(e) => { setEmail(e.target.value); clearError(); }}
            type="email"
            placeholder="you@example.com"
            className="w-full bg-white/90 border border-mist shadow-sm rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-steel/30 focus:border-steel outline-none transition-all placeholder:text-navy/40 text-navy"
            required
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs uppercase tracking-wider font-bold text-navy/60">
              Password
            </label>
            {isLogin && (
              <a href="#" className="text-xs font-bold text-steel hover:text-steel/70 underline transition-colors">
                Forgot password?
              </a>
            )}
          </div>
          <div className="relative">
            <input
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearError(); }}
              type={showPassword ? 'text' : 'password'}
              className="w-full bg-white/90 border border-mist shadow-sm rounded-xl px-4 py-2.5 text-sm pr-10 focus:ring-2 focus:ring-steel/30 focus:border-steel outline-none transition-all placeholder:text-navy/40 text-navy"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-navy/40 hover:text-navy/70 transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-navy text-white py-3 rounded-xl font-bold text-sm shadow-xl shadow-navy/20 hover:shadow-navy/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <p className="text-center text-xs text-navy/60 pt-4 font-medium">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            onClick={onSwitch}
            className="font-extrabold text-steel hover:text-steel/70 underline transition-colors"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </form>
    </div>
  );
};

// ════════════════════════════════════
// MOBILE FORM COMPONENT
// ════════════════════════════════════
const MobileForm = ({
  mode, showPassword, setShowPassword,
  name, setName, email, setEmail, password, setPassword,
  institution, setInstitution,
  onSubmit, onSwitch, isLoading,
  authError, clearError,
}: any) => {
  const isLogin = mode === 'login';
  return (
    <div className="space-y-5 w-full">
      <div className="flex items-center gap-3 mb-2 pt-4">
        <div className="w-10 h-10 bg-navy text-white rounded-2xl flex items-center justify-center font-bold text-lg shadow-lg border border-steel/20 shrink-0">
          Go
        </div>
        <div>
          <div className="font-extrabold text-navy text-xl tracking-tight leading-tight">
            {isLogin ? 'Welcome back' : 'Create account'}
          </div>
          <div className="text-xs text-navy/60 font-medium">
            {isLogin ? 'Sign in to your Go-PKL portal' : 'Register with your institution email'}
          </div>
        </div>
      </div>

      {/* ERROR BANNER */}
      {authError && (
        <ErrorBanner error={authError} onClose={clearError} />
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        {!isLogin && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
            <div>
              <label className="block text-xs uppercase tracking-wider font-bold text-navy/50 mb-1.5">
                Full Name
              </label>
              <input
                value={name}
                onChange={(e) => { setName(e.target.value); clearError(); }}
                type="text"
                placeholder="John Doe"
                className="w-full bg-white/90 border border-mist shadow-sm rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-steel/30 outline-none transition-all placeholder:text-navy/30 text-navy"
                required
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider font-bold text-navy/50 mb-1.5">
                Institution
              </label>
              <input
                value={institution}
                onChange={(e) => { setInstitution(e.target.value); clearError(); }}
                type="text"
                placeholder="School / Company Name"
                className="w-full bg-white/90 border border-mist shadow-sm rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-steel/30 outline-none transition-all placeholder:text-navy/30 text-navy"
                required
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs uppercase tracking-wider font-bold text-navy/50 mb-1.5">
            Email
          </label>
          <input
            value={email}
            onChange={(e) => { setEmail(e.target.value); clearError(); }}
            type="email"
            placeholder="you@example.com"
            className="w-full bg-white/90 border border-mist shadow-sm rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-steel/30 outline-none transition-all placeholder:text-navy/30 text-navy"
            required
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs uppercase tracking-wider font-bold text-navy/50">
              Password
            </label>
            {isLogin && (
              <a href="#" className="text-xs font-bold text-steel underline transition-colors">
                Forgot?
              </a>
            )}
          </div>
          <div className="relative">
            <input
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearError(); }}
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className="w-full bg-white/90 border border-mist shadow-sm rounded-2xl px-4 py-3.5 text-sm pr-12 focus:ring-2 focus:ring-steel/30 outline-none transition-all text-navy"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-navy/40 active:text-navy/60"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-navy text-white py-4 rounded-2xl font-bold text-sm shadow-xl shadow-navy/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <p className="text-center text-sm text-navy/60 pt-2 font-medium pb-8">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            onClick={onSwitch}
            className="font-extrabold text-steel underline"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </form>
    </div>
  );
};

const DecorativeGraphic = ({ mode }: { mode: 'login' | 'register' }) => (
  <>
    <div className="relative z-10 space-y-4">
      <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-white border border-white/20 shadow-sm">
        <Sparkles className="w-3.5 h-3.5 text-white" />
        {mode === 'login' ? 'Integrated PKL Portal' : 'Secure Registration'}
      </div>
      <h3 className="text-4xl font-extrabold text-white tracking-tight leading-tight max-w-sm">
        {mode === 'login'
          ? 'Manage your internship activities in one place.'
          : 'Start your professional journey with Go-PKL.'}
      </h3>
    </div>

    <div className="relative z-10 w-full max-w-sm self-end space-y-3">
      {mode === 'login' ? (
        <>
          <div className="bg-white/15 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-xl">
            <div className="flex items-center gap-3 border-b border-white/20 pb-3 mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Geofence Check-in</div>
                <div className="text-xs text-white/70">Tokopedia Tower</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <CheckCircle2 className="w-4 h-4" /> Validated location
            </div>
          </div>
          <div className="bg-white/15 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-xl">
            <div className="flex justify-between items-center mb-3">
              <div className="text-sm font-bold text-white">Daily Logbook</div>
              <span className="text-[10px] bg-white/20 text-white px-2.5 py-1 rounded-full font-bold">
                Approved
              </span>
            </div>
            <div className="h-2 bg-white/10 rounded-full w-3/4 mb-2"></div>
            <div className="h-2 bg-white/10 rounded-full w-1/2"></div>
          </div>
        </>
      ) : (
        <>
          <div className="bg-white/15 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-xl">
            <div className="flex items-center gap-3 border-b border-white/20 pb-3 mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Mentorship Pairing</div>
                <div className="text-xs text-white/70">Connect with industry experts</div>
              </div>
            </div>
            <div className="flex items-center -space-x-2">
              {[1, 2, 3].map((i) => (
                <img
                  key={i}
                  src={`https://i.pravatar.cc/100?img=${i + 10}`}
                  className="w-6 h-6 rounded-full border-2 border-white/40"
                  alt="Avatar"
                />
              ))}
              <div className="w-6 h-6 rounded-full border-2 border-white/40 bg-white/20 flex items-center justify-center text-[8px] font-bold text-white">
                +12
              </div>
            </div>
          </div>
          <div className="bg-white/15 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-xl">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <LineChart className="w-4 h-4 text-white/80" />
                <div className="text-sm font-bold text-white">Skill Progress</div>
              </div>
              <span className="text-[10px] bg-white/20 text-white px-2.5 py-1 rounded-full font-bold">
                Level Up
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5 mb-1">
              <div className="bg-white h-1.5 rounded-full" style={{ width: '75%' }}></div>
            </div>
            <div className="text-[9px] text-white/70 text-right">75% to Next Milestone</div>
          </div>
        </>
      )}
    </div>

    <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
    <div className="absolute bottom-[-10%] left-[-10%] w-72 h-72 bg-navy/10 rounded-full blur-3xl pointer-events-none"></div>
  </>
);