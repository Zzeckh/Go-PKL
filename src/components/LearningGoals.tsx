import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  BadgeCheck,
  CheckCircle2,
  Eye,
  Info,
  Loader2,
  RefreshCw,
  Save,
  Target,
  User,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import {
  display,
  errorMessage,
  GoalsPayload,
  goalRoleHint,
  LearningGoal,
} from '../utils/learning';
import { LearningStudentSelector } from './LearningStudentSelector';

type Notice = { type: 'success' | 'error'; message: string };

export const LearningGoals: React.FC = () => {
  const { userRole, userId } = useApp();
  const isStudent = userRole === 'intern';

  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(
    isStudent ? userId : null
  );
  const [data, setData] = useState<GoalsPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [notice, setNotice] = useState<Notice | null>(null);
  const [savingGoals, setSavingGoals] = useState(false);
  const [goalError, setGoalError] = useState<string | null>(null);

  useEffect(() => {
    if (isStudent) setSelectedStudentId(userId ?? null);
  }, [isStudent, userId]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!selectedStudentId) {
      setData(null);
      setLoadError(null);
      return;
    }

    let active = true;
    setLoading(true);
    setLoadError(null);
    setGoalError(null);

    api
      .get<GoalsPayload>(`/api/learning/students/${selectedStudentId}/goals`)
      .then((response) => {
        if (!active) return;
        setData(response);
      })
      .catch((error: any) => {
        if (!active) return;
        setData(null);
        setLoadError(errorMessage(error, 'Gagal memuat tujuan pembelajaran.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedStudentId, reloadKey]);

  const updateGoalLocal = (id: number, patch: Partial<LearningGoal>) => {
    setData((current) =>
      current
        ? {
            ...current,
            goals: current.goals.map((goal) => (goal.id === id ? { ...goal, ...patch } : goal)),
          }
        : current
    );
    setGoalError(null);
  };

  const handleSaveGoals = async () => {
    if (!data?.access.canEditGoals) return;

    const invalid = data.goals.find(
      (goal) =>
        goal.score !== null &&
        (!Number.isInteger(goal.score) || goal.score < 10 || goal.score > 100)
    );

    if (invalid) {
      setGoalError('Nilai harus berupa bilangan bulat 10 sampai 100.');
      return;
    }

    setSavingGoals(true);
    setGoalError(null);
    try {
      const response = await api.put<{ goals: LearningGoal[] }>(
        `/api/learning/students/${data.student.id}/goals`,
        {
          goals: data.goals.map((goal) => ({
            id: goal.id,
            score: goal.score,
            description: goal.description,
          })),
        }
      );
      setData((current) => (current ? { ...current, goals: response.goals } : current));
      setNotice({ type: 'success', message: 'Nilai tujuan pembelajaran berhasil disimpan.' });
    } catch (error: any) {
      setGoalError(errorMessage(error, 'Gagal menyimpan nilai tujuan pembelajaran.'));
    } finally {
      setSavingGoals(false);
    }
  };

  const canEditGoals = Boolean(data?.access.canEditGoals);

  return (
    <div className="h-full w-full flex flex-col gap-3 md:gap-4 overflow-y-auto custom-scrollbar">
      {/* ── HEADER ── */}
      <div className="shrink-0 bg-white rounded-[24px] border border-mist/60 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-[10px] bg-navy flex items-center justify-center shadow-md shadow-navy/20 shrink-0">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-steel">
                Logbook PKL
              </p>
              <h2 className="text-xl font-bold text-navy leading-tight">Tujuan Pembelajaran</h2>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 self-start sm:self-center text-[11px] font-bold text-navy bg-mist/40 border border-mist px-3 py-2 rounded-full">
            <Info className="w-3.5 h-3.5 text-steel" />
            {userRole === 'mentor'
              ? 'Mentor'
              : userRole === 'teacher'
              ? 'Guru · lihat saja'
              : userRole === 'hubin'
              ? 'Hubin · lihat saja'
              : 'Siswa · lihat saja'}
          </span>
        </div>

        <p className="text-[12px] sm:text-[13px] font-medium text-navy/60 mt-3 leading-relaxed">
          {goalRoleHint(userRole)}
        </p>
      </div>

      {!isStudent && (
        <LearningStudentSelector
          selectedStudentId={selectedStudentId}
          onSelect={setSelectedStudentId}
        />
      )}

      {notice && (
        <div
          className={`shrink-0 flex items-start gap-2.5 rounded-[24px] border px-4 py-3 text-[13px] font-semibold ${
            notice.type === 'success'
              ? 'bg-white border-steel/40 text-navy shadow-sm'
              : 'bg-navy/10 border-navy/20 text-navy'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-steel shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-navy shrink-0 mt-0.5" />
          )}
          <span className="flex-1">{notice.message}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-navy/50 hover:text-navy transition-colors shrink-0"
            aria-label="Tutup notifikasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {selectedStudentId && loading && (
        <div className="shrink-0 bg-white rounded-[24px] border border-mist/60 shadow-sm p-10 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-steel animate-spin mb-3" />
          <p className="text-sm font-semibold text-navy/60">Memuat tujuan pembelajaran...</p>
        </div>
      )}

      {selectedStudentId && !loading && loadError && (
        <div className="shrink-0 bg-white rounded-[24px] border border-navy/20 shadow-sm p-6 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-[10px] bg-navy flex items-center justify-center mb-3">
            <AlertCircle className="w-6 h-6 text-white" />
          </div>
          <p className="text-base font-bold text-navy mb-1">Gagal memuat data</p>
          <p className="text-sm text-navy/60 max-w-md mb-4">{loadError}</p>
          <button
            type="button"
            onClick={() => setReloadKey((value) => value + 1)}
            className="bg-navy text-white px-5 py-2.5 rounded-[24px] text-sm font-bold flex items-center gap-2 hover:bg-navy/90 transition-all shadow-md shadow-navy/20"
          >
            <RefreshCw className="w-4 h-4" /> Coba lagi
          </button>
        </div>
      )}

      {!selectedStudentId && !loading && (
        <div className="shrink-0 bg-white rounded-[24px] border border-mist/60 shadow-sm p-10 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-[10px] bg-navy flex items-center justify-center mb-4">
            <Target className="w-7 h-7 text-white" />
          </div>
          <p className="text-base font-bold text-navy mb-1">Belum ada siswa untuk ditampilkan</p>
          <p className="text-sm text-navy/60 max-w-md">
            {isStudent
              ? 'Data siswa akan tampil setelah sesi Anda dimuat.'
              : 'Siswa akan tampil di sini setelah berada dalam bimbingan/perusahaan Anda.'}
          </p>
        </div>
      )}

      {data && !loading && !loadError && (
        <>
          {/* ── BIODATA SISWA ── */}
          <div className="shrink-0 bg-white rounded-[24px] border border-mist/60 shadow-sm p-4 md:p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-[10px] bg-navy flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-navy leading-tight">Biodata Siswa</h3>
                <p className="text-[11px] font-semibold text-navy/50">
                  Data siswa yang terhubung dengan tujuan pembelajaran
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="bg-mist/30 rounded-2xl p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-navy/50 mb-1">
                  Nama
                </p>
                <p className="text-sm font-bold text-navy">{display(data.student.name)}</p>
              </div>
              <div className="bg-mist/30 rounded-2xl p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-navy/50 mb-1">
                  NIS
                </p>
                <p className="text-sm font-bold text-navy tabular-nums">
                  {display(data.student.nis)}
                </p>
              </div>
              <div className="bg-mist/30 rounded-2xl p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-navy/50 mb-1">
                  Program/Konsentrasi Keahlian
                </p>
                <p className="text-sm font-bold text-navy">{display(data.student.program)}</p>
              </div>
              <div className="bg-mist/30 rounded-2xl p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-navy/50 mb-1">
                  Tempat Praktik 1
                </p>
                <p className="text-sm font-bold text-navy">{display(data.student.practicePlace)}</p>
              </div>
              <div className="bg-mist/30 rounded-2xl p-3 sm:col-span-2 lg:col-span-2">
                <p className="text-[10px] font-bold uppercase tracking-wide text-navy/50 mb-1">
                  Alamat
                </p>
                <p className="text-sm font-bold text-navy leading-relaxed">
                  {display(data.student.address)}
                </p>
              </div>
            </div>
          </div>

          {/* ── TABEL TUJUAN ── */}
          <div className="bg-white rounded-[24px] border border-mist/60 shadow-sm overflow-hidden">
            <div className="p-4 md:p-5 border-b border-mist/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[10px] bg-navy flex items-center justify-center">
                  <BadgeCheck className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-navy leading-tight">
                    Tabel Tujuan Pembelajaran
                  </h3>
                  <p className="text-[11px] font-semibold text-navy/50">
                    {data.goals.length} tujuan · nilai 10–100
                  </p>
                </div>
              </div>

              {canEditGoals && (
                <button
                  type="button"
                  onClick={handleSaveGoals}
                  disabled={savingGoals}
                  className="bg-steel text-white px-4 py-2.5 rounded-[24px] text-sm font-bold flex items-center justify-center gap-2 hover:bg-steel/90 transition-all shadow-md shadow-steel/20 disabled:opacity-50 shrink-0"
                >
                  {savingGoals ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
                  ) : (
                    <><Save className="w-4 h-4" /> Simpan Nilai</>
                  )}
                </button>
              )}
            </div>

            {goalError && (
              <div className="mx-4 mt-3 flex items-start gap-2 rounded-[24px] border border-navy/20 bg-navy/10 px-4 py-3 text-[12px] font-semibold text-navy">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{goalError}</span>
              </div>
            )}

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full min-w-[820px] text-left border-collapse">
                <thead>
                  <tr className="bg-mist/40 text-navy/60">
                    <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide text-center border-b border-mist/60 w-12">
                      No
                    </th>
                    <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide border-b border-mist/60 min-w-[300px]">
                      Tujuan Pembelajaran
                    </th>
                    <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide text-center border-b border-mist/60 w-28">
                      Nilai
                    </th>
                    <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide border-b border-mist/60 min-w-[260px]">
                      Deskripsi
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {data.goals.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center">
                        <div className="w-14 h-14 rounded-[10px] bg-navy flex items-center justify-center mx-auto mb-3">
                          <BadgeCheck className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-sm font-bold text-navy mb-1">
                          Belum ada tujuan pembelajaran
                        </p>
                        <p className="text-xs text-navy/50">
                          Muat ulang halaman untuk membuat template tujuan.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    data.goals.map((goal) => (
                      <tr
                        key={goal.id}
                        className="align-top border-b border-mist/60 last:border-b-0"
                      >
                        <td className="px-3 py-3 text-center text-xs font-bold text-navy tabular-nums">
                          {goal.orderIndex}
                        </td>

                        <td className="px-3 py-3">
                          <p className="text-[13px] font-semibold text-navy leading-relaxed">
                            {goal.title}
                          </p>
                        </td>

                        <td className="px-3 py-3 text-center">
                          {canEditGoals ? (
                            <input
                              type="number"
                              inputMode="numeric"
                              min={10}
                              max={100}
                              step={1}
                              value={goal.score ?? ''}
                              onChange={(event) => {
                                const raw = event.target.value;
                                updateGoalLocal(goal.id, {
                                  score: raw === '' ? null : Number(raw),
                                });
                              }}
                              placeholder="10–100"
                              aria-label={`Nilai tujuan ${goal.orderIndex}`}
                              className="w-24 bg-mist/30 border border-mist rounded-2xl px-3 py-2 text-sm font-bold text-navy text-center outline-none focus:border-steel focus:bg-white transition-all tabular-nums placeholder:text-navy/35"
                            />
                          ) : goal.score !== null ? (
                            <span className="inline-flex items-center justify-center min-w-[56px] text-sm font-bold text-white bg-steel px-3 py-1.5 rounded-full tabular-nums shadow-sm shadow-steel/25">
                              {goal.score}
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-navy/40">
                              Belum dinilai
                            </span>
                          )}
                        </td>

                        <td className="px-3 py-3">
                          {canEditGoals ? (
                            <textarea
                              rows={3}
                              value={goal.description ?? ''}
                              onChange={(event) =>
                                updateGoalLocal(goal.id, { description: event.target.value })
                              }
                              placeholder="Deskripsi penilaian tujuan pembelajaran..."
                              className="w-full bg-mist/30 border border-mist rounded-2xl px-3 py-2 text-[13px] font-medium text-navy outline-none focus:border-steel focus:bg-white transition-all resize-none placeholder:text-navy/40"
                            />
                          ) : (
                            <p className="text-[13px] font-medium text-navy/70 leading-relaxed whitespace-pre-wrap">
                              {display(goal.description)}
                            </p>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 border-t border-mist/60 bg-mist/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <p className="text-[11px] font-medium text-navy/55">
                Nilai kosong berarti tujuan belum dinilai. Nilai yang diisi harus 10–100.
              </p>
              {!canEditGoals && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-navy/50">
                  <Eye className="w-3.5 h-3.5" /> Lihat saja
                </span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LearningGoals;
