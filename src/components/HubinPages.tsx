import React, { useState, useMemo } from 'react';
import {
  Users, Building2, Briefcase, GraduationCap, Search, X, Plus,
  MapPin, Clock, ShieldCheck,
  UserPlus, Building as BuildingIcon, UserCog, Package,
  MapPinned
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LocationPickerModal } from './LocationPickerModal';

type TabKey = 'siswa' | 'guru' | 'perusahaan' | 'mentor';

const getInitials = (name: string) =>
  (name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════ */
export const HubinData: React.FC = () => {
  const {
    siswaList, perusahaanList, guruList, mentorList,
    addSiswa, addPerusahaan, logEntries
  } = useApp();

  const [activeTab, setActiveTab] = useState<TabKey>('siswa');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Detail modal state
  const [detailSiswa, setDetailSiswa] = useState<any>(null);
  const [detailPerusahaan, setDetailPerusahaan] = useState<any>(null);
  const [detailGuru, setDetailGuru] = useState<any>(null);
  const [detailMentor, setDetailMentor] = useState<any>(null);
  
  // ── Location picker modal state
  const [pickerCompany, setPickerCompany] = useState<any>(null);

  /* ── Tahun akademik aktif ── */
  const activeYear = siswaList.find(s => s.academicYear && s.academicYear !== '-')?.academicYear || '2025/2026';

  /* ── Tab config ── */
  const tabConfig: { key: TabKey; label: string; icon: React.ElementType; count: number; group: 'dalam' | 'luar' }[] = [
    { key: 'siswa', label: 'Siswa', icon: GraduationCap, count: siswaList.length, group: 'dalam' },
    { key: 'guru', label: 'Guru', icon: Users, count: guruList.length, group: 'dalam' },
    { key: 'perusahaan', label: 'Perusahaan', icon: Building2, count: perusahaanList.length, group: 'luar' },
    { key: 'mentor', label: 'Mentor', icon: Briefcase, count: mentorList.length, group: 'luar' },
  ];

  /* ── Filtered data per tab ── */
  const filteredSiswa = useMemo(() => siswaList.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.kelas.toLowerCase().includes(search.toLowerCase()) ||
    s.perusahaan.toLowerCase().includes(search.toLowerCase())
  ), [siswaList, search]);

  const filteredGuru = useMemo(() => guruList.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    (g.subject || '').toLowerCase().includes(search.toLowerCase())
  ), [guruList, search]);

  const filteredPerusahaan = useMemo(() => perusahaanList.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.address.toLowerCase().includes(search.toLowerCase())
  ), [perusahaanList, search]);

  const filteredMentor = useMemo(() => mentorList.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.perusahaan.toLowerCase().includes(search.toLowerCase()) ||
    (m.role || '').toLowerCase().includes(search.toLowerCase())
  ), [mentorList, search]);

  const changeTab = (k: TabKey) => {
    setActiveTab(k);
    setSearch('');
  };

  /* ── Stats cards ── */
  const stats = [
    { icon: GraduationCap, label: 'Total Siswa', value: siswaList.length },
    { icon: Users, label: 'Total Guru', value: guruList.length },
    { icon: Building2, label: 'Perusahaan Mitra', value: perusahaanList.length },
    { icon: Briefcase, label: 'Mentor DUDI', value: mentorList.length },
  ];

  /* ── Logbook siswa terpilih (untuk modal detail) ── */
  const getSiswaLogs = (siswaName: string) =>
    logEntries.filter(l => {
      return l.title.toLowerCase().includes(siswaName.split(' ')[0].toLowerCase());
    }).slice(0, 3);

  /* ── Siswa yang dibimbing guru / perusahaan ── */
  const getSiswaByGuru = (guruName: string) =>
    siswaList.filter(s => s.guruPembimbing === guruName);

  const getSiswaByPerusahaan = (companyName: string) =>
    siswaList.filter(s => s.perusahaan === companyName);

  const getSiswaByMentor = (mentorName: string, companyName: string) =>
    siswaList.filter(s =>
      s.mentor === mentorName || s.perusahaan.toLowerCase() === companyName.toLowerCase()
    );

  return (
    <div className="h-full w-full flex flex-col gap-3 md:gap-4 overflow-hidden">

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between shrink-0 bg-white rounded-[24px] p-4 md:p-5 border border-mist/60 shadow-sm">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <div className="w-11 h-11 md:w-12 md:h-12 bg-navy rounded-[10px] flex items-center justify-center text-white shadow-md shadow-navy/20 shrink-0">
            <Package className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-lg md:text-xl text-navy leading-tight truncate">
              Kelola Data
            </h2>
            <p className="text-[13px] text-navy/60 font-semibold mt-0.5 truncate">
              Direktori siswa, guru, perusahaan mitra & mentor DUDI
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold text-navy/60 bg-shell border border-mist px-3 py-2 rounded-full">
            <Clock className="w-3.5 h-3.5" /> TA {activeYear}
          </span>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-steel text-white text-xs font-bold px-4 py-2 rounded-[24px] shadow-md shadow-steel/25 hover:bg-steel/90 hover:-translate-y-0.5 transition-all"
          >
            <Plus className="w-4 h-4" /> Tambah Data
          </button>
        </div>
      </div>

      {/* ── STATS CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white border border-mist/60 rounded-[24px] p-4 md:p-5 min-h-[100px] flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-[10px] bg-shell flex items-center justify-center">
              <s.icon className="w-5 h-5 text-navy/60" />
            </div>
            <div>
              <p className="text-3xl font-bold text-navy tabular-nums leading-none">{s.value}</p>
              <p className="text-[11px] font-bold text-navy/60 uppercase tracking-wide mt-2">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── MAIN CARD (tabs + content) ── */}
      <div className="flex-1 bg-white rounded-[24px] border border-mist/60 shadow-sm flex flex-col overflow-hidden min-h-0">
        
        {/* Toolbar: segmented tabs + search */}
        <div className="px-4 md:px-5 pt-4 pb-3 shrink-0 space-y-3 border-b border-mist/60">
          {/* Segmented tabs grouped by Dalam/Luar */}
          <div className="bg-shell p-1 rounded-[24px] flex items-center gap-1 overflow-x-auto">
            <span className="text-[10px] font-bold text-navy/40 uppercase tracking-widest px-2 shrink-0">
              Dalam
            </span>
            {tabConfig.filter(t => t.group === 'dalam').map(t => {
              const Icon = t.icon;
              const active = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => changeTab(t.key)}
                  className={`flex-1 min-w-[100px] px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                    active ? 'bg-white text-navy shadow-sm' : 'text-navy/60 hover:text-navy'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                  <span className={`text-[10px] tabular-nums ${active ? 'text-steel' : 'text-navy/40'}`}>
                    {t.count}
                  </span>
                </button>
              );
            })}
            <div className="w-px h-5 bg-mist mx-1 shrink-0" />
            <span className="text-[10px] font-bold text-navy/40 uppercase tracking-widest px-2 shrink-0">
              Luar
            </span>
            {tabConfig.filter(t => t.group === 'luar').map(t => {
              const Icon = t.icon;
              const active = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => changeTab(t.key)}
                  className={`flex-1 min-w-[100px] px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                    active ? 'bg-white text-navy shadow-sm' : 'text-navy/60 hover:text-navy'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                  <span className={`text-[10px] tabular-nums ${active ? 'text-steel' : 'text-navy/40'}`}>
                    {t.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/40" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`Cari ${activeTab === 'siswa' ? 'siswa, kelas, perusahaan...' : activeTab === 'guru' ? 'nama guru, mata pelajaran...' : activeTab === 'perusahaan' ? 'nama perusahaan, alamat...' : 'nama mentor, perusahaan, role...'}...`}
              className="w-full bg-shell border border-mist rounded-[24px] pl-10 pr-10 py-2.5 text-sm font-medium text-navy outline-none focus:border-steel focus:bg-white transition-all placeholder:text-navy/40"
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
        </div>

        {/* Content grid */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-5">
          
          {/* ── TAB: SISWA ── */}
          {activeTab === 'siswa' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredSiswa.length === 0 ? (
                <EmptyState label="siswa" search={search} />
              ) : (
                filteredSiswa.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setDetailSiswa(s)}
                    className="p-4 rounded-[24px] border border-mist/60 bg-white hover:border-steel/30 hover:shadow-sm transition-all text-left group"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-11 h-11 rounded-full bg-navy text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {getInitials(s.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-navy truncate">{s.name}</p>
                        <p className="text-[11px] font-semibold text-navy/50 truncate mt-0.5">
                          {s.kelas !== '-' ? s.kelas : 'Belum ada kelas'} · {s.perusahaan !== '-' ? s.perusahaan : 'Belum dipetakan'}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-shell border border-mist rounded-lg px-2 py-1.5 text-center">
                        <p className="text-sm font-bold text-navy tabular-nums leading-none">{s.kehadiran}%</p>
                        <p className="text-[9px] font-bold text-navy/50 uppercase tracking-wide mt-1">Hadir</p>
                      </div>
                      <div className="bg-shell border border-mist rounded-lg px-2 py-1.5 text-center">
                        <p className="text-sm font-bold text-navy tabular-nums leading-none">{s.logs}</p>
                        <p className="text-[9px] font-bold text-navy/50 uppercase tracking-wide mt-1">Log</p>
                      </div>
                      <div className="bg-shell border border-mist rounded-lg px-2 py-1.5 text-center">
                        <p className="text-sm font-bold text-navy tabular-nums leading-none">{s.berkasPct}%</p>
                        <p className="text-[9px] font-bold text-navy/50 uppercase tracking-wide mt-1">Berkas</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {/* ── TAB: GURU ── */}
          {activeTab === 'guru' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredGuru.length === 0 ? (
                <EmptyState label="guru" search={search} />
              ) : (
                filteredGuru.map(g => (
                  <button
                    key={g.id}
                    onClick={() => setDetailGuru(g)}
                    className="p-4 rounded-[24px] border border-mist/60 bg-white hover:border-steel/30 hover:shadow-sm transition-all text-left"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-11 h-11 rounded-full bg-navy text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {getInitials(g.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-navy truncate">{g.name}</p>
                        <p className="text-[11px] font-semibold text-navy/50 truncate mt-0.5">
                          {g.subject || 'Guru Pembimbing'}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold bg-navy text-white px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                        <GraduationCap className="w-3 h-3" /> GURU
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-shell border border-mist rounded-lg px-2 py-2 text-center">
                        <p className="text-base font-bold text-navy tabular-nums leading-none">{g.totalSiswa}</p>
                        <p className="text-[9px] font-bold text-navy/50 uppercase tracking-wide mt-1">Siswa</p>
                      </div>
                      <div className="bg-shell border border-mist rounded-lg px-2 py-2 text-center">
                        <p className="text-base font-bold text-navy tabular-nums leading-none">{g.totalDUDI}</p>
                        <p className="text-[9px] font-bold text-navy/50 uppercase tracking-wide mt-1">DUDI</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {/* ── TAB: PERUSAHAAN (with location badge) ── */}
          {activeTab === 'perusahaan' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredPerusahaan.length === 0 ? (
                <EmptyState label="perusahaan" search={search} />
              ) : (
                filteredPerusahaan.map(c => {
                  const count = siswaList.filter(s => s.perusahaan === c.name).length;
                  const hasCoords = c.latitude != null && c.longitude != null;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setDetailPerusahaan(c)}
                      className="p-4 rounded-[24px] border border-mist/60 bg-white hover:border-steel/30 hover:shadow-sm transition-all text-left group"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-11 h-11 rounded-[10px] bg-steel/10 flex items-center justify-center shrink-0">
                          <BuildingIcon className="w-5 h-5 text-steel" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-navy truncate">{c.name}</p>
                          <p className="text-[11px] font-semibold text-navy/50 truncate mt-0.5">{c.address}</p>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center bg-shell border border-mist rounded-lg px-2.5 py-1.5">
                          <span className="text-[11px] font-bold text-navy/60">Kuota</span>
                          <span className="text-[11px] font-bold text-navy tabular-nums">
                            {count} / {c.quota}
                          </span>
                        </div>
                        <div className="flex justify-between items-center bg-shell border border-mist rounded-lg px-2.5 py-1.5">
                          <span className="text-[11px] font-bold text-navy/60">Mentor</span>
                          <span className="text-[11px] font-bold text-navy truncate ml-2">
                            {c.mentor || '-'}
                          </span>
                        </div>
                        {/* Koordinat status + tombol */}
                        <div className={`flex justify-between items-center rounded-lg px-2.5 py-1.5 border ${
                          hasCoords 
                            ? 'bg-steel/10 border-steel/30' 
                            : 'bg-steel/10 border-steel/20'
                        }`}>
                          <div className="flex items-center gap-1.5">
                            <MapPinned className={`w-3.5 h-3.5 ${hasCoords ? 'text-steel' : 'text-steel'}`} />
                            <span className={`text-[11px] font-bold ${hasCoords ? 'text-steel' : 'text-steel'}`}>
                              {hasCoords ? 'Koordinat Aktif' : 'Belum Diatur'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setPickerCompany(c); }}
                            className={`text-[10px] font-bold px-2 py-1 rounded-md transition-colors ${
                              hasCoords 
                                ? 'bg-white text-navy hover:bg-mist' 
                                : 'bg-steel text-white hover:bg-steel/90'
                            }`}
                          >
                            {hasCoords ? 'Edit' : 'Atur Lokasi'}
                          </button>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}

          {/* ── TAB: MENTOR ── */}
          {activeTab === 'mentor' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredMentor.length === 0 ? (
                <EmptyState label="mentor" search={search} />
              ) : (
                filteredMentor.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setDetailMentor(m)}
                    className="p-4 rounded-[24px] border border-mist/60 bg-white hover:border-steel/30 hover:shadow-sm transition-all text-left"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-11 h-11 rounded-full bg-steel text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {getInitials(m.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-navy truncate">{m.name}</p>
                        <p className="text-[11px] font-semibold text-navy/50 truncate mt-0.5">{m.role || 'Mentor'}</p>
                      </div>
                      <span className="text-[10px] font-bold bg-steel text-white px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                        <Briefcase className="w-3 h-3" /> MENTOR
                      </span>
                    </div>
                    <div className="bg-shell border border-mist rounded-lg p-2.5 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-navy/60 flex items-center gap-1.5">
                          <BuildingIcon className="w-3.5 h-3.5" /> DUDI
                        </span>
                        <span className="font-bold text-navy truncate ml-2">{m.perusahaan}</span>
                      </div>
                      <div className="h-px bg-mist" />
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-navy/60 flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5" /> Bimbingan
                        </span>
                        <span className="font-bold text-navy">{m.totalSiswa} siswa</span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════
          MODALS
          ══════════════════════════════════════ */}

      {/* Modal Detail Siswa */}
      {detailSiswa && (
        <DetailModal
          onClose={() => setDetailSiswa(null)}
          avatarBg="bg-navy"
          avatarContent={getInitials(detailSiswa.name)}
          title={detailSiswa.name}
          subtitle={`${detailSiswa.kelas} · ${detailSiswa.perusahaan}`}
          icon={GraduationCap}
        >
          <div className="grid grid-cols-3 gap-2 mb-5">
            <MiniStat label="Kehadiran" value={`${detailSiswa.kehadiran}%`} />
            <MiniStat label="Logbook" value={detailSiswa.logs} />
            <MiniStat label="Berkas" value={`${detailSiswa.berkasPct}%`} />
          </div>

          <h4 className="text-[11px] font-bold text-navy/50 uppercase tracking-wide mb-2">Info Pembimbing</h4>
          <div className="grid grid-cols-2 gap-2 mb-5">
            <div className="bg-shell border border-mist rounded-[24px] p-3">
              <p className="text-[10px] font-bold text-navy/50 uppercase tracking-wide">Guru Pembimbing</p>
              <p className="text-sm font-bold text-navy mt-0.5 truncate">{detailSiswa.guruPembimbing || '-'}</p>
            </div>
            <div className="bg-shell border border-mist rounded-[24px] p-3">
              <p className="text-[10px] font-bold text-navy/50 uppercase tracking-wide">Mentor</p>
              <p className="text-sm font-bold text-navy mt-0.5 truncate">{detailSiswa.mentor || '-'}</p>
            </div>
          </div>

          <h4 className="text-[11px] font-bold text-navy/50 uppercase tracking-wide mb-2">Logbook Terbaru</h4>
          <LogPreviewList logs={getSiswaLogs(detailSiswa.name)} />
        </DetailModal>
      )}

      {/* Modal Detail Perusahaan */}
      {detailPerusahaan && (
        <DetailModal
          onClose={() => setDetailPerusahaan(null)}
          avatarBg="bg-steel"
          avatarContent={<BuildingIcon className="w-5 h-5" />}
          title={detailPerusahaan.name}
          subtitle={detailPerusahaan.address}
          icon={Building2}
        >
          <div className="grid grid-cols-3 gap-2 mb-5">
            <MiniStat label="Kuota" value={detailPerusahaan.quota} />
            <MiniStat label="Terisi" value={detailPerusahaan.filled} />
            <MiniStat label="Sisa" value={detailPerusahaan.quota - detailPerusahaan.filled} />
          </div>

          <div className="grid grid-cols-2 gap-2 mb-5">
            <div className="bg-shell border border-mist rounded-[24px] p-3">
              <p className="text-[10px] font-bold text-navy/50 uppercase tracking-wide">Mentor DUDI</p>
              <p className="text-sm font-bold text-navy mt-0.5 truncate">{detailPerusahaan.mentor || '-'}</p>
            </div>
            <div className="bg-shell border border-mist rounded-[24px] p-3">
              <p className="text-[10px] font-bold text-navy/50 uppercase tracking-wide">Radius</p>
              <p className="text-sm font-bold text-navy mt-0.5 tabular-nums">{detailPerusahaan.radiusMeters || 500}m</p>
            </div>
          </div>

          {detailPerusahaan.latitude && detailPerusahaan.longitude && (
            <div className="bg-shell border border-mist rounded-[24px] p-3 mb-5 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-steel shrink-0" />
              <p className="text-[11px] font-bold text-navy/70 tabular-nums">
                {detailPerusahaan.latitude.toFixed(4)}, {detailPerusahaan.longitude.toFixed(4)}
              </p>
            </div>
          )}

          {/* Tombol Atur/Edit Lokasi Geofence */}
          <button
            type="button"
            onClick={() => setPickerCompany(detailPerusahaan)}
            className={`w-full mb-5 flex items-center justify-center gap-2 py-3 rounded-[24px] font-bold text-sm transition-all ${
              detailPerusahaan.latitude && detailPerusahaan.longitude
                ? 'bg-mist text-navy hover:bg-mist/80'
                : 'bg-steel text-white hover:bg-steel/90 shadow-md shadow-steel/25'
            }`}
          >
            <MapPinned className="w-4 h-4" />
            {detailPerusahaan.latitude && detailPerusahaan.longitude
              ? 'Edit Lokasi Geofence'
              : 'Atur Lokasi Geofence'}
          </button>

          <h4 className="text-[11px] font-bold text-navy/50 uppercase tracking-wide mb-2">Siswa yang Magang</h4>
          <SiswaPreviewList list={getSiswaByPerusahaan(detailPerusahaan.name)} />
        </DetailModal>
      )}

      {/* Modal Detail Guru */}
      {detailGuru && (
        <DetailModal
          onClose={() => setDetailGuru(null)}
          avatarBg="bg-navy"
          avatarContent={getInitials(detailGuru.name)}
          title={detailGuru.name}
          subtitle={detailGuru.subject || 'Guru Pembimbing'}
          icon={Users}
          badge={{ label: 'GURU', icon: GraduationCap, bg: 'bg-navy', text: 'text-white' }}
        >
          <div className="grid grid-cols-2 gap-2 mb-5">
            <MiniStat label="Siswa Bimbingan" value={detailGuru.totalSiswa} />
            <MiniStat label="Perusahaan" value={detailGuru.totalDUDI} />
          </div>

          <h4 className="text-[11px] font-bold text-navy/50 uppercase tracking-wide mb-2">Daftar Siswa Bimbingan</h4>
          <SiswaPreviewList list={getSiswaByGuru(detailGuru.name)} />
        </DetailModal>
      )}

      {/* Modal Detail Mentor */}
      {detailMentor && (
        <DetailModal
          onClose={() => setDetailMentor(null)}
          avatarBg="bg-steel"
          avatarContent={getInitials(detailMentor.name)}
          title={detailMentor.name}
          subtitle={`${detailMentor.role || 'Mentor'} · ${detailMentor.perusahaan}`}
          icon={Briefcase}
          badge={{ label: 'MENTOR', icon: Briefcase, bg: 'bg-steel', text: 'text-white' }}
        >
          <div className="grid grid-cols-2 gap-2 mb-5">
            <MiniStat label="Siswa Bimbingan" value={detailMentor.totalSiswa} />
            <MiniStat label="DUDI" value={detailMentor.perusahaan ? 1 : 0} />
          </div>

          <h4 className="text-[11px] font-bold text-navy/50 uppercase tracking-wide mb-2">Daftar Siswa Bimbingan</h4>
          <SiswaPreviewList list={getSiswaByMentor(detailMentor.name, detailMentor.perusahaan)} />
        </DetailModal>
      )}

      {/* Modal Tambah Data */}
      {showAddModal && (
        <AddDataModal
          onClose={() => setShowAddModal(false)}
          activeTab={activeTab}
          addSiswa={addSiswa}
          addPerusahaan={addPerusahaan}
        />
      )}

      {/* Location Picker Modal */}
      {pickerCompany && (
        <LocationPickerModal
          companyId={pickerCompany.id}
          companyName={pickerCompany.name}
          initialLat={pickerCompany.latitude}
          initialLng={pickerCompany.longitude}
          initialRadius={pickerCompany.radiusMeters || 500}
          onClose={() => setPickerCompany(null)}
        />
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   SUB-COMPONENTS
   ══════════════════════════════════════════════════════ */

const EmptyState: React.FC<{ label: string; search: string }> = ({ label, search }) => (
  <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
    <div className="w-14 h-14 rounded-[10px] bg-shell flex items-center justify-center mb-3">
      <Search className="w-6 h-6 text-navy/30" />
    </div>
    <p className="text-sm font-bold text-navy mb-1">Data {label} tidak ditemukan</p>
    <p className="text-xs text-navy/50 max-w-xs">
      {search ? `Tidak ada ${label} yang cocok dengan "${search}"` : `Belum ada data ${label}. Klik "Tambah Data" untuk menambah.`}
    </p>
  </div>
);

const MiniStat: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="bg-shell border border-mist rounded-[24px] p-3 text-center">
    <p className="text-[10px] font-bold text-navy/50 uppercase tracking-wide">{label}</p>
    <p className="text-xl font-bold text-navy tabular-nums mt-1">{value}</p>
  </div>
);

interface DetailModalProps {
  onClose: () => void;
  avatarBg: string;
  avatarContent: React.ReactNode;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  badge?: { label: string; icon: React.ElementType; bg: string; text: string };
  children: React.ReactNode;
}

const DetailModal: React.FC<DetailModalProps> = ({
  onClose, avatarBg, avatarContent, title, subtitle, badge, children
}) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy/50 backdrop-blur-md animate-in fade-in duration-200">
    <div className="bg-white rounded-[24px] max-w-2xl w-full max-h-[85vh] shadow-2xl flex flex-col overflow-hidden border border-mist/60">
      <div className="bg-navy p-5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-12 h-12 rounded-[10px] ${avatarBg === 'bg-navy' ? 'bg-white/15' : 'bg-white'} flex items-center justify-center shrink-0 ${avatarBg === 'bg-navy' ? 'text-white' : 'text-steel'}`}>
            {typeof avatarContent === 'string' ? (
              <span className="font-bold text-base">{avatarContent}</span>
            ) : avatarContent}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-white truncate">{title}</h3>
              {badge && (
                <span className={`text-[10px] font-bold ${badge.bg} ${badge.text} px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0`}>
                  <badge.icon className="w-3 h-3" /> {badge.label}
                </span>
              )}
            </div>
            <p className="text-[12px] font-semibold text-white/60 truncate mt-0.5">{subtitle}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-[10px] bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
        {children}
      </div>
    </div>
  </div>
);

const SiswaPreviewList: React.FC<{ list: any[] }> = ({ list }) => {
  if (list.length === 0) {
    return (
      <div className="bg-shell border border-mist rounded-[24px] p-5 text-center">
        <p className="text-xs font-semibold text-navy/50">Belum ada siswa yang terdaftar.</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {list.map(s => (
        <div key={s.id} className="p-2.5 rounded-[24px] border border-mist/60 bg-white flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-navy text-white flex items-center justify-center font-bold text-xs shrink-0">
            {getInitials(s.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-navy truncate">{s.name}</p>
            <p className="text-[11px] font-semibold text-navy/50 truncate">{s.kelas} · {s.perusahaan}</p>
          </div>
          <span className="text-[10px] font-bold bg-steel/10 text-steel px-2 py-1 rounded-full tabular-nums shrink-0">
            {s.kehadiran}%
          </span>
        </div>
      ))}
    </div>
  );
};

const LogPreviewList: React.FC<{ logs: any[] }> = ({ logs }) => {
  if (logs.length === 0) {
    return (
      <div className="bg-shell border border-mist rounded-[24px] p-5 text-center">
        <p className="text-xs font-semibold text-navy/50">Belum ada logbook tercatat.</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {logs.map(l => (
        <div key={l.id} className="p-3 rounded-[24px] border border-mist/60 bg-white">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] font-bold text-navy/40 uppercase tracking-wide">{l.date}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              l.status === 'approved' ? 'bg-steel/15 text-steel'
              : l.status === 'revision' ? 'bg-navy/10 text-navy'
              : 'bg-steel/10 text-steel'
            }`}>
              {l.status === 'approved' ? 'Disetujui' : l.status === 'revision' ? 'Revisi' : 'Menunggu'}
            </span>
          </div>
          <p className="text-sm font-bold text-navy line-clamp-2">{l.title}</p>
          <p className="text-[11px] font-semibold text-navy/50 mt-0.5">{l.hours} jam · {l.category}</p>
        </div>
      ))}
    </div>
  );
};

/* ── Add Data Modal (FIX: state form TERPISAH per tab) ── */
interface AddDataModalProps {
  onClose: () => void;
  activeTab: TabKey;
  addSiswa: any;
  addPerusahaan: any;
}

const AddDataModal: React.FC<AddDataModalProps> = ({ onClose, activeTab, addSiswa, addPerusahaan }) => {
  const { guruList, mentorList, perusahaanList } = useApp();
  const [formTab, setFormTab] = useState<TabKey>(activeTab);

  // ✅ State terpisah per tab — input tidak bocor antar formulir
  const [formSiswa, setFormSiswa] = useState({
    name: '', kelas: '', guruPembimbing: '', perusahaan: '',
  });
  const [formGuru, setFormGuru] = useState({
    name: '', subject: '',
  });
  const [formPerusahaan, setFormPerusahaan] = useState({
    name: '', address: '', quota: 5, mentor: '',
  });
  const [formMentor, setFormMentor] = useState({
    name: '', role: '', perusahaan: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (formTab === 'siswa') {
        await addSiswa({
          name: formSiswa.name,
          kelas: formSiswa.kelas || '-',
          perusahaan: formSiswa.perusahaan || '-',
          guruPembimbing: formSiswa.guruPembimbing || '-',
          mentor: '-',
          academicYear: '2025/2026',
        });
      } else if (formTab === 'perusahaan') {
        await addPerusahaan({
          name: formPerusahaan.name,
          address: formPerusahaan.address,
          quota: Number(formPerusahaan.quota),
          mentor: formPerusahaan.mentor,
        });
      } else {
        console.warn('Tambah guru/mentor belum diimplementasi di backend');
      }
      onClose();
    } catch (err) {
      alert('Gagal menambah data. Pastikan backend support endpoint ini.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy/50 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-[24px] max-w-2xl w-full max-h-[85vh] shadow-2xl flex flex-col overflow-hidden border border-mist/60">
        <div className="p-5 border-b border-mist/60 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[10px] bg-navy flex items-center justify-center">
                <UserPlus className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-navy">Tambah Data Baru</h3>
                <p className="text-[12px] font-semibold text-navy/60 mt-0.5">Pilih tipe data yang akan ditambah</p>
              </div>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-[10px] bg-mist/60 hover:bg-mist flex items-center justify-center text-navy/60 transition-colors shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="bg-shell p-1 rounded-[24px] flex gap-1">
            {([
              { key: 'siswa', label: 'Siswa', icon: UserPlus },
              { key: 'guru', label: 'Guru', icon: UserCog },
              { key: 'perusahaan', label: 'Perusahaan', icon: BuildingIcon },
              { key: 'mentor', label: 'Mentor', icon: Briefcase },
            ] as const).map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => setFormTab(t.key)}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    formTab === t.key ? 'bg-white text-navy shadow-sm' : 'text-navy/60 hover:text-navy'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" /> {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-3">

          {/* ── FORM SISWA ── */}
          {formTab === 'siswa' && (
            <>
              <FormInput
                label="Nama Lengkap"
                value={formSiswa.name}
                onChange={v => setFormSiswa({ ...formSiswa, name: v })}
                required
                placeholder="Nama siswa"
              />
              <FormInput
                label="Kelas"
                value={formSiswa.kelas}
                onChange={v => setFormSiswa({ ...formSiswa, kelas: v })}
                placeholder="Contoh: XII RPL 1"
              />
              <FormSelect
                label="Guru Pembimbing"
                value={formSiswa.guruPembimbing}
                onChange={v => setFormSiswa({ ...formSiswa, guruPembimbing: v })}
                options={guruList.map(g => g.name)}
              />
              <FormSelect
                label="Tempat PKL (Perusahaan)"
                value={formSiswa.perusahaan}
                onChange={v => setFormSiswa({ ...formSiswa, perusahaan: v })}
                options={perusahaanList.map(c => c.name)}
              />
            </>
          )}

          {/* ── FORM GURU ── */}
          {formTab === 'guru' && (
            <>
              <FormInput
                label="Nama Lengkap"
                value={formGuru.name}
                onChange={v => setFormGuru({ ...formGuru, name: v })}
                required
                placeholder="Nama guru"
              />
              <FormInput
                label="Mata Pelajaran / Bidang"
                value={formGuru.subject}
                onChange={v => setFormGuru({ ...formGuru, subject: v })}
                placeholder="Contoh: Produktif RPL"
              />
            </>
          )}

          {/* ── FORM PERUSAHAAN ── */}
          {formTab === 'perusahaan' && (
            <>
              <FormInput
                label="Nama Perusahaan"
                value={formPerusahaan.name}
                onChange={v => setFormPerusahaan({ ...formPerusahaan, name: v })}
                required
                placeholder="Contoh: UPTD Tikomdik"
              />
              <FormInput
                label="Alamat"
                value={formPerusahaan.address}
                onChange={v => setFormPerusahaan({ ...formPerusahaan, address: v })}
                required
                placeholder="Alamat lengkap"
              />
              <FormInput
                label="Kuota Siswa"
                value={formPerusahaan.quota}
                onChange={v => setFormPerusahaan({ ...formPerusahaan, quota: Number(v) || 0 })}
                type="number"
              />
              <FormSelect
                label="Mentor DUDI"
                value={formPerusahaan.mentor}
                onChange={v => setFormPerusahaan({ ...formPerusahaan, mentor: v })}
                options={mentorList.map(m => m.name)}
              />
            </>
          )}

          {/* ── FORM MENTOR ── */}
          {formTab === 'mentor' && (
            <>
              <FormInput
                label="Nama Lengkap"
                value={formMentor.name}
                onChange={v => setFormMentor({ ...formMentor, name: v })}
                required
                placeholder="Nama mentor"
              />
              <FormInput
                label="Role / Jabatan"
                value={formMentor.role}
                onChange={v => setFormMentor({ ...formMentor, role: v })}
                placeholder="Contoh: Kepala Unit"
              />
              <FormSelect
                label="Perusahaan"
                value={formMentor.perusahaan}
                onChange={v => setFormMentor({ ...formMentor, perusahaan: v })}
                options={perusahaanList.map(c => c.name)}
              />
            </>
          )}

          {(formTab === 'guru' || formTab === 'mentor') && (
            <div className="bg-steel/10 border border-steel/20 rounded-[24px] p-3 flex items-start gap-2 mt-2">
              <ShieldCheck className="w-4 h-4 text-steel shrink-0 mt-0.5" />
              <p className="text-[11px] font-medium text-steel leading-relaxed">
                Endpoint untuk menambah guru/mentor belum diimplementasi di backend. Form akan gagal submit — data hanya bisa ditambah lewat seed atau database langsung.
              </p>
            </div>
          )}
        </form>

        <div className="p-5 pt-3 border-t border-mist/60 flex gap-2 shrink-0">
          <button onClick={onClose} type="button" className="flex-1 bg-mist/60 text-navy/70 font-bold text-sm py-3 rounded-[24px] hover:bg-mist transition-colors">
            Batal
          </button>
          <button type="submit" onClick={handleSubmit} className="flex-1 bg-steel text-white font-bold text-sm py-3 rounded-[24px] hover:bg-steel/90 shadow-lg shadow-steel/25 transition-all flex items-center justify-center gap-1.5">
            <Plus className="w-4 h-4" /> Simpan Data
          </button>
        </div>
      </div>
    </div>
  );
};

const FormInput: React.FC<{
  label: string; value: string | number; onChange: (v: string) => void;
  type?: string; required?: boolean; placeholder?: string;
}> = ({ label, value, onChange, type = 'text', required, placeholder }) => (
  <div>
    <label className="text-[11px] font-bold text-navy/70 uppercase tracking-wide block mb-1.5">{label}</label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      required={required}
      placeholder={placeholder}
      className="w-full bg-shell border border-mist rounded-[24px] px-3 py-2.5 text-sm font-semibold text-navy outline-none focus:border-steel focus:bg-white transition-all placeholder:text-navy/40"
    />
  </div>
);

const FormSelect: React.FC<{
  label: string; value: string; onChange: (v: string) => void; options: string[];
}> = ({ label, value, onChange, options }) => (
  <div>
    <label className="text-[11px] font-bold text-navy/70 uppercase tracking-wide block mb-1.5">{label}</label>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-shell border border-mist rounded-[24px] px-3 py-2.5 text-sm font-semibold text-navy outline-none focus:border-steel focus:bg-white transition-all"
    >
      <option value="">— Pilih —</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);