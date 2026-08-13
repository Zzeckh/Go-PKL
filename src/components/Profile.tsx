import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Building, Briefcase, Award, Calendar, Check, Edit2, Clock, Star, Users } from 'lucide-react';
import { UserRole } from '../types';

interface ProfileProps {
  userRole?: UserRole;
}

export const Profile: React.FC<ProfileProps> = ({ userRole = 'intern' }) => {
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<any>({});

  // Initialize profile based on role
  useEffect(() => {
    if (userRole === 'mentor') {
      setProfile({
        name: 'Siti Rahma, S.T.',
        school: 'PT Tokopedia',
        email: 'siti.rahma@tokopedia.com',
        phone: '+62 812-9999-8888',
        address: 'Tokopedia Tower, Jl. Prof. DR. Satrio No.11, Jakarta',
        company: 'PT Tokopedia',
        role: 'Mentor Industri',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      });
    } else if (userRole === 'teacher') {
      setProfile({
        name: 'Ahmad Fauzi, M.Kom',
        school: 'SMK Negeri 1 Jakarta',
        email: 'ahmad.fauzi@smkn1.sch.id',
        phone: '+62 856-1234-5678',
        address: 'Jl. Budi Utomo No.7, Jakarta Pusat',
        company: 'SMKN 1 Jakarta',
        role: 'Guru Pembimbing',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
      });
    } else if (userRole === 'hubin') {
      setProfile({
        name: 'Drs. Hendra Wijaya',
        school: 'SMK Negeri 1 Jakarta',
        email: 'hendra.hubin@smkn1.sch.id',
        phone: '+62 811-2233-4455',
        address: 'Jl. Budi Utomo No.7, Jakarta Pusat',
        company: 'Tim Hubin SMKN 1',
        role: 'Supervisor Hubin',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      });
    } else {
      setProfile({
        name: 'Budi Santoso',
        school: 'RPL · SMK Negeri 1 Jakarta',
        email: 'budi.santoso@student.smkn1.sch.id',
        phone: '+62 812-3456-7890',
        address: 'Jl. Kebon Kacang Raya No.15, Jakarta Pusat',
        company: 'PT Tokopedia',
        role: 'Frontend Developer Intern',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      });
    }
  }, [userRole]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setProfile({ ...profile, [e.target.name]: e.target.value });

  const getStats = () => {
    if (userRole === 'mentor') {
      return [
        { label: 'Siswa Dibimbing', value: '8' },
        { label: 'Pending Review', value: '12' },
        { label: 'Jurnal Disetujui', value: '142' },
        { label: 'Alert Aktif', value: '1' },
      ];
    } else if (userRole === 'teacher') {
      return [
        { label: 'Total Siswa', value: '45' },
        { label: 'Kunjungan', value: '12' },
        { label: 'Mitra Industri', value: '5' },
        { label: 'Alert Aktif', value: '3' },
      ];
    } else if (userRole === 'hubin') {
      return [
        { label: 'Siswa Aktif', value: '240' },
        { label: 'Mitra DUDI', value: '32' },
        { label: 'Guru Pendamping', value: '12' },
        { label: 'Evaluasi Masuk', value: '98%' },
      ];
    }
    return [
      { label: 'Hari Hadir', value: '45' },
      { label: 'Jurnal', value: '38' },
      { label: 'Sisa Hari', value: '45' },
      { label: 'Grade', value: 'A' },
    ];
  };

  const getDetailsCards = () => {
    if (userRole === 'mentor' || userRole === 'hubin') {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 min-h-0">
          <div className="bg-black rounded-[24px] p-5 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
            <div className="relative z-10 flex-1">
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-4">Informasi Mitra</p>
              <div className="flex flex-col gap-4">
                <div>
                  <h4 className="text-xl font-bold text-white mb-1">PT Tokopedia</h4>
                  <p className="text-xs text-white/70">Teknologi & E-Commerce</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-wide mb-1">Kuota PKL</p>
                  <p className="text-sm font-bold text-white">{userRole === 'hubin' ? '120 Siswa Total' : '8 / 10 Siswa Aktif'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-wide mb-1">Periode Program</p>
                  <p className="text-sm font-bold text-white">Gelombang 2 (Sep - Nov)</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white/80 rounded-[24px] border border-black/5 p-5 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
            <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest mb-1">{userRole === 'hubin' ? 'Sebaran Top DUDI' : 'Status Bimbingan'}</p>
            {[
              { icon: Users, label: userRole === 'hubin' ? 'PT Tokopedia' : 'SMK Negeri 1 Jakarta', value: userRole === 'hubin' ? '25 Siswa' : '5 Siswa' },
              { icon: Users, label: userRole === 'hubin' ? 'Gojek Indonesia' : 'SMK Taruna', value: userRole === 'hubin' ? '18 Siswa' : '2 Siswa' },
              { icon: Users, label: userRole === 'hubin' ? 'Traveloka' : 'SMKN 2', value: userRole === 'hubin' ? '15 Siswa' : '1 Siswa' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-black/60" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-black/40 uppercase tracking-wide">{label}</p>
                  <p className="text-xs font-bold text-black mt-1">{value}</p>
                </div>
              </div>
            ))}
            <button className="mt-auto w-full py-3 bg-black text-white rounded-xl text-xs font-bold hover:bg-black/80 transition-colors shadow-sm">
              Unduh Laporan Evaluasi
            </button>
          </div>
        </div>
      );
    }
    
    // intern logic
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 min-h-0">
        <div className="bg-black rounded-[24px] p-5 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4" />
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-3">Pembimbing Industri</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-white/5">
                <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80" alt="Mentor" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Siti Rahma, S.T.</p>
                <p className="text-xs font-semibold text-white/60 mt-0.5">Sr. Frontend Engineer</p>
              </div>
            </div>
          </div>
          <div className="w-full h-px bg-white/10 my-4 relative z-10" />
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-3">Pembimbing Sekolah</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-white/5">
                <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80" alt="Teacher" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Ahmad Fauzi, M.Kom</p>
                <p className="text-xs font-semibold text-white/60 mt-0.5">Guru Produktif RPL</p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white/80 rounded-[24px] border border-black/5 p-5 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
          {[
            { icon: Calendar, label: 'Durasi',          value: '01 Sep – 30 Nov 2024' },
            { icon: Award,    label: 'Evaluasi Bln 1',  value: 'A — Sangat Baik' },
            { icon: Clock,    label: 'Total Jam Kerja', value: '360 / 720 jam' },
            { icon: Star,     label: 'Poin Prestasi',   value: '1.250 poin' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-black/60" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-black/40 uppercase tracking-wide">{label}</p>
                <p className="text-xs font-bold text-black mt-1">{value}</p>
              </div>
            </div>
          ))}
          <button className="mt-auto w-full py-3 bg-black text-white rounded-xl text-xs font-bold hover:bg-black/80 transition-colors shadow-sm">
            Unduh Surat Penempatan PDF
          </button>
        </div>
      </div>
    );
  };

  const stats = getStats();

  if (!profile.name) return null;

  return (
    <div className="h-full w-full flex flex-col gap-4">
      {/* ── Hero Card ── */}
      <div className="c0 shrink-0 bg-white/70 backdrop-blur-xl rounded-[24px] overflow-hidden border border-white shadow-sm p-6 flex flex-col relative">
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setEditing(!editing)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border transition-all ${editing ? 'bg-black text-white border-black' : 'bg-white text-black border-black/10 hover:bg-black/5 hover:border-black/30'}`}
          >
            {editing ? <><Check className="w-4 h-4" /> Simpan</> : <><Edit2 className="w-4 h-4" /> Edit Profil</>}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pt-4">
          <div className="w-24 h-24 rounded-[24px] overflow-hidden border-4 border-white ring-2 ring-black/5 shadow-lg shrink-0 bg-black/5">
            <img src={profile.avatar} alt="Profile" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            {editing ? (
              <div className="flex flex-col gap-2 pt-2 items-center sm:items-start">
                <input name="name" value={profile.name} onChange={onChange} className="font-bold text-2xl text-black border-b-2 border-black/10 bg-transparent outline-none w-full max-w-xs focus:border-black transition-colors text-center sm:text-left" />
                <input name="school" value={profile.school} onChange={onChange} className="text-sm font-semibold text-black/60 border-b border-black/10 bg-transparent outline-none w-full max-w-sm focus:border-black transition-colors text-center sm:text-left" />
              </div>
            ) : (
              <div className="pt-2">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <h1 className="text-2xl font-bold text-black truncate">{profile.name}</h1>
                  <span className="shrink-0 bg-black text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">{userRole === 'intern' ? 'Aktif PKL' : userRole}</span>
                </div>
                <p className="text-sm font-semibold text-black/60 mt-1">{profile.school}</p>
              </div>
            )}
            
            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3 mt-4">
              {editing ? (
                <>
                  <div className="flex items-center gap-2 bg-white border border-black/10 px-3 py-2 rounded-xl text-xs font-bold text-black shadow-sm">
                    <Building className="w-4 h-4 text-black/40 shrink-0" />
                    <input name="company" value={profile.company} onChange={onChange} className="w-32 bg-transparent outline-none" />
                  </div>
                  <div className="flex items-center gap-2 bg-white border border-black/10 px-3 py-2 rounded-xl text-xs font-bold text-black shadow-sm">
                    <Briefcase className="w-4 h-4 text-black/40 shrink-0" />
                    <input name="role" value={profile.role} onChange={onChange} className="w-36 bg-transparent outline-none" />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 bg-white border border-black/5 shadow-sm px-4 py-2 rounded-xl text-xs font-bold text-black/80">
                    <Building className="w-4 h-4 text-black/40" /> {profile.company}
                  </div>
                  <div className="flex items-center gap-2 bg-white border border-black/5 shadow-sm px-4 py-2 rounded-xl text-xs font-bold text-black/80">
                    <Briefcase className="w-4 h-4 text-black/40" /> {profile.role}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-black/5 mt-6 pt-5 gap-4 sm:gap-0">
          {stats.map((s, i) => (
            <div key={s.label} className={`flex flex-col items-center py-1 ${i < 3 ? 'sm:border-r border-black/5' : ''}`}>
              <span className="text-3xl font-bold text-black tabular-nums">{s.value}</span>
              <span className="text-[10px] font-bold text-black/50 uppercase tracking-widest mt-1.5">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Details Grid ── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
        {/* Contact */}
        <div className="c1 bg-white/70 backdrop-blur-xl rounded-[24px] border border-white shadow-sm flex flex-col p-5 overflow-hidden hover:shadow-md transition-all duration-300">
          <p className="text-xs font-bold uppercase tracking-widest text-black/50 mb-4 shrink-0">Informasi Kontak</p>
          <div className="flex flex-col gap-3 flex-1 overflow-y-auto custom-scrollbar pr-2">
            {[
              { icon: Mail,   label: 'Email',   field: 'email'   as const, val: profile.email },
              { icon: Phone,  label: 'Telepon', field: 'phone'   as const, val: profile.phone },
              { icon: MapPin, label: 'Alamat',  field: 'address' as const, val: profile.address },
            ].map(({ icon: Icon, label, field, val }) => (
              <div key={field} className="flex items-start gap-4 bg-white/80 rounded-2xl border border-black/5 p-4 hover:shadow-sm transition-all group">
                <div className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center shrink-0 group-hover:bg-black transition-colors duration-300">
                  <Icon className="w-4 h-4 text-black/50 group-hover:text-white transition-colors duration-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-black/40 uppercase tracking-wide">{label}</p>
                  {editing ? (
                    <input name={field} value={val} onChange={onChange} className="w-full text-xs font-bold text-black border-b border-black/10 bg-transparent outline-none focus:border-black mt-1 transition-colors" />
                  ) : (
                    <p className="text-xs font-bold text-black/80 mt-1 line-clamp-2">{val}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Placement or Assignment Details */}
        <div className="c2 lg:col-span-2 bg-white/70 backdrop-blur-xl rounded-[24px] border border-white shadow-sm flex flex-col p-5 overflow-hidden hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <p className="text-xs font-bold uppercase tracking-widest text-black/50">
              {userRole === 'intern' ? 'Detail Penempatan PKL' : 'Detail Penugasan'}
            </p>
            {userRole === 'intern' && (
              <span className="text-[10px] font-bold bg-black text-white px-3 py-1.5 rounded-full">50% selesai</span>
            )}
          </div>
          {getDetailsCards()}
        </div>
      </div>
    </div>
  );
};
