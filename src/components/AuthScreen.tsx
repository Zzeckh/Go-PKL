import React, { useState } from 'react';
import {
  Eye, EyeOff, ArrowRight, Sparkles, MapPin, CheckCircle2,
  Loader2, Lock, Mail, WifiOff, AlertCircle, X
} from 'lucide-react';

interface AuthScreenProps {
  onSubmit: (payload: { email: string; password: string }) => void | Promise<void>;
}

// ─── Error Classification Helper ───
type ErrorType = 'wrong-password' | 'wrong-email' | 'technical';

interface AuthError {
  type: ErrorType;
  title: string;
  message: string;
  icon: React.ElementType;
}

function classifyAuthError(error: any): AuthError {
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
    <div className="animate-in fade-in slide-in-from-top-2 duration-300 bg-navy/5 border border-navy/15 rounded-[24px] p-4 flex items-start gap-3 shadow-sm">
      <div className="w-9 h-9 rounded-lg bg-navy/10 flex items-center justify-center shrink-0">
        <Icon className="w-4.5 h-4.5 text-navy/70" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-navy leading-tight">{error.title}</p>
        <p className="text-xs text-navy/70 mt-1 leading-relaxed">{error.message}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="w-7 h-7 rounded-lg hover:bg-navy/10 flex items-center justify-center text-navy/60 hover:text-navy transition-colors shrink-0"
        aria-label="Tutup"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSubmit }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<AuthError | null>(null);

  const clearError = () => setAuthError(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);

    try {
      await onSubmit({ email, password });
    } catch (error: any) {
      setAuthError(classifyAuthError(error));
    } finally {
      setIsLoading(false);
    }
  };

  const formProps = {
    showPassword,
    setShowPassword,
    email,
    setEmail,
    password,
    setPassword,
    onSubmit: handleSubmit,
    isLoading,
    authError,
    clearError,
  };

  return (
    <div className="flex-1 w-full h-full relative overflow-hidden rounded-[24px] bg-white/40 backdrop-blur-xl border border-white/60 shadow-sm">

      {/* MOBILE VIEW */}
      <div className="lg:hidden w-full h-full relative overflow-hidden">
        <div className="absolute inset-0 overflow-y-auto">
          <div className="min-h-full flex flex-col justify-center px-5 py-8">
            <MobileForm {...formProps} />
          </div>
        </div>
      </div>

      {/* DESKTOP VIEW */}
      <div className="hidden lg:block w-full h-full relative overflow-hidden">
        <div className="absolute top-0 left-0 h-full w-1/2 p-8 xl:p-12 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto">
            <AuthForm {...formProps} />
          </div>
        </div>

        <div className="absolute top-0 right-0 w-1/2 h-full z-30 p-4">
          <div className="w-full h-full bg-steel/95 backdrop-blur-md rounded-[24px] overflow-hidden border border-white/20 shadow-2xl shadow-steel/30 relative">
            <div className="absolute inset-0 p-10 flex flex-col justify-between">
              <DecorativeGraphic />
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
  showPassword, setShowPassword,
  email, setEmail, password, setPassword,
  onSubmit, isLoading,
  authError, clearError,
}: any) => {
  return (
    <div className="space-y-5">
      <div>
        <div className="w-12 h-12 bg-navy text-white rounded-[10px] flex items-center justify-center font-bold text-xl mb-6 shadow-lg border border-steel/20">
          Go
        </div>
        <h2 className="text-3xl font-extrabold text-navy tracking-tight">
          Selamat Datang Kembali
        </h2>
        <p className="text-sm text-navy/60 mt-2 font-medium">
          Masukkan kredensial Anda untuk mengakses dashboard
        </p>
      </div>

      {/* ERROR BANNER */}
      {authError && (
        <ErrorBanner error={authError} onClose={clearError} />
      )}

      <form onSubmit={onSubmit} className="space-y-4 pt-2">
        <div>
          <label className="block text-xs uppercase tracking-wider font-bold text-navy/60 mb-1.5">
            Alamat Email
          </label>
          <input
            value={email}
            onChange={(e) => { setEmail(e.target.value); clearError(); }}
            type="email"
            placeholder="you@example.com"
            className="w-full bg-white/90 border border-mist shadow-sm rounded-[24px] px-4 py-2.5 text-sm focus:ring-2 focus:ring-steel/30 focus:border-steel outline-none transition-all placeholder:text-navy/40 text-navy"
            required
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider font-bold text-navy/60 mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearError(); }}
              type={showPassword ? 'text' : 'password'}
              className="w-full bg-white/90 border border-mist shadow-sm rounded-[24px] px-4 py-2.5 text-sm pr-10 focus:ring-2 focus:ring-steel/30 focus:border-steel outline-none transition-all placeholder:text-navy/40 text-navy"
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
          className="w-full bg-navy text-white py-3 rounded-[24px] font-bold text-sm shadow-xl shadow-navy/20 hover:shadow-navy/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <span>Masuk</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <p className="text-center text-xs text-navy/60 pt-4 font-medium">
          Gunakan akun yang diberikan oleh sekolah atau perusahaan.
        </p>
      </form>
    </div>
  );
};

// ════════════════════════════════════
// MOBILE FORM COMPONENT
// ════════════════════════════════════
const MobileForm = ({
  showPassword, setShowPassword,
  email, setEmail, password, setPassword,
  onSubmit, isLoading,
  authError, clearError,
}: any) => {
  return (
    <div className="space-y-5 w-full">
      <div className="flex items-center gap-3 mb-2 pt-4">
        <div className="w-10 h-10 bg-navy text-white rounded-[10px] flex items-center justify-center font-bold text-lg shadow-lg border border-steel/20 shrink-0">
          Go
        </div>
        <div>
          <div className="font-extrabold text-navy text-xl tracking-tight leading-tight">
            Selamat Datang Kembali
          </div>
          <div className="text-xs text-navy/60 font-medium">
            Masuk ke portal Go-PKL Anda
          </div>
        </div>
      </div>

      {/* ERROR BANNER */}
      {authError && (
        <ErrorBanner error={authError} onClose={clearError} />
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-xs uppercase tracking-wider font-bold text-navy/50 mb-1.5">
            Email
          </label>
          <input
            value={email}
            onChange={(e) => { setEmail(e.target.value); clearError(); }}
            type="email"
            placeholder="you@example.com"
            className="w-full bg-white/90 border border-mist shadow-sm rounded-[24px] px-4 py-3.5 text-sm focus:ring-2 focus:ring-steel/30 outline-none transition-all placeholder:text-navy/30 text-navy"
            required
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider font-bold text-navy/50 mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearError(); }}
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className="w-full bg-white/90 border border-mist shadow-sm rounded-[24px] px-4 py-3.5 text-sm pr-12 focus:ring-2 focus:ring-steel/30 outline-none transition-all text-navy"
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
          className="w-full bg-navy text-white py-4 rounded-[24px] font-bold text-sm shadow-xl shadow-navy/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <span>Masuk</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <p className="text-center text-sm text-navy/60 pt-2 font-medium pb-8">
          Gunakan akun yang diberikan oleh sekolah atau perusahaan.
        </p>
      </form>
    </div>
  );
};

const DecorativeGraphic = () => (
  <>
    <div className="relative z-10 space-y-4">
      <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-white border border-white/20 shadow-sm">
        <Sparkles className="w-3.5 h-3.5 text-white" />
        Portal PKL Terintegrasi
      </div>
      <h3 className="text-4xl font-extrabold text-white tracking-tight leading-tight max-w-sm">
        Kelola aktivitas PKL Anda dalam satu tempat.
      </h3>
    </div>

    <div className="relative z-10 w-full max-w-sm self-end space-y-3">
      <div className="bg-white/15 backdrop-blur-md p-4 rounded-[24px] border border-white/20 shadow-xl">
        <div className="flex items-center gap-3 border-b border-white/20 pb-3 mb-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">Check-in Geofence</div>
            <div className="text-xs text-white/70">Tokopedia Tower</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-white">
          <CheckCircle2 className="w-4 h-4" /> Lokasi terverifikasi
        </div>
      </div>
      <div className="bg-white/15 backdrop-blur-md p-4 rounded-[24px] border border-white/20 shadow-xl">
        <div className="flex justify-between items-center mb-3">
          <div className="text-sm font-bold text-white">Logbook Harian</div>
          <span className="text-[10px] bg-white/20 text-white px-2.5 py-1 rounded-full font-bold">
            Disetujui
          </span>
        </div>
        <div className="h-2 bg-white/10 rounded-full w-3/4 mb-2"></div>
        <div className="h-2 bg-white/10 rounded-full w-1/2"></div>
      </div>
    </div>

    <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
    <div className="absolute bottom-[-10%] left-[-10%] w-72 h-72 bg-navy/10 rounded-full blur-3xl pointer-events-none"></div>
  </>
);
