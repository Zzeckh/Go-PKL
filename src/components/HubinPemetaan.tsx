import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  MapPin, Users, Briefcase, GraduationCap, Compass, Building2,
  Search, Pencil, Save, X, CheckCircle2, ShieldCheck, Map,
  ChevronDown, Filter, Plus, Calendar, ChevronRight
} from 'lucide-react';
import { useApp, SiswaItem } from '../context/AppContext';

const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, ' ').trim();

type FilterType = 'all' | 'mapped' | 'unmapped';

interface SearchableOption {
  id: number | string;
  label: string;
  sublabel?: string;
}

/* ══════════════════════════════════════════════════════
   SEARCHABLE SELECT — pengganti dropdown untuk data banyak
   ══════════════════════════════════════════════════════ */
interface SearchableSelectProps {
  label: string;
  icon: React.ElementType;
  value: number | string;
  options: SearchableOption[];
  onChange: (id: number | string) => void;
  placeholder: string;
  emptyText?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label, icon: Icon, value, options, onChange, placeholder, emptyText = 'Tidak ada data'
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Tutup saat klik di luar
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Auto-focus input saat buka
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const selected = options.find(o => String(o.id) === String(value));
  const filtered = useMemo(() => {
    if (!query) return options;
    const q = query.toLowerCase();
    return options.filter(o =>
      o.label.toLowerCase().includes(q) ||
      (o.sublabel && o.sublabel.toLowerCase().includes(q))
    );
  }, [options, query]);

  return (
    <div ref={containerRef} className="relative">
      <label className="text-[11px] font-bold text-navy/70 uppercase tracking-wide flex items-center gap-1.5 mb-2">
        <Icon className="w-3.5 h-3.5" /> {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-[24px] text-sm font-semibold outline-none transition-all ${
          open
            ? 'bg-white border-2 border-steel text-navy'
            : 'bg-shell border border-mist text-navy hover:border-steel/50'
        }`}
      >
        <span className={`truncate ${selected ? 'text-navy' : 'text-navy/40'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-navy/40 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white border border-mist rounded-[24px] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Search input */}
          <div className="p-2 border-b border-mist">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-navy/40" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Cari..."
                className="w-full bg-shell border border-transparent rounded-lg pl-8 pr-3 py-2 text-sm font-medium text-navy outline-none focus:border-steel focus:bg-white transition-all placeholder:text-navy/40"
              />
            </div>
          </div>

          {/* Options list */}
          <div className="overflow-y-auto custom-scrollbar max-h-60 p-1">
            {filtered.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-xs font-semibold text-navy/40">{emptyText}</p>
              </div>
            ) : (
              filtered.map((opt) => {
                const isSelected = String(opt.id) === String(value);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onChange(opt.id);
                      setOpen(false);
                      setQuery('');
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-steel/10 text-steel'
                        : 'text-navy hover:bg-shell'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-bold truncate ${isSelected ? 'text-steel' : 'text-navy'}`}>
                        {opt.label}
                      </p>
                      {opt.sublabel && (
                        <p className="text-[11px] font-semibold text-navy/50 truncate mt-0.5">
                          {opt.sublabel}
                        </p>
                      )}
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-steel shrink-0" />}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer info */}
          <div className="px-3 py-1.5 border-t border-mist bg-shell/50">
            <p className="text-[10px] font-bold text-navy/40 tabular-nums">
              {filtered.length} dari {options.length} data
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════ */
export const HubinPemetaan: React.FC = () => {
  const { perusahaanList: mapLocations, siswaList, guruList, mentorList, updateSiswaMapping } = useApp();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedSiswaId, setSelectedSiswaId] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const [formCompanyId, setFormCompanyId] = useState<number | string>('');
  const [formGuruId, setFormGuruId] = useState<number | string>('');
  const [formMentorId, setFormMentorId] = useState<number | string>('');

  /* ── Helpers ── */
  const matchLocation = (company?: string) => {
    if (!company || company === '-') return undefined;
    const q = normalize(company);
    return mapLocations.find(l =>
      normalize(l.name).includes(q) || q.includes(normalize(l.name).split('(')[0].trim())
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

  const mappedCount = siswaList.filter(isMapped).length;
  const unmappedCount = siswaList.length - mappedCount;
  const activeYear = siswaList.find(s => s.academicYear && s.academicYear !== '-')?.academicYear || '2025/2026';

  /* ── Options untuk SearchableSelect ── */
  const companyOptions: SearchableOption[] = mapLocations.map(loc => ({
    id: loc.id,
    label: loc.name,
    sublabel: loc.address,
  }));

  const guruOptions: SearchableOption[] = guruList.map(g => ({
    id: g.id,
    label: g.name,
    sublabel: g.subject || 'Guru Pembimbing',
  }));

  const mentorOptions: SearchableOption[] = mentorList.map(m => ({
    id: m.id,
    label: m.name,
    sublabel: m.perusahaan || 'Mentor Industri',
  }));

  /* ── Actions ── */
  const handleSelectSiswa = (s: SiswaItem) => {
    setSelectedSiswaId(s.id);
    setEditing(false);
    setJustSaved(false);
    const loc = matchLocation(s.perusahaan);
    const guru = guruList.find(g => g.name.split(',')[0] === s.guruPembimbing?.split(',')[0]);
    const mentor = mentorList.find(m => m.name.split(',')[0] === s.mentor?.split(',')[0]);
    setFormCompanyId(loc?.id ?? '');
    setFormGuruId(guru?.id ?? '');
    setFormMentorId(mentor?.id ?? '');
  };

  const handleEdit = () => {
    setEditing(true);
    setJustSaved(false);
  };

  const handleSave = async () => {
    if (!selectedSiswa) return;
    const loc = mapLocations.find(l => String(l.id) === String(formCompanyId));
    const guru = guruList.find(g => String(g.id) === String(formGuruId));
    const mentor = mentorList.find(m => String(m.id) === String(formMentorId));
    await updateSiswaMapping(selectedSiswa.id, {
      perusahaan: loc ? loc.name.replace(/\s*\(.*\)$/, '') : selectedSiswa.perusahaan,
      guruPembimbing: guru ? guru.name : selectedSiswa.guruPembimbing,
      mentor: mentor ? mentor.name : selectedSiswa.mentor,
      companyId: formCompanyId,
      teacherId: formGuruId,
      mentorName: mentor ? mentor.name : undefined,
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
    setFormGuruId(guru?.id ?? '');
    setFormMentorId(mentor?.id ?? '');
    setEditing(false);
  };

  const stats = [
    { icon: GraduationCap, label: 'Total Siswa', value: siswaList.length },
    { icon: Building2, label: 'Perusahaan Mitra', value: mapLocations.length },
    { icon: CheckCircle2, label: 'Sudah Terpetakan', value: mappedCount, color: unmappedCount > 0 ? 'text-steel' : 'text-steel' },
  ];

  return (
    <div className="h-full w-full flex flex-col gap-3 md:gap-4 overflow-hidden">

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between shrink-0 bg-white rounded-[24px] p-4 md:p-5 border border-mist/60 shadow-sm">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <div className="w-11 h-11 md:w-12 md:h-12 bg-navy rounded-[24px] flex items-center justify-center text-white shadow-md shadow-navy/20 shrink-0">
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
            <div className="w-10 h-10 rounded-[24px] bg-shell flex items-center justify-center">
              <s.icon className={`w-5 h-5 ${'color' in s ? (s as any).color : 'text-navy'}`} />
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

        {/* ══ LEFT: Daftar Siswa ══ */}
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
                className="w-full bg-shell border border-mist rounded-[24px] pl-10 pr-4 py-2.5 text-sm font-medium text-navy outline-none focus:border-steel focus:bg-white transition-all placeholder:text-navy/40"
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
            <div className="bg-shell p-1 rounded-[24px] flex gap-1">
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

          <div className="flex-1 overflow-y-auto custom-scrollbar px-4 md:px-5 pb-4 flex flex-col gap-2 min-h-0">
            {filteredSiswa.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                <div className="w-14 h-14 rounded-[24px] bg-shell flex items-center justify-center mb-3">
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
                    className={`p-3 rounded-[24px] border transition-all shrink-0 text-left group flex items-center gap-3 ${
                      isSelected
                        ? 'bg-steel/10 border-steel/30 shadow-sm'
                        : 'bg-white border-mist/60 hover:border-steel/30 hover:bg-shell/50'
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
                          <span className="text-[10px] font-bold text-navy/60 bg-shell border border-mist px-2 py-0.5 rounded-md shrink-0">
                            {s.kelas}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-semibold text-navy/50 truncate mt-0.5">
                        {mapped ? s.perusahaan : 'Belum dipetakan'}
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                      mapped ? 'bg-steel/10 text-steel' : 'bg-steel/10 text-steel'
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

        {/* ══ RIGHT: Detail + Form ══ */}
        <div className="lg:col-span-2 flex flex-col gap-3 min-h-0">

          {!selectedSiswa ? (
            <div className="flex-1 bg-white rounded-[24px] border border-mist/60 shadow-sm flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-[24px] bg-steel/10 flex items-center justify-center mb-4">
                <Map className="w-7 h-7 text-steel" />
              </div>
              <h3 className="text-base font-bold text-navy mb-1">Pilih Siswa untuk Memetakan</h3>
              <p className="text-sm text-navy/60 max-w-xs leading-relaxed">
                Klik salah satu siswa di daftar kiri untuk melihat dan mengatur tempat PKL, guru, serta mentor pembimbingnya.
              </p>

              <div className="mt-6 w-full max-w-xs h-32 relative rounded-[24px] border border-navy/10 overflow-hidden">
                <div className="absolute inset-0 bg-shell">
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
                    style={{ left: `${20 + i * 30}%`, top: `${30 + (i % 2) * 30}%` }}
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
              {/* Card identitas */}
              <div className="bg-navy rounded-[24px] p-5 shrink-0 relative overflow-hidden shadow-lg shadow-navy/20">
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-[24px] bg-white/15 flex items-center justify-center">
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
                    <div className="w-12 h-12 rounded-[24px] bg-white/15 border border-white/10 flex items-center justify-center font-bold text-sm text-white shrink-0">
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

              {/* Card form */}
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

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-5 min-h-0">
                  {!editing ? (
                    <div className="space-y-3">
                      <div className={`p-3 rounded-[24px] border ${selectedLoc ? 'border-steel/30 bg-steel/5' : 'border-mist/60 bg-shell/50'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-[24px] flex items-center justify-center shrink-0 ${
                            selectedLoc ? 'bg-steel text-white' : 'bg-shell text-navy/50'
                          }`}>
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-navy/50 uppercase tracking-wide">Tempat PKL</p>
                            <p className={`text-sm font-bold truncate mt-0.5 ${selectedLoc ? 'text-steel' : 'text-navy/60'}`}>
                              {selectedSiswa.perusahaan && selectedSiswa.perusahaan !== '-' ? selectedSiswa.perusahaan : 'Belum dipetakan'}
                            </p>
                          </div>
                          {selectedLoc && <MapPin className="w-4 h-4 text-steel shrink-0" />}
                        </div>
                      </div>

                      <div className={`p-3 rounded-[24px] border ${
  selectedSiswa.guruPembimbing && selectedSiswa.guruPembimbing !== '-' ? 'border-steel/30 bg-steel/5' : 'border-mist/60 bg-white'
}`}>
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 rounded-[24px] bg-navy flex items-center justify-center shrink-0">
      <Users className="w-4 h-4 text-white" />
    </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-navy/50 uppercase tracking-wide">Guru Pembimbing</p>
                            <p className="text-sm font-bold text-navy truncate mt-0.5">
                              {selectedSiswa.guruPembimbing && selectedSiswa.guruPembimbing !== '-' ? selectedSiswa.guruPembimbing : 'Belum ditentukan'}
                            </p>
                          </div>
                          <span className="text-[10px] font-bold bg-navy text-white px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                            <GraduationCap className="w-3 h-3" /> GURU
                          </span>
                        </div>
                      </div>

                      <div className={`p-3 rounded-[24px] border ${selectedSiswa.mentor && selectedSiswa.mentor !== '-' ? 'border-steel/30 bg-steel/5' : 'border-mist/60 bg-shell/50'}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-[24px] bg-steel flex items-center justify-center shrink-0">
                            <Briefcase className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-navy/50 uppercase tracking-wide">Mentor Industri</p>
                            <p className="text-sm font-bold text-navy truncate mt-0.5">
                              {selectedSiswa.mentor && selectedSiswa.mentor !== '-' ? selectedSiswa.mentor : 'Belum ditentukan'}
                            </p>
                          </div>
                          <span className="text-[10px] font-bold bg-steel text-white px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                            <Briefcase className="w-3 h-3" /> MENTOR
                          </span>
                        </div>
                      </div>

                      <div className="p-3 bg-shell border border-mist rounded-[24px] flex items-start gap-2">
                        <ShieldCheck className="w-4 h-4 text-steel shrink-0 mt-0.5" />
                        <p className="text-[11px] font-medium text-navy/70 leading-relaxed">
                          Pemetaan ini menentukan tempat siswa melaksanakan PKL beserta guru dan mentor yang akan membimbing selama periode akademik.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <SearchableSelect
                        label="Tempat PKL"
                        icon={Building2}
                        value={formCompanyId}
                        options={companyOptions}
                        onChange={setFormCompanyId}
                        placeholder="— Pilih Tempat PKL —"
                        emptyText="Belum ada perusahaan. Tambah di halaman Data Perusahaan."
                      />

                      <SearchableSelect
                        label="Guru Pembimbing"
                        icon={Users}
                        value={formGuruId}
                        options={guruOptions}
                        onChange={setFormGuruId}
                        placeholder="— Pilih Guru Pembimbing —"
                        emptyText="Belum ada guru pembimbing."
                      />

                      <SearchableSelect
                        label="Mentor Industri"
                        icon={Briefcase}
                        value={formMentorId}
                        options={mentorOptions}
                        onChange={setFormMentorId}
                        placeholder="— Pilih Mentor Industri —"
                        emptyText="Belum ada mentor industri."
                      />

                      <div className="p-3 bg-steel/5 border border-steel/20 rounded-[24px] flex items-start gap-2">
                        <Plus className="w-4 h-4 text-steel shrink-0 mt-0.5" />
                        <p className="text-[11px] font-medium text-navy/70 leading-relaxed">
                          Data perusahaan, guru, dan mentor dikelola terpisah. Tambah data baru di halaman Data Siswa atau Data Pembimbing.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {editing && (
                  <div className="p-4 md:p-5 pt-3 border-t border-mist/60 flex gap-2 shrink-0">
                    <button
                      onClick={handleCancel}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-mist/60 text-navy/70 font-bold text-sm py-3 rounded-[24px] hover:bg-mist transition-colors"
                    >
                      <X className="w-4 h-4" /> Batal
                    </button>
                    <button
                      onClick={handleSave}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-steel text-white font-bold text-sm py-3 rounded-[24px] hover:bg-steel/90 hover:-translate-y-0.5 shadow-lg shadow-steel/25 transition-all"
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