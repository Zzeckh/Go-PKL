import React, { useState, useMemo } from 'react';
import {
  MapPin, Users, Briefcase, GraduationCap, Compass, Building2,
  Search, Pencil, Save, X, CheckCircle2, ShieldCheck, Map,
  ChevronRight, Filter, Plus, Calendar
} from 'lucide-react';
import { useApp, SiswaItem } from '../context/AppContext';

const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, ' ').trim();

type FilterType = 'all' | 'mapped' | 'unmapped';

export const HubinPemetaan: React.FC = () => {
  const { mapLocations, siswaList, guruList, mentorList, updateSiswaMapping } = useApp();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedSiswaId, setSelectedSiswaId] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  // Edit form state
  const [formCompanyId, setFormCompanyId] = useState<number | string>('');
  const [formGuruId, setFormGuruId] = useState<number>(0);
  const [formMentorId, setFormMentorId] = useState<number>(0);

  /* ── Helpers ── */
  const matchLocation = (company?: string) => {
    if (!company || company === '-') return undefined;
    const q = normalize(company);
    return mapLocations.find(l =>
      normalize(l.companyName).includes(q) || q.includes(normalize(l.companyName).split('(')[0].trim())
    );
  };

  const isMapped = (s: SiswaItem) =>
    !!(s.perusahaan && s.perusahaan !== '-' && matchLocation(s.perusahaan));

  /* ── Derived data ── */
  const filteredSiswa = useMemo(() => {
    return siswaList.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
                          s.kelas.toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      if (filter === 'mapped') return isMapped(s);
      if (filter === 'unmapped') return !isMapped(s);
      return true;
    });
  }, [siswaList, search, filter]);

  const selectedSiswa = siswaList.find(s => s.id === selectedSiswaId) || null;
  const selectedLoc = selectedSiswa ? matchLocation(selectedSiswa.perusahaan) : undefined;
  const selectedGuru = selectedSiswa
    ? guruList.find(g => g.name.split(',')[0] === selectedSiswa.guruPembimbing?.split(',')[0]) || null
    : null;
  const selectedMentor = selectedSiswa
    ? mentorList.find(m => m.name.split(',')[0] === selectedSiswa.mentor?.split(',')[0]) || null
    : null;

  const mappedCount = siswaList.filter(isMapped).length;
  const unmappedCount = siswaList.length - mappedCount;

  const activeYear = siswaList.find(s => s.academicYear && s.academicYear !== '-')?.academicYear || '2025/2026';

  /* ── Actions ── */
  const handleSelectSiswa = (s: SiswaItem) => {
    setSelectedSiswaId(s.id);
    setEditing(false);
    setJustSaved(false);
    const loc = matchLocation(s.perusahaan);
    const guru = guruList.find(g => g.name.split(',')[0] === s.guruPembimbing?.split(',')[0]);
    const mentor = mentorList.find(m => m.name.split(',')[0] === s.mentor?.split(',')[0]);
    setFormCompanyId(loc?.id ?? '');
    setFormGuruId(guru?.id ?? 0);
    setFormMentorId(mentor?.id ?? 0);
  };

  const handleEdit = () => {
    setEditing(true);
    setJustSaved(false);
  };

  const handleSave = async () => {
    if (!selectedSiswa) return;
    const loc = mapLocations.find(l => l.id === formCompanyId);
    const guru = guruList.find(g => g.id === formGuruId);
    const mentor = mentorList.find(m => m.id === formMentorId);
    await updateSiswaMapping(selectedSiswa.id, {
      perusahaan: loc ? loc.companyName.replace(/\s*\(.*\)$/, '') : selectedSiswa.perusahaan,
      guruPembimbing: guru ? guru.name : selectedSiswa.guruPembimbing,
      mentor: mentor ? mentor.name : selectedSiswa.mentor,
    });
    setEditing(false);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2500);
  };

  const handleCancel = () => {
    if (!selectedSiswa) return;
    const loc = matchLocation(selectedSiswa.perusahaan);
    const guru = guruList.find(g => g.name.split(',')[0] === selectedSiswa.guruPembimbing?.split(',')[0]);
    const mentor = mentorList.find(m => m.name.split(',')[0] === selectedSiswa.mentor?.split(',')[0]);
    setFormCompanyId(loc?.id ?? '');
    setFormGuruId(guru?.id ?? 0);
    setFormMentorId(mentor?.id ?? 0);
    setEditing(false);
  };

  const stats = [
    { icon: GraduationCap, label: 'Total Siswa', value: siswaList.length, color: 'text-navy' },
    { icon: Building2, label: 'Perusahaan Mitra', value: mapLocations.length, color: 'text-navy' },
    { icon: CheckCircle2, label: 'Sudah Terpetakan', value: mappedCount, color: unmappedCount > 0 ? 'text-[#9A6B15]' : 'text-steel' },
  ];

  return (
    <div className="h-full w-full flex flex-col gap-3 md:gap-4 overflow-hidden">

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between shrink-0 bg-white rounded-[24px] p-4 md:p-5 border border-mist/60 shadow-sm">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <div className="w-11 h-11 md:w-12 md:h-12 bg-navy rounded-2xl flex items-center justify-center text-white shadow-md shadow-navy/20 shrink-0">
            <Compass className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-lg md:text-xl text-navy leading-tight truncate">
              Pemetaan Sebaran PKL
            </h2>
            <p className="text-[13px] text-navy/60 font-semibold mt-0.5 truncate">
              Atur penempatan siswa ke perusahaan, guru & mentor pembimbing
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-steel bg-steel/10 border border-steel/20 px-3 py-2 rounded-full">
            <Calendar className="w-3.5 h-3.5" />
            TA {activeYear}
          </span>
        </div>
      </div>

      {/* ── STATS CARDS ── */}
      <div className="grid grid-cols-3 gap-3 shrink-0">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white border border-mist/60 rounded-[24px] p-4 md:p-5 min-h-[100px] flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-[#F1F4F8] flex items-center justify-center">
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-3xl font-bold text-navy tabular-nums leading-none">{s.value}</p>
              <p className="text-[11px] font-bold text-navy/60 uppercase tracking-wide mt-2">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── MAIN GRID (3 + 2) ── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-3 md:gap-4 min-h-0">

        {/* ══ LEFT: Daftar Siswa PKL ══ */}
        <div className="lg:col-span-3 bg-white rounded-[24px] border border-mist/60 shadow-sm flex flex-col overflow-hidden min-h-0">
          <div className="px-4 md:px-5 pt-4 pb-3 shrink-0 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-steel/15 flex items-center justify-center">
                  <GraduationCap className="w-3.5 h-3.5 text-steel" />
                </div>
                <p className="text-[13px] font-bold uppercase tracking-widest text-navy/70">
                  Daftar Siswa PKL
                </p>
              </div>
              <span className="text-[11px] font-bold text-navy/40 tabular-nums">
                {filteredSiswa.length} siswa
              </span>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/40" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari nama siswa atau kelas..."
                className="w-full bg-[#F1F4F8] border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-navy outline-none focus:border-steel focus:bg-white transition-all placeholder:text-navy/40"
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

            {/* Filter pills */}
            <div className="bg-[#F1F4F8] p-1 rounded-xl flex gap-1">
              {([
                { key: 'all', label: 'Semua', count: siswaList.length },
                { key: 'mapped', label: 'Terpetakan', count: mappedCount },
                { key: 'unmapped', label: 'Belum', count: unmappedCount },
              ] as const).map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    filter === f.key ? 'bg-white text-navy shadow-sm' : 'text-navy/60 hover:text-navy'
                  }`}
                >
                  <Filter className="w-3 h-3" />
                  {f.label}
                  <span className={`text-[10px] tabular-nums ${filter === f.key ? 'text-steel' : 'text-navy/40'}`}>
                    {f.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* List siswa */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-4 md:px-5 pb-4 flex flex-col gap-2 min-h-0">
            {filteredSiswa.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#F1F4F8] flex items-center justify-center mb-3">
                  <Search className="w-6 h-6 text-navy/30" />
                </div>
                <p className="text-sm font-bold text-navy mb-1">Siswa tidak ditemukan</p>
                <p className="text-xs text-navy/50 max-w-xs">
                  {search ? `Tidak ada siswa yang cocok dengan "${search}"` : 'Belum ada data siswa di sistem.'}
                </p>
              </div>
            ) : (
              filteredSiswa.map((s) => {
                const mapped = isMapped(s);
                const isSelected = selectedSiswaId === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => handleSelectSiswa(s)}
                    className={`p-3 rounded-xl border transition-all shrink-0 text-left group flex items-center gap-3 ${
                      isSelected
                        ? 'bg-steel/10 border-steel/30 shadow-sm'
                        : 'bg-white border-mist/60 hover:border-steel/30 hover:bg-[#F1F4F8]/50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                      isSelected ? 'bg-steel text-white' : 'bg-navy text-white'
                    }`}>
                      {s.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-sm font-bold truncate ${isSelected ? 'text-steel' : 'text-navy'}`}>
                          {s.name}
                        </p>
                        {s.kelas && s.kelas !== '-' && (
                          <span className="text-[10px] font-bold text-navy/60 bg-[#F1F4F8] border border-[#E2E8F0] px-2 py-0.5 rounded-md shrink-0">
                            {s.kelas}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-semibold text-navy/50 truncate mt-0.5">
                        {mapped ? s.perusahaan : 'Belum dipetakan'}
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                      mapped ? 'bg-steel/10 text-steel' : 'bg-[#FBF3E2] text-[#9A6B15]'
                    }`}>
                      {mapped ? '✓ Terpetakan' : 'Belum'}
                    </span>
                    <ChevronRight className={`w-4 h-4 shrink-0 ${isSelected ? 'text-steel' : 'text-navy/20 group-hover:text-steel'} group-hover:translate-x-0.5 transition-all`} />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ══ RIGHT: Detail Siswa + Form Pemetaan ══ */}
        <div className="lg:col-span-2 flex flex-col gap-3 min-h-0">

          {!selectedSiswa ? (
            /* ── Empty State ── */
            <div className="flex-1 bg-white rounded-[24px] border border-mist/60 shadow-sm flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-steel/10 flex items-center justify-center mb-4">
                <Map className="w-7 h-7 text-steel" />
              </div>
              <h3 className="text-base font-bold text-navy mb-1">Pilih Siswa untuk Memetakan</h3>
              <p className="text-sm text-navy/60 max-w-xs leading-relaxed">
                Klik salah satu siswa di daftar kiri untuk melihat dan mengatur tempat PKL, guru, serta mentor pembimbingnya.
              </p>

              {/* Mini peta dekoratif */}
              <div className="mt-6 w-full max-w-xs h-32 relative rounded-xl border border-navy/10 overflow-hidden">
                <div className="absolute inset-0 bg-[#EDF1F7]">
                  <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <rect x="36" y="8" width="26" height="22" rx="2" fill="#E7EBF2" />
                    <rect x="8" y="40" width="22" height="22" rx="2" fill="#E7EBF2" />
                    <rect x="38" y="40" width="24" height="22" rx="2" fill="#E7EBF2" />
                    <rect x="70" y="40" width="24" height="20" rx="2" fill="#E7EBF2" />
                    <rect x="36" y="70" width="26" height="16" rx="2" fill="#E7EBF2" />
                    <path d="M0,34 L100,34" stroke="#FFFFFF" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                    <path d="M0,66 L100,66" stroke="#FFFFFF" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                    <path d="M32,0 L32,100" stroke="#FFFFFF" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                    <path d="M66,0 L66,100" stroke="#FFFFFF" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                  </svg>
                </div>
                {mapLocations.slice(0, 3).map((loc, i) => (
                  <div
                    key={loc.id}
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${loc.coordinates.x}%`, top: `${loc.coordinates.y}%` }}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 border-white shadow-md flex items-center justify-center ${
                      i === 0 ? 'bg-steel' : 'bg-white'
                    }`}>
                      <MapPin className={`w-2.5 h-2.5 ${i === 0 ? 'text-white' : 'text-navy/60'}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* ── Card navy: identitas siswa terpilih ── */}
              <div className="bg-navy rounded-[24px] p-5 shrink-0 relative overflow-hidden shadow-lg shadow-navy/20">
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
                        <GraduationCap className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-white/60">Siswa Terpilih</p>
                    </div>
                    {justSaved && (
                      <span className="flex items-center gap-1.5 text-[11px] font-bold bg-steel text-white px-2.5 py-1 rounded-full animate-in fade-in">
                        <CheckCircle2 className="w-3 h-3" /> Tersimpan
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/10 flex items-center justify-center font-bold text-sm text-white shrink-0">
                      {selectedSiswa.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-base text-white leading-tight truncate">{selectedSiswa.name}</h4>
                      <div className="flex items-center gap-1.5 mt-1">
                        {selectedSiswa.kelas && selectedSiswa.kelas !== '-' && (
                          <span className="text-[10px] font-bold text-white bg-white/15 px-2 py-0.5 rounded-md">
                            {selectedSiswa.kelas}
                          </span>
                        )}
                        <span className="text-[11px] font-semibold text-white/60 truncate">
                          {selectedSiswa.guruPembimbing && selectedSiswa.guruPembimbing !== '-'
                            ? `Pembimbing: ${selectedSiswa.guruPembimbing}`
                            : 'Belum ada pembimbing'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Card putih: Form Pemetaan + Detail ── */}
              <div className="bg-white rounded-[24px] border border-mist/60 shadow-sm flex-1 flex flex-col overflow-hidden min-h-0">
                <div className="flex items-center justify-between px-4 md:px-5 pt-4 pb-3 shrink-0 border-b border-mist/60">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-steel/15 flex items-center justify-center">
                      <MapPin className="w-3.5 h-3.5 text-steel" />
                    </div>
                    <p className="text-[13px] font-bold text-navy">
                      {editing ? 'Edit Pemetaan' : 'Detail Pemetaan'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {editing ? (
                      <span className="flex items-center gap-1.5 text-[11px] font-bold text-steel bg-steel/10 px-2.5 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-steel animate-pulse" />
                        Mode Edit
                      </span>
                    ) : (
                      <button
                        onClick={handleEdit}
                        className="flex items-center gap-1.5 text-[11px] font-bold bg-navy text-white px-3 py-1.5 rounded-lg hover:bg-navy/90 transition-colors"
                      >
                        <Pencil className="w-3 h-3" /> Edit
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-5 space-y-3 min-h-0">
                  {!editing ? (
                    /* ── View mode ── */
                    <>
                      {/* Tempat PKL */}
                      <div className={`p-3 rounded-xl border ${selectedLoc ? 'border-steel/30 bg-steel/5' : 'border-mist/60 bg-[#F1F4F8]/50'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            selectedLoc ? 'bg-steel text-white' : 'bg-[#F1F4F8] text-navy/50'
                          }`}>
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-navy/50 uppercase tracking-wide">Tempat PKL</p>
                            <p className={`text-sm font-bold truncate mt-0.5 ${selectedLoc ? 'text-steel' : 'text-navy/60'}`}>
                              {selectedSiswa.perusahaan && selectedSiswa.perusahaan !== '-'
                                ? selectedSiswa.perusahaan
                                : 'Belum dipetakan'}
                            </p>
                          </div>
                          {selectedLoc && <MapPin className="w-4 h-4 text-steel shrink-0" />}
                        </div>
                        {selectedLoc && (
                          <p className="text-[11px] text-navy/60 mt-2 pl-13 ml-13 line-clamp-2">{selectedLoc.address}</p>
                        )}
                      </div>

                      {/* Guru Pembimbing */}
                      <div className={`p-3 rounded-xl border ${selectedGuru ? 'border-mist/60 bg-white' : 'border-mist/60 bg-[#F1F4F8]/50'}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center shrink-0">
                            <Users className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-navy/50 uppercase tracking-wide">Guru Pembimbing</p>
                            <p className="text-sm font-bold text-navy truncate mt-0.5">
                              {selectedSiswa.guruPembimbing && selectedSiswa.guruPembimbing !== '-'
                                ? selectedSiswa.guruPembimbing
                                : 'Belum ditentukan'}
                            </p>
                          </div>
                          <span className="text-[10px] font-bold bg-navy text-white px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                            <GraduationCap className="w-3 h-3" /> GURU
                          </span>
                        </div>
                      </div>

                      {/* Mentor */}
                      <div className={`p-3 rounded-xl border ${selectedMentor ? 'border-steel/30 bg-steel/5' : 'border-mist/60 bg-[#F1F4F8]/50'}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-steel flex items-center justify-center shrink-0">
                            <Briefcase className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-navy/50 uppercase tracking-wide">Mentor Industri</p>
                            <p className="text-sm font-bold text-navy truncate mt-0.5">
                              {selectedSiswa.mentor && selectedSiswa.mentor !== '-'
                                ? selectedSiswa.mentor
                                : 'Belum ditentukan'}
                            </p>
                          </div>
                          <span className="text-[10px] font-bold bg-steel text-white px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                            <Briefcase className="w-3 h-3" /> MENTOR
                          </span>
                        </div>
                      </div>

                      {/* Info tambahan */}
                      <div className="p-3 bg-[#F1F4F8] border border-[#E2E8F0] rounded-xl flex items-start gap-2">
                        <ShieldCheck className="w-4 h-4 text-steel shrink-0 mt-0.5" />
                        <p className="text-[11px] font-medium text-navy/70 leading-relaxed">
                          Pemetaan ini menentukan tempat siswa melaksanakan PKL beserta guru dan mentor yang akan membimbing selama periode akademik.
                        </p>
                      </div>
                    </>
                  ) : (
                    /* ── Edit mode ── */
                    <div className="space-y-4">
                      <div>
                        <label className="text-[11px] font-bold text-navy/70 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                          <Building2 className="w-3.5 h-3.5" /> Tempat PKL
                        </label>
                        <select
                          value={formCompanyId}
                          onChange={e => setFormCompanyId(e.target.value)}
                          className="w-full bg-[#F1F4F8] border border-mist rounded-xl px-3 py-2.5 text-sm font-semibold text-navy outline-none focus:border-steel focus:bg-white transition-all"
                        >
                          <option value="">— Pilih Tempat PKL —</option>
                          {mapLocations.map(loc => (
                            <option key={loc.id} value={loc.id}>{loc.companyName}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-navy/70 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                          <Users className="w-3.5 h-3.5" /> Guru Pembimbing
                        </label>
                        <select
                          value={formGuruId}
                          onChange={e => setFormGuruId(Number(e.target.value))}
                          className="w-full bg-[#F1F4F8] border border-mist rounded-xl px-3 py-2.5 text-sm font-semibold text-navy outline-none focus:border-steel focus:bg-white transition-all"
                        >
                          <option value={0}>— Pilih Guru Pembimbing —</option>
                          {guruList.map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-navy/70 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                          <Briefcase className="w-3.5 h-3.5" /> Mentor Industri
                        </label>
                        <select
                          value={formMentorId}
                          onChange={e => setFormMentorId(Number(e.target.value))}
                          className="w-full bg-[#F1F4F8] border border-mist rounded-xl px-3 py-2.5 text-sm font-semibold text-navy outline-none focus:border-steel focus:bg-white transition-all"
                        >
                          <option value={0}>— Pilih Mentor Industri —</option>
                          {mentorList.map(m => (
                            <option key={m.id} value={m.id}>{m.name} • {m.perusahaan}</option>
                          ))}
                        </select>
                      </div>

                      <div className="p-3 bg-steel/5 border border-steel/20 rounded-xl flex items-start gap-2">
                        <Plus className="w-4 h-4 text-steel shrink-0 mt-0.5" />
                        <p className="text-[11px] font-medium text-navy/70 leading-relaxed">
                          Data perusahaan, guru, dan mentor dikelola terpisah. Tambah data baru di halaman Data Siswa atau Data Pembimbing.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {editing && (
                  <div className="p-4 md:p-5 pt-3 border-t border-mist/60 flex gap-2 shrink-0">
                    <button
                      onClick={handleCancel}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-mist/60 text-navy/70 font-bold text-sm py-3 rounded-xl hover:bg-mist transition-colors"
                    >
                      <X className="w-4 h-4" /> Batal
                    </button>
                    <button
                      onClick={handleSave}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-steel text-white font-bold text-sm py-3 rounded-xl hover:bg-steel/90 hover:-translate-y-0.5 shadow-lg shadow-steel/25 transition-all"
                    >
                      <Save className="w-4 h-4" /> Simpan
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};