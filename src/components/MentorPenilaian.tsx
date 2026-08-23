import React, { useState } from 'react';
import { X, Award } from 'lucide-react';
import { useApp } from '../context/AppContext';

const getInitials = (name: string) =>
  (name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

/* ══════════════════════════════════════════════════════
   ROSTER & PENILAIAN SISWA (MENTOR)
   ══════════════════════════════════════════════════════ */
export const MentorPenilaian: React.FC = () => {
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

      <div className="flex-1 bg-white rounded-[24px] border border-mist/60 shadow-sm overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-5">
          {siswaList.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-navy/50">Belum ada siswa magang.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {siswaList.map(student => (
                <div key={student.id} className="p-4 rounded-[24px] border border-mist/60 bg-white hover:border-steel/30 transition-all flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-[10px] bg-navy text-white flex items-center justify-center font-bold text-sm shrink-0">
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
                    <div className="flex justify-between items-center bg-shell border border-mist p-2.5 rounded-[24px]">
                      <span className="text-xs font-bold text-navy/60">Nilai Industri</span>
                      <span className="text-sm font-bold text-navy tabular-nums">{student.nilaiDUDI || '0'}</span>
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

      {showEvalModal && selectedStudent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy/50 backdrop-blur-md">
          <div className="bg-white rounded-[24px] max-w-md w-full shadow-2xl border border-mist/60">
            <div className="p-5 border-b border-mist/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[10px] bg-navy flex items-center justify-center">
                  <Award className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-navy leading-tight">Evaluasi Siswa Magang</h3>
                  <p className="text-[11px] font-semibold text-navy/50">{selectedStudent.name}</p>
                </div>
              </div>
              <button onClick={() => setShowEvalModal(false)} className="w-9 h-9 rounded-[10px] bg-mist/60 hover:bg-mist flex items-center justify-center">
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
                  className="w-full bg-shell border border-mist rounded-[24px] px-3 py-2.5 text-sm font-semibold text-navy outline-none focus:border-steel transition-all"
                />
              </div>
              {error && (
                <div className="p-3 bg-navy/5 border border-navy/15 rounded-[24px] text-xs font-semibold text-navy">
                  {error}
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowEvalModal(false)} className="flex-1 bg-mist/60 text-navy/70 font-bold text-sm py-3 rounded-[24px]">
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
