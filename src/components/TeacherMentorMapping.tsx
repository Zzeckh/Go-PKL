import React, { useCallback, useEffect, useState } from 'react';
import { Building2, Briefcase, Users, RefreshCw, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import { api } from '../utils/api';

type Mentor = { id: number; name: string; email: string };
type Student = { id: number; name: string; class?: { name: string } | null };
type Company = {
  id: number;
  name: string;
  address: string;
  mentor: Mentor | null;
  registeredMentors: Mentor[];
  students: Student[];
  studentCount: number;
};

export const TeacherMentorMapping: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selected, setSelected] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get<{ data: Company[] }>('/api/mentor-mapping/teacher/companies');
      const items = response.data || [];
      setCompanies(items);
      setSelected((previous) => {
        const next = { ...previous };
        for (const company of items) {
          if (next[company.id] === undefined) next[company.id] = company.mentor ? String(company.mentor.id) : '';
          else if (!company.registeredMentors.some((mentor) => String(mentor.id) === next[company.id])) {
            next[company.id] = company.mentor ? String(company.mentor.id) : '';
          }
        }
        return next;
      });
    } catch (err: any) {
      setError(err?.data?.error || err?.message || 'Gagal memuat perusahaan siswa bimbingan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const save = async (company: Company) => {
    const mentorId = Number(selected[company.id]);
    if (!Number.isInteger(mentorId) || mentorId <= 0) {
      setError('Pilih mentor yang terdaftar pada perusahaan terlebih dahulu.');
      return;
    }
    setSavingId(company.id);
    setError('');
    setNotice('');
    try {
      await api.patch(`/api/mentor-mapping/teacher/companies/${company.id}/mentor`, { mentorId });
      setNotice(`Mentor untuk ${company.name} berhasil disimpan. Penetapan berlaku untuk seluruh siswa di perusahaan ini.`);
      await load();
    } catch (err: any) {
      setError(err?.data?.error || err?.message || 'Gagal menyimpan pemetaan mentor.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto custom-scrollbar space-y-4">
      <section className="rounded-[24px] border border-mist/60 bg-white p-4 md:p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-navy text-white"><Briefcase className="h-5 w-5" /></div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-navy md:text-xl">Pemetaan Mentor Perusahaan</h2>
            <p className="mt-1 text-sm text-navy/60">Pilih mentor dari daftar mentor terdaftar pada perusahaan. Satu pilihan berlaku untuk semua siswa di perusahaan tersebut.</p>
          </div>
          <button onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-mist px-3 py-2 text-xs font-bold text-navy hover:bg-mist/40 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Muat ulang</button>
        </div>
      </section>

      {error && <div role="alert" className="flex gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700"><AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />{error}</div>}
      {notice && <div role="status" className="flex gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800"><CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />{notice}</div>}

      {loading ? <div className="rounded-2xl bg-white p-8 text-center text-sm text-navy/60">Memuat perusahaan...</div> : companies.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-mist bg-white p-8 text-center"><Building2 className="mx-auto mb-2 h-8 w-8 text-navy/30" /><p className="font-bold text-navy">Belum ada perusahaan dalam siswa bimbingan Anda</p><p className="mt-1 text-sm text-navy/60">Pastikan siswa sudah dipetakan ke perusahaan dan Guru Pembimbing.</p></div>
      ) : (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {companies.map((company) => {
            const current = company.mentor ? String(company.mentor.id) : '';
            const value = selected[company.id] ?? current;
            const changed = value !== current;
            return <article key={company.id} className="rounded-[24px] border border-mist/70 bg-white p-4 shadow-sm space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mist/60 text-navy"><Building2 className="h-5 w-5" /></div>
                <div className="min-w-0 flex-1"><h3 className="font-bold text-navy">{company.name}</h3><p className="mt-0.5 text-xs text-navy/55">{company.address || 'Alamat belum diisi'}</p></div>
                <span className="shrink-0 rounded-full bg-mist px-2.5 py-1 text-[11px] font-bold text-navy">{company.studentCount} siswa</span>
              </div>
              <div className="rounded-xl bg-mist/30 p-3">
                <div className="mb-2 flex items-center gap-2 text-xs font-bold text-navy"><Users className="h-4 w-4" /> Siswa bimbingan di perusahaan ini</div>
                <div className="flex flex-wrap gap-1.5">{company.students.slice(0, 6).map((student) => <span key={student.id} className="rounded-lg border border-mist bg-white px-2 py-1 text-[11px] text-navy/80">{student.name}{student.class?.name ? ` · ${student.class.name}` : ''}</span>)}{company.students.length > 6 && <span className="px-2 py-1 text-[11px] font-semibold text-navy/50">+{company.students.length - 6} siswa lainnya</span>}</div>
              </div>
              <div>
                <label htmlFor={`mentor-${company.id}`} className="mb-1.5 block text-xs font-bold text-navy">Mentor perusahaan</label>
                <select id={`mentor-${company.id}`} value={value} onChange={(event) => setSelected((old) => ({ ...old, [company.id]: event.target.value }))} className="w-full rounded-xl border border-mist bg-white px-3 py-3 text-sm font-semibold text-navy outline-none focus:border-steel" disabled={savingId === company.id}>
                  <option value="">— Pilih mentor terdaftar —</option>
                  {company.registeredMentors.map((mentor) => <option key={mentor.id} value={mentor.id}>{mentor.name}{mentor.email ? ` (${mentor.email})` : ''}</option>)}
                </select>
                {company.registeredMentors.length === 0 && <p className="mt-1 text-xs text-amber-700">Belum ada mentor terdaftar. Hubin perlu mengelola daftar mentor perusahaan terlebih dahulu.</p>}
                <p className="mt-1.5 text-xs text-navy/55">Saat ini: <strong>{company.mentor?.name || 'Belum ditetapkan'}</strong></p>
              </div>
              <button onClick={() => void save(company)} disabled={savingId === company.id || !changed || !company.registeredMentors.length || !value} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-steel px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-steel/90 disabled:cursor-not-allowed disabled:opacity-40"><Save className="h-4 w-4" />{savingId === company.id ? 'Menyimpan...' : 'Simpan Mentor Perusahaan'}</button>
            </article>;
          })}
        </div>
      )}
    </div>
  );
};
