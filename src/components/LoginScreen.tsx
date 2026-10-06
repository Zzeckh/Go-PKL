import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MapPin,
  Sparkles,
  WifiOff,
  AlertCircle,
} from 'lucide-react';

interface LoginScreenProps {
  onSubmit: (credentials: { email: string; password: string }) => void | Promise<void>;
}

interface LoginError {
  title: string;
  message: string;
  icon: React.ElementType;
}

const classifyLoginError = (error: any): LoginError => {
  const message = error?.message?.toLowerCase() || '';
  const status = error?.status;

  if (status >= 500 || !status || message.includes('network') || message.includes('fetch')) {
    return {
      title: 'Kesalahan Teknis',
      message: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda atau coba lagi nanti.',
      icon: WifiOff,
    };
  }

  if (status === 401 || status === 403) {
    return {
      title: 'Login Gagal',
      message: error?.message || 'Email atau password yang Anda masukkan salah.',
      icon: Lock,
    };
  }

  if (status === 400) {
    return {
      title: 'Data Tidak Lengkap',
      message: error?.message || 'Masukkan email dan password untuk melanjutkan.',
      icon: AlertCircle,
    };
  }

  return {
    title: 'Terjadi Kesalahan',
    message: error?.message || 'Silakan coba lagi dalam beberapa saat.',
    icon: AlertCircle,
  };
};

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSubmit }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<LoginError | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await onSubmit({ email, password });
    } catch (submitError: any) {
      setError(classifyLoginError(submitError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 w-full h-full overflow-y-auto rounded-[24px] bg-white/60 backdrop-blur-xl border border-white/70 shadow-sm">
      <div className="min-h-full grid grid-cols-1 lg:grid-cols-2">
        <section className="hidden lg:flex flex-col justify-between bg-steel text-white p-10 xl:p-14">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-[12px] bg-white/15 border border-white/20 flex items-center justify-center font-extrabold text-lg">
              Go
            </div>
            <div>
              <p className="font-extrabold text-lg leading-tight">Go-PKL</p>
              <p className="text-xs font-semibold text-white/65">Portal Praktik Kerja Lapangan</p>
            </div>
          </div>

          <div className="max-w-lg space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/20 px-3 py-1.5 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" /> Portal PKL Terintegrasi
            </span>
            <h1 className="text-4xl xl:text-5xl font-extrabold leading-tight">
              Kelola aktivitas PKL dalam satu tempat.
            </h1>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-white/12 border border-white/15 rounded-[18px] p-4">
                <MapPin className="w-5 h-5 mb-3" />
                <p className="text-sm font-bold">Presensi terpantau</p>
                <p className="text-xs text-white/65 mt-1">Data kegiatan tersimpan di satu portal.</p>
              </div>
              <div className="bg-white/12 border border-white/15 rounded-[18px] p-4">
                <CheckCircle2 className="w-5 h-5 mb-3" />
                <p className="text-sm font-bold">Monitoring PKL</p>
                <p className="text-xs text-white/65 mt-1">Siswa dan pembimbing terhubung.</p>
              </div>
            </div>
          </div>

          <p className="text-xs font-semibold text-white/55">Go-PKL · Sistem Informasi Praktik Kerja Lapangan</p>
        </section>

        <section className="flex items-center justify-center p-5 sm:p-8 lg:p-12">
          <div className="w-full max-w-md space-y-6">
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-[11px] bg-navy text-white flex items-center justify-center font-extrabold">Go</div>
              <div>
                <p className="font-extrabold text-navy">Go-PKL</p>
                <p className="text-xs text-navy/55 font-semibold">Portal PKL</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-steel">Akses Akun</p>
              <h2 className="text-3xl font-extrabold text-navy mt-2">Masuk ke Go-PKL</h2>
              <p className="text-sm text-navy/60 mt-2">Gunakan email dan password akun Anda.</p>
            </div>

            {error && (
              <div role="alert" className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-[16px] p-3">
                <error.icon className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-rose-800">{error.title}</p>
                  <p className="text-xs text-rose-700 mt-1">{error.message}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="block text-xs uppercase tracking-wider font-bold text-navy/60 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/40" />
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="nama@domain.com"
                    className="w-full bg-white border border-mist rounded-[14px] pl-10 pr-3.5 py-3 text-sm text-navy outline-none focus:border-steel focus:ring-2 focus:ring-steel/15"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="login-password" className="block text-xs uppercase tracking-wider font-bold text-navy/60 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/40" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full bg-white border border-mist rounded-[14px] pl-10 pr-12 py-3 text-sm text-navy outline-none focus:border-steel focus:ring-2 focus:ring-steel/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-navy/50 hover:text-navy"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-navy text-white py-3 rounded-[14px] font-bold text-sm shadow-lg hover:bg-navy/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? 'Memeriksa akun...' : 'Masuk'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
};
