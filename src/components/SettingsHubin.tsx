import React, { useState } from 'react';
import {
  Palette, Monitor, Eye, EyeOff, Lock, AlertTriangle, Trash2,
  Check, Shield, KeyRound, Search, RotateCcw, User,
  Bell, Sparkles, GraduationCap, Building2, LifeBuoy, Loader2
} from 'lucide-react';
import { useApp } from '../context/AppContext';

type TabKey = 'account' | 'appearance' | 'security' | 'danger';

/* ══════════════════════════════════════════════════════
   SETTINGS HUBIN (LAYOUT HEADBAR)
   Navigasi horizontal di atas, bukan sidebar
   ══════════════════════════════════════════════════════ */
export const SettingsHubin: React.FC = () => {
  const { userName, schoolName, perusahaanList, changePassword, deleteAccount } = useApp();

  const [activeTab, setActiveTab] = useState<TabKey>('account');
  const [search, setSearch] = useState('');

  /* ── Appearance state ── */
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [compactMode, setCompactMode] = useState(false);
  const [reduceAnim, setReduceAnim] = useState(false);
  const [pushNotif, setPushNotif] = useState(true);

  /* ── Snapshot untuk Discard / Save ── */
  const [snapshot, setSnapshot] = useState({ theme: 'light' as 'light' | 'dark', compactMode: false, reduceAnim: false, pushNotif: true });
  const [savedFlash, setSavedFlash] = useState(false);

  /* ── Security state ── */
  const [showPassword, setShowPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteMsg, setDeleteMsg] = useState<{ type: 'error'; text: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const applyTheme = (t: 'light' | 'dark') => {
    if (t === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  const handleThemeToggle = (t: 'light' | 'dark') => {
    setTheme(t);
    applyTheme(t);
  };

  const dirty =
    theme !== snapshot.theme ||
    compactMode !== snapshot.compactMode ||
    reduceAnim !== snapshot.reduceAnim ||
    pushNotif !== snapshot.pushNotif;

  const handleSaveChanges = () => {
    setSnapshot({ theme, compactMode, reduceAnim, pushNotif });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  };

  const handleDiscard = () => {
    setTheme(snapshot.theme);
    applyTheme(snapshot.theme);
    setCompactMode(snapshot.compactMode);
    setReduceAnim(snapshot.reduceAnim);
    setPushNotif(snapshot.pushNotif);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

  const handlePasswordSubmit = async () => {
    setPasswordMsg(null);
    if (!passwordForm.current || !passwordForm.newPass || !passwordForm.confirm) {
      setPasswordMsg({ type: 'error', text: 'Semua field wajib diisi' });
      return;
    }
    if (passwordForm.newPass.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password baru minimal 6 karakter' });
      return;
    }
    if (passwordForm.newPass !== passwordForm.confirm) {
      setPasswordMsg({ type: 'error', text: 'Konfirmasi password tidak cocok' });
      return;
    }
    setPasswordLoading(true);
    try {
      await changePassword(passwordForm.current, passwordForm.newPass);
      setPasswordMsg({ type: 'success', text: 'Password berhasil diubah!' });
      setPasswordForm({ current: '', newPass: '', confirm: '' });
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err?.message || 'Gagal mengubah password' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteMsg(null);
    if (deleteConfirm !== 'HAPUS' || !deletePassword) return;
    setDeleteLoading(true);
    try {
      await deleteAccount(deletePassword);
    } catch (err: any) {
      setDeleteMsg({ type: 'error', text: err?.message || 'Gagal menghapus akun' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: 'account', label: 'Account', icon: User },
    { key: 'appearance', label: 'Appearance', icon: Palette },
    { key: 'security', label: 'Privacy & Security', icon: Shield },
    { key: 'danger', label: 'Danger Zone', icon: AlertTriangle },
  ];

  /* ── Search: lompat ke tab yang cocok ── */
  const handleSearch = (q: string) => {
    setSearch(q);
    if (!q) return;
    const match = tabs.find(t => t.label.toLowerCase().includes(q.toLowerCase()));
    if (match) setActiveTab(match.key);
  };

  const themes = [
    { id: 'light' as const, label: 'Terang', gradientStyle: { background: 'linear-gradient(to bottom right, #ffffff, #DADEE8)' }, text: 'text-navy' },
    { id: 'dark' as const, label: 'Gelap', gradientStyle: { background: 'linear-gradient(to bottom right, #152A42, #000000)' }, text: 'text-white' },
  ];

  return (
    <div className="h-full w-full flex flex-col gap-4 overflow-y-auto custom-scrollbar p-4 md:p-6">

      {/* ── HEADER: role + save actions ── */}
      <div className="shrink-0 bg-white rounded-[24px] border border-mist/60 shadow-sm p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* ✅ Hanya role yang ditampilkan */}
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-sm md:text-base font-bold text-navy uppercase tracking-wide truncate">
            Hubin
          </h2>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <span className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-2 rounded-full border ${
            dirty
              ? 'bg-[#FBF3E2] text-[#9A6B15] border-[#F0E1C0]'
              : 'bg-white text-navy/60 border-mist/60 shadow-sm'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dirty ? 'bg-[#9A6B15]' : 'bg-steel'}`} />
            {savedFlash ? 'Perubahan tersimpan!' : dirty ? 'Perubahan belum disimpan' : 'Semua perubahan tersimpan'}
          </span>
          <button
            onClick={handleDiscard}
            disabled={!dirty}
            className="flex items-center gap-1.5 text-[11px] font-bold bg-white border border-mist/60 text-navy px-3 py-2 rounded-full hover:bg-mist/30 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Discard
          </button>
          <button
            onClick={handleSaveChanges}
            disabled={!dirty}
            className="flex items-center gap-1.5 text-[11px] font-bold bg-navy text-white px-4 py-2 rounded-full hover:bg-navy/90 transition-colors shadow-md shadow-navy/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-3.5 h-3.5" /> Save Changes
          </button>
        </div>
      </div>

      {/* ── HEADBAR NAV + search ── */}
      <div className="shrink-0 flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        <div className="flex-1 bg-mist/40 p-1 rounded-[24px] flex gap-1 overflow-x-auto">
          {tabs.map(t => {
            const Icon = t.icon;
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex-1 min-w-[130px] px-3 py-2.5 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  active ? 'bg-steel text-white shadow' : 'text-navy/60 hover:text-navy'
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {t.label}
              </button>
            );
          })}
        </div>
        <div className="relative lg:w-64 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/40" />
          <input
            type="text"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search settings..."
            className="w-full bg-mist/40 border border-mist rounded-[24px] pl-10 pr-4 py-2.5 text-sm font-medium text-navy outline-none focus:border-steel focus:bg-white transition-all placeholder:text-navy/40"
          />
        </div>
      </div>

      {/* ══════════ TAB: ACCOUNT ══════════ */}
      {activeTab === 'account' && (
        <div className="bg-white rounded-[24px] border border-mist/60 shadow-sm p-5 md:p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-[10px] bg-navy flex items-center justify-center shadow-md shadow-navy/20">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-navy">Account</h2>
              <p className="text-[10px] text-navy/50 font-medium">Profil & informasi akun</p>
            </div>
          </div>

          {/* Profile row */}
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-[16px] border border-mist/60 bg-mist/30 mb-4">
            <div className="w-16 h-16 rounded-[10px] bg-navy text-white flex items-center justify-center font-bold text-xl shrink-0 shadow-md shadow-navy/20">
              {(userName || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <p className="text-base font-bold text-navy truncate">{userName || 'Tim Hubin'}</p>
                <span className="text-[10px] font-bold bg-steel text-white shadow-sm shadow-steel/30 px-2.5 py-1 rounded-full uppercase">
                  Hubin
                </span>
              </div>
              <p className="text-[11px] font-semibold text-navy/50 mt-1 truncate">
                {schoolName || 'Sekolah'}
              </p>
            </div>
          </div>

          {/* Info cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 bg-white border border-mist/60 shadow-sm rounded-2xl p-3">
              <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center shrink-0">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-navy/50 uppercase tracking-wide">Sekolah</p>
                <p className="text-sm font-bold text-navy truncate">{schoolName || '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white border border-mist/60 shadow-sm rounded-2xl p-3">
              <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-navy/50 uppercase tracking-wide">Perusahaan Mitra</p>
                <p className="text-sm font-bold text-navy tabular-nums">{perusahaanList.length} perusahaan</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ TAB: APPEARANCE ══════════ */}
      {activeTab === 'appearance' && (
        <div className="flex flex-col gap-4">
          {/* Profile Theme */}
          <div className="bg-white rounded-[24px] border border-mist/60 shadow-sm p-5 md:p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-[10px] bg-navy flex items-center justify-center shadow-md shadow-navy/20">
                <Palette className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-navy">Profile Theme</h2>
                <p className="text-[10px] text-navy/50 font-medium">Theme tersimpan otomatis & ter-apply di semua halaman</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {themes.map(t => (
                <button
                  key={t.id}
                  onClick={() => handleThemeToggle(t.id)}
                  className={`relative h-40 rounded-[16px] border-2 overflow-hidden transition-all text-left ${
                    theme === t.id ? 'border-steel ring-2 ring-steel/30 shadow-md' : 'border-mist/60 hover:border-mist'
                  }`}
                  style={t.gradientStyle}
                >
                  {theme === t.id && (
                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-steel text-white flex items-center justify-center shadow-sm">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <span className={`absolute bottom-3 left-3 text-xs font-bold ${t.text}`}>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Display Options */}
          <div className="bg-white rounded-[24px] border border-mist/60 shadow-sm p-5 md:p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-[10px] bg-navy flex items-center justify-center shadow-md shadow-navy/20">
                <Monitor className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-navy">Display Options</h2>
                <p className="text-[10px] text-navy/50 font-medium">Atur kenyamanan tampilan dashboard</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {/* Compact */}
              <div className="flex items-center justify-between px-4 py-4 rounded-[16px] border border-mist/60 hover:bg-mist/30 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center shrink-0">
                    <Monitor className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-navy">Mode Kompak</p>
                    <p className="text-[10px] text-navy/50">Spacing lebih rapat, konten lebih banyak di layar</p>
                  </div>
                </div>
                <button
                  onClick={() => setCompactMode(!compactMode)}
                  className={`w-11 h-6 rounded-full transition-all relative shrink-0 ${compactMode ? 'bg-steel' : 'bg-mist'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow-sm absolute top-1 transition-all ${compactMode ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              {/* Reduce animations */}
              <div className="flex items-center justify-between px-4 py-4 rounded-[16px] border border-mist/60 hover:bg-mist/30 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-navy">Kurangi Animasi</p>
                    <p className="text-[10px] text-navy/50">Minimalkan motion di seluruh dashboard</p>
                  </div>
                </div>
                <button
                  onClick={() => setReduceAnim(!reduceAnim)}
                  className={`w-11 h-6 rounded-full transition-all relative shrink-0 ${reduceAnim ? 'bg-steel' : 'bg-mist'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow-sm absolute top-1 transition-all ${reduceAnim ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              {/* Push notif — deskripsi khusus hubin */}
              <div className="flex items-center justify-between px-4 py-4 rounded-[16px] border border-mist/60 hover:bg-mist/30 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center shrink-0">
                    <Bell className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-navy">Notifikasi Push</p>
                    <p className="text-[10px] text-navy/50">Terima notifikasi data industri</p>
                  </div>
                </div>
                <button
                  onClick={() => setPushNotif(!pushNotif)}
                  className={`w-11 h-6 rounded-full transition-all relative shrink-0 ${pushNotif ? 'bg-steel' : 'bg-mist'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow-sm absolute top-1 transition-all ${pushNotif ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ TAB: PRIVACY & SECURITY ══════════ */}
      {activeTab === 'security' && (
        <div className="flex flex-col gap-4">
          {/* Change Password */}
          <div className="bg-white rounded-[24px] border border-mist/60 shadow-sm p-5 md:p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-[10px] bg-navy flex items-center justify-center shadow-md shadow-navy/20">
                <KeyRound className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-navy">Ubah Password</h2>
                <p className="text-[10px] text-navy/50 font-medium">Pastikan password baru minimal 6 karakter</p>
              </div>
            </div>

            {passwordMsg && (
              <div className={`mb-4 px-4 py-3 rounded-[12px] text-xs font-bold ${passwordMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {passwordMsg.text}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] font-bold text-navy/50 uppercase tracking-wide mb-1 block">Password Saat Ini</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="current"
                    value={passwordForm.current}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-3 bg-mist/30 border border-mist rounded-[16px] text-xs font-bold text-navy outline-none focus:border-steel focus:bg-white transition-all pr-10 placeholder:text-navy/40"
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
                  className="w-full px-4 py-3 bg-mist/30 border border-mist rounded-[16px] text-xs font-bold text-navy outline-none focus:border-steel focus:bg-white transition-all placeholder:text-navy/40"
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
                  className="w-full px-4 py-3 bg-mist/30 border border-mist rounded-[16px] text-xs font-bold text-navy outline-none focus:border-steel focus:bg-white transition-all placeholder:text-navy/40"
                  placeholder="Ulangi password baru"
                />
              </div>
              <button
                onClick={handlePasswordSubmit}
                disabled={passwordLoading}
                className="mt-2 w-full sm:w-auto px-6 py-3 bg-navy text-white rounded-[16px] text-xs font-bold hover:bg-navy/90 transition-colors shadow-md shadow-navy/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {passwordLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />} {passwordLoading ? 'Menyimpan...' : 'Update Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ TAB: DANGER ZONE ══════════ */}
      {activeTab === 'danger' && (
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
              <p className="text-xs font-bold text-red-600">Hapus Akun</p>
            </div>
            <p className="text-[10px] text-red-500/80 mb-4">
              Setelah akun Anda dihapus, semua data pemetaan industri dan siswa akan hilang secara permanen. Tindakan ini tidak dapat dibatalkan.
            </p>

            {deleteMsg && (
              <div className="mb-4 px-4 py-3 rounded-[12px] text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                {deleteMsg.text}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] font-bold text-red-500 uppercase tracking-wide mb-1 block">Password</label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-red-200 rounded-[12px] text-xs font-bold text-navy outline-none focus:border-red-400 transition-colors placeholder:text-navy/40"
                  placeholder="Masukkan password untuk konfirmasi"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-red-500 uppercase tracking-wide mb-1 block">Ketik HAPUS</label>
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-red-200 rounded-[12px] text-xs font-bold text-navy outline-none focus:border-red-400 transition-colors"
                  placeholder='Ketik "HAPUS" untuk konfirmasi'
                />
              </div>
            </div>
            <button
              disabled={deleteConfirm !== 'HAPUS' || !deletePassword || deleteLoading}
              onClick={handleDeleteAccount}
              className={`mt-4 w-full px-6 py-3 rounded-[16px] text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                deleteConfirm === 'HAPUS' && deletePassword && !deleteLoading
                  ? 'bg-red-500 text-white hover:bg-red-600 shadow-sm'
                  : 'bg-red-100 text-red-300 cursor-not-allowed'
              }`}
            >
              {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} {deleteLoading ? 'Menghapus...' : 'Hapus Akun'}
            </button>
          </div>
        </div>
      )}

      {/* ── SUPPORT CARD ── */}
      <div className="bg-navy rounded-[24px] p-5 relative overflow-hidden shadow-lg shadow-navy/20 shrink-0">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-10 h-10 rounded-[10px] bg-white/15 flex items-center justify-center shrink-0">
            <LifeBuoy className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">Butuh bantuan?</p>
            <p className="text-[11px] font-semibold text-white/60 mt-0.5">
              Tim support Go-PKL membalas dalam 24 jam.
            </p>
          </div>
          <button className="shrink-0 px-5 py-2.5 bg-white text-navy rounded-[16px] text-xs font-bold hover:bg-mist transition-colors">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};