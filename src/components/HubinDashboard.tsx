import React, { useState } from 'react';
import { 
  Users, Building, ShieldCheck, 
  MapPin, Briefcase, GraduationCap, ChevronRight
} from 'lucide-react';
import { ActivePage } from '../types';
import { useApp } from '../context/AppContext';

interface HubinDashboardProps {
  userName?: string;
  schoolName: string;
  onNavigate?: (page: ActivePage) => void;
}

export const HubinDashboard: React.FC<HubinDashboardProps> = ({ schoolName, onNavigate }) => {
  const { siswaList, perusahaanList, guruList, mentorList } = useApp();
  const [date] = useState(new Date());

  return (
    <div className="h-full w-full flex flex-col gap-4 animate-in fade-in duration-300">
      {/* ── Header & Quick Summary ── */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-black/50">
            {date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <h1 className="text-2xl font-bold text-black leading-tight">Panel Pengawasan Hubin - {schoolName}</h1>
          </div>
          <div className="flex items-center gap-1.5 mt-2 bg-black/5 w-max px-2.5 py-1 rounded-full border border-black/10">
            <ShieldCheck className="w-3.5 h-3.5 text-black/60" />
            <span className="text-[11px] font-bold text-black/80">Monitoring Hubin Area</span>
          </div>
        </div>
      </div>

      {/* ── Scrollable Main View ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4 flex flex-col gap-4 min-h-0">
        
        {/* Top 4 Stat Cards - DYNAMIC COUNTS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
          <div 
            onClick={() => onNavigate && onNavigate('data-siswa')}
            className="bg-white/70 backdrop-blur-xl rounded-[24px] border border-white p-5 shadow-sm flex flex-col transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <GraduationCap className="w-6 h-6 text-black/40 transition-colors" />
              <ChevronRight className="w-4 h-4 text-black/20 transition-colors" />
            </div>
            <p className="text-3xl font-bold text-black">{siswaList.length}</p>
            <p className="text-xs font-bold text-black/60 mt-1 uppercase tracking-wide">Siswa Magang</p>
          </div>

          <div 
            onClick={() => onNavigate && onNavigate('data-siswa')}
            className="bg-white/70 backdrop-blur-xl rounded-[24px] border border-white p-5 shadow-sm flex flex-col transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <Building className="w-6 h-6 text-black/40 transition-colors" />
              <ChevronRight className="w-4 h-4 text-black/20 transition-colors" />
            </div>
            <p className="text-3xl font-bold text-black">{perusahaanList.length}</p>
            <p className="text-xs font-bold text-black/60 mt-1 uppercase tracking-wide">Perusahaan Mitra</p>
          </div>

          <div 
            onClick={() => onNavigate && onNavigate('data-pembimbing')}
            className="bg-white/70 backdrop-blur-xl rounded-[24px] border border-white p-5 shadow-sm flex flex-col transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <Users className="w-6 h-6 text-black/40 transition-colors" />
              <ChevronRight className="w-4 h-4 text-black/20 transition-colors" />
            </div>
            <p className="text-3xl font-bold text-black">{guruList.length}</p>
            <p className="text-xs font-bold text-black/60 mt-1 uppercase tracking-wide">Guru Pembimbing</p>
          </div>

          <div 
            onClick={() => onNavigate && onNavigate('data-pembimbing')}
            className="bg-white/70 backdrop-blur-xl rounded-[24px] border border-white p-5 shadow-sm flex flex-col transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <Briefcase className="w-6 h-6 text-black/40 transition-colors" />
              <ChevronRight className="w-4 h-4 text-black/20 transition-colors" />
            </div>
            <p className="text-3xl font-bold text-black">{mentorList.length}</p>
            <p className="text-xs font-bold text-black/60 mt-1 uppercase tracking-wide">Mentor DUDI</p>
          </div>
        </div>

        {/* SECTION: Ringkasan Pemetaan - DYNAMIC COMPANY LIST */}
        <div className="bg-white/70 backdrop-blur-xl border border-white rounded-[24px] shadow-sm flex flex-col overflow-hidden shrink-0 transition-all">
          <div className="p-4 border-b border-black/5 bg-white/40 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-black text-sm">Ringkasan Pemetaan Distribusi Siswa</h3>
              <p className="text-[11px] font-semibold text-black/50">Sebaran penempatan magang siswa di DUDI mitra</p>
            </div>
            {onNavigate && (
              <button 
                onClick={() => onNavigate('data-siswa')}
                className="text-xs font-bold text-black bg-white px-3 py-1.5 rounded-xl border border-black/10 transition-all shadow-sm"
              >
                Lihat Detail Data Siswa
              </button>
            )}
          </div>
          <div className="flex flex-col lg:flex-row p-4 gap-4 bg-white/30">
            {/* Visual Map */}
            <div className="w-full lg:w-72 h-48 relative bg-white border border-black/10 rounded-[20px] shrink-0 overflow-hidden group cursor-pointer shadow-sm">
              <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-transform duration-500">
                <div className="w-32 h-32 border border-black/10 rounded-full absolute -inset-10 animate-pulse"></div>
                <div className="w-10 h-10 bg-black text-white rounded-[12px] flex items-center justify-center shadow-xl border-2 border-white relative z-10">
                  <Building className="w-5 h-5" />
                </div>
              </div>
              <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-black/10 shadow-sm text-[10px] font-bold text-black flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-black/50" /> Peta Pusat
              </div>
            </div>
            {/* Mapping List */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 overflow-y-auto h-48 custom-scrollbar">
              {perusahaanList.map(c => {
                const countSiswa = siswaList.filter(s => s.perusahaan.toLowerCase() === c.name.toLowerCase()).length;
                return (
                  <div 
                    key={c.id} 
                    onClick={() => onNavigate && onNavigate('data-siswa')}
                    className="bg-white p-4 rounded-[20px] border border-black/10 shadow-sm flex flex-col gap-3 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h5 className="font-bold text-xs text-black">{c.name}</h5>
                      <span className="text-[9px] font-bold bg-black/5 px-2.5 py-1 rounded-lg border border-black/10 whitespace-nowrap">{countSiswa} Siswa</span>
                    </div>
                    <div className="text-[10px] font-semibold text-black/60 flex items-center gap-2 mt-auto">
                      <Briefcase className="w-3.5 h-3.5 text-black/40" /> Mentor: {c.mentor}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
