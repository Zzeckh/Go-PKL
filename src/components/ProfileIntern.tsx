import React, { useState, useEffect } from 'react';
import {
  Mail, Phone, MapPin, Building2, Briefcase, Award, Calendar,
  Check, Edit2, Clock, Star, BookMarked
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ProfileIntern: React.FC = () => {
  const { userName, userCompanyName, userCompanyAddress } = useApp();

  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<any>({});

  useEffect(() => {
    setProfile({
      name: userName || 'Budi Santoso',
      email: 'siswa@gopkl.id',
      phone: '+62 812-3456-7890',
      address: 'Jl. Kebon Kacang Raya No.15, Jakarta Pusat',
      company: userCompanyName || 'PT Teknologi Nusantara',
      role: 'Frontend Developer Intern',
      className: 'XII RPL 1',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    });
  }, [userName, userCompanyName, userCompanyAddress]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setProfile({ ...profile, [e.target.name]: e.target.value });

  const stats = [
    { label: 'Hari Hadir', value: '45' },
    { label: 'Jurnal', value: '38' },
    { label: 'Sisa Hari', value: '45' },
    { label: 'Grade', value: 'A' },
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
                  <span className="shrink-0 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider bg-steel">
                    Aktif PKL
                  </span>
                </div>
                <p className="text-sm font-semibold text-navy/60 mt-1">{profile.role}</p>
                <p className="text-xs text-navy/50 mt-0.5">Kelas: {profile.className}</p>
              </div>
            )}

            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3 mt-4">
              {editing ? (
                <>
                  <div className="flex items-center gap-2 bg-shell border border-mist px-3 py-2 rounded-[24px] text-xs font-bold text-navy shadow-sm">
                    <Building2 className="w-4 h-4 text-navy/40 shrink-0" />
                    <input name="company" value={profile.company} onChange={onChange} className="w-32 bg-transparent outline-none" />
                  </div>
                  <div className="flex items-center gap-2 bg-shell border border-mist px-3 py-2 rounded-[24px] text-xs font-bold text-navy shadow-sm">
                    <BookMarked className="w-4 h-4 text-navy/40 shrink-0" />
                    <input name="className" value={profile.className} onChange={onChange} className="w-24 bg-transparent outline-none" />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 bg-shell border border-mist shadow-sm px-4 py-2 rounded-[24px] text-xs font-bold text-navy/80">
                    <Building2 className="w-4 h-4 text-navy/40" /> {profile.company}
                  </div>
                  <div className="flex items-center gap-2 bg-shell border border-mist shadow-sm px-4 py-2 rounded-[24px] text-xs font-bold text-navy/80">
                    <BookMarked className="w-4 h-4 text-navy/40" /> {profile.className}
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
      <div className="lg:flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 lg:min-h-0">
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

        {/* Detail Penempatan PKL */}
        <div className="lg:col-span-2 bg-white rounded-[24px] border border-mist/60 shadow-sm flex flex-col p-5 overflow-hidden hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <p className="text-xs font-bold uppercase tracking-widest text-navy/50">Detail Penempatan PKL</p>
            <span className="text-[10px] font-bold bg-steel text-white px-3 py-1.5 rounded-full">50% selesai</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:flex-1 lg:min-h-0">
            <div className="bg-navy rounded-[24px] p-5 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-steel/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4" />
              <div className="relative z-10">
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-3">Pembimbing Industri</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[10px] overflow-hidden border border-white/10 shrink-0 bg-white/5">
                    <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80" alt="Mentor" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Mentor Industri</p>
                    <p className="text-xs font-semibold text-white/60 mt-0.5">Sr. Frontend Engineer</p>
                  </div>
                </div>
              </div>
              <div className="w-full h-px bg-white/10 my-4 relative z-10" />
              <div className="relative z-10">
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-3">Pembimbing Sekolah</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[10px] overflow-hidden border border-white/10 shrink-0 bg-white/5">
                    <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80" alt="Teacher" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Guru Pembimbing</p>
                    <p className="text-xs font-semibold text-white/60 mt-0.5">Guru Produktif RPL</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-shell rounded-[24px] border border-mist p-5 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
              {[
                { icon: Calendar, label: 'Durasi', value: '01 Sep – 30 Nov 2025' },
                { icon: Award, label: 'Evaluasi Bln 1', value: 'A — Sangat Baik' },
                { icon: Clock, label: 'Total Jam Kerja', value: '360 / 720 jam' },
                { icon: Star, label: 'Poin Prestasi', value: '1.250 poin' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-[10px] bg-white flex items-center justify-center shrink-0 shadow-sm">
                    <Icon className="w-4 h-4 text-navy/60" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-navy/40 uppercase tracking-wide">{label}</p>
                    <p className="text-xs font-bold text-navy mt-1">{value}</p>
                  </div>
                </div>
              ))}
              <button className="mt-auto w-full py-3 bg-navy text-white rounded-[24px] text-xs font-bold hover:bg-navy/90 transition-colors shadow-sm">
                Unduh Surat Penempatan PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
