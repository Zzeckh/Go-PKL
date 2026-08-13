import React, { useState } from 'react';
import { Compass, MapPin, CheckCircle2, Navigation, Users, Clock } from 'lucide-react';
import { PKLMapLocation, AttendanceRecord } from '../types';

interface MapsProps {
  locations: PKLMapLocation[];
  attendances: AttendanceRecord[];
  onCheckIn: () => void;
}

export const Maps: React.FC<MapsProps> = ({ locations, attendances, onCheckIn }) => {
  const [selectedLocation, setSelectedLocation] = useState<string>(locations[0].id);
  const [mapLayer, setMapLayer] = useState<'street' | 'satellite'>('street');
  const activeLoc = locations.find(l => l.id === selectedLocation) || locations[0];
  const todayString = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const hasCheckedIn = attendances.some(a => a.date === todayString);

  return (
    <div className="h-full w-full flex flex-col gap-4">

      {/* ── Header ── */}
      <div className="c0 shrink-0 bg-white/70 backdrop-blur-xl rounded-[24px] border border-white shadow-sm p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center">
            <Compass className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-black/50">Real-time GPS</p>
            <h2 className="text-xl font-bold text-black">Geofencing & Lokasi PKL</h2>
          </div>
        </div>
        <div className="bg-black/5 p-1 rounded-full flex gap-1">
          <button onClick={() => setMapLayer('street')} className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${mapLayer === 'street' ? 'bg-black text-white shadow' : 'text-black/60 hover:text-black'}`}>Jalan</button>
          <button onClick={() => setMapLayer('satellite')} className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${mapLayer === 'satellite' ? 'bg-black text-white shadow' : 'text-black/60 hover:text-black'}`}>Satelit</button>
        </div>
      </div>

      {/* ── Map + Sidebar ── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">

        {/* Map */}
        <div className="c1 lg:col-span-2 bg-white/70 backdrop-blur-xl rounded-[24px] border border-white shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all duration-300">
          <div className="flex-1 relative overflow-hidden">
            {/* Base background */}
            <div className={`absolute inset-0 transition-all duration-700 ${mapLayer === 'satellite' ? 'bg-gradient-to-br from-black/80 via-black/70 to-black/90' : 'bg-gradient-to-br from-white via-black/5 to-black/10'}`} />

            {/* Grid / road pattern */}
            {mapLayer === 'street' ? (
              <>
                <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                <div className="absolute top-1/2 left-0 right-0 h-4 bg-white shadow-sm -translate-y-1/2" />
                <div className="absolute left-1/2 top-0 bottom-0 w-4 bg-white shadow-sm -translate-x-1/2" />
                <div className="absolute top-[35%] left-0 w-full h-3 bg-white/70" style={{ transform: 'rotate(-8deg) scaleX(1.5)', transformOrigin: 'left center' }} />
              </>
            ) : (
              <>
                <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
                <div className="absolute top-1/2 left-0 right-0 h-3 bg-white/20 -translate-y-1/2" />
                <div className="absolute left-1/2 top-0 bottom-0 w-3 bg-white/20 -translate-x-1/2" />
              </>
            )}

            {/* Geofence ring */}
            <div
              className="absolute rounded-full border-[2px] border-dashed border-black/30 pointer-events-none transition-all duration-500"
              style={{ width: '180px', height: '180px', left: `${activeLoc.coordinates.x}%`, top: `${activeLoc.coordinates.y}%`, transform: 'translate(-50%,-50%)' }}
            />
            <div
              className="absolute rounded-full pointer-events-none"
              style={{ width: '180px', height: '180px', left: `${activeLoc.coordinates.x}%`, top: `${activeLoc.coordinates.y}%`, transform: 'translate(-50%,-50%)', background: mapLayer === 'satellite' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }}
            />

            {/* Pins */}
            {locations.map(loc => {
              const isSel = selectedLocation === loc.id;
              return (
                <button
                  key={loc.id}
                  onClick={() => setSelectedLocation(loc.id)}
                  style={{ left: `${loc.coordinates.x}%`, top: `${loc.coordinates.y}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${isSel ? 'scale-125 z-30' : 'hover:scale-110 z-10'}`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl border-2 transition-all ${isSel ? 'bg-black border-black ring-4 ring-black/20' : 'bg-white border-white hover:border-black/30'}`}>
                    <MapPin className={`w-5 h-5 ${isSel ? 'text-white' : 'text-black/60'}`} />
                  </div>
                  {isSel && (
                    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-black text-white text-xs font-bold px-3 py-2 rounded-xl shadow-xl whitespace-nowrap animate-in fade-in zoom-in-95 duration-200">
                      {loc.companyName}
                      <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-black rotate-45 -z-10" />
                    </div>
                  )}
                </button>
              );
            })}

            {/* GPS badge */}
            <div className="absolute left-4 bottom-4 bg-white px-4 py-2.5 rounded-2xl border border-black/5 shadow-lg flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-20" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-black" />
              </span>
              <span className="text-xs font-bold text-black">GPS Aktif · Dalam Radius</span>
            </div>

            {/* Layer label */}
            <div className="absolute right-4 top-4 bg-white/90 backdrop-blur-sm text-xs font-bold text-black/70 px-3 py-1.5 rounded-full border border-black/5 shadow-sm">
              {mapLayer === 'street' ? '🗺 Peta Jalan' : '🛰 Satelit'}
            </div>
          </div>
        </div>

        {/* Details panel */}
        <div className="c2 bg-white/70 backdrop-blur-xl rounded-[24px] border border-white shadow-sm flex flex-col p-5 overflow-hidden hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <p className="text-xs font-bold uppercase tracking-widest text-black/50">Lokasi Aktif</p>
            <span className="text-xs font-bold bg-black text-white px-3 py-1.5 rounded-full">{activeLoc.distance}</span>
          </div>

          <div className="shrink-0 mb-4">
            <h3 className="text-base font-bold text-black leading-snug">{activeLoc.companyName}</h3>
            <p className="text-sm font-medium text-black/60 mt-1 leading-relaxed">{activeLoc.address}</p>
          </div>

          <div className="flex flex-col gap-3 flex-1 overflow-y-auto custom-scrollbar pr-2">
            {[
              { icon: MapPin,      label: 'Kategori',       value: activeLoc.category },
              { icon: Users,       label: 'Pembimbing',     value: activeLoc.mentorName },
              { icon: Navigation,  label: 'Radius Aman',    value: 'Maks 1.5 km' },
              { icon: Clock,       label: 'Operasional',    value: '07:00 – 17:00 WIB' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-4 bg-white/80 border border-black/5 rounded-2xl p-4 hover:shadow-sm transition-all">
                <div className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-black/70" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-black/40 uppercase tracking-wide">{label}</p>
                  <p className="text-sm font-bold text-black truncate mt-1">{value}</p>
                </div>
              </div>
            ))}

            {/* Geofence status */}
            <div className="bg-black text-white rounded-2xl p-4 flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-30" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
              </span>
              <div>
                <p className="text-xs font-bold text-white/50 uppercase tracking-wide">Geofence</p>
                <p className="text-sm font-bold text-white mt-1">Terverifikasi · Dalam Area</p>
              </div>
            </div>
          </div>

          <button
            onClick={onCheckIn}
            disabled={hasCheckedIn}
            className={`mt-4 w-full py-3.5 rounded-2xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-sm shrink-0 ${
              hasCheckedIn
                ? 'bg-black/10 text-black/50 cursor-not-allowed'
                : 'bg-black text-white hover:bg-black/80 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0'
            }`}
          >
            {hasCheckedIn
              ? <><CheckCircle2 className="w-5 h-5" /> Tervalidasi · Sudah Check-in</>
              : <><Navigation className="w-5 h-5" /> Validasi Kehadiran</>
            }
          </button>
        </div>
      </div>
    </div>
  );
};
