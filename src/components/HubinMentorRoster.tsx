import React, { useCallback, useEffect, useState } from 'react';
import { Building2, Users, RefreshCw, Save, AlertCircle, CheckCircle2, Search } from 'lucide-react';
import { api } from '../utils/api';

type Mentor = { id: number; name: string; email: string; isActive?: boolean };
type Company = { id: number; name: string; address: string; mentor: Mentor | null; registeredMentors: Mentor[] };

export const HubinMentorRoster: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedMentors, setSelectedMentors] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [companyResponse, mentorResponse] = await Promise.all([
        api.get<{ data: Company[] }>('/api/mentor-mapping/roster'),
        api.get<{ data: Mentor[] }>('/api/mentor-mapping/mentors'),
      ]);
      setCompanies(companyResponse.data || []);
      setMentors(mentorResponse.data || []);
      const chosen = selectedCompany || String(companyResponse.data?.[0]?.id || '');
      setSelectedCompany(chosen);
      const activeCompany = (companyResponse.data || []).find((company) => String(company.id) === chosen);
      setSelectedMentors(activeCompany?.registeredMentors.map((mentor) => mentor.id) || []);
    } catch (err: any) {
      setError(err?.data?.error || err?.message || 'Gagal memuat daftar mentor perusahaan.');
    } finally { setLoading(false); }
  }, [selectedCompany]);

  useEffect(() => { void load(); }, [load]);

  const company = companies.find((item) => String(item.id) === selectedCompany) || null;
  const filteredMentors = mentors.filter((mentor) => `${mentor.name} ${mentor.email}`.toLowerCase().includes(search.toLowerCase()));

  const changeCompany = (id: string) => {
    setSelectedCompany(id);
    const item = companies.find((entry) => String(entry.id) === id);
    setSelectedMentors(item?.registeredMentors.map((mentor) => mentor.id) || []);
    setNotice(''); setError('');
  };

  const toggleMentor = (id: number, checked: boolean) => {
    setSelectedMentors((previous) => checked ? [...new Set([...previous, id])] : previous.filter((item) => item !== id));
    setNotice(''); setError('');
  };

  const save = async () => {
    if (!company) return;
    setSaving(true); setError(''); setNotice('');
    try {
      const response = await api.put<{ message: string }>(`/api/mentor-mapping/roster/${company.id}`, { mentorIds: selectedMentors });
      setNotice(response.message || 'Daftar mentor berhasil disimpan.');
      await load();
    } catch (err: any) {
      setError(err?.data?.error || err?.message || 'Gagal menyimpan daftar mentor.');
    } finally { setSaving(false); }
  };

  return <div className="h-full w-full overflow-y-auto custom-scrollbar space-y-4">
    <section className="rounded-[24px] border border-mist/60 bg-white p-4 md:p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-navy text-white"><Users className="h-5 w-5" /></div>
        <div className="min-w-0 flex-1"><h2 className="text-lg font-bold text-navy md:text-xl">Daftar Mentor Perusahaan</h2><p className="mt-1 text-sm text-navy/60">Hubin mengatur mentor yang terdaftar di setiap perusahaan. Penetapan mentor aktif tetap dilakukan Guru Pembimbing.</p></div>
        <button onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-mist px-3 py-2 text-xs font-bold text-navy hover:bg-mist/40 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Muat ulang</button>
      </div>
    </section>
    {error && <div role="alert" className="flex gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700"><AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />{error}</div>}
    {notice && <div role="status" className="flex gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800"><CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />{notice}</div>}
    {loading ? <div className="rounded-2xl bg-white p-8 text-center text-sm text-navy/60">Memuat data...</div> : <section className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
      <div className="rounded-[24px] border border-mist/60 bg-white p-4 shadow-sm space-y-3">
        <label htmlFor="roster-company" className="block text-xs font-bold text-navy">Pilih perusahaan</label>
        <select id="roster-company" value={selectedCompany} onChange={(event) => changeCompany(event.target.value)} className="w-full rounded-xl border border-mist bg-white px-3 py-3 text-sm font-semibold text-navy outline-none focus:border-steel"><option value="">— Pilih perusahaan —</option>{companies.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        {company && <div className="rounded-2xl bg-mist/30 p-3"><div className="flex items-center gap-2 font-bold text-navy"><Building2 className="h-4 w-4" />{company.name}</div><p className="mt-1 text-xs text-navy/55">{company.address || 'Alamat belum diisi'}</p><p className="mt-2 text-xs text-navy/70">Mentor yang sedang ditetapkan: <strong>{company.mentor?.name || 'Belum ditetapkan'}</strong></p></div>}
        <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy/40" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari mentor..." className="w-full rounded-xl border border-mist bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-steel" /></div>
        <p className="text-xs text-navy/55">Centang mentor yang boleh dipilih Guru Pembimbing untuk perusahaan ini.</p>
      </div>
      <div className="rounded-[24px] border border-mist/60 bg-white p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2"><h3 className="font-bold text-navy">Mentor terdaftar</h3><span className="rounded-full bg-mist px-2.5 py-1 text-xs font-bold text-navy">{selectedMentors.length} dipilih</span></div>
        {!selectedCompany ? <p className="text-sm text-navy/55">Pilih perusahaan terlebih dahulu.</p> : filteredMentors.length === 0 ? <p className="text-sm text-navy/55">Tidak ada akun mentor aktif yang cocok.</p> : <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">{filteredMentors.map((mentor) => {
          const checked = selectedMentors.includes(mentor.id);
          const isCurrent = company?.mentor?.id === mentor.id;
          const disabled = !mentor.isActive && !checked && !isCurrent;
          return <label key={mentor.id} className={`flex items-start gap-3 rounded-xl border p-3 transition ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${checked ? 'border-steel/40 bg-mist/30' : 'border-mist hover:bg-mist/20'}`}><input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => toggleMentor(mentor.id, event.target.checked)} className="mt-1 h-4 w-4 accent-steel" /><span className="min-w-0 flex-1"><span className="block text-sm font-bold text-navy">{mentor.name}{isCurrent ? ' · Mentor aktif' : ''}{!mentor.isActive ? ' · Nonaktif' : ''}</span><span className="block truncate text-xs text-navy/55">{mentor.email}</span></span></label>;
        })}</div>}
        <button onClick={() => void save()} disabled={!company || saving} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-steel px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-steel/90 disabled:cursor-not-allowed disabled:opacity-40"><Save className="h-4 w-4" />{saving ? 'Menyimpan...' : 'Simpan Daftar Mentor'}</button>
        <p className="text-[11px] leading-relaxed text-navy/50">Mentor yang sedang ditetapkan tidak dapat dihapus dari daftar sampai Guru Pembimbing menetapkan mentor lain.</p>
      </div>
    </section>}
  </div>;
};
