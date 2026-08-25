import React, { useState } from 'react';
import {
  Palette, Monitor, Sun, Moon, Eye, EyeOff,
  Lock, AlertTriangle, Trash2, Check, Shield, KeyRound,
  Smartphone
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const SettingsSuperAdmin: React.FC = () => {
  useApp();

  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [compactMode, setCompactMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [saved, setSaved] = useState(false);

  const handleThemeToggle = (t: 'light' | 'dark') => {
    setTheme(t);
    if (t === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

  const handleSaveAppearance = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const themes = [
    { id: 'light' as const, label: 'Terang', icon: Sun, color: 'bg-white border-mist' },
    { id: 'dark' as const, label: 'Gelap', icon: Moon, color: 'bg-navy border-navy' },
  ];

  return (
    <div className="h-full w-full flex flex-col gap-4 overflow-y-auto custom-scrollbar p-4 md:p-6">
      {/* ── Appearance ── */}
      <div className="bg-white rounded-[24px] border border-mist/60 shadow-sm p-5 md:p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-[10px] bg-steel/10 flex items-center justify-center">
            <Palette className="w-5 h-5 text-steel" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-navy">Appearance</h2>
            <p className="text-[10px] text-navy/50 font-medium">Sesuaikan tampilan aplikasi</p>
          </div>
        </div>

        {/* Profile Theme */}
        <div className="mb-6">
          <p className="text-[10px] font-bold text-navy/50 uppercase tracking-widest mb-3">Profile Theme</p>
          <div className="flex gap-3">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => handleThemeToggle(t.id)}
                className={`flex items-center gap-3 px-5 py-3 rounded-[16px] border-2 transition-all ${
                  theme === t.id
                    ? 'border-steel bg-steel/5 shadow-sm'
                    : 'border-mist/60 hover:border-mist hover:bg-shell'
                }`}
              >
                <div className={`w-8 h-8 rounded-[8px] flex items-center justify-center ${
                  t.id === 'dark' ? 'bg-navy' : 'bg-white border border-mist'
                }`}>
                  <t.icon className={`w-4 h-4 ${t.id === 'dark' ? 'text-white' : 'text-navy'}`} />
                </div>
                <span className="text-xs font-bold text-navy">{t.label}</span>
                {theme === t.id && <Check className="w-4 h-4 text-steel ml-auto" />}
              </button>
            ))}
          </div>
        </div>

        {/* Display Options */}
        <div>
          <p className="text-[10px] font-bold text-navy/50 uppercase tracking-widest mb-3">Display Options</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setCompactMode(!compactMode)}
              className={`flex items-center justify-between px-5 py-4 rounded-[16px] border transition-all ${
                compactMode ? 'border-steel bg-steel/5' : 'border-mist/60 hover:bg-shell'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[8px] bg-shell flex items-center justify-center">
                  <Monitor className="w-4 h-4 text-navy/60" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-navy">Mode Kompak</p>
                  <p className="text-[10px] text-navy/50">Padding lebih kecil untuk tampilan lebih padat</p>
                </div>
              </div>
              <div className={`w-10 h-6 rounded-full transition-all ${compactMode ? 'bg-steel' : 'bg-mist'} relative`}>
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm absolute top-1 transition-all ${compactMode ? 'left-5' : 'left-1'}`} />
              </div>
            </button>

            <button
              className="flex items-center justify-between px-5 py-4 rounded-[16px] border border-mist/60 hover:bg-shell transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[8px] bg-shell flex items-center justify-center">
                  <Eye className="w-4 h-4 text-navy/60" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-navy">Notifikasi Push</p>
                  <p className="text-[10px] text-navy/50">Terima notifikasi sistem</p>
                </div>
              </div>
              <div className="w-10 h-6 rounded-full bg-steel relative">
                <div className="w-4 h-4 rounded-full bg-white shadow-sm absolute top-1 left-5" />
              </div>
            </button>
          </div>
        </div>

        <button
          onClick={handleSaveAppearance}
          className="mt-6 w-full sm:w-auto px-6 py-3 bg-steel text-white rounded-[16px] text-xs font-bold hover:bg-steel/90 transition-colors shadow-sm flex items-center justify-center gap-2"
        >
          {saved ? <><Check className="w-4 h-4" /> Tersimpan!</> : 'Simpan Pengaturan'}
        </button>
      </div>

      {/* ── Security ── */}
      <div className="bg-white rounded-[24px] border border-mist/60 shadow-sm p-5 md:p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-[10px] bg-navy/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-navy" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-navy">Security</h2>
            <p className="text-[10px] text-navy/50 font-medium">Kelola keamanan akun Anda</p>
          </div>
        </div>

        <div className="bg-shell rounded-[16px] border border-mist p-5">
          <div className="flex items-center gap-2 mb-4">
            <KeyRound className="w-4 h-4 text-navy/60" />
            <p className="text-xs font-bold text-navy">Ubah Password</p>
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-[10px] font-bold text-navy/50 uppercase tracking-wide mb-1 block">Password Saat Ini</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="current"
                  value={passwordForm.current}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-3 bg-white border border-mist rounded-[12px] text-xs font-bold text-navy outline-none focus:border-steel transition-colors pr-10"
                  placeholder="Masukkan password saat ini"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-navy/40 hover:text-navy transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-navy/50 uppercase tracking-wide mb-1 block">Password Baru</label>
              <input
                type="password"
                name="newPass"
                value={passwordForm.newPass}
                onChange={handlePasswordChange}
                className="w-full px-4 py-3 bg-white border border-mist rounded-[12px] text-xs font-bold text-navy outline-none focus:border-steel transition-colors"
                placeholder="Masukkan password baru"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-navy/50 uppercase tracking-wide mb-1 block">Konfirmasi Password Baru</label>
              <input
                type="password"
                name="confirm"
                value={passwordForm.confirm}
                onChange={handlePasswordChange}
                className="w-full px-4 py-3 bg-white border border-mist rounded-[12px] text-xs font-bold text-navy outline-none focus:border-steel transition-colors"
                placeholder="Ulangi password baru"
              />
            </div>
            <button className="mt-2 w-full sm:w-auto px-6 py-3 bg-navy text-white rounded-[16px] text-xs font-bold hover:bg-navy/90 transition-colors shadow-sm flex items-center justify-center gap-2">
              <Lock className="w-4 h-4" /> Update Password
            </button>
          </div>
        </div>

        <div className="mt-4 bg-shell rounded-[16px] border border-mist p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[8px] bg-white flex items-center justify-center shadow-sm">
                <Smartphone className="w-4 h-4 text-navy/60" />
              </div>
              <div>
                <p className="text-xs font-bold text-navy">Sesi Aktif</p>
                <p className="text-[10px] text-navy/50">1 perangkat aktif saat ini</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-white border border-mist rounded-[12px] text-[10px] font-bold text-navy hover:bg-mist transition-colors shadow-sm">
              Keluar Semua
            </button>
          </div>
        </div>
      </div>

      {/* ── Danger Zone ── */}
      <div className="bg-white rounded-[24px] border-2 border-red-200 shadow-sm p-5 md:p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-[10px] bg-red-50 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-red-600">Danger Zone</h2>
            <p className="text-[10px] text-red-400 font-medium">Tindakan yang tidak dapat dibatalkan</p>
          </div>
        </div>

        <div className="bg-red-50 rounded-[16px] border border-red-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <Trash2 className="w-5 h-5 text-red-500" />
            <p className="text-xs font-bold text-red-600">Hapus Akun Super Admin</p>
          </div>
          <p className="text-[10px] text-red-500/80 mb-4">
            ⚠️ Sebagai Super Admin, menghapus akun ini akan menghilangkan akses seluruh sistem. Pastikan sudah ada admin lain yang menggantikan. Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              className="flex-1 px-4 py-3 bg-white border border-red-200 rounded-[12px] text-xs font-bold text-navy outline-none focus:border-red-400 transition-colors"
              placeholder='Ketik "HAPUS" untuk konfirmasi'
            />
            <button
              disabled={deleteConfirm !== 'HAPUS'}
              className={`px-6 py-3 rounded-[16px] text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                deleteConfirm === 'HAPUS'
                  ? 'bg-red-500 text-white hover:bg-red-600 shadow-sm'
                  : 'bg-red-100 text-red-300 cursor-not-allowed'
              }`}
            >
              <Trash2 className="w-4 h-4" /> Hapus Akun
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
