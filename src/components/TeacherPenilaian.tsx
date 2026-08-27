import React, { useState, useMemo } from 'react';
import { X, Award, Search, GraduationCap, Activity, Building, BookOpen, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

const getInitials = (name: string) =>
  (name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

/* ══════════════════════════════════════════════════════
   TEACHER PENILAIAN
   Guru input nilai Guru — melihat nilai Mentor (DUDI)
   Guru memegang otoritas nilai akhir PKL
   ══════════════════════════════════════════════════════ */
export const TeacherPenilaian: React.FC = () => {
  const { siswaList, submitGuruGrade } = useApp();
  const [search, setSearch] = useState('');
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [gradeGuru, setGradeGuru] = useState('85');
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}/${now.getFullYear() + 1}`;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<number | null>(null);

  const filtered = useMemo(
    () => siswaList.filter(s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.kelas || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.perusahaan || '').toLowerCase().includes(search.toLowerCase())
    ),
    [siswaList, search]
  );

  const gradedByGuru = siswaList.filter(s => s.nilaiGuru && s.nilaiGuru !== '0').length;
  const gradedByMentor = siswaList.filter(s => s.nilaiDUDI && s.nilaiDUDI !== '0').length;

  const avgGuru = gradedByGuru
    ? Math.round(
        siswaList
          .filter(s => s.nilaiGuru && s.nilaiGuru !== '0')
          .reduce((a, s) => a + (parseInt(s.nilaiGuru) || 0), 0) / gradedByGuru
      )
    : 0;

  const stats = [
    { icon: GraduationCap, label: 'Total Siswa', value: siswaList.length },
    { icon: BookOpen, label: 'Dinilai Mentor', value: `${gradedByMentor}/${siswaList.length}` },
    { icon: Award, label: 'Dinilai Guru', value: `${gradedByGuru}/${siswaList.length}` },
    { icon: Activity, label: 'Rata-rata Guru', value: avgGuru },
  ];

  const openEval = (student: any) => {
    setSelectedStudent(student);
    setGradeGuru(student.nilaiGuru && student.nilaiGuru !== '0' ? String(student.nilaiGuru) : '85');
    setError(null);
    setShowEvalModal(true);
  };

  const handleSaveGrade = async () => {
    if (!selectedStudent) return;
    setError(null);
    setLoading(true);
    try {
      await submitGuruGrade(selectedStudent.id, Number(gradeGuru), period);
      setShowEvalModal(false);
      setSaveSuccess(selectedStudent.id);
      setTimeout(() => setSaveSuccess(null), 2000);
    } catch (err: any) {
      setError(err?.data?.error || err?.message || 'Gagal menyimpan nilai guru.');
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
            <h2 className="font-bold text-lg md:text-xl text-navy leading-tight truncate">Penilaian Siswa</h2>
            <p className="text-[13px] text-navy/60 font-semibold mt-0.5 truncate">
              Input nilai guru & lihat nilai mentor untuk {siswaList.length} siswa
            </p>
          </div>
        </div>
      </div>

      {/* ── STATS ─ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-mist/60 rounded-[24px] p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center shrink-0">
              <s.icon className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-navy tabular-nums leading-none">{s.value}</p>
              <p className="text-[10px] font-bold text-navy/50 uppercase tracking-wide mt-1 truncate">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── SEARCH ─ */}
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

      {/* ── GRID CARD SISWA ─ */}
      <div className="flex-1 bg-white rounded-[24px] border border-mist/60 shadow-sm overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-5">
          {siswaList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-[10px] bg-navy flex items-center justify-center mb-3">
                <Award className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm font-bold text-navy mb-1">Belum ada siswa magang</p>
              <p className="text-xs text-navy/50">Siswa yang dipetakan ke perusahaan akan tampil di sini.</p>
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
              {filtered.map(student => {
                const hasMentorGrade = student.nilaiDUDI && student.nilaiDUDI !== '0';
                const hasGuruGrade = student.nilaiGuru && student.nilaiGuru !== '0';
                const justSaved = saveSuccess === student.id;

                return (
                  <div key={student.id} className="p-4 rounded-[24px] border border-mist/60 bg-white hover:border-steel/30 hover:shadow-sm transition-all flex flex-col gap-3">
                    {/* ── identitas ── */}
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-[10px] bg-navy text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-md shadow-navy/20">
                        {getInitials(student.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-bold text-sm text-navy truncate">{student.name}</h4>
                          {justSaved && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-steel shrink-0">
                              <CheckCircle2 className="w-3 h-3" /> Tersimpan
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-semibold text-navy/50 truncate mt-0.5">
                          {student.kelas || '-'} · {student.perusahaan || '-'}
                        </p>
                      </div>
                    </div>

                    {/* ── nilai Mentor & Guru berdampingan ── */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* Nilai Mentor (DUDI) */}
                      <div className="flex items-center gap-2 bg-mist/30 border border-mist/60 rounded-2xl p-2.5">
                        <div className="w-7 h-7 rounded-lg bg-steel flex items-center justify-center shrink-0">
                          <Building className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] font-bold uppercase text-navy/50">Mentor</p>
                          <p className="text-sm font-bold text-navy tabular-nums leading-tight">
                            {hasMentorGrade ? student.nilaiDUDI : <span className="text-navy/30">—</span>}
                          </p>
                        </div>
                        {hasMentorGrade && (
                          <span className="text-[10px] font-bold bg-steel text-white shadow-sm shadow-steel/30 px-2 py-0.5 rounded-full tabular-nums shrink-0">
                            ✓
                          </span>
                        )}
                      </div>

                      {/* Nilai Guru */}
                      <div className="flex items-center gap-2 bg-mist/30 border border-mist/60 rounded-2xl p-2.5">
                        <div className="w-7 h-7 rounded-lg bg-navy flex items-center justify-center shrink-0">
                          <GraduationCap className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] font-bold uppercase text-navy/50">Guru</p>
                          <p className="text-sm font-bold text-navy tabular-nums leading-tight">
                            {hasGuruGrade ? student.nilaiGuru : <span className="text-navy/30">—</span>}
                          </p>
                        </div>
                        {hasGuruGrade && (
                          <span className="text-[10px] font-bold bg-navy text-white shadow-sm shadow-navy/30 px-2 py-0.5 rounded-full tabular-nums shrink-0">
                            ✓
                          </span>
                        )}
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

                    {/* ── tombol input nilai guru ── */}
                    <button
                      onClick={() => openEval(student)}
                      className={`mt-auto w-full font-bold text-xs py-2.5 rounded-[24px] transition-colors flex items-center justify-center gap-2 ${
                        hasGuruGrade
                          ? 'bg-navy text-white shadow-md shadow-navy/20 hover:bg-navy/90'
                          : 'bg-steel text-white shadow-sm shadow-steel/25 hover:bg-steel/90'
                      }`}
                    >
                      <Award className="w-4 h-4" />
                      {hasGuruGrade ? `Nilai Guru: ${student.nilaiGuru}` : 'Input Nilai Guru'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL EVALUASI ── */}
      {showEvalModal && selectedStudent && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-3 sm:p-4 bg-navy/50 backdrop-blur-md">
          <div className="bg-white rounded-t-[24px] sm:rounded-[24px] max-w-md w-full shadow-2xl border border-mist/60 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-mist/60 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-[10px] bg-navy flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-navy leading-tight">Nilai Guru</h3>
                  <p className="text-[11px] font-semibold text-navy/50 truncate">{selectedStudent.name}</p>
                </div>
              </div>
              <button onClick={() => setShowEvalModal(false)} className="w-9 h-9 rounded-[10px] bg-mist/60 hover:bg-mist flex items-center justify-center shrink-0">
                <X className="w-4 h-4 text-navy/60" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
              {/* Nilai Mentor (read-only) */}
              <div className="bg-mist/30 border border-mist/60 rounded-[24px] p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-navy/50" />
                    <span className="text-xs font-bold text-navy/60">Nilai Mentor (DUDI)</span>
                  </div>
                  <span className="text-sm font-bold text-navy tabular-nums">
                    {selectedStudent.nilaiDUDI && selectedStudent.nilaiDUDI !== '0'
                      ? selectedStudent.nilaiDUDI
                      : <span className="text-navy/30">—</span>
                    }
                  </span>
                </div>
                <p className="text-[11px] text-navy/40 mt-1">Dinput oleh mentor industri. Tidak dapat diubah oleh guru.</p>
              </div>

              {/* Input: studentId, type, score, period */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-navy/70 uppercase tracking-wide block mb-1.5">studentId</label>
                  <div className="w-full bg-mist/30 border border-mist rounded-[24px] px-3 py-2.5 text-sm font-semibold text-navy tabular-nums">
                    {selectedStudent.id}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-navy/70 uppercase tracking-wide block mb-1.5">type</label>
                  <div className="w-full bg-mist/30 border border-mist rounded-[24px] px-3 py-2.5 text-sm font-semibold text-steel">
                    guru
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-navy/70 uppercase tracking-wide block mb-1.5">score (0-100) *</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={gradeGuru}
                    onChange={e => setGradeGuru(e.target.value)}
                    className="w-full bg-mist/30 border border-mist rounded-[24px] px-3 py-2.5 text-sm font-semibold text-navy outline-none focus:border-steel focus:bg-white transition-all tabular-nums"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-navy/70 uppercase tracking-wide block mb-1.5">period *</label>
                  <input
                    type="text"
                    value={period}
                    onChange={e => setPeriod(e.target.value)}
                    placeholder="Contoh: 2025/2026"
                    className="w-full bg-mist/30 border border-mist rounded-[24px] px-3 py-2.5 text-sm font-semibold text-navy outline-none focus:border-steel focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Preview Nilai Akhir */}
              <div className="bg-navy rounded-[24px] p-4">
                <p className="text-[11px] font-bold text-white/60 uppercase tracking-widest mb-2">Preview Nilai Akhir</p>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-white/60">Mentor</p>
                    <p className="text-xl font-bold text-white tabular-nums">
                      {selectedStudent.nilaiDUDI && selectedStudent.nilaiDUDI !== '0' ? selectedStudent.nilaiDUDI : '—'}
                    </p>
                  </div>
                  <div className="text-white/30 font-bold">+</div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-white/60">Guru</p>
                    <p className="text-xl font-bold text-white tabular-nums">{gradeGuru || '—'}</p>
                  </div>
                  <div className="text-white/30 font-bold">=</div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-white/60">Rata-rata</p>
                    <p className="text-xl font-bold text-white tabular-nums">
                      {(() => {
                        const d = parseInt(selectedStudent.nilaiDUDI) || 0;
                        const g = parseInt(gradeGuru) || 0;
                        if (d && g) return Math.round((d + g) / 2);
                        return g || d || 0;
                      })()}
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-navy/5 border border-navy/15 rounded-[24px] text-xs font-semibold text-navy">
                  {error}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowEvalModal(false)} className="flex-1 bg-mist/60 text-navy/70 font-bold text-sm py-3 rounded-[24px] hover:bg-mist transition-colors">
                  Batal
                </button>
                <button onClick={handleSaveGrade} disabled={loading} className="flex-1 bg-steel text-white font-bold text-sm py-3 rounded-[24px] hover:bg-steel/90 shadow-lg shadow-steel/25 disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
                  ) : (
                    <><Save className="w-4 h-4" /> Simpan Nilai Guru</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
