import React, { useEffect, useState } from 'react';
import { AlertCircle, Loader2, RefreshCw, User } from 'lucide-react';
import { errorMessage, fetchStudentOptions, StudentOption } from '../utils/learning';

interface LearningStudentSelectorProps {
  selectedStudentId: number | null;
  onSelect: (id: number | null) => void;
}

export const LearningStudentSelector: React.FC<LearningStudentSelectorProps> = ({
  selectedStudentId,
  onSelect,
}) => {
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    fetchStudentOptions()
      .then((mapped) => {
        if (!active) return;
        setStudents(mapped);
        onSelect(mapped[0]?.id ?? null);
      })
      .catch((loadError: any) => {
        if (!active) return;
        setStudents([]);
        setError(errorMessage(loadError, 'Gagal memuat daftar siswa.'));
        onSelect(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
    // Daftar siswa dimuat sekali saat halaman dibuka.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  return (
    <div className="shrink-0 bg-white rounded-[24px] border border-mist/60 shadow-sm p-4 md:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <label
            htmlFor="learning-student"
            className="text-[11px] font-bold uppercase tracking-wide text-navy/70"
          >
            Pilih Siswa
          </label>
        </div>

        <select
          id="learning-student"
          value={selectedStudentId ?? ''}
          onChange={(event) => onSelect(event.target.value ? Number(event.target.value) : null)}
          disabled={loading || !students.length}
          className="w-full sm:max-w-md bg-mist/40 border border-mist rounded-[24px] px-4 py-2.5 text-sm font-semibold text-navy outline-none focus:border-steel focus:bg-white transition-all disabled:opacity-60"
        >
          {students.length === 0 && <option value="">Belum ada siswa</option>}
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.name}
              {student.className ? ` · ${student.className}` : ''}
              {student.companyName ? ` · ${student.companyName}` : ''}
            </option>
          ))}
        </select>

        {loading && (
          <span className="flex items-center gap-2 text-[12px] font-semibold text-navy/50">
            <Loader2 className="w-4 h-4 animate-spin text-steel" /> Memuat siswa...
          </span>
        )}

        {error && (
          <div className="flex items-center gap-2 text-[12px] font-semibold text-navy">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setReloadKey((value) => value + 1)}
              className="inline-flex items-center gap-1 text-steel hover:text-steel/80 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Muat ulang
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LearningStudentSelector;
