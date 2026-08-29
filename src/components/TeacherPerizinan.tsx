import React, { useState } from 'react';
import { FileText, DownloadCloud, Check, X, CheckCircle2, AlertCircle, Hourglass } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { assetUrl } from '../utils/api';

const getInitials = (name: string) =>
  (name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

/* ══════════════════════════════════════════════════════
   TEACHER PERIZINAN
   ✅ Stats row + filter pills + pending diurutkan pertama
   ══════════════════════════════════════════════════════ */
export const TeacherPerizinan: React.FC = () => {
  const { perizinanList, updatePerizinanStatus } = useApp();
  const [filter, setFilter] = useState<FilterStatus>('all');

  const pending = perizinanList.filter(p => p.status === 'pending').length;
  const approved = perizinanList.filter(p => p.status === 'approved').length;
  const rejected = perizinanList.filter(p => p.status === 'rejected').length;

  const stats = [
    { icon: Hourglass, label: 'Menunggu', value: pending },
    { icon: CheckCircle2, label: 'Disetujui', value: approved },
    { icon: AlertCircle, label: 'Ditolak', value: rejected },
  ];

  /* ✅ filter + pending diurutkan paling atas */
  const filteredList = perizinanList
    .filter(req => filter === 'all' || req.status === filter)
    .sort((a, b) => (a.status === 'pending' ? 0 : 1) - (b.status === 'pending' ? 0 : 1));

  return (
    <div className="h-full w-full flex flex-col gap-3 md:gap-4 overflow-y-auto custom-scrollbar">
      {/* ── HEADER ─ */}
      <div className="flex items-center justify-between shrink-0 bg-white rounded-[24px] p-4 md:p-5 border border-mist/60 shadow-sm">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <div className="w-11 h-11 md:w-12 md:h-12 bg-navy rounded-[10px] flex items-center justify-center text-white shadow-md shadow-navy/20 shrink-0">
            <FileText className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-lg md:text-xl text-navy leading-tight">Verifikasi Perizinan & Surat Sakit</h2>
            <p className="text-[13px] text-navy/60 font-semibold mt-0.5 truncate">
              Tinjau dan setujui pengajuan izin absen siswa
            </p>
          </div>
        </div>
      </div>

      {/* ── STATS — icon chip navy solid + icon putih ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-mist/60 rounded-[24px] p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center shrink-0">
              <s.icon className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold text-navy tabular-nums leading-none">{s.value}</p>
              <p className="text-[10px] font-bold text-navy/50 uppercase tracking-wide mt-1 truncate">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── FILTER PILLS — aktif = steel solid ── */}
      <div className="shrink-0 bg-mist/40 p-1 rounded-[24px] flex gap-1 overflow-x-auto">
        {([
          { key: 'all', label: 'Semua', count: perizinanList.length },
          { key: 'pending', label: 'Menunggu', count: pending },
          { key: 'approved', label: 'Disetujui', count: approved },
          { key: 'rejected', label: 'Ditolak', count: rejected },
        ] as const).map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              filter === f.key ? 'bg-steel text-white shadow' : 'text-navy/60 hover:text-navy'
            }`}
          >
            {f.label}
            <span className={`text-[10px] tabular-nums ${filter === f.key ? 'text-white/80' : 'text-navy/40'}`}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── LIST PENGAJUAN ── */}
      <div className="lg:flex-1 bg-white rounded-[24px] border border-mist/60 shadow-sm flex flex-col overflow-hidden lg:min-h-0">
        <div className="lg:flex-1 overflow-y-auto custom-scrollbar p-4 md:p-5 grid grid-cols-1 lg:grid-cols-2 gap-3 content-start max-h-[65vh] lg:max-h-none">
          {perizinanList.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-[10px] bg-navy flex items-center justify-center mb-3">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm font-bold text-navy mb-1">Tidak ada pengajuan perizinan</p>
              <p className="text-xs text-navy/50">Semua izin telah diproses.</p>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-[10px] bg-navy flex items-center justify-center mb-3">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm font-bold text-navy mb-1">Tidak ada pengajuan dengan status ini</p>
              <p className="text-xs text-navy/50">Coba pilih filter status lainnya.</p>
            </div>
          ) : (
            filteredList.map(req => (
              <div key={req.id} className="bg-white rounded-[24px] p-5 border border-mist/60 shadow-sm flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4 border-b border-mist/60 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[10px] bg-navy text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-md shadow-navy/20">
                      {getInitials(req.name)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-navy">{req.name}</h4>
                      <p className="text-[11px] font-semibold text-navy/50">{req.company} • {req.date}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${
                    req.type === 'Sakit' ? 'bg-navy text-white' : 'bg-steel text-white shadow-sm shadow-steel/30'
                  }`}>
                    {req.type}
                  </span>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-navy/40 mb-1">Alasan</p>
                  <p className="text-xs font-semibold text-navy/80 leading-relaxed">{req.reason}</p>
                </div>

                {/* ✅ lampiran: icon chip navy solid */}
                <div className="flex items-center gap-3 bg-mist/30 p-3 rounded-2xl border border-mist/60">
                  <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  {req.attachment ? (
                    <>
                      <span className="text-xs font-bold text-navy truncate flex-1">Surat keterangan terlampir</span>
                      <a
                        href={assetUrl(req.attachment)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-steel text-white rounded-lg text-[11px] font-bold hover:bg-steel/90 transition-colors shrink-0"
                      >
                        <DownloadCloud className="w-3.5 h-3.5" /> Lihat Gambar
                      </a>
                    </>
                  ) : (
                    <span className="text-xs font-bold text-navy/50 truncate flex-1">Tidak ada lampiran</span>
                  )}
                </div>

                <div className="flex gap-2 mt-auto pt-1">
                  {req.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => updatePerizinanStatus(req.id, 'rejected')}
                        className="flex-1 py-3 bg-white border border-navy/20 text-navy rounded-[24px] text-xs font-bold flex items-center justify-center gap-2 hover:bg-navy/5 transition-colors"
                      >
                        <X className="w-4 h-4" /> Tolak Izin
                      </button>
                      <button
                        onClick={() => updatePerizinanStatus(req.id, 'approved')}
                        className="flex-1 py-3 bg-steel text-white rounded-[24px] text-xs font-bold shadow-md shadow-steel/25 flex items-center justify-center gap-2 hover:bg-steel/90 transition-colors"
                      >
                        <Check className="w-4 h-4" /> Setujui Izin
                      </button>
                    </>
                  ) : (
                    <div className={`w-full py-2 rounded-[24px] text-center border ${
                      req.status === 'approved'
                        ? 'bg-steel border-steel shadow-sm shadow-steel/30'
                        : 'bg-navy border-navy'
                    }`}>
                      <span className="text-xs font-bold capitalize text-white">
                        {req.status === 'approved' ? '✓ Disetujui' : '✕ Ditolak'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};