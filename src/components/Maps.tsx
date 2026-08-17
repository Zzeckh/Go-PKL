import React, { useState } from 'react';
import { 
  Compass, MapPin, CheckCircle2, Navigation, Users, Clock, 
  Building2, Layers, Plus, Minus, LocateFixed, Tag, ShieldCheck,
  GraduationCap, Briefcase
} from 'lucide-react';
import { PKLMapLocation, AttendanceRecord } from '../types';
import { useApp } from '../context/AppContext';

interface MapsProps {
  locations: PKLMapLocation[];
  attendances: AttendanceRecord[];
  onCheckIn: () => void;
}

const getInitials = (name: string) => {
  if (!name || name === '-') return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export const Maps: React.FC<MapsProps> = ({ locations, attendances, onCheckIn }) => {
  const { siswaList } = useApp();
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [mapLayer, setMapLayer] = useState<'street' | 'satellite'>('street');

  const activeLoc = locations.find(l => l.id === selectedLocation) || locations[0] || null;
  const todayString = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const hasCheckedIn = attendances.some(a => a.date === todayString);
  const totalInterns = locations.reduce((s, l) => s + (l.internsCount || 0), 0);

  /* ── Empty state ── */
  if (!activeLoc) {
    return (
      <div className="h-full w-full flex items-center justify-center p-4">
        <div className="bg-white rounded-[24px] border border-mist/60 shadow-sm max-w-sm w-full flex flex-col items-center text-center p-8">
          <div className="w-16 h-16 rounded-2xl bg-[#F1F4F8] flex items-center justify-center mb-4">
            <Compass className="w-7 h-7 text-navy/40" />
          </div>
          <h2 className="text-lg font-bold text-navy mb-1">Belum Ada Lokasi PKL</h2>
          <p className="text-sm text-navy/60 leading-relaxed">
            Titik koordinat perusahaan akan muncul di sini setelah admin menambahkan data pemetaan.
          </p>
        </div>
      </div>
    );
  }

  /* ── Data pembimbing untuk lokasi aktif ── */
  const mentorName = activeLoc.mentorName || 'Mentor Industri';
  const teacherName =
    siswaList.find(s => s.perusahaan === activeLoc.companyName && s.guruPembimbing !== '-')?.guruPembimbing
    || 'Guru Pembimbing';

  return (
    <div className="h-full w-full flex flex-col gap-3 md:gap-4 overflow-hidden">

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between shrink-0 bg-white rounded-[24px] p-4 md:p-5 border border-mist/60 shadow-sm">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <div className="w-11 h-11 md:w-12 md:h-12 bg-navy rounded-2xl flex items-center justify-center text-white shadow-md shadow-navy/20 shrink-0">
            <Compass className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-lg md:text-xl text-navy leading-tight">Geofencing & Lokasi PKL</h2>
            <p className="text-[13px] text-navy/60 font-semibold mt-0.5 truncate">
              Pantau titik koordinat perusahaan mitra secara real-time
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden md:flex items-center gap-1.5 text-[11px] font-bold text-navy/60 bg-[#F1F4F8] border border-[#E2E8F0] px-3 py-2 rounded-full">
            <Building2 className="w-3.5 h-3.5" />
            {locations.length} Lokasi · {totalInterns} Siswa
          </span>
          <div className="bg-[#F1F4F8] p-1 rounded-xl flex gap-1">
            <button 
              onClick={() => setMapLayer('street')} 
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                mapLayer === 'street' ? 'bg-white text-navy shadow-sm' : 'text-navy/60 hover:text-navy'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Jalan
            </button>
            <button 
              onClick={() => setMapLayer('satellite')} 
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                mapLayer === 'satellite' ? 'bg-navy text-white shadow-sm' : 'text-navy/60 hover:text-navy'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Satelit
            </button>
          </div>
        </div>
      </div>

      {/* ── MAIN GRID ── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-3 md:gap-4 min-h-0">

        {/* ══ LEFT: MAP CANVAS (Peta Sebaran — tanpa label nama perusahaan) ══ */}
        <div className="lg:col-span-3 bg-white rounded-[24px] border border-mist/60 shadow-sm overflow-hidden flex flex-col min-h-[380px] lg:min-h-0">
          <div className="flex items-center justify-between px-4 md:px-5 pt-4 pb-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-steel/15 flex items-center justify-center">
                <MapPin className="w-3.5 h-3.5 text-steel" />
              </div>
              <p className="text-[13px] font-bold uppercase tracking-widest text-navy/70">Peta Sebaran</p>
            </div>
            <span className={`text-[11px] font-bold px-3 py-1.5 rounded-full border ${
              mapLayer === 'street' 
                ? 'bg-[#F1F4F8] text-navy/60 border-[#E2E8F0]' 
                : 'bg-navy text-white border-navy'
            }`}>
              {mapLayer === 'street' ? '🗺️ Peta Jalan' : '🛰️ Satelit'}
            </span>
          </div>

          <div className="flex-1 relative overflow-hidden mx-4 md:mx-5 mb-4 md:mb-5 rounded-[20px] border border-navy/10">

            {/* ── Base layer: STREET ── */}
            {mapLayer === 'street' ? (
              <div className="absolute inset-0 bg-[#EDF1F7] transition-colors duration-500">
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M0,80 C18,76 30,88 52,86 C74,84 86,94 100,90 L100,100 L0,100 Z" fill="#DCE7F2" />
                  <rect x="6" y="8" width="22" height="18" rx="2" fill="#E4F0F1" />
                  <rect x="70" y="10" width="24" height="16" rx="2" fill="#E4F0F1" />
                  <rect x="8" y="64" width="18" height="12" rx="2" fill="#E4F0F1" />
                  <rect x="36" y="6" width="26" height="20" rx="2" fill="#E7EBF2" />
                  <rect x="8" y="34" width="20" height="20" rx="2" fill="#E7EBF2" />
                  <rect x="38" y="34" width="24" height="20" rx="2" fill="#E7EBF2" />
                  <rect x="70" y="34" width="24" height="20" rx="2" fill="#E7EBF2" />
                  <rect x="36" y="62" width="26" height="14" rx="2" fill="#E7EBF2" />
                  <rect x="70" y="62" width="24" height="14" rx="2" fill="#E7EBF2" />
                  <path d="M0,30 L100,30" stroke="#FFFFFF" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
                  <path d="M0,58 L100,58" stroke="#FFFFFF" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
                  <path d="M32,0 L32,100" stroke="#FFFFFF" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
                  <path d="M66,0 L66,100" stroke="#FFFFFF" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
                  <path d="M0,30 C20,22 44,40 66,30" stroke="#FFFFFF" strokeWidth="1.5" fill="none" opacity="0.9" vectorEffect="non-scaling-stroke" />
                  <path d="M32,58 C44,66 56,52 66,58" stroke="#FFFFFF" strokeWidth="1.5" fill="none" opacity="0.9" vectorEffect="non-scaling-stroke" />
                </svg>
              </div>
            ) : (
              /* ── Base layer: SATELLITE ── */
              <div className="absolute inset-0 bg-navy transition-colors duration-500">
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <rect x="4" y="6" width="26" height="22" rx="3" fill="#FFFFFF" opacity="0.05" />
                  <rect x="38" y="8" width="26" height="18" rx="3" fill="#FFFFFF" opacity="0.07" />
                  <rect x="70" y="6" width="26" height="22" rx="3" fill="#FFFFFF" opacity="0.04" />
                  <rect x="6" y="36" width="22" height="20" rx="3" fill="#FFFFFF" opacity="0.06" />
                  <rect x="36" y="34" width="26" height="22" rx="3" fill="#FFFFFF" opacity="0.05" />
                  <rect x="70" y="36" width="26" height="20" rx="3" fill="#FFFFFF" opacity="0.07" />
                  <rect x="8" y="64" width="20" height="16" rx="3" fill="#FFFFFF" opacity="0.04" />
                  <rect x="36" y="64" width="26" height="16" rx="3" fill="#FFFFFF" opacity="0.06" />
                  <rect x="70" y="64" width="26" height="16" rx="3" fill="#FFFFFF" opacity="0.05" />
                  <path d="M0,30 L100,30" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.15" vectorEffect="non-scaling-stroke" />
                  <path d="M0,58 L100,58" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.15" vectorEffect="non-scaling-stroke" />
                  <path d="M32,0 L32,100" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.15" vectorEffect="non-scaling-stroke" />
                  <path d="M66,0 L66,100" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.15" vectorEffect="non-scaling-stroke" />
                </svg>
              </div>
            )}

            {/* ── Geofence ring ── */}
            <div
              className="absolute rounded-full border-2 border-dashed border-steel/60 pointer-events-none transition-all duration-500"
              style={{ 
                width: '170px', height: '170px', 
                left: `${activeLoc.coordinates.x}%`, top: `${activeLoc.coordinates.y}%`, 
                transform: 'translate(-50%,-50%)' 
              }}
            />
            <div
              className="absolute rounded-full pointer-events-none transition-all duration-500"
              style={{ 
                width: '170px', height: '170px', 
                left: `${activeLoc.coordinates.x}%`, top: `${activeLoc.coordinates.y}%`, 
                transform: 'translate(-50%,-50%)', 
                background: 'rgba(74,124,140,0.10)' 
              }}
            />

            {/* ── Pins (tanpa tooltip nama perusahaan) ── */}
            {locations.map((loc) => {
              const isSel = selectedLocation === loc.id || (!selectedLocation && loc.id === activeLoc.id);
              return (
                <button
                  key={loc.id}
                  onClick={() => setSelectedLocation(loc.id)}
                  style={{ left: `${loc.coordinates.x}%`, top: `${loc.coordinates.y}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${isSel ? 'z-30' : 'z-10 hover:z-20'}`}
                >
                  {isSel && (
                    <span className="absolute inset-0 -m-2 rounded-full bg-steel/30 animate-ping pointer-events-none" />
                  )}
                  <div className={`relative w-11 h-11 rounded-full flex items-center justify-center shadow-lg border-2 transition-all duration-300 ${
                    isSel 
                      ? 'bg-steel border-white ring-4 ring-steel/25 scale-110' 
                      : 'bg-white border-white hover:scale-105'
                  }`}>
                    <MapPin className={`w-5 h-5 ${isSel ? 'text-white' : 'text-navy/60'}`} />
                    <span className={`absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center border ${
                      isSel ? 'bg-navy text-white border-navy' : 'bg-[#F1F4F8] text-navy/70 border-mist'
                    }`}>
                      {loc.internsCount}
                    </span>
                  </div>
                </button>
              );
            })}

            {/* ── GPS badge ── */}
            <div className="absolute left-3 bottom-3 bg-white/95 backdrop-blur-sm px-3.5 py-2.5 rounded-xl border border-mist shadow-lg flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-steel opacity-30" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-steel" />
              </span>
              <span className="text-xs font-bold text-navy">GPS Aktif · Dalam Radius</span>
            </div>

            {/* ── Locate me ── */}
            <button className={`absolute left-3 top-3 w-9 h-9 rounded-xl border shadow-lg flex items-center justify-center transition-colors ${
              mapLayer === 'street' 
                ? 'bg-white/95 border-mist text-steel hover:bg-[#F1F4F8]' 
                : 'bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm'
            }`}>
              <LocateFixed className="w-4 h-4" />
            </button>

            {/* ── Zoom controls ── */}
            <div className={`absolute right-3 bottom-3 flex flex-col rounded-xl overflow-hidden border shadow-lg ${
              mapLayer === 'street' ? 'bg-white/95 border-mist' : 'bg-white/10 border-white/20 backdrop-blur-sm'
            }`}>
              <button className={`w-9 h-9 flex items-center justify-center transition-colors ${
                mapLayer === 'street' ? 'text-navy/70 hover:bg-[#F1F4F8]' : 'text-white hover:bg-white/10'
              }`}>
                <Plus className="w-4 h-4" />
              </button>
              <div className={`h-px ${mapLayer === 'street' ? 'bg-mist' : 'bg-white/20'}`} />
              <button className={`w-9 h-9 flex items-center justify-center transition-colors ${
                mapLayer === 'street' ? 'text-navy/70 hover:bg-[#F1F4F8]' : 'text-white hover:bg-white/10'
              }`}>
                <Minus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ══ RIGHT: STACKED CARDS ══ */}
        <div className="lg:col-span-2 flex flex-col gap-3 md:gap-4 min-h-0">

          {/* ── Card navy: Lokasi Aktif ── */}
          <div className="bg-navy rounded-[24px] p-5 shrink-0 relative overflow-hidden shadow-lg shadow-navy/20">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-white/60">Lokasi Aktif</p>
                </div>
                <span className="text-[11px] font-bold bg-white/15 text-white px-3 py-1.5 rounded-full">
                  {activeLoc.distance && activeLoc.distance !== '-' ? activeLoc.distance : 'Terpilih'}
                </span>
              </div>

              <h4 className="font-bold text-base text-white leading-tight">{activeLoc.companyName}</h4>
              <p className="text-[13px] font-medium text-white/60 mt-1 leading-relaxed">
                {activeLoc.address}
              </p>

              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border bg-steel/20 border-steel/40">
                  <div className="flex items-center gap-2 min-w-0">
                    <ShieldCheck className="w-4 h-4 text-steel shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[12px] font-bold text-white leading-tight">Geofence Terverifikasi</p>
                      <p className="text-[11px] text-white/60 font-semibold">
                        Radius aman · {activeLoc.internsCount} siswa aktif
                      </p>
                    </div>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-steel animate-pulse shrink-0" />
                </div>
              </div>
            </div>
          </div>

          {/* ── Card putih: Stats + CTA ── */}
          <div className="bg-white rounded-[24px] border border-mist/60 shadow-sm p-4 shrink-0">
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-[#F1F4F8] border border-[#E2E8F0] rounded-xl px-3 py-2.5 flex items-center gap-2.5">
                <Tag className="w-4 h-4 text-navy/50 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-navy/50 uppercase tracking-wide leading-none">Kategori</p>
                  <p className="text-[13px] font-bold text-navy truncate mt-1">{activeLoc.category}</p>
                </div>
              </div>
              <div className="bg-[#F1F4F8] border border-[#E2E8F0] rounded-xl px-3 py-2.5 flex items-center gap-2.5">
                <Users className="w-4 h-4 text-navy/50 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-navy/50 uppercase tracking-wide leading-none">Siswa PKL</p>
                  <p className="text-[13px] font-bold text-navy mt-1">{activeLoc.internsCount} orang</p>
                </div>
              </div>
              <div className="bg-[#F1F4F8] border border-[#E2E8F0] rounded-xl px-3 py-2.5 flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-navy/50 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-navy/50 uppercase tracking-wide leading-none">Operasional</p>
                  <p className="text-[13px] font-bold text-navy mt-1">07:00 – 17:00</p>
                </div>
              </div>
              <div className="bg-[#F1F4F8] border border-[#E2E8F0] rounded-xl px-3 py-2.5 flex items-center gap-2.5">
                <Navigation className="w-4 h-4 text-navy/50 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-navy/50 uppercase tracking-wide leading-none">Status</p>
                  <p className="text-[13px] font-bold text-steel mt-1">Aktif</p>
                </div>
              </div>
            </div>

            <button
              onClick={onCheckIn}
              disabled={hasCheckedIn}
              className={`w-full py-3.5 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                hasCheckedIn
                  ? 'bg-mist/70 text-navy/40 cursor-not-allowed'
                  : 'bg-steel text-white hover:bg-steel/90 hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-steel/25'
              }`}
            >
              {hasCheckedIn
                ? <><CheckCircle2 className="w-4 h-4" /> Sudah Check-in Hari Ini</>
                : <><Navigation className="w-4 h-4" /> Validasi Kehadiran</>
              }
            </button>
          </div>

          {/* ── Card putih: PEMBIMBING ── */}
          <div className="bg-white rounded-[24px] border border-mist/60 shadow-sm p-4 flex-1 flex flex-col min-h-[200px]">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-mist flex items-center justify-center">
                  <Users className="w-3.5 h-3.5 text-navy" />
                </div>
                <p className="text-[13px] font-bold text-navy">Pembimbing</p>
              </div>
              <span className="text-[11px] font-bold text-navy/40 tabular-nums">2 orang</span>
            </div>

            <div className="flex-1 flex flex-col gap-2.5 min-h-0 overflow-y-auto custom-scrollbar pr-1">
              
              {/* Guru Pembimbing */}
              <div className="p-3.5 rounded-2xl border border-mist/60 bg-[#F1F4F8]/60 hover:border-navy/30 transition-all shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-navy text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-md shadow-navy/20">
                    {getInitials(teacherName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-navy truncate">{teacherName}</p>
                    <p className="text-[11px] font-semibold text-navy/50 mt-0.5 truncate">
                      Monitoring akademik & kunjungan
                    </p>
                  </div>
                  <span className="text-[10px] font-bold bg-navy text-white px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
                    <GraduationCap className="w-3 h-3" /> GURU
                  </span>
                </div>
              </div>

              {/* Mentor — Pembimbing Industri */}
              <div className="p-3.5 rounded-2xl border border-steel/30 bg-steel/5 hover:border-steel/50 transition-all shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-steel text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-md shadow-steel/25">
                    {getInitials(mentorName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-navy truncate">{mentorName}</p>
                    <p className="text-[11px] font-semibold text-navy/50 mt-0.5 truncate">
                      Bimbingan harian · {activeLoc.companyName}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold bg-steel text-white px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
                    <Briefcase className="w-3 h-3" /> MENTOR
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};