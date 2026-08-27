import React, { useState, useEffect } from 'react';
import {
  Mail, Phone, MapPin, Building2, Briefcase,
  Check, Edit2, Users, BookMarked, ShieldCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ProfileSuperAdmin: React.FC = () => {
  const { userName } = useApp();

  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<any>({});

  useEffect(() => {
    setProfile({
      name: userName || 'Super Admin',
      email: 'superadmin@gopkl.id',
      phone: '+62 811-0000-0000',
      address: 'Kantor Pusat Go-PKL, Jakarta',
      company: 'Go-PKL Indonesia',
      role: 'Super Administrator',
      className: '-',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80',
    });
  }, [userName]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setProfile({ ...profile, [e.target.name]: e.target.value });

  const stats = [
    { label: 'Total Kelas', value: '2' },
    { label: 'Total Pengguna', value: '5' },
    { label: 'Mitra DUDI', value: '1' },
    { label: 'Uptime', value: '99%' },
  ];

  if (!profile.name) return null;

  return (
    <div className="h-full w-full flex flex-col gap-4 overflow-y-auto custom-scrollbar p-4 md:p-6">
      {/* ── Hero Card ── */}
      <div className="shrink-0 bg-white rounded-[24px] overflow-hidden border border-mist/60 shadow-sm p-6 flex flex-col relative">
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={() => setEditing(!editing)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border transition-all ${
              editing
                ? 'bg-steel text-white border-steel'
                : 'bg-white text-navy border-mist hover:border-steel/40 hover:bg-shell'
            }`}
          >
            {editing ? <><Check className="w-4 h-4" /> Simpan</> : <><Edit2 className="w-4 h-4" /> Edit Profil</>}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pt-4">
          <div className="w-24 h-24 rounded-[10px] overflow-hidden border-4 border-white ring-2 ring-mist/60 shadow-lg shrink-0 bg-navy flex items-center justify-center">
            <img
              src={profile.avatar}
              alt="Profile"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <div className="flex-1 text-center sm:text-left min-w-0">
            {editing ? (
              <div className="flex flex-col gap-2 pt-2 items-center sm:items-start">
                <input
                  name="name"
                  value={profile.name}
                  onChange={onChange}
                  className="font-bold text-2xl text-navy border-b-2 border-mist bg-transparent outline-none w-full max-w-xs focus:border-steel transition-colors text-center sm:text-left"
                />
                <input
                  name="role"
                  value={profile.role}
                  onChange={onChange}
                  className="text-sm font-semibold text-navy/60 border-b border-mist bg-transparent outline-none w-full max-w-sm focus:border-steel transition-colors text-center sm:text-left"
                />
              </div>
            ) : (
              <div className="pt-2">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <h1 className="text-2xl font-bold text-navy truncate">{profile.name}</h1>
                  <span className="shrink-0 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider bg-navy">
                    Super Admin
                  </span>
                </div>
                <p className="text-sm font-semibold text-navy/60 mt-1">{profile.role}</p>
              </div>
            )}

            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3 mt-4">
              {editing ? (
                <div className="flex items-center gap-2 bg-shell border border-mist px-3 py-2 rounded-[24px] text-xs font-bold text-navy shadow-sm">
                  <Building2 className="w-4 h-4 text-navy/40 shrink-0" />
                  <input name="company" value={profile.company} onChange={onChange} className="w-32 bg-transparent outline-none" />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 bg-shell border border-mist shadow-sm px-4 py-2 rounded-[24px] text-xs font-bold text-navy/80">
                    <Building2 className="w-4 h-4 text-navy/40" /> {profile.company}
                  </div>
                  <div className="flex items-center gap-2 bg-shell border border-mist shadow-sm px-4 py-2 rounded-[24px] text-xs font-bold text-navy/80">
                    <Briefcase className="w-4 h-4 text-navy/40" /> {profile.role}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-mist/60 mt-6 pt-5 gap-4 sm:gap-0">
          {stats.map((s, i) => (
            <div key={s.label} className={`flex flex-col items-center py-1 ${i < 3 ? 'sm:border-r border-mist/60' : ''}`}>
              <span className="text-3xl font-bold text-navy tabular-nums">{s.value}</span>
              <span className="text-[10px] font-bold text-navy/50 uppercase tracking-widest mt-1.5">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Details Grid ── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
        {/* Contact */}
        <div className="bg-white rounded-[24px] border border-mist/60 shadow-sm flex flex-col p-5 overflow-hidden hover:shadow-md transition-all duration-300">
          <p className="text-xs font-bold uppercase tracking-widest text-navy/50 mb-4 shrink-0">Informasi Kontak</p>
          <div className="flex flex-col gap-3 flex-1 overflow-y-auto custom-scrollbar pr-2">
            {[
              { icon: Mail, label: 'Email', field: 'email' as const, val: profile.email },
              { icon: Phone, label: 'Telepon', field: 'phone' as const, val: profile.phone },
              { icon: MapPin, label: 'Alamat', field: 'address' as const, val: profile.address },
            ].map(({ icon: Icon, label, field, val }) => (
              <div key={field} className="flex items-start gap-4 bg-shell rounded-[24px] border border-mist p-4 hover:shadow-sm transition-all group">
                <div className="w-10 h-10 rounded-[10px] bg-white flex items-center justify-center shrink-0 group-hover:bg-steel transition-colors duration-300 shadow-sm">
                  <Icon className="w-4 h-4 text-navy/50 group-hover:text-white transition-colors duration-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-navy/40 uppercase tracking-wide">{label}</p>
                  {editing ? (
                    <input
                      name={field}
                      value={val}
                      onChange={onChange}
                      className="w-full text-xs font-bold text-navy border-b border-mist bg-transparent outline-none focus:border-steel mt-1 transition-colors"
                    />
                  ) : (
                    <p className="text-xs font-bold text-navy/80 mt-1 line-clamp-2">{val}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Akses Global */}
        <div className="lg:col-span-2 bg-white rounded-[24px] border border-mist/60 shadow-sm flex flex-col p-5 overflow-hidden hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <p className="text-xs font-bold uppercase tracking-widest text-navy/50">Akses Global</p>
            <span className="text-[10px] font-bold bg-navy text-white px-3 py-1.5 rounded-full">FULL ACCESS</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 min-h-0">
            <div className="bg-navy rounded-[24px] p-5 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-steel/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
              <div className="relative z-10 flex-1">
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-4">Akses Global</p>
                <div className="flex flex-col gap-4">
                  <div>
                    <h4 className="text-xl font-bold text-white mb-1">Go-PKL Indonesia</h4>
                    <p className="text-xs text-white/70">Sistem Manajemen PKL Nasional</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-wide mb-1">Total Kelas</p>
                    <p className="text-sm font-bold text-white">2 Kelas Aktif</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-wide mb-1">Tahun Akademik</p>
                    <p className="text-sm font-bold text-white">2025/2026</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-shell rounded-[24px] border border-mist p-5 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
              <p className="text-[10px] font-bold text-navy/40 uppercase tracking-widest mb-1">Role Terkelola</p>
              {[
                { icon: BookMarked, label: 'Siswa PKL', value: '1 User' },
                { icon: Users, label: 'Guru Pembimbing', value: '1 User' },
                { icon: Briefcase, label: 'Mentor Industri', value: '1 User' },
                { icon: ShieldCheck, label: 'Tim Hubin', value: '1 User' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-[10px] bg-white flex items-center justify-center shrink-0 shadow-sm">
                    <Icon className="w-4 h-4 text-steel" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-navy/40 uppercase tracking-wide">{label}</p>
                    <p className="text-xs font-bold text-navy mt-1">{value}</p>
                  </div>
                </div>
              ))}
              <button className="mt-auto w-full py-3 bg-navy text-white rounded-[24px] text-xs font-bold hover:bg-navy/90 transition-colors shadow-sm">
                Unduh Laporan Global
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
