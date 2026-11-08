import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
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
import { api } from '../utils/api';
import { errorMessage } from '../utils/learning';

type Notice = { type: 'success' | 'error'; message: string };

interface ConcentrationOption {
  id: number;
  name: string;
  programKeahlianId: number;
}

interface ProgramOption {
  id: number;
  name: string;
  concentrations: ConcentrationOption[];
}

interface AchievementTemplate {
  id: number;
  programKeahlianId: number;
  orderIndex: number;
  title: string;
}

interface TemplatesPayload {
  program: { id: number; name: string };
  templates: AchievementTemplate[];
}

export const LearningAchievementTemplates: React.FC = () => {
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [programsLoading, setProgramsLoading] = useState(true);
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null);

  const [templates, setTemplates] = useState<AchievementTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [notice, setNotice] = useState<Notice | null>(null);
  const [adding, setAdding] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    setProgramsLoading(true);

    api
      .get<ProgramOption[]>('/api/static/programs')
      .then((data) => {
        if (!active) return;
        const list = Array.isArray(data) ? data : [];
        setPrograms(list);
        setSelectedProgramId((current) => current ?? list[0]?.id ?? null);
      })
      .catch((error: any) => {
        if (!active) return;
        setPrograms([]);
        setLoadError(errorMessage(error, 'Gagal memuat Program Keahlian.'));
      })
      .finally(() => {
        if (active) setProgramsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!selectedProgramId) {
      setTemplates([]);
      setLoadError(null);
      return;
    }

    let active = true;
    setLoading(true);
    setLoadError(null);

    api
      .get<TemplatesPayload>(
        `/api/learning/achievement-templates?programKeahlianId=${selectedProgramId}`
      )
      .then((response) => {
        if (!active) return;
        setTemplates(response.templates ?? []);
      })
      .catch((error: any) => {
        if (!active) return;
        setTemplates([]);
        setLoadError(errorMessage(error, 'Gagal memuat template capaian.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedProgramId, reloadKey]);

  const selectedProgram = useMemo(
    () => programs.find((program) => program.id === selectedProgramId) ?? null,
    [programs, selectedProgramId]
  );

  const updateLocal = (id: number, title: string) => {
    setTemplates((current) =>
      current.map((template) =>
        template.id === id ? { ...template, title } : template
      )
    );
  };

  const handleAdd = async () => {
    if (!selectedProgramId) return;

    setAdding(true);
    try {
      const created = await api.post<AchievementTemplate>(
        '/api/learning/achievement-templates',
        { programKeahlianId: selectedProgramId }
      );
      setTemplates((current) => [...current, created]);
      setNotice({
        type: 'success',
        message: 'Baris capaian ditambahkan. Lengkapi judul lalu simpan.',
      });
    } catch (error: any) {
      setNotice({
        type: 'error',
        message: errorMessage(error, 'Gagal menambah template capaian.'),
      });
    } finally {
      setAdding(false);
    }
  };

  const handleSave = async (template: AchievementTemplate) => {
    if (!template.title.trim()) {
      setNotice({ type: 'error', message: 'Capaian pembelajaran wajib diisi.' });
      return;
    }

    setSavingId(template.id);
    try {
      const updated = await api.put<AchievementTemplate>(
        `/api/learning/achievement-templates/${template.id}`,
        { title: template.title }
      );
      setTemplates((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );
      setNotice({ type: 'success', message: 'Template capaian berhasil disimpan.' });
    } catch (error: any) {
      setNotice({
        type: 'error',
        message: errorMessage(error, 'Gagal menyimpan template capaian.'),
      });
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (template: AchievementTemplate) => {
    if (!window.confirm(`Hapus capaian "${template.title}" dari template?`)) return;

    setDeletingId(template.id);
    try {
      await api.delete(`/api/learning/achievement-templates/${template.id}`);
      setTemplates((current) =>
        current.filter((item) => item.id !== template.id)
      );
      setNotice({ type: 'success', message: 'Template capaian dihapus.' });
    } catch (error: any) {
      setNotice({
        type: 'error',
        message: errorMessage(error, 'Gagal menghapus template capaian.'),
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="h-full w-full flex flex-col gap-3 md:gap-4 overflow-y-auto custom-scrollbar">
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
              <h2 className="text-xl font-bold text-navy leading-tight">
                Capaian Pembelajaran
              </h2>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 self-start sm:self-center text-[11px] font-bold text-navy bg-mist/40 border border-mist px-3 py-2 rounded-full">
            <Info className="w-3.5 h-3.5 text-steel" />
            Hubin · kelola per Program Keahlian
          </span>
        </div>

        <p className="text-[12px] sm:text-[13px] font-medium text-navy/60 mt-3 leading-relaxed">
          Pilih Program Keahlian lalu susun daftar Capaian Pembelajaran. Daftar ini
          menjadi acuan saat siswa di program tersebut pertama kali membuka halaman
          capaian; mentor tetap mengisi bukti, minggu, dan paraf per siswa.
        </p>
      </div>

      <div className="shrink-0 bg-white rounded-[24px] border border-mist/60 shadow-sm p-4 md:p-5">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1">
            <label
              htmlFor="achievement-program"
              className="text-[11px] font-bold uppercase tracking-wide text-navy/70 block mb-1.5"
            >
              Program Keahlian
            </label>
            <select
              id="achievement-program"
              value={selectedProgramId ?? ''}
              onChange={(event) =>
                setSelectedProgramId(
                  event.target.value ? Number(event.target.value) : null
                )
              }
              disabled={programsLoading || programs.length === 0}
              className="w-full bg-mist/40 border border-mist rounded-[24px] px-4 py-2.5 text-sm font-semibold text-navy outline-none focus:border-steel focus:bg-white transition-all disabled:opacity-60"
            >
              {programs.length === 0 && (
                <option value="">Belum ada Program Keahlian</option>
              )}
              {programs.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            disabled={!selectedProgramId || adding}
            className="bg-steel text-white px-4 py-2.5 rounded-[24px] text-sm font-bold flex items-center justify-center gap-2 hover:bg-steel/90 transition-all shadow-md shadow-steel/20 disabled:opacity-50 shrink-0"
          >
            {adding ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Menambah...</>
            ) : (
              <><Plus className="w-4 h-4" /> Tambah Capaian</>
            )}
          </button>
        </div>

        {selectedProgram && (
          <p className="text-[11px] font-semibold text-navy/45 mt-3">
            {selectedProgram.name} · {templates.length} baris template
            {selectedProgram.concentrations.length > 0 &&
              ` · ${selectedProgram.concentrations.length} konsentrasi`}
          </p>
        )}
      </div>

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

      {loading && (
        <div className="shrink-0 bg-white rounded-[24px] border border-mist/60 shadow-sm p-10 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-steel animate-spin mb-3" />
          <p className="text-sm font-semibold text-navy/60">Memuat template capaian...</p>
        </div>
      )}

      {!loading && loadError && (
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

      {!loading && !loadError && selectedProgramId && (
        <div className="bg-white rounded-[24px] border border-mist/60 shadow-sm overflow-hidden">
          <div className="p-4 md:p-5 border-b border-mist/60">
            <h3 className="text-base font-bold text-navy leading-tight">
              Tabel Template Capaian
            </h3>
            <p className="text-[11px] font-semibold text-navy/50 mt-0.5">
              Template dipakai saat siswa belum memiliki baris capaian.
            </p>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[720px] text-left border-collapse">
              <thead>
                <tr className="bg-mist/40 text-navy/60">
                  <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide text-center border-b border-mist/60 w-12">
                    No
                  </th>
                  <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide border-b border-mist/60 min-w-[380px]">
                    Capaian Pembelajaran
                  </th>
                  <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide text-center border-b border-mist/60 w-44">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody>
                {templates.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-10 text-center">
                      <div className="w-14 h-14 rounded-[10px] bg-navy flex items-center justify-center mx-auto mb-3">
                        <GraduationCap className="w-6 h-6 text-white" />
                      </div>
                      <p className="text-sm font-bold text-navy mb-1">
                        Belum ada template capaian
                      </p>
                      <p className="text-xs text-navy/50 mb-4">
                        Tambahkan baris capaian untuk Program Keahlian ini.
                      </p>
                      <button
                        type="button"
                        onClick={handleAdd}
                        disabled={adding}
                        className="bg-steel text-white px-4 py-2 rounded-[24px] text-xs font-bold inline-flex items-center gap-1.5 hover:bg-steel/90 transition-all disabled:opacity-50"
                      >
                        <Plus className="w-3.5 h-3.5" /> Tambah Capaian
                      </button>
                    </td>
                  </tr>
                ) : (
                  templates.map((template) => {
                    const isSaving = savingId === template.id;
                    const isDeleting = deletingId === template.id;

                    return (
                      <tr
                        key={template.id}
                        className="align-top border-b border-mist/60 last:border-b-0"
                      >
                        <td className="px-3 py-3 text-center text-xs font-bold text-navy tabular-nums">
                          {template.orderIndex}
                        </td>

                        <td className="px-3 py-3">
                          <textarea
                            rows={2}
                            value={template.title}
                            onChange={(event) =>
                              updateLocal(template.id, event.target.value)
                            }
                            placeholder="Tulis capaian pembelajaran..."
                            className="w-full bg-mist/30 border border-mist rounded-2xl px-3 py-2 text-[13px] font-semibold text-navy outline-none focus:border-steel focus:bg-white transition-all resize-none placeholder:text-navy/40"
                          />
                        </td>

                        <td className="px-3 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleSave(template)}
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
                              onClick={() => handleDelete(template)}
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
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t border-mist/60 bg-mist/20">
            <p className="text-[11px] font-medium text-navy/55">
              Perubahan judul disimpan per baris dengan tombol Simpan. Template
              tidak menimpa capaian siswa yang sudah diisi mentor.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningAchievementTemplates;
