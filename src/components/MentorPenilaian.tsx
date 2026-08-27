import React, { useState, useMemo } from 'react';
import { X, Award, Search, GraduationCap, Activity, Building } from 'lucide-react';
import { useApp } from '../context/AppContext';

const getInitials = (name: string) =>
  (name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

/* ══════════════════════════════════════════════════════
   ROSTER & PENILAIAN SISWA (MENTOR)
   ✅ Stats row + search + card nilai seragam design system
   ══════════════════════════════════════════════════════ */
export const MentorPenilaian: React.FC = () => {
  const { siswaList, submitEvaluation } = useApp();
  const [search, setSearch] = useState('');
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [gradeDUDI, setGradeDUDI] = useState('90');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(
    () => siswaList.filter(s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.kelas || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.perusahaan || '').toLowerCase().includes(search.toLowerCase())
    ),
    [siswaList, search]
  );

  const gradedCount = siswaList.filter(s => s.nilaiDUDI && s.nilaiDUDI !== '0').length;
  const avgDUDI = gradedCount
    ? Math.round(
        siswaList
          .filter(s => s.nilaiDUDI && s.nilaiDUDI !== '0')
          .reduce((a, s) => a + (parseInt(s.nilaiDUDI) || 0), 0) / gradedCount
      )
    : 0;

  const stats = [
    { icon: GraduationCap, label: 'Total Siswa', value: siswaList.length },
    { icon: Award, label: 'Sudah Dinilai', value: `${gradedCount}/${siswaList.length}` },
    { icon: Activity, label: 'Rata-rata Nilai DUDI', value: avgDUDI },
  ];

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
      {/* ── HEADER ─ */}
      <div className="flex items-center justify-between shrink-0 bg-white rounded-[24px] p-4 md:p-5 border border-mist/60 shadow-sm">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <div className="w-11 h-11 md:w-12 md:h-12 bg-navy rounded-[10px] flex items-center justify-center text-white shadow-md shadow-navy/20 shrink-0">
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

      {/* ── SEARCH BAR ── */}
      <div className="shrink-0 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/40" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari nama, kelas, atau perusahaan..."
          className="w-full bg-mist/40 border border-mist rounded-[24px] pl-10 pr-10 py-2.5 text-sm font-medium text-navy outline-none focus:border-steel focus:bg-white transition-all placeholder:text-navy/40"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-navy/10 hover:bg-navy/20 flex items-center justify-center transition-colors"
          >
            <X className="w-3 h-3 text-navy/60" />
          </button>
        )}
      </div>

      {/* ── GRID CARD SISWA ── */}
      <div className="flex-1 bg-white rounded-[24px] border border-mist/60 shadow-sm overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-5">
          {siswaList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-[10px] bg-navy flex items-center justify-center mb-3">
                <Award className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm font-bold text-navy mb-1">Belum ada siswa magang</p>
              <p className="text-xs text-navy/50">Siswa yang dipetakan ke perusahaan Anda akan tampil di sini.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-[10px] bg-navy flex items-center justify-center mb-3">
                <Search className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm font-bold text-navy mb-1">Siswa tidak ditemukan</p>
              <p className="text-xs text-navy/50">Tidak ada siswa yang cocok dengan pencarian ini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered.map(student => (
                <div key={student.id} className="p-4 rounded-[24px] border border-mist/60 bg-white hover:border-steel/30 hover:shadow-sm transition-all flex flex-col gap-3">
                  {/* ── identitas + nilai akhir ── */}
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-[10px] bg-navy text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-md shadow-navy/20">
                      {getInitials(student.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-sm text-navy truncate">{student.name}</h4>
                        {/* ✅ nilai akhir: solid steel pill */}
                        <span className="text-[10px] font-black bg-steel text-white shadow-sm shadow-steel/30 px-2.5 py-1 rounded-full tabular-nums shrink-0">
                          Akhir {student.finalNilai || '0'}
                        </span>
                      </div>
                      <p className="text-[11px] font-semibold text-navy/50 truncate mt-0.5">
                        {student.kelas || '-'} · {student.perusahaan || '-'}
                      </p>
                    </div>
                  </div>

                  {/* ── progress kehadiran ── */}
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-bold text-navy/50 uppercase tracking-wide shrink-0">Hadir</span>
                    <div className="flex-1 h-1.5 bg-mist/60 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white rounded-full transition-all"
                        style={{ width: `${Math.min(student.kehadiran || 0, 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-navy/50 tabular-nums w-8 text-right">{student.kehadiran || 0}%</span>
                  </div>

                  {/* ── nilai industri (full width) ── */}
                  <div className="flex items-center gap-2.5 bg-white border border-mist/60 shadow-sm rounded-2xl p-2.5">
                    <div className="w-7 h-7 rounded-lg bg-navy flex items-center justify-center shrink-0">
                      <Building className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold uppercase text-navy/50">Nilai Industri (DUDI)</p>
                      <p className="text-sm font-bold text-navy tabular-nums leading-tight">{student.nilaiDUDI || '0'}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => openEval(student)}
                    className="mt-auto w-full bg-steel text-white font-bold text-xs py-2.5 rounded-[24px] hover:bg-steel/90 shadow-sm shadow-steel/25 transition-colors flex items-center justify-center gap-2"
                  >
                    <Award className="w-4 h-4" /> Nilai & Evaluasi
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL EVALUASI ─ */}
      {showEvalModal && selectedStudent && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-3 sm:p-4 bg-navy/50 backdrop-blur-md">
          <div className="bg-white rounded-t-[24px] sm:rounded-[24px] max-w-md w-full shadow-2xl border border-mist/60 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-mist/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[10px] bg-navy flex items-center justify-center">
                  <Award className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-navy leading-tight">Evaluasi Siswa Magang</h3>
                  <p className="text-[11px] font-semibold text-navy/50 truncate">{selectedStudent.name}</p>
                </div>
              </div>
              <button onClick={() => setShowEvalModal(false)} className="w-9 h-9 rounded-[10px] bg-mist/60 hover:bg-mist flex items-center justify-center">
                <X className="w-4 h-4 text-navy/60" />
              </button>
            </div>
            <div className="p-4 sm:p-5 space-y-3 overflow-y-auto">
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
                  className="w-full bg-mist/30 border border-mist rounded-[24px] px-3 py-2.5 text-sm font-semibold text-navy outline-none focus:border-steel focus:bg-white transition-all tabular-nums"
                />
              </div>
              {error && (
                <div className="p-3 bg-navy/5 border border-navy/15 rounded-[24px] text-xs font-semibold text-navy">
                  {error}
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowEvalModal(false)} className="flex-1 bg-mist/60 text-navy/70 font-bold text-sm py-3 rounded-[24px] hover:bg-mist transition-colors">
                  Batal
                </button>
                <button onClick={handleSaveEval} disabled={loading} className="flex-1 bg-steel text-white font-bold text-sm py-3 rounded-[24px] hover:bg-steel/90 shadow-lg shadow-steel/25 disabled:opacity-60">
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