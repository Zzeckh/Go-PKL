import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  BadgeCheck,
  CheckCircle2,
  GraduationCap,
  Info,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import {
  Achievement,
  AchievementsPayload,
  achievementRoleHint,
  errorMessage,
  formatSignatureDate,
  SignedBy,
  WEEKS,
} from '../utils/learning';
import { LearningStudentSelector } from './LearningStudentSelector';

type Notice = { type: 'success' | 'error'; message: string };

export const LearningAchievements: React.FC = () => {
  const { userRole, userId } = useApp();
  const isStudent = userRole === 'intern';

  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(
    isStudent ? userId : null
  );
  const [data, setData] = useState<AchievementsPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [notice, setNotice] = useState<Notice | null>(null);
  const [adding, setAdding] = useState(false);
  const [savingAchievementId, setSavingAchievementId] = useState<number | null>(null);
  const [deletingAchievementId, setDeletingAchievementId] = useState<number | null>(null);
  const [signingKey, setSigningKey] = useState<string | null>(null);

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

    api
      .get<AchievementsPayload>(`/api/learning/students/${selectedStudentId}/achievements`)
      .then((response) => {
        if (!active) return;
        setData(response);
      })
      .catch((error: any) => {
        if (!active) return;
        setData(null);
        setLoadError(errorMessage(error, 'Gagal memuat capaian pembelajaran.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedStudentId, reloadKey]);

  const updateAchievementLocal = (id: number, patch: Partial<Achievement>) => {
    setData((current) =>
      current
        ? {
            ...current,
            achievements: current.achievements.map((achievement) =>
              achievement.id === id ? { ...achievement, ...patch } : achievement
            ),
          }
        : current
    );
  };

  const replaceAchievement = (updated: Achievement) => {
    setData((current) =>
      current
        ? {
            ...current,
            achievements: current.achievements.map((achievement) =>
              achievement.id === updated.id ? updated : achievement
            ),
          }
        : current
    );
  };

  const handleSaveAchievement = async (achievement: Achievement) => {
    if (!data?.access.canManageAchievements) return;

    setSavingAchievementId(achievement.id);
    try {
      const updated = await api.put<Achievement>(
        `/api/learning/students/${data.student.id}/achievements/${achievement.id}`,
        {
          title: achievement.title,
          evidence: achievement.evidence,
          weeks: achievement.weeks,
        }
      );
      replaceAchievement(updated);
      setNotice({ type: 'success', message: 'Capaian pembelajaran berhasil disimpan.' });
    } catch (error: any) {
      setNotice({
        type: 'error',
        message: errorMessage(error, 'Gagal menyimpan capaian pembelajaran.'),
      });
    } finally {
      setSavingAchievementId(null);
    }
  };

  const handleAddAchievement = async () => {
    if (!data?.access.canManageAchievements) return;

    setAdding(true);
    try {
      const created = await api.post<Achievement>(
        `/api/learning/students/${data.student.id}/achievements`,
        {}
      );
      setData((current) =>
        current ? { ...current, achievements: [...current.achievements, created] } : current
      );
      setNotice({
        type: 'success',
        message: 'Baris capaian ditambahkan. Lengkapi isinya lalu simpan.',
      });
    } catch (error: any) {
      setNotice({
        type: 'error',
        message: errorMessage(error, 'Gagal menambah capaian pembelajaran.'),
      });
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteAchievement = async (achievement: Achievement) => {
    if (!data?.access.canManageAchievements) return;
    if (!window.confirm(`Hapus capaian "${achievement.title}"?`)) return;

    setDeletingAchievementId(achievement.id);
    try {
      await api.delete(`/api/learning/students/${data.student.id}/achievements/${achievement.id}`);
      setData((current) =>
        current
          ? {
              ...current,
              achievements: current.achievements.filter((item) => item.id !== achievement.id),
            }
          : current
      );
      setNotice({ type: 'success', message: 'Capaian pembelajaran dihapus.' });
    } catch (error: any) {
      setNotice({
        type: 'error',
        message: errorMessage(error, 'Gagal menghapus capaian pembelajaran.'),
      });
    } finally {
      setDeletingAchievementId(null);
    }
  };

  const handleSignature = async (achievement: Achievement, signer: 'mentor' | 'teacher') => {
    if (!data) return;

    const signed =
      signer === 'mentor'
        ? Boolean(achievement.mentorSignedAt)
        : Boolean(achievement.teacherSignedAt);

    setSigningKey(`${achievement.id}-${signer}`);
    try {
      const updated = await api.put<Achievement>(
        `/api/learning/students/${data.student.id}/achievements/${achievement.id}/signature`,
        { signer, signed: !signed }
      );
      replaceAchievement(updated);
      setNotice({
        type: 'success',
        message: signed
          ? 'Paraf berhasil dibatalkan.'
          : `Paraf ${signer === 'mentor' ? 'Mentor' : 'Sekolah/Guru'} berhasil dicatat.`,
      });
    } catch (error: any) {
      setNotice({
        type: 'error',
        message: errorMessage(error, 'Gagal menyimpan paraf.'),
      });
    } finally {
      setSigningKey(null);
    }
  };

  const toggleWeek = (achievement: Achievement, week: number) => {
    if (!data?.access.canManageAchievements) return;
    const selected = new Set(achievement.weeks);
    if (selected.has(week)) selected.delete(week);
    else selected.add(week);
    updateAchievementLocal(achievement.id, {
      weeks: [...selected].sort((a, b) => a - b),
    });
  };

  const access = data?.access;
  const canManageAchievements = Boolean(access?.canManageAchievements);

  return (
    <div className="h-full w-full flex flex-col gap-3 md:gap-4 overflow-y-auto custom-scrollbar">
      {/* ── HEADER ── */}
      <div className="shrink-0 bg-white rounded-[24px] border border-mist/60 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-[10px] bg-navy flex items-center justify-center shadow-md shadow-navy/20 shrink-0">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-steel">
                Logbook PKL
              </p>
              <h2 className="text-xl font-bold text-navy leading-tight">Capaian Pembelajaran</h2>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 self-start sm:self-center text-[11px] font-bold text-navy bg-mist/40 border border-mist px-3 py-2 rounded-full">
            <Info className="w-3.5 h-3.5 text-steel" />
            {userRole === 'mentor'
              ? 'Mentor'
              : userRole === 'teacher'
              ? 'Guru'
              : userRole === 'hubin'
              ? 'Hubin · lihat saja'
              : 'Siswa · lihat saja'}
          </span>
        </div>

        <p className="text-[12px] sm:text-[13px] font-medium text-navy/60 mt-3 leading-relaxed">
          {achievementRoleHint(userRole)}
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
          <p className="text-sm font-semibold text-navy/60">Memuat capaian pembelajaran...</p>
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
            <GraduationCap className="w-7 h-7 text-white" />
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
        <div className="bg-white rounded-[24px] border border-mist/60 shadow-sm overflow-hidden">
          <div className="p-4 md:p-5 border-b border-mist/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[10px] bg-navy flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-navy leading-tight">
                  Tabel Capaian Pembelajaran
                </h3>
                <p className="text-[11px] font-semibold text-navy/50">
                  {data.student.name}
                  {data.student.className ? ` · ${data.student.className}` : ''} ·{' '}
                  {data.achievements.length} baris
                </p>
              </div>
            </div>

            {canManageAchievements && (
              <button
                type="button"
                onClick={handleAddAchievement}
                disabled={adding}
                className="bg-steel text-white px-4 py-2.5 rounded-[24px] text-sm font-bold flex items-center justify-center gap-2 hover:bg-steel/90 transition-all shadow-md shadow-steel/20 disabled:opacity-50 shrink-0"
              >
                {adding ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Menambah...</>
                ) : (
                  <><Plus className="w-4 h-4" /> Tambah Capaian</>
                )}
              </button>
            )}
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[1020px] text-left border-collapse">
              <thead>
                <tr className="bg-mist/40 text-navy/60">
                  <th
                    rowSpan={2}
                    className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide text-center border-b border-mist/60 w-12"
                  >
                    No
                  </th>
                  <th
                    rowSpan={2}
                    className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide border-b border-mist/60 min-w-[260px]"
                  >
                    Capaian Pembelajaran
                  </th>
                  <th
                    rowSpan={2}
                    className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide border-b border-mist/60 min-w-[240px]"
                  >
                    Bukti Pembelajaran
                  </th>
                  <th
                    rowSpan={2}
                    className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide border-b border-mist/60 min-w-[190px]"
                  >
                    Minggu Ke-
                  </th>
                  <th
                    colSpan={2}
                    className="px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-center border-b border-l border-mist/60"
                  >
                    Paraf Pembimbing
                  </th>
                </tr>
                <tr className="bg-mist/40 text-navy/60">
                  <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-center border-b border-l border-mist/60 w-40">
                    Mentor
                  </th>
                  <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-center border-b border-l border-mist/60 w-40">
                    Sekolah/Guru
                  </th>
                </tr>
              </thead>

              <tbody>
                {data.achievements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center">
                      <div className="w-14 h-14 rounded-[10px] bg-navy flex items-center justify-center mx-auto mb-3">
                        <GraduationCap className="w-6 h-6 text-white" />
                      </div>
                      <p className="text-sm font-bold text-navy mb-1">
                        Belum ada capaian pembelajaran
                      </p>
                      <p className="text-xs text-navy/50 mb-4">
                        {canManageAchievements
                          ? 'Tambahkan baris capaian untuk mulai mengisi logbook.'
                          : 'Mentor pembimbing belum menambahkan capaian pembelajaran.'}
                      </p>
                      {canManageAchievements && (
                        <button
                          type="button"
                          onClick={handleAddAchievement}
                          disabled={adding}
                          className="bg-steel text-white px-4 py-2 rounded-[24px] text-xs font-bold inline-flex items-center gap-1.5 hover:bg-steel/90 transition-all disabled:opacity-50"
                        >
                          <Plus className="w-3.5 h-3.5" /> Tambah Capaian
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  data.achievements.map((achievement) => {
                    const isSaving = savingAchievementId === achievement.id;
                    const isDeleting = deletingAchievementId === achievement.id;

                    return (
                      <tr
                        key={achievement.id}
                        className="align-top border-b border-mist/60 last:border-b-0"
                      >
                        <td className="px-3 py-3 text-center text-xs font-bold text-navy tabular-nums">
                          {achievement.orderIndex}
                        </td>

                        <td className="px-3 py-3">
                          {canManageAchievements ? (
                            <>
                              <textarea
                                rows={2}
                                value={achievement.title}
                                onChange={(event) =>
                                  updateAchievementLocal(achievement.id, {
                                    title: event.target.value,
                                  })
                                }
                                placeholder="Tulis capaian pembelajaran..."
                                className="w-full bg-mist/30 border border-mist rounded-2xl px-3 py-2 text-[13px] font-semibold text-navy outline-none focus:border-steel focus:bg-white transition-all resize-none placeholder:text-navy/40"
                              />
                              <div className="flex items-center gap-2 mt-2">
                                <button
                                  type="button"
                                  onClick={() => handleSaveAchievement(achievement)}
                                  disabled={isSaving || isDeleting}
                                  className="text-[11px] font-bold bg-navy text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 hover:bg-navy/90 transition-all disabled:opacity-50"
                                >
                                  {isSaving ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Save className="w-3 h-3" />
                                  )}
                                  Simpan
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAchievement(achievement)}
                                  disabled={isSaving || isDeleting}
                                  className="text-[11px] font-bold text-navy/60 bg-white border border-mist px-2.5 py-1.5 rounded-full hover:text-navy hover:border-navy/30 transition-colors disabled:opacity-50"
                                  title="Hapus capaian"
                                >
                                  {isDeleting ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            </>
                          ) : (
                            <p className="text-[13px] font-semibold text-navy leading-relaxed whitespace-pre-wrap">
                              {achievement.title || '-'}
                            </p>
                          )}
                        </td>

                        <td className="px-3 py-3">
                          {canManageAchievements ? (
                            <textarea
                              rows={2}
                              value={achievement.evidence ?? ''}
                              onChange={(event) =>
                                updateAchievementLocal(achievement.id, {
                                  evidence: event.target.value,
                                })
                              }
                              placeholder="Bukti pembelajaran..."
                              className="w-full bg-mist/30 border border-mist rounded-2xl px-3 py-2 text-[13px] font-medium text-navy outline-none focus:border-steel focus:bg-white transition-all resize-none placeholder:text-navy/40"
                            />
                          ) : (
                            <p className="text-[13px] font-medium text-navy/70 leading-relaxed whitespace-pre-wrap">
                              {achievement.evidence || '-'}
                            </p>
                          )}
                        </td>

                        <td className="px-3 py-3">
                          <div className="grid grid-cols-4 gap-1.5 min-w-[160px]">
                            {WEEKS.map((week) => {
                              const checked = achievement.weeks.includes(week);
                              return (
                                <label
                                  key={week}
                                  className={`flex items-center justify-center w-7 h-7 rounded-lg border text-[11px] font-bold transition-colors ${
                                    checked
                                      ? 'bg-steel border-steel text-white'
                                      : 'bg-white border-mist text-navy/50'
                                  } ${
                                    canManageAchievements
                                      ? 'cursor-pointer hover:border-steel/60'
                                      : 'cursor-default'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={checked}
                                    onChange={() => toggleWeek(achievement, week)}
                                    disabled={!canManageAchievements}
                                    aria-label={`Minggu ${week}`}
                                  />
                                  {week}
                                </label>
                              );
                            })}
                          </div>
                        </td>

                        <td className="px-3 py-3 border-l border-mist/60">
                          <SignatureCell
                            signedAt={achievement.mentorSignedAt}
                            signedBy={achievement.mentorSignedBy}
                            canSign={Boolean(access?.canSignMentor)}
                            busy={signingKey === `${achievement.id}-mentor`}
                            onToggle={() => handleSignature(achievement, 'mentor')}
                            label="Mentor"
                          />
                        </td>

                        <td className="px-3 py-3 border-l border-mist/60">
                          <SignatureCell
                            signedAt={achievement.teacherSignedAt}
                            signedBy={achievement.teacherSignedBy}
                            canSign={Boolean(access?.canSignTeacher)}
                            busy={signingKey === `${achievement.id}-teacher`}
                            onToggle={() => handleSignature(achievement, 'teacher')}
                            label="Sekolah/Guru"
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {canManageAchievements && data.achievements.length > 0 && (
            <div className="px-4 py-3 border-t border-mist/60 bg-mist/20">
              <p className="text-[11px] font-medium text-navy/55">
                Perubahan judul, bukti, dan centang minggu disimpan per baris dengan tombol Simpan.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface SignatureCellProps {
  signedAt: string | null;
  signedBy: SignedBy | null;
  canSign: boolean;
  busy: boolean;
  onToggle: () => void;
  label: string;
}

const SignatureCell: React.FC<SignatureCellProps> = ({
  signedAt,
  signedBy,
  canSign,
  busy,
  onToggle,
  label,
}) => {
  return (
    <div className="flex flex-col items-center text-center gap-1.5">
      {signedAt ? (
        <div className="flex flex-col items-center">
          <span className="font-serif italic text-base font-bold text-navy leading-tight">
            {signedBy?.name || 'Pembimbing'}
          </span>
          <span className="text-[10px] font-semibold text-navy/45 mt-0.5">
            {formatSignatureDate(signedAt)}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-steel mt-1">
            <BadgeCheck className="w-3 h-3" /> Paraf tercatat
          </span>
        </div>
      ) : (
        <span className="text-[11px] font-semibold text-navy/35">Belum</span>
      )}

      {canSign && (
        <button
          type="button"
          onClick={onToggle}
          disabled={busy}
          className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors disabled:opacity-50 ${
            signedAt
              ? 'bg-white border-mist text-navy/55 hover:text-navy hover:border-navy/30'
              : 'bg-navy border-navy text-white hover:bg-navy/90'
          }`}
          title={signedAt ? `Batalkan paraf ${label}` : `Bubuhkan paraf ${label}`}
        >
          {busy ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : signedAt ? (
            'Batalkan'
          ) : (
            'Bubuhkan Paraf'
          )}
        </button>
      )}
    </div>
  );
};

export default LearningAchievements;
