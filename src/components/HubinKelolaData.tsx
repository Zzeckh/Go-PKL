import React, { useEffect, useMemo, useState } from 'react';
import {
  Users,
  Building2,
  Briefcase,
  GraduationCap,
  Search,
  X,
  Plus,
  MapPin,
  Clock,
  ShieldCheck,
  UserPlus,
  Building as BuildingIcon,
  UserCog,
  Package,
  MapPinned,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';

import { useApp } from '../context/AppContext';
import { LocationPickerModal } from './LocationPickerModal';

type TabKey = 'siswa' | 'guru' | 'perusahaan' | 'mentor';

const getInitials = (name: string) =>
  (name || '?')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

/* =========================================================
   MAIN COMPONENT
========================================================= */

export const HubinData: React.FC = () => {
  const {
    siswaList,
    perusahaanList,
    guruList,
    mentorList,
    addSiswa,
    addPerusahaan,
    logEntries,

    academicYears,
    selectedAcademicYearId,
    setSelectedAcademicYearId,

    // reload data
    loadSiswa,
    loadGuru,
    loadMentor,
    loadPerusahaan,
  } = useApp();

  const [activeTab, setActiveTab] =
    useState<TabKey>('siswa');

  const [search, setSearch] = useState('');

  const [showAddModal, setShowAddModal] =
    useState(false);

  const [detailSiswa, setDetailSiswa] =
    useState<any>(null);

  const [detailPerusahaan, setDetailPerusahaan] =
    useState<any>(null);

  const [detailGuru, setDetailGuru] =
    useState<any>(null);

  const [detailMentor, setDetailMentor] =
    useState<any>(null);

  const [pickerCompany, setPickerCompany] =
    useState<any>(null);

  /* =========================================================
     SELECTED ACADEMIC YEAR
  ========================================================= */

  const activeYear =
    academicYears.find(
      (year) =>
        Number(year.id) ===
        Number(selectedAcademicYearId)
    )?.name || '-';

  /* =========================================================
     RELOAD DATA WHEN ACADEMIC YEAR CHANGES
  ========================================================= */

  useEffect(() => {
    if (!selectedAcademicYearId) return;

    const reload = async () => {
      try {
        await Promise.all([
          loadSiswa(),
          loadGuru(),
          loadMentor(),
          loadPerusahaan(),
        ]);
      } catch (error) {
        console.error(
          'Gagal memuat data berdasarkan tahun ajaran:',
          error
        );
      }
    };

    reload();
  }, [
    selectedAcademicYearId,
    loadSiswa,
    loadGuru,
    loadMentor,
    loadPerusahaan,
  ]);

  /* =========================================================
     HELPER FILTER TAHUN
  ========================================================= */

  const isSameAcademicYear = (
    item: any
  ): boolean => {
    if (!selectedAcademicYearId) {
      return true;
    }

    /*
     * PRIORITAS:
     * 1. academicYearId
     * 2. academicYear object
     * 3. academicYear string
     */

    if (
      item?.academicYearId !== undefined &&
      item?.academicYearId !== null
    ) {
      return (
        Number(item.academicYearId) ===
        Number(selectedAcademicYearId)
      );
    }

    if (
      item?.academicYear &&
      typeof item.academicYear === 'object'
    ) {
      return (
        Number(item.academicYear.id) ===
        Number(selectedAcademicYearId)
      );
    }

    if (
      item?.academicYear &&
      typeof item.academicYear === 'string'
    ) {
      return (
        item.academicYear === activeYear
      );
    }

    /*
     * Kalau AppContext sudah melakukan filtering
     * berdasarkan academicYearId, data yang masuk
     * dianggap sudah sesuai.
     */
    return true;
  };

  /* =========================================================
     FILTER DATA BERDASARKAN TAHUN
  ========================================================= */

  const filteredSiswaByYear = useMemo(() => {
    return siswaList.filter(isSameAcademicYear);
  }, [
    siswaList,
    selectedAcademicYearId,
    activeYear,
  ]);

  const filteredGuruByYear = useMemo(() => {
    return guruList.filter(isSameAcademicYear);
  }, [
    guruList,
    selectedAcademicYearId,
    activeYear,
  ]);

  const filteredPerusahaanByYear = useMemo(() => {
    return perusahaanList.filter(isSameAcademicYear);
  }, [
    perusahaanList,
    selectedAcademicYearId,
    activeYear,
  ]);

  const filteredMentorByYear = useMemo(() => {
    return mentorList.filter(isSameAcademicYear);
  }, [
    mentorList,
    selectedAcademicYearId,
    activeYear,
  ]);

  /* =========================================================
     SEARCH SISWA
  ========================================================= */

  const filteredSiswa = useMemo(() => {
    const keyword = search.toLowerCase();

    return filteredSiswaByYear.filter(
      (s: any) =>
        (s.name || '')
          .toLowerCase()
          .includes(keyword) ||
        (s.kelas || '')
          .toLowerCase()
          .includes(keyword) ||
        (s.perusahaan || '')
          .toLowerCase()
          .includes(keyword) ||
        (s.guruPembimbing || '')
          .toLowerCase()
          .includes(keyword) ||
        (s.mentor || '')
          .toLowerCase()
          .includes(keyword)
    );
  }, [filteredSiswaByYear, search]);

  /* =========================================================
     SEARCH GURU
  ========================================================= */

  const filteredGuru = useMemo(() => {
    const keyword = search.toLowerCase();

    return filteredGuruByYear.filter(
      (g: any) =>
        (g.name || '')
          .toLowerCase()
          .includes(keyword) ||
        (g.subject || '')
          .toLowerCase()
          .includes(keyword)
    );
  }, [filteredGuruByYear, search]);

  /* =========================================================
     SEARCH PERUSAHAAN
  ========================================================= */

  const filteredPerusahaan = useMemo(() => {
    const keyword = search.toLowerCase();

    return filteredPerusahaanByYear.filter(
      (c: any) =>
        (c.name || '')
          .toLowerCase()
          .includes(keyword) ||
        (c.address || '')
          .toLowerCase()
          .includes(keyword) ||
        (c.mentor || '')
          .toLowerCase()
          .includes(keyword)
    );
  }, [
    filteredPerusahaanByYear,
    search,
  ]);

  /* =========================================================
     SEARCH MENTOR
  ========================================================= */

  const filteredMentor = useMemo(() => {
    const keyword = search.toLowerCase();

    return filteredMentorByYear.filter(
      (m: any) =>
        (m.name || '')
          .toLowerCase()
          .includes(keyword) ||
        (m.perusahaan || '')
          .toLowerCase()
          .includes(keyword) ||
        (m.role || '')
          .toLowerCase()
          .includes(keyword)
    );
  }, [filteredMentorByYear, search]);

  /* =========================================================
     CHANGE TAB
  ========================================================= */

  const changeTab = (key: TabKey) => {
    setActiveTab(key);
    setSearch('');
  };

  /* =========================================================
     STATS
  ========================================================= */

  const stats = [
    {
      icon: GraduationCap,
      label: 'Total Siswa',
      value: filteredSiswaByYear.length,
    },
    {
      icon: Users,
      label: 'Total Guru',
      value: filteredGuruByYear.length,
    },
    {
      icon: Building2,
      label: 'Perusahaan Mitra',
      value: filteredPerusahaanByYear.length,
    },
    {
      icon: Briefcase,
      label: 'Mentor DUDI',
      value: filteredMentorByYear.length,
    },
  ];

  /* =========================================================
     SISWA BY GURU
  ========================================================= */

  const getSiswaByGuru = (guru: any) => {
    if (!guru) return [];

    const byTeacherId =
      filteredSiswaByYear.filter((s: any) => {
        if (
          s.teacherId !== undefined &&
          s.teacherId !== null &&
          guru.id !== undefined &&
          guru.id !== null
        ) {
          return (
            Number(s.teacherId) ===
            Number(guru.id)
          );
        }

        return false;
      });

    if (byTeacherId.length > 0) {
      return byTeacherId;
    }

    return filteredSiswaByYear.filter(
      (s: any) =>
        (s.guruPembimbing || '')
          .trim()
          .toLowerCase() ===
        (guru.name || '')
          .trim()
          .toLowerCase()
    );
  };

  /* =========================================================
     PERUSAHAAN BY GURU
  ========================================================= */

  const getPerusahaanByGuru = (guru: any) => {
    const students = getSiswaByGuru(guru);

    const companyNames = new Set(
      students
        .map((s: any) =>
          (s.perusahaan || '').trim()
        )
        .filter(
          (name: string) =>
            name &&
            name !== '-' &&
            name.toLowerCase() !==
              'belum dipetakan'
        )
    );

    return filteredPerusahaanByYear.filter(
      (company: any) =>
        companyNames.has(
          (company.name || '').trim()
        )
    );
  };

  /* =========================================================
     SISWA BY PERUSAHAAN
  ========================================================= */

  const getSiswaByPerusahaan = (
    companyName: string
  ) => {
    if (!companyName) return [];

    return filteredSiswaByYear.filter(
      (s: any) =>
        (s.perusahaan || '')
          .trim()
          .toLowerCase() ===
        companyName.trim().toLowerCase()
    );
  };

  /* =========================================================
     PERUSAHAAN BY MENTOR
  ========================================================= */

  const getPerusahaanByMentor = (
    mentor: any
  ) => {
    if (!mentor) return [];

    const byMentorId =
      filteredPerusahaanByYear.filter(
        (company: any) => {
          if (
            company.mentorId !== undefined &&
            company.mentorId !== null &&
            mentor.id !== undefined &&
            mentor.id !== null
          ) {
            return (
              Number(company.mentorId) ===
              Number(mentor.id)
            );
          }

          return false;
        }
      );

    if (byMentorId.length > 0) {
      return byMentorId;
    }

    return filteredPerusahaanByYear.filter(
      (company: any) =>
        (company.mentor || '')
          .trim()
          .toLowerCase() ===
        (mentor.name || '')
          .trim()
          .toLowerCase()
    );
  };

  /* =========================================================
     SISWA BY MENTOR
  ========================================================= */

  const getSiswaByMentor = (
    mentor: any
  ) => {
    if (!mentor) return [];

    const mentorCompanies =
      getPerusahaanByMentor(mentor);

    const companyNames = new Set(
      mentorCompanies
        .map((company: any) =>
          (company.name || '')
            .trim()
            .toLowerCase()
        )
        .filter(Boolean)
    );

    return filteredSiswaByYear.filter(
      (student: any) => {
        const studentCompany =
          (student.perusahaan || '')
            .trim()
            .toLowerCase();

        if (
          companyNames.has(studentCompany)
        ) {
          return true;
        }

        const studentMentor =
          (student.mentor || '')
            .trim()
            .toLowerCase();

        return (
          studentMentor !== '' &&
          studentMentor !== '-' &&
          studentMentor ===
            (mentor.name || '')
              .trim()
              .toLowerCase()
        );
      }
    );
  };

  /* =========================================================
     SISWA LOG
  ========================================================= */

  const getSiswaLogs = (
    siswaName: string
  ) =>
    logEntries
      .filter((l: any) =>
        (l.title || '')
          .toLowerCase()
          .includes(
            (siswaName || '')
              .split(' ')[0]
              .toLowerCase()
          )
      )
      .slice(0, 3);

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="h-full w-full flex flex-col gap-3 md:gap-4 overflow-y-auto custom-scrollbar">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 shrink-0 bg-white rounded-[24px] p-4 md:p-5 border border-mist/60 shadow-sm">

        {/* TITLE */}

        <div className="flex items-center gap-3 min-w-0">

          <div className="w-11 h-11 md:w-12 md:h-12 bg-navy rounded-[10px] flex items-center justify-center text-white shadow-md shadow-navy/20 shrink-0">
            <Package className="w-5 h-5 md:w-6 md:h-6" />
          </div>

          <div className="min-w-0">

            <h2 className="font-bold text-lg md:text-xl text-navy leading-tight">
              Kelola Data
            </h2>

            <p className="text-[13px] text-navy/60 font-semibold mt-0.5">
              Direktori siswa, guru, perusahaan mitra & mentor DUDI
            </p>

          </div>

        </div>

        {/* ACTION */}

        <div className="flex flex-wrap items-center gap-2">

          {/* ===============================================
              DROPDOWN TAHUN AJARAN
          =============================================== */}

          <div className="relative">

            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-navy/50 pointer-events-none" />

            <select
              value={
                selectedAcademicYearId ?? ''
              }
              onChange={(e) => {
                const value =
                  e.target.value;

                if (!value) return;

                setSelectedAcademicYearId(
                  Number(value)
                );
              }}
              className="appearance-none pl-9 pr-9 py-2.5 rounded-[24px] bg-mist/40 border border-mist text-xs font-bold text-navy outline-none cursor-pointer hover:bg-mist/70 focus:border-steel transition-all"
            >

              {academicYears.length === 0 ? (
                <option value="">
                  Tidak ada tahun ajaran
                </option>
              ) : (
                academicYears.map(
                  (year: any) => (
                    <option
                      key={year.id}
                      value={year.id}
                    >
                      {year.name}
                      {year.isActive
                        ? ' (Aktif)'
                        : ''}
                    </option>
                  )
                )
              )}

            </select>

            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-navy/50 pointer-events-none" />

          </div>

          {/* ===============================================
              ADD BUTTON
          =============================================== */}

          <button
            onClick={() =>
              setShowAddModal(true)
            }
            className="flex items-center gap-1.5 bg-steel text-white text-xs font-bold px-4 py-2.5 rounded-[24px] shadow-md shadow-steel/25 hover:bg-steel/90 hover:-translate-y-0.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            Tambah Data
          </button>

        </div>

      </div>

      {/* =====================================================
          YEAR INFO
      ===================================================== */}

      <div className="flex items-center justify-between bg-steel/5 border border-steel/20 rounded-[20px] px-4 py-2.5 shrink-0">

        <div className="flex items-center gap-2">

          <Clock className="w-4 h-4 text-steel" />

          <span className="text-xs font-bold text-navy">
            Data Tahun Ajaran
          </span>

        </div>

        <span className="text-xs font-bold text-steel">
          {activeYear}
        </span>

      </div>

      {/* =====================================================
          STATS
      ===================================================== */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">

        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white border border-mist/60 rounded-[24px] p-4 md:p-5 min-h-[100px] flex flex-col justify-between"
          >

            <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center">

              <s.icon className="w-4 h-4 text-white" />

            </div>

            <div>

              <p className="text-3xl font-bold text-navy tabular-nums leading-none">
                {s.value}
              </p>

              <p className="text-[11px] font-bold text-navy/60 uppercase tracking-wide mt-2">
                {s.label}
              </p>

            </div>

          </div>
        ))}

      </div>

      {/* =====================================================
          MAIN CARD
      ===================================================== */}

      <div className="lg:flex-1 bg-white rounded-[24px] border border-mist/60 shadow-sm flex flex-col overflow-hidden lg:min-h-0">

        {/* TOP */}

        <div className="px-4 md:px-5 pt-4 pb-3 shrink-0 space-y-3 border-b border-mist/60">

          {/* TAB */}

          <div className="bg-mist/40 p-1 rounded-[24px] flex items-center gap-1 overflow-x-auto">

            <span className="text-[10px] font-bold text-navy/40 uppercase tracking-widest px-2 shrink-0">
              Dalam
            </span>

            <TabButton
              active={activeTab === 'siswa'}
              onClick={() =>
                changeTab('siswa')
              }
              icon={GraduationCap}
              label="Siswa"
              count={filteredSiswaByYear.length}
            />

            <TabButton
              active={activeTab === 'guru'}
              onClick={() =>
                changeTab('guru')
              }
              icon={Users}
              label="Guru"
              count={filteredGuruByYear.length}
            />

            <div className="w-px h-5 bg-mist mx-1 shrink-0" />

            <span className="text-[10px] font-bold text-navy/40 uppercase tracking-widest px-2 shrink-0">
              Luar
            </span>

            <TabButton
              active={
                activeTab === 'perusahaan'
              }
              onClick={() =>
                changeTab('perusahaan')
              }
              icon={Building2}
              label="Perusahaan"
              count={
                filteredPerusahaanByYear.length
              }
            />

            <TabButton
              active={activeTab === 'mentor'}
              onClick={() =>
                changeTab('mentor')
              }
              icon={Briefcase}
              label="Mentor"
              count={
                filteredMentorByYear.length
              }
            />

          </div>

          {/* SEARCH */}

          <div className="relative">

            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/40" />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder={
                `Cari ${
                  activeTab === 'siswa'
                    ? 'siswa, kelas, perusahaan...'
                    : activeTab === 'guru'
                    ? 'nama guru, mata pelajaran...'
                    : activeTab === 'perusahaan'
                    ? 'nama perusahaan, alamat...'
                    : 'nama mentor, perusahaan, role...'
                }...`
              }
              className="w-full bg-mist/40 border border-mist rounded-[24px] pl-10 pr-10 py-2.5 text-sm font-medium text-navy outline-none focus:border-steel focus:bg-white transition-all placeholder:text-navy/40"
            />

            {search && (
              <button
                onClick={() =>
                  setSearch('')
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-navy/10 hover:bg-navy/20 flex items-center justify-center"
              >
                <X className="w-3 h-3 text-navy/60" />
              </button>
            )}

          </div>

        </div>

        {/* ===================================================
            CONTENT
        =================================================== */}

        <div className="lg:flex-1 overflow-y-auto custom-scrollbar p-4 md:p-5 max-h-[65vh] lg:max-h-none">

          {/* =================================================
              SISWA
          ================================================= */}

          {activeTab === 'siswa' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">

              {filteredSiswa.length === 0 ? (
                <EmptyState
                  label="siswa"
                  search={search}
                  year={activeYear}
                />
              ) : (
                filteredSiswa.map(
                  (s: any) => (
                    <button
                      key={s.id}
                      onClick={() =>
                        setDetailSiswa(s)
                      }
                      className="p-4 rounded-[24px] border border-mist/60 bg-white hover:border-steel/30 hover:shadow-sm transition-all text-left"
                    >

                      <div className="flex items-center gap-3 mb-3">

                        <div className="w-11 h-11 rounded-[10px] bg-navy text-white flex items-center justify-center font-bold text-sm shrink-0">
                          {getInitials(s.name)}
                        </div>

                        <div className="flex-1 min-w-0">

                          <p className="text-sm font-bold text-navy truncate">
                            {s.name}
                          </p>

                          <p className="text-[11px] font-semibold text-navy/50 truncate mt-0.5">
                            {s.kelas !== '-'
                              ? s.kelas
                              : 'Belum ada kelas'}
                            {' · '}
                            {s.perusahaan !== '-'
                              ? s.perusahaan
                              : 'Belum dipetakan'}
                          </p>

                        </div>

                      </div>

                      <div className="grid grid-cols-3 gap-2">

                        <MiniStat
                          label="Hadir"
                          value={`${s.kehadiran ?? 0}%`}
                        />

                        <MiniStat
                          label="Log"
                          value={s.logs ?? 0}
                        />

                        <MiniStat
                          label="Berkas"
                          value={`${s.berkasPct ?? 0}%`}
                        />

                      </div>

                    </button>
                  )
                )
              )}

            </div>
          )}

          {/* =================================================
              GURU
          ================================================= */}

          {activeTab === 'guru' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">

              {filteredGuru.length === 0 ? (
                <EmptyState
                  label="guru"
                  search={search}
                  year={activeYear}
                />
              ) : (
                filteredGuru.map(
                  (g: any) => {

                    const students =
                      getSiswaByGuru(g);

                    const companies =
                      getPerusahaanByGuru(g);

                    return (
                      <button
                        key={g.id}
                        onClick={() =>
                          setDetailGuru(g)
                        }
                        className="p-4 rounded-[24px] border border-mist/60 bg-white hover:border-steel/30 hover:shadow-sm transition-all text-left"
                      >

                        <div className="flex items-center gap-3 mb-3">

                          <div className="w-11 h-11 rounded-[10px] bg-navy text-white flex items-center justify-center font-bold text-sm shrink-0">
                            {getInitials(g.name)}
                          </div>

                          <div className="flex-1 min-w-0">

                            <p className="text-sm font-bold text-navy truncate">
                              {g.name}
                            </p>

                            <p className="text-[11px] font-semibold text-navy/50 truncate">
                              {g.subject ||
                                'Guru Pembimbing'}
                            </p>

                          </div>

                          <span className="text-[10px] font-bold bg-navy text-white px-2 py-0.5 rounded-full">
                            GURU
                          </span>

                        </div>

                        <div className="grid grid-cols-2 gap-2">

                          <MiniStat
                            label="Siswa"
                            value={students.length}
                          />

                          <MiniStat
                            label="Perusahaan"
                            value={companies.length}
                          />

                        </div>

                      </button>
                    );
                  }
                )
              )}

            </div>
          )}

          {/* =================================================
              PERUSAHAAN
          ================================================= */}

          {activeTab === 'perusahaan' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">

              {filteredPerusahaan.length === 0 ? (
                <EmptyState
                  label="perusahaan"
                  search={search}
                  year={activeYear}
                />
              ) : (
                filteredPerusahaan.map(
                  (c: any) => {

                    const count =
                      getSiswaByPerusahaan(
                        c.name
                      ).length;

                    const hasCoords =
                      c.latitude != null &&
                      c.longitude != null;

                    return (
                      <button
                        key={c.id}
                        onClick={() =>
                          setDetailPerusahaan(c)
                        }
                        className="p-4 rounded-[24px] border border-mist/60 bg-white hover:border-steel/30 hover:shadow-sm transition-all text-left"
                      >

                        <div className="flex items-center gap-3 mb-3">

                          <div className="w-11 h-11 rounded-[10px] bg-navy flex items-center justify-center shrink-0">
                            <BuildingIcon className="w-5 h-5 text-white" />
                          </div>

                          <div className="flex-1 min-w-0">

                            <p className="text-sm font-bold text-navy truncate">
                              {c.name}
                            </p>

                            <p className="text-[11px] font-semibold text-navy/50 truncate">
                              {c.address}
                            </p>

                          </div>

                        </div>

                        <div className="space-y-1.5">

                          <div className="flex justify-between items-center bg-white border border-mist/60 rounded-lg px-2.5 py-1.5">

                            <span className="text-[11px] font-bold text-navy/60">
                              Kuota
                            </span>

                            <span className="text-[11px] font-bold text-navy">
                              {count} / {c.quota}
                            </span>

                          </div>

                          <div className="flex justify-between items-center bg-white border border-mist/60 rounded-lg px-2.5 py-1.5">

                            <span className="text-[11px] font-bold text-navy/60">
                              Mentor
                            </span>

                            <span className="text-[11px] font-bold text-navy truncate ml-2">
                              {c.mentor || '-'}
                            </span>

                          </div>

                          <div
                            className={`flex justify-between items-center rounded-lg px-2.5 py-1.5 border ${
                              hasCoords
                                ? 'bg-steel/5 border-steel/30'
                                : 'bg-mist/30 border-mist/60'
                            }`}
                          >

                            <div className="flex items-center gap-1.5">

                              <MapPinned
                                className={`w-3.5 h-3.5 ${
                                  hasCoords
                                    ? 'text-steel'
                                    : 'text-navy/50'
                                }`}
                              />

                              <span className="text-[11px] font-bold text-navy/60">
                                {hasCoords
                                  ? 'Koordinat Aktif'
                                  : 'Belum Diatur'}
                              </span>

                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();

                                setPickerCompany(
                                  c
                                );
                              }}
                              className="text-[10px] font-bold px-2 py-1 rounded-md bg-steel text-white"
                            >
                              {hasCoords
                                ? 'Edit'
                                : 'Atur Lokasi'}
                            </button>

                          </div>

                        </div>

                      </button>
                    );
                  }
                )
              )}

            </div>
          )}

          {/* =================================================
              MENTOR
          ================================================= */}

          {activeTab === 'mentor' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">

              {filteredMentor.length === 0 ? (
                <EmptyState
                  label="mentor"
                  search={search}
                  year={activeYear}
                />
              ) : (
                filteredMentor.map(
                  (m: any) => {

                    const companies =
                      getPerusahaanByMentor(
                        m
                      );

                    const students =
                      getSiswaByMentor(m);

                    return (
                      <button
                        key={m.id}
                        onClick={() =>
                          setDetailMentor(m)
                        }
                        className="p-4 rounded-[24px] border border-mist/60 bg-white hover:border-steel/30 hover:shadow-sm transition-all text-left"
                      >

                        <div className="flex items-center gap-3 mb-3">

                          <div className="w-11 h-11 rounded-[10px] bg-navy text-white flex items-center justify-center font-bold text-sm shrink-0">
                            {getInitials(m.name)}
                          </div>

                          <div className="flex-1 min-w-0">

                            <p className="text-sm font-bold text-navy truncate">
                              {m.name}
                            </p>

                            <p className="text-[11px] font-semibold text-navy/50 truncate">
                              {m.role || 'Mentor'}
                            </p>

                          </div>

                          <span className="text-[10px] font-bold bg-navy text-white px-2 py-0.5 rounded-full">
                            MENTOR
                          </span>

                        </div>

                        <div className="grid grid-cols-2 gap-2">

                          <MiniStat
                            label="Perusahaan"
                            value={
                              companies.length
                            }
                          />

                          <MiniStat
                            label="Siswa"
                            value={
                              students.length
                            }
                          />

                        </div>

                      </button>
                    );
                  }
                )
              )}

            </div>
          )}

        </div>

      </div>

      {/* =====================================================
          DETAIL SISWA
      ===================================================== */}

      {detailSiswa && (
        <DetailModal
          onClose={() =>
            setDetailSiswa(null)
          }
          title={detailSiswa.name}
          subtitle={`${detailSiswa.kelas} · ${detailSiswa.perusahaan}`}
          avatarContent={getInitials(
            detailSiswa.name
          )}
          icon={GraduationCap}
        >

          <div className="grid grid-cols-3 gap-2 mb-5">

            <MiniStat
              label="Kehadiran"
              value={`${detailSiswa.kehadiran ?? 0}%`}
            />

            <MiniStat
              label="Logbook"
              value={detailSiswa.logs ?? 0}
            />

            <MiniStat
              label="Berkas"
              value={`${detailSiswa.berkasPct ?? 0}%`}
            />

          </div>

          <div className="grid grid-cols-2 gap-2">

            <div className="bg-mist/30 border border-mist/60 rounded-2xl p-3">

              <p className="text-[10px] font-bold text-navy/50 uppercase">
                Guru Pembimbing
              </p>

              <p className="text-sm font-bold text-navy mt-1">
                {detailSiswa.guruPembimbing ||
                  '-'}
              </p>

            </div>

            <div className="bg-mist/30 border border-mist/60 rounded-2xl p-3">

              <p className="text-[10px] font-bold text-navy/50 uppercase">
                Mentor
              </p>

              <p className="text-sm font-bold text-navy mt-1">
                {detailSiswa.mentor || '-'}
              </p>

            </div>

          </div>

        </DetailModal>
      )}

      {/* =====================================================
          DETAIL PERUSAHAAN
      ===================================================== */}

      {detailPerusahaan && (
        <DetailModal
          onClose={() =>
            setDetailPerusahaan(null)
          }
          title={detailPerusahaan.name}
          subtitle={detailPerusahaan.address}
          avatarContent={
            <BuildingIcon className="w-5 h-5 text-white" />
          }
          icon={Building2}
        >

          <div className="grid grid-cols-3 gap-2 mb-5">

            <MiniStat
              label="Kuota"
              value={detailPerusahaan.quota ?? 0}
            />

            <MiniStat
              label="Terisi"
              value={
                getSiswaByPerusahaan(
                  detailPerusahaan.name
                ).length
              }
            />

            <MiniStat
              label="Sisa"
              value={
                Math.max(
                  0,
                  Number(
                    detailPerusahaan.quota || 0
                  ) -
                    getSiswaByPerusahaan(
                      detailPerusahaan.name
                    ).length
                )
              }
            />

          </div>

          <div className="grid grid-cols-2 gap-2 mb-5">

            <div className="bg-mist/30 border border-mist/60 rounded-2xl p-3">

              <p className="text-[10px] font-bold text-navy/50 uppercase">
                Mentor
              </p>

              <p className="text-sm font-bold text-navy mt-1">
                {detailPerusahaan.mentor ||
                  '-'}
              </p>

            </div>

            <div className="bg-mist/30 border border-mist/60 rounded-2xl p-3">

              <p className="text-[10px] font-bold text-navy/50 uppercase">
                Radius
              </p>

              <p className="text-sm font-bold text-navy mt-1">
                {detailPerusahaan.radiusMeters ??
                  500}
                m
              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={() =>
              setPickerCompany(
                detailPerusahaan
              )
            }
            className="w-full mb-5 flex items-center justify-center gap-2 py-3 rounded-[24px] font-bold text-sm bg-steel text-white"
          >
            <MapPinned className="w-4 h-4" />
            Atur Lokasi Geofence
          </button>

          <h4 className="text-[11px] font-bold text-navy/50 uppercase mb-2">
            Siswa yang Magang
          </h4>

          <SiswaPreviewList
            list={getSiswaByPerusahaan(
              detailPerusahaan.name
            )}
          />

        </DetailModal>
      )}

      {/* =====================================================
          DETAIL GURU
      ===================================================== */}

      {detailGuru && (
        <DetailModal
          onClose={() =>
            setDetailGuru(null)
          }
          title={detailGuru.name}
          subtitle={
            detailGuru.subject ||
            'Guru Pembimbing'
          }
          avatarContent={getInitials(
            detailGuru.name
          )}
          icon={Users}
        >

          <div className="grid grid-cols-2 gap-2 mb-5">

            <MiniStat
              label="Siswa"
              value={
                getSiswaByGuru(detailGuru)
                  .length
              }
            />

            <MiniStat
              label="Perusahaan"
              value={
                getPerusahaanByGuru(
                  detailGuru
                ).length
              }
            />

          </div>

          <h4 className="text-[11px] font-bold text-navy/50 uppercase mb-2">
            Daftar Siswa
          </h4>

          <SiswaPreviewList
            list={getSiswaByGuru(
              detailGuru
            )}
          />

        </DetailModal>
      )}

      {/* =====================================================
          DETAIL MENTOR
      ===================================================== */}

      {detailMentor && (
        <DetailModal
          onClose={() =>
            setDetailMentor(null)
          }
          title={detailMentor.name}
          subtitle={
            detailMentor.role || 'Mentor'
          }
          avatarContent={getInitials(
            detailMentor.name
          )}
          icon={Briefcase}
        >

          <div className="grid grid-cols-2 gap-2 mb-5">

            <MiniStat
              label="Perusahaan"
              value={
                getPerusahaanByMentor(
                  detailMentor
                ).length
              }
            />

            <MiniStat
              label="Siswa"
              value={
                getSiswaByMentor(
                  detailMentor
                ).length
              }
            />

          </div>

          <h4 className="text-[11px] font-bold text-navy/50 uppercase mb-2">
            Daftar Siswa
          </h4>

          <SiswaPreviewList
            list={getSiswaByMentor(
              detailMentor
            )}
          />

        </DetailModal>
      )}

      {/* =====================================================
          ADD DATA
      ===================================================== */}

      {showAddModal && (
        <AddDataModal
          onClose={() =>
            setShowAddModal(false)
          }
          activeTab={activeTab}
          addSiswa={addSiswa}
          addPerusahaan={addPerusahaan}
        />
      )}

      {/* =====================================================
          LOCATION PICKER
      ===================================================== */}

      {pickerCompany && (
        <LocationPickerModal
          companyId={pickerCompany.id}
          companyName={pickerCompany.name}
          initialLat={
            pickerCompany.latitude
          }
          initialLng={
            pickerCompany.longitude
          }
          initialRadius={
            pickerCompany.radiusMeters || 500
          }
          onClose={() =>
            setPickerCompany(null)
          }
        />
      )}

    </div>
  );
};

/* =========================================================
   TAB BUTTON
========================================================= */

const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  count: number;
}> = ({
  active,
  onClick,
  icon: Icon,
  label,
  count,
}) => (
  <button
    onClick={onClick}
    className={`flex-1 min-w-[100px] px-3 py-2 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
      active
        ? 'bg-steel text-white shadow'
        : 'text-navy/60 hover:text-navy'
    }`}
  >

    <Icon className="w-3.5 h-3.5" />

    {label}

    <span
      className={`text-[10px] ${
        active
          ? 'text-white/80'
          : 'text-navy/40'
      }`}
    >
      {count}
    </span>

  </button>
);

/* =========================================================
   EMPTY
========================================================= */

const EmptyState: React.FC<{
  label: string;
  search: string;
  year: string;
}> = ({
  label,
  search,
  year,
}) => (
  <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">

    <div className="w-14 h-14 rounded-[10px] bg-navy flex items-center justify-center mb-3">
      <Search className="w-6 h-6 text-white" />
    </div>

    <p className="text-sm font-bold text-navy mb-1">
      Data {label} tidak ditemukan
    </p>

    <p className="text-xs text-navy/50 max-w-xs">
      {search
        ? `Tidak ada ${label} yang cocok dengan "${search}"`
        : `Belum ada data ${label} untuk tahun ajaran ${year}.`}
    </p>

  </div>
);

/* =========================================================
   MINI STAT
========================================================= */

const MiniStat: React.FC<{
  label: string;
  value: string | number;
}> = ({
  label,
  value,
}) => (
  <div className="bg-white border border-mist/60 rounded-lg px-2 py-2 text-center shadow-sm">

    <p className="text-sm font-bold text-navy tabular-nums leading-none">
      {value}
    </p>

    <p className="text-[9px] font-bold text-navy/50 uppercase tracking-wide mt-1">
      {label}
    </p>

  </div>
);

/* =========================================================
   DETAIL MODAL
========================================================= */

interface DetailModalProps {
  onClose: () => void;
  title: string;
  subtitle: string;
  avatarContent: React.ReactNode;
  icon: React.ElementType;
  children: React.ReactNode;
}

const DetailModal: React.FC<
  DetailModalProps
> = ({
  onClose,
  title,
  subtitle,
  avatarContent,
  children,
}) => (
  <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-3 sm:p-4 bg-navy/50 backdrop-blur-md">

    <div className="bg-white rounded-t-[24px] sm:rounded-[24px] max-w-2xl w-full max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">

      <div className="bg-navy p-4 sm:p-5 flex items-center justify-between shrink-0">

        <div className="flex items-center gap-3 min-w-0">

          <div className="w-12 h-12 rounded-[10px] bg-white/15 text-white flex items-center justify-center shrink-0">
            {avatarContent}
          </div>

          <div className="min-w-0">

            <h3 className="text-lg font-bold text-white truncate">
              {title}
            </h3>

            <p className="text-[12px] font-semibold text-white/60 truncate mt-0.5">
              {subtitle}
            </p>

          </div>

        </div>

        <button
          onClick={onClose}
          className="w-9 h-9 rounded-[10px] bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
        >
          <X className="w-4 h-4" />
        </button>

      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-5">
        {children}
      </div>

    </div>

  </div>
);

/* =========================================================
   SISWA PREVIEW
========================================================= */

const SiswaPreviewList: React.FC<{
  list: any[];
}> = ({ list }) => {

  if (list.length === 0) {
    return (
      <div className="bg-mist/30 border border-mist/60 rounded-2xl p-5 text-center">

        <p className="text-xs font-semibold text-navy/50">
          Belum ada siswa.
        </p>

      </div>
    );
  }

  return (
    <div className="space-y-2">

      {list.map((s: any) => (
        <div
          key={s.id}
          className="p-2.5 rounded-2xl border border-mist/60 bg-white flex items-center gap-3"
        >

          <div className="w-9 h-9 rounded-[10px] bg-navy text-white flex items-center justify-center font-bold text-xs shrink-0">
            {getInitials(s.name)}
          </div>

          <div className="flex-1 min-w-0">

            <p className="text-[13px] font-bold text-navy truncate">
              {s.name}
            </p>

            <p className="text-[11px] font-semibold text-navy/50 truncate">
              {s.kelas || '-'} ·{' '}
              {s.perusahaan || '-'}
            </p>

          </div>

          <span className="text-[10px] font-bold bg-steel text-white px-2.5 py-1 rounded-full">
            {s.kehadiran ?? 0}%
          </span>

        </div>
      ))}

    </div>
  );
};

/* =========================================================
   LOG PREVIEW
========================================================= */

const LogPreviewList: React.FC<{
  logs: any[];
}> = ({ logs }) => {

  if (logs.length === 0) {
    return (
      <div className="bg-mist/30 border border-mist/60 rounded-2xl p-5 text-center">

        <p className="text-xs font-semibold text-navy/50">
          Belum ada logbook.
        </p>

      </div>
    );
  }

  return (
    <div className="space-y-2">

      {logs.map((l: any) => (
        <div
          key={l.id}
          className="p-3 rounded-2xl border border-mist/60 bg-white"
        >

          <div className="flex items-center justify-between mb-1">

            <span className="text-[10px] font-bold text-navy/40 uppercase">
              {l.date}
            </span>

            <span className="text-[10px] font-bold bg-steel text-white px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {l.status}
            </span>

          </div>

          <p className="text-sm font-bold text-navy">
            {l.title}
          </p>

          <p className="text-[11px] font-semibold text-navy/50 mt-0.5">
            {l.hours} jam · {l.category}
          </p>

        </div>
      ))}

    </div>
  );
};

/* =========================================================
   ADD DATA MODAL
========================================================= */

interface AddDataModalProps {
  onClose: () => void;
  activeTab: TabKey;
  addSiswa: any;
  addPerusahaan: any;
}

const AddDataModal: React.FC<
  AddDataModalProps
> = ({
  onClose,
  activeTab,
  addSiswa,
  addPerusahaan,
}) => {

  const {
    guruList,
    mentorList,
    perusahaanList,
    selectedAcademicYearId,
    academicYears,
  } = useApp();

  const [formTab, setFormTab] =
    useState<TabKey>(activeTab);

  const [formSiswa, setFormSiswa] =
    useState({
      name: '',
      kelas: '',
      guruPembimbing: '',
      perusahaan: '',
    });

  const [formPerusahaan, setFormPerusahaan] =
    useState({
      name: '',
      address: '',
      quota: 5,
      mentor: '',
    });

  const selectedYearName =
    academicYears.find(
      (year: any) =>
        Number(year.id) ===
        Number(selectedAcademicYearId)
    )?.name || '-';

  /* =========================================================
     SUBMIT
  ========================================================= */

  const handleSubmit = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    if (!selectedAcademicYearId) {
      alert(
        'Pilih tahun ajaran terlebih dahulu.'
      );
      return;
    }

    try {

      /* =====================================================
         SISWA
      ===================================================== */

      if (formTab === 'siswa') {

        await addSiswa({
          name: formSiswa.name,
          kelas:
            formSiswa.kelas || '-',
          perusahaan:
            formSiswa.perusahaan || '-',
          guruPembimbing:
            formSiswa.guruPembimbing || '-',
          mentor: '-',

          // PENTING
          academicYearId:
            selectedAcademicYearId,

          // fallback untuk kode lama
          academicYear:
            selectedYearName,
        });

      }

      /* =====================================================
         PERUSAHAAN
      ===================================================== */

      else if (
        formTab === 'perusahaan'
      ) {

        await addPerusahaan({
          name: formPerusahaan.name,
          address:
            formPerusahaan.address,
          quota: Number(
            formPerusahaan.quota
          ),
          mentor:
            formPerusahaan.mentor,

          // PENTING
          academicYearId:
            selectedAcademicYearId,
        });

      }

      onClose();

    } catch (error) {

      console.error(
        'Gagal menambah data:',
        error
      );

      alert(
        'Gagal menambahkan data. Periksa koneksi backend.'
      );

    }

  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-3 sm:p-6 bg-navy/50 backdrop-blur-md">

      <div className="bg-white rounded-t-[24px] sm:rounded-[24px] max-w-2xl w-full max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">

        {/* HEADER */}

        <div className="p-4 sm:p-5 border-b border-mist/60">

          <div className="flex items-center justify-between mb-4">

            <div className="flex items-center gap-3">

              <div className="w-10 h-10 rounded-[10px] bg-navy flex items-center justify-center">

                <UserPlus className="w-4 h-4 text-white" />

              </div>

              <div>

                <h3 className="text-lg font-bold text-navy">
                  Tambah Data Baru
                </h3>

                <p className="text-[12px] font-semibold text-steel">
                  Tahun Ajaran {selectedYearName}
                </p>

              </div>

            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-[10px] bg-mist/60 hover:bg-mist flex items-center justify-center"
            >
              <X className="w-4 h-4 text-navy/60" />
            </button>

          </div>

          <div className="bg-mist/40 p-1 rounded-[24px] flex gap-1">

            {[
              {
                key: 'siswa',
                label: 'Siswa',
                icon: UserPlus,
              },
              {
                key: 'perusahaan',
                label: 'Perusahaan',
                icon: BuildingIcon,
              },
            ].map((t: any) => {

              const Icon = t.icon;

              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() =>
                    setFormTab(t.key)
                  }
                  className={`flex-1 px-3 py-2 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 ${
                    formTab === t.key
                      ? 'bg-steel text-white shadow'
                      : 'text-navy/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              );

            })}

          </div>

        </div>

        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-5 space-y-3"
        >

          {/* SISWA */}

          {formTab === 'siswa' && (
            <>

              <FormInput
                label="Nama Lengkap"
                value={
                  formSiswa.name
                }
                onChange={(v) =>
                  setFormSiswa({
                    ...formSiswa,
                    name: v,
                  })
                }
                required
                placeholder="Nama siswa"
              />

              <FormInput
                label="Kelas"
                value={
                  formSiswa.kelas
                }
                onChange={(v) =>
                  setFormSiswa({
                    ...formSiswa,
                    kelas: v,
                  })
                }
                placeholder="Contoh: XII RPL 2"
              />

              <FormSelect
                label="Guru Pembimbing"
                value={
                  formSiswa.guruPembimbing
                }
                onChange={(v) =>
                  setFormSiswa({
                    ...formSiswa,
                    guruPembimbing: v,
                  })
                }
                options={guruList.map(
                  (g: any) => g.name
                )}
              />

              <FormSelect
                label="Perusahaan"
                value={
                  formSiswa.perusahaan
                }
                onChange={(v) =>
                  setFormSiswa({
                    ...formSiswa,
                    perusahaan: v,
                  })
                }
                options={perusahaanList.map(
                  (c: any) => c.name
                )}
              />

            </>
          )}

          {/* PERUSAHAAN */}

          {formTab === 'perusahaan' && (
            <>

              <FormInput
                label="Nama Perusahaan"
                value={
                  formPerusahaan.name
                }
                onChange={(v) =>
                  setFormPerusahaan({
                    ...formPerusahaan,
                    name: v,
                  })
                }
                required
                placeholder="Nama perusahaan"
              />

              <FormInput
                label="Alamat"
                value={
                  formPerusahaan.address
                }
                onChange={(v) =>
                  setFormPerusahaan({
                    ...formPerusahaan,
                    address: v,
                  })
                }
                required
                placeholder="Alamat perusahaan"
              />

              <FormInput
                label="Kuota Siswa"
                type="number"
                value={
                  formPerusahaan.quota
                }
                onChange={(v) =>
                  setFormPerusahaan({
                    ...formPerusahaan,
                    quota:
                      Number(v) || 0,
                  })
                }
              />

              <FormSelect
                label="Mentor DUDI"
                value={
                  formPerusahaan.mentor
                }
                onChange={(v) =>
                  setFormPerusahaan({
                    ...formPerusahaan,
                    mentor: v,
                  })
                }
                options={mentorList.map(
                  (m: any) => m.name
                )}
              />

            </>
          )}

        </form>

        {/* FOOTER */}

        <div className="p-4 sm:p-5 pt-3 border-t border-mist/60 flex gap-2">

          <button
            onClick={onClose}
            type="button"
            className="flex-1 bg-mist/60 text-navy/70 font-bold text-sm py-3 rounded-[24px]"
          >
            Batal
          </button>

          <button
            type="submit"
            onClick={handleSubmit}
            className="flex-1 bg-steel text-white font-bold text-sm py-3 rounded-[24px] shadow-lg shadow-steel/25 flex items-center justify-center gap-1.5"
          >

            <Plus className="w-4 h-4" />

            Simpan Data

          </button>

        </div>

      </div>

    </div>
  );
};

/* =========================================================
   FORM INPUT
========================================================= */

const FormInput: React.FC<{
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}> = ({
  label,
  value,
  onChange,
  type = 'text',
  required,
  placeholder,
}) => (
  <div>

    <label className="text-[11px] font-bold text-navy/70 uppercase tracking-wide block mb-1.5">
      {label}
    </label>

    <input
      type={type}
      value={value}
      onChange={(e) =>
        onChange(e.target.value)
      }
      required={required}
      placeholder={placeholder}
      className="w-full bg-mist/30 border border-mist rounded-[24px] px-3 py-2.5 text-sm font-semibold text-navy outline-none focus:border-steel focus:bg-white"
    />

  </div>
);

/* =========================================================
   FORM SELECT
========================================================= */

const FormSelect: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}> = ({
  label,
  value,
  onChange,
  options,
}) => (
  <div>

    <label className="text-[11px] font-bold text-navy/70 uppercase tracking-wide block mb-1.5">
      {label}
    </label>

    <select
      value={value}
      onChange={(e) =>
        onChange(e.target.value)
      }
      className="w-full bg-mist/30 border border-mist rounded-[24px] px-3 py-2.5 text-sm font-semibold text-navy outline-none focus:border-steel focus:bg-white"
    >

      <option value="">
        — Pilih —
      </option>

      {options.map((option) => (
        <option
          key={option}
          value={option}
        >
          {option}
        </option>
      ))}

    </select>

  </div>
);