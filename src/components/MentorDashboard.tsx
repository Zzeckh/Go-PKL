import React, { useState } from 'react';
import { 
  Users, CheckCircle2, Clock, Search, 
  Filter, Building, MessageSquare, AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface MentorDashboardProps {
  userName: string;
  companyName: string;
}

export const MentorDashboard: React.FC<MentorDashboardProps> = ({ userName, companyName }) => {
  const { logEntries, updateLogStatus, siswaList } = useApp();
  const [date] = useState(new Date());

  const pendingEntries = logEntries.filter(l => l.status === 'pending');

  return (
    <div className="h-full w-full flex flex-col gap-4">
      {/* ── Header & Quick Summary ── */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-black/50">
            {date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <h1 className="text-2xl font-bold text-black leading-tight mt-1">Welcome back, Mentor {userName.split(',')[0]}</h1>
          <div className="flex items-center gap-1.5 mt-2 bg-black/5 w-max px-2.5 py-1 rounded-full border border-black/10">
            <Building className="w-3.5 h-3.5 text-black/60" />
            <span className="text-[11px] font-bold text-black/80">{companyName}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <div className="bg-white/70 backdrop-blur-xl rounded-[24px] border border-white p-5 shadow-sm flex flex-col transition-all cursor-pointer">
          <Users className="w-6 h-6 text-black/40 mb-3" />
          <p className="text-3xl font-bold text-black">{siswaList.length}</p>
          <p className="text-xs font-bold text-black/60 mt-1 uppercase tracking-wide">Total Students</p>
        </div>
        <div className="bg-white/70 backdrop-blur-xl rounded-[24px] border border-white p-5 shadow-sm flex flex-col transition-all cursor-pointer">
          <CheckCircle2 className="w-6 h-6 text-black mb-3" />
          <p className="text-3xl font-bold text-black">{siswaList.length - 1} <span className="text-sm font-semibold text-black/50">/ {siswaList.length}</span></p>
          <p className="text-xs font-bold text-black/60 mt-1 uppercase tracking-wide">Present Today</p>
        </div>
        <div className="bg-white/70 backdrop-blur-xl rounded-[24px] border border-black/10 p-5 shadow-sm flex flex-col relative overflow-hidden transition-all cursor-pointer">
          <Clock className="w-6 h-6 text-black/80 mb-3 relative z-10" />
          <p className="text-3xl font-bold text-black relative z-10">{pendingEntries.length}</p>
          <p className="text-xs font-bold text-black/70 mt-1 uppercase tracking-wide relative z-10">Pending Logbooks</p>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-black/5 rounded-full blur-2xl"></div>
        </div>
        <div className="bg-white/70 backdrop-blur-xl rounded-[24px] border border-white p-5 shadow-sm flex flex-col transition-all cursor-pointer">
          <AlertCircle className="w-6 h-6 text-black/60 mb-3" />
          <p className="text-3xl font-bold text-black">0</p>
          <p className="text-xs font-bold text-black/60 mt-1 uppercase tracking-wide">Attendance Alert</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 animate-in fade-in duration-300 flex-1 min-h-0">
        
        {/* Catatan Mentor (Kiri) */}
        <div className="hidden lg:flex flex-col w-[300px] shrink-0 bg-white/70 backdrop-blur-xl rounded-[24px] border border-white shadow-sm h-full transition-all">
          <div className="flex items-center justify-between p-5 pb-3 shrink-0">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-black/60">Catatan</p>
              <p className="text-sm font-bold text-black">Catatan Mentor</p>
            </div>
            <button className="w-8 h-8 rounded-xl flex items-center justify-center border transition-all shadow-sm bg-white text-black/60 border-black/10">
              <Clock className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 mx-4 mb-4 bg-white/80 rounded-[20px] border border-black/5 overflow-hidden shadow-inner p-4 text-sm font-medium text-black/80 whitespace-pre-line leading-relaxed">
            - Briefing siswa hari Senin pukul 09.00
            - Cek logbook mingguan
            - Siapkan feedback evaluasi bulan pertama
          </div>
        </div>

        {/* Main Review Feed (Kanan) */}
        <div className="flex-1 bg-white/60 backdrop-blur-xl border border-white rounded-[24px] shadow-sm flex flex-col overflow-hidden transition-all">
          <div className="p-5 border-b border-black/5 shrink-0 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-black text-lg">Pending Logbook Reviews ({pendingEntries.length})</h3>
              <p className="text-xs font-semibold text-black/50 mt-0.5">Please review and approve student activities</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-white border border-black/10 rounded-xl px-3 py-1.5 flex items-center gap-2">
                <Search className="w-4 h-4 text-black/40" />
                <input type="text" placeholder="Search..." className="bg-transparent outline-none text-xs w-24 sm:w-40 font-semibold" />
              </div>
              <button className="p-2 border border-black/10 bg-white rounded-xl text-black/60">
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
            {pendingEntries.length > 0 ? (
              pendingEntries.map(log => (
                <div key={log.id} className="bg-white rounded-[24px] p-5 border border-black/5 shadow-sm flex flex-col lg:flex-row gap-5">
                  <div className="flex-1 flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-black/5 bg-black/5 flex items-center justify-center font-bold text-xs">
                        BS
                      </div>
                      <div>
                        <p className="font-bold text-sm text-black">Budi Santoso</p>
                        <p className="text-[10px] font-bold text-black/50">SMK Negeri 1 • {log.date}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-black">{log.title}</h4>
                      <p className="text-xs font-medium text-black/70 mt-1 leading-relaxed">{log.description}</p>
                    </div>
                  </div>
                  <div className="w-full lg:w-48 h-32 rounded-2xl overflow-hidden shrink-0 bg-black/5 relative border border-black/5">
                    <img src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=400&q=80" alt="Proof" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-row lg:flex-col gap-2 shrink-0 border-t lg:border-t-0 pt-4 lg:pt-0 border-black/5 lg:w-40 justify-center">
                    <button 
                      onClick={() => updateLogStatus(log.id, 'approved')}
                      className="flex-1 bg-black text-white py-2.5 rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Approve
                    </button>
                    <button 
                      onClick={() => updateLogStatus(log.id, 'revision', 'Perlu perbaikan deskripsi')}
                      className="flex-1 bg-white border border-black text-black py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4" /> Revise
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white p-8 rounded-[24px] border border-black/5 text-center">
                <CheckCircle2 className="w-8 h-8 text-black/30 mx-auto mb-2" />
                <p className="text-sm font-bold text-black">Semua logbook telah ditinjau!</p>
                <p className="text-xs text-black/50 mt-1">Tidak ada jurnal harian yang menunggu persetujuan.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
