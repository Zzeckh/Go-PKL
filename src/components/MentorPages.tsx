import React, { useState, useMemo } from 'react';
import { X, Award, Calendar, Search, ChevronRight, Activity, GraduationCap, Building, BookOpen, CheckCircle2, MessageSquare, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';

const getInitials = (name: string) =>
  (name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

/* ══════════════════════════════════════════════════════
   VERIFIKASI LOGBOOK SISWA (MENTOR)
   ══════════════════════════════════════════════════════ */
export const MentorLogbook: React.FC = () => {
  const { logEntries, updateLogStatus } = useApp();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'revision'>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () => logEntries.filter(l =>
      (filter === 'all' || l.status === filter) &&
      l.title.toLowerCase().includes(search.toLowerCase())
    ),
    [logEntries, filter, search]
  );

  const pendingCount = logEntries.filter(l => l.status === 'pending').length;
  const approvedCount = logEntries.filter(l => l.status === 'approved').length;
  const revisionCount = logEntries.filter(l => l.status === 'revision').length;

  const statusLabel = (s: string) =>
    s === 'approved' ? 'Disetujui' : s === 'revision' ? 'Revisi' : 'Menunggu';

  const statusPill = (s: string) =>
    s === 'approved' ? 'bg-steel/15 text-steel'
    : s === 'revision' ? 'bg-navy/10 text-navy'
    : 'bg-steel/10 text-steel';

  const tabs = [
    { key: 'all' as const, label: 'Semua', count: logEntries.length },
    { key: 'pending' as const, label: 'Menunggu', count: pendingCount },
    { key: 'approved' as const, label: 'Disetujui', count: approvedCount },
    { key: 'revision' as const, label: 'Revisi', count: revisionCount },
  ];

  return (
    <div className="h-full w-full flex flex-col gap-3 md:gap-4 overflow-hidden">
      <div className="flex items-center justify-between shrink-0 bg-white rounded-[24px] p-4 md:p-5 border border-mist/60 shadow-sm">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <div className="w-11 h-11 md:w-12 md:h-12 bg-navy rounded-2xl flex items-center justify-center text-white shadow-md shadow-navy/20 shrink-0">
            <BookOpen className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-lg md:text-xl text-navy leading-tight">Verifikasi Logbook</h2>
            <p className="text-[13px] text-navy/60 font-semibold mt-0.5 truncate">
              Tinjau jurnal harian siswa magang milik Anda
            </p>
          </div>
        </div>
        <span className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold text-steel bg-steel/10 border border-steel/20 px-3 py-2 rounded-full">
          <Clock className="w-3.5 h-3.5" /> {pendingCount} menunggu
        </span>
      </div>

      <div className="shrink-0 space-y-3">
        <div className="bg-shell p-1 rounded-xl flex gap-1 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                filter === t.key ? 'bg-white text-navy shadow-sm' : 'text-navy/60 hover:text-navy'
              }`}
            >
              {t.label}
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                filter === t.key ? 'bg-steel/15 text-steel' : 'bg-mist text-navy/50'
              }`}>{t.count}</span>
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/40" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari judul logbook..."
            className="w-full bg-white border border-mist/60 rounded-xl pl-10 pr-10 py-2.5 text-sm font-medium text-navy outline-none focus:border-steel transition-all"
          />
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[24px] border border-mist/60 shadow-sm overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-5">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-shell flex items-center justify-center mb-3">
                <BookOpen className="w-6 h-6 text-navy/30" />
              </div>
              <p className="text-sm font-bold text-navy mb-1">Tidak ada logbook</p>
              <p className="text-xs text-navy/50">Belum ada jurnal yang cocok dengan filter ini.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(log => (
                <div key={log.id} className="p-3.5 rounded-2xl border border-mist/60 bg-white hover:border-steel/30 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-navy text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {getInitials(log.title.split(' ')[0] || '?')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-navy truncate">{log.title}</p>
                        <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${statusPill(log.status)}`}>
                          {statusLabel(log.status)}
                        </span>
                      </div>
                      <p className="text-[11px] font-semibold text-navy/50 mt-0.5">
                        {log.date} · {log.hours} jam · {log.category}
                      </p>
                      {log.description && (
                        <p className="text-xs font-medium text-navy/70 mt-1.5 leading-relaxed">{log.description}</p>
                      )}
                    </div>
                  </div>
                  {log.status === 'pending' && (
                    <div className="flex items-center justify-end gap-2 mt-3 border-t border-mist/60 pt-2.5">
                      <button
                        onClick={() => updateLogStatus(log.id, 'revision', 'Perlu perbaikan deskripsi')}
                        className="text-[11px] font-bold bg-white border border-mist text-navy/70 px-3 py-1.5 rounded-lg hover:border-steel/40 hover:text-navy transition-colors flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Revisi
                      </button>
                      <button
                        onClick={() => updateLogStatus(log.id, 'approved')}
                        className="text-[11px] font-bold bg-steel text-white px-3 py-1.5 rounded-lg hover:bg-steel/90 transition-colors flex items-center gap-1.5 shadow-sm shadow-steel/25"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Setujui
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   KEHADIRAN SISWA (MENTOR)
   ══════════════════════════════════════════════════════ */
export const MentorAttendance: React.FC = () => {
  const { siswaList, attendances } = useApp();
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  const todayLabel = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });

  const filtered = useMemo(
    () => siswaList.filter(s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.perusahaan || '').toLowerCase().includes(search.toLowerCase())
    ),
    [siswaList, search]
  );

  const presentToday = siswaList.filter(s => (s.kehadiran || 0) >= 75).length;

  const stats = [
    { icon: GraduationCap, label: 'Total Siswa', value: siswaList.length },
    { icon: Activity, label: 'Rekap Kehadiran', value: `${siswaList.length ? Math.round(siswaList.reduce((a, s) => a + (s.kehadiran || 0), 0) / siswaList.length) : 0}%` },
    { icon: Calendar, label: 'Hadir Hari Ini (est.)', value: `${presentToday}/${siswaList.length}` },
  ];

  return (
    <div className="h-full w-full flex flex-col gap-3 md:gap-4 overflow-hidden">
      <div className="flex items-center justify-between shrink-0 bg-white rounded-[24px] p-4 md:p-5 border border-mist/60 shadow-sm">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <div className="w-11 h-11 md:w-12 md:h-12 bg-navy rounded-2xl flex items-center justify-center text-white shadow-md shadow-navy/20 shrink-0">
            <Activity className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-lg md:text-xl text-navy leading-tight truncate">Kehadiran Siswa Magang</h2>
            <p className="text-[13px] text-navy/60 font-semibold mt-0.5 truncate">
              {todayLabel}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-mist/60 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-shell flex items-center justify-center shrink-0">
              <s.icon className="w-5 h-5 text-steel" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold text-navy tabular-nums leading-none">{s.value}</p>
              <p className="text-[10px] font-bold text-navy/50 uppercase tracking-wide mt-1 truncate">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="shrink-0 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/40" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari nama atau perusahaan..."
          className="w-full bg-white border border-mist/60 rounded-xl pl-10 pr-10 py-2.5 text-sm font-medium text-navy outline-none focus:border-steel transition-all"
        />
      </div>

      <div className="flex-1 bg-white rounded-[24px] border border-mist/60 shadow-sm overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-5">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-navy/50">Tidak ada siswa ditemukan.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(s => {
                const pct = s.kehadiran || 0;
                const statusLabel = pct >= 75 ? 'Rajin' : pct >= 50 ? 'Cukup' : 'Perlu Perhatian';
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStudent(s)}
                    className="w-full p-3 rounded-2xl border border-mist/60 bg-white flex items-center gap-3 hover:border-steel/30 transition-all text-left group"
                  >
                    <div className="w-11 h-11 rounded-full bg-navy text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {getInitials(s.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-navy truncate">{s.name}</p>
                      <p className="text-[11px] font-semibold text-navy/50 truncate mt-0.5">
                        {s.kelas || '-'} · {s.perusahaan || '-'}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-shell rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: pct >= 75 ? 'var(--color-steel, #0f766e)' : pct >= 50 ? '#F59E0B' : '#F43F5E' }}
                          />
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                          pct >= 75 ? 'bg-steel/15 text-steel' : pct >= 50 ? 'bg-steel/10 text-steel' : 'bg-navy/10 text-navy'
                        }`}>
                          {pct}% · {statusLabel}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-navy/20 group-hover:text-steel group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedStudent && (
        <StudentDetailModal student={selectedStudent} attendances={attendances} onClose={() => setSelectedStudent(null)} />
      )}
    </div>
  );
};

const StudentDetailModal: React.FC<{ student: any; attendances: any[]; onClose: () => void }> = ({ student, attendances, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy/50 backdrop-blur-md">
      <div className="bg-white rounded-[24px] max-w-md w-full shadow-2xl border border-mist/60 overflow-hidden">
        <div className="p-5 border-b border-mist/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-navy text-white flex items-center justify-center font-bold text-sm">
              {getInitials(student.name)}
            </div>
            <div>
              <h3 className="text-lg font-bold text-navy leading-tight">{student.name}</h3>
              <p className="text-[11px] font-semibold text-navy/50">{student.kelas || '-'}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-mist/60 hover:bg-mist flex items-center justify-center">
            <X className="w-4 h-4 text-navy/60" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-3 bg-shell border border-mist rounded-xl p-3">
            <Building className="w-4 h-4 text-steel shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase text-navy/50">Tempat Magang</p>
              <p className="text-sm font-bold text-navy truncate">{student.perusahaan || '-'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-shell border border-mist rounded-xl p-3">
            <Activity className="w-4 h-4 text-steel shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase text-navy/50">Rekap Kehadiran</p>
              <p className="text-sm font-bold text-navy">{student.kehadiran || 0}%</p>
            </div>
          </div>
          <div className="w-full h-full overflow-y-auto custom-scrollbar text-[13px] font-medium text-navy/70 leading-relaxed bg-shell/60 border border-mist/60 rounded-xl p-3 max-h-40">
            <p className="text-[10px] font-bold uppercase text-navy/50 mb-2">Riwayat Absensi Terakhir</p>
            {attendances.length === 0 ? (
              <p className="text-xs text-navy/50">Belum ada data absensi.</p>
            ) : (
              <ul className="space-y-1">
                {attendances.slice(0, 5).map((a, i) => (
                  <li key={i} className="text-xs text-navy/70">• {a.date} — {a.status}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   ROSTER & PENILAIAN SISWA (MENTOR)
   ══════════════════════════════════════════════════════ */
export const MentorRoster: React.FC = () => {
  const { siswaList, submitEvaluation } = useApp();
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [gradeDUDI, setGradeDUDI] = useState('90');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openEval = (student: any) => {
    setSelectedStudent(student);
    setGradeDUDI(student.nilaiDUDI && student.nilaiDUDI !== '0' ? String(student.nilaiDUDI) : '90');
    setError(null);
    setShowEvalModal(true);
  };

  const handleSaveEval = async () => {
    if (!selectedStudent) return;
    setError(null);
    setLoading(true);
    try {
      await submitEvaluation(selectedStudent.id, Number(gradeDUDI), Number(selectedStudent.nilaiGuru || '85'));
      setShowEvalModal(false);
    } catch (err: any) {
      setError(err?.data?.error || err?.message || 'Gagal menyimpan evaluasi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col gap-3 md:gap-4 overflow-hidden">
      <div className="flex items-center justify-between shrink-0 bg-white rounded-[24px] p-4 md:p-5 border border-mist/60 shadow-sm">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <div className="w-11 h-11 md:w-12 md:h-12 bg-navy rounded-2xl flex items-center justify-center text-white shadow-md shadow-navy/20 shrink-0">
            <Award className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-lg md:text-xl text-navy leading-tight truncate">Roster & Penilaian Siswa</h2>
            <p className="text-[13px] text-navy/60 font-semibold mt-0.5 truncate">
              {siswaList.length} siswa magang
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[24px] border border-mist/60 shadow-sm overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-5">
          {siswaList.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-navy/50">Belum ada siswa magang.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {siswaList.map(student => (
                <div key={student.id} className="p-4 rounded-2xl border border-mist/60 bg-white hover:border-steel/30 transition-all flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-navy text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {getInitials(student.name)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-navy truncate">{student.name}</h4>
                      <p className="text-[11px] font-semibold text-navy/50 truncate">{student.kelas || '-'} · {student.perusahaan || '-'}</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div>
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wide mb-1">
                        <span className="text-navy/50">Kehadiran</span>
                        <span className="text-navy">{student.kehadiran || 0}%</span>
                      </div>
                      <div className="h-2 w-full bg-shell rounded-full overflow-hidden">
                        <div className="h-full bg-steel rounded-full" style={{ width: `${student.kehadiran || 0}%` }}></div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center bg-shell border border-mist p-2.5 rounded-xl">
                      <span className="text-xs font-bold text-navy/60">Nilai Industri</span>
                      <span className="text-sm font-bold text-navy tabular-nums">{student.nilaiDUDI || '0'}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => openEval(student)}
                    className="mt-auto w-full bg-steel text-white font-bold text-xs py-2.5 rounded-xl hover:bg-steel/90 shadow-sm shadow-steel/25 transition-colors flex items-center justify-center gap-2"
                  >
                    <Award className="w-4 h-4" /> Nilai & Evaluasi
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showEvalModal && selectedStudent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy/50 backdrop-blur-md">
          <div className="bg-white rounded-[24px] max-w-md w-full shadow-2xl border border-mist/60">
            <div className="p-5 border-b border-mist/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center">
                  <Award className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-navy leading-tight">Evaluasi Siswa Magang</h3>
                  <p className="text-[11px] font-semibold text-navy/50">{selectedStudent.name}</p>
                </div>
              </div>
              <button onClick={() => setShowEvalModal(false)} className="w-9 h-9 rounded-xl bg-mist/60 hover:bg-mist flex items-center justify-center">
                <X className="w-4 h-4 text-navy/60" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-[11px] font-bold text-navy/70 uppercase tracking-wide block mb-1.5">
                  Nilai Evaluasi Industri (0-100)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={gradeDUDI}
                  onChange={e => setGradeDUDI(e.target.value)}
                  className="w-full bg-shell border border-mist rounded-xl px-3 py-2.5 text-sm font-semibold text-navy outline-none focus:border-steel transition-all"
                />
              </div>
              {error && (
                <div className="p-3 bg-navy/5 border border-navy/15 rounded-xl text-xs font-semibold text-navy">
                  {error}
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowEvalModal(false)} className="flex-1 bg-mist/60 text-navy/70 font-bold text-sm py-3 rounded-xl">
                  Batal
                </button>
                <button onClick={handleSaveEval} disabled={loading} className="flex-1 bg-steel text-white font-bold text-sm py-3 rounded-xl hover:bg-steel/90 shadow-lg shadow-steel/25 disabled:opacity-60">
                  {loading ? 'Menyimpan...' : 'Simpan Evaluasi'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};