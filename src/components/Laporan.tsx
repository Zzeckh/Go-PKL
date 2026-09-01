import React, { useEffect, useState } from 'react';
import {
  FileDown,
  Loader2,
  AlertCircle,
  FileText,
  Users,
  ClipboardList,
  Building2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';

const ABSENSI_STATUS = [
  { value: '', label: 'Semua Status' },
  { value: 'hadir', label: 'Hadir' },
  { value: 'izin', label: 'Izin' },
  { value: 'sakit', label: 'Sakit' },
  { value: 'alpha', label: 'Alpha' },
];

const LOGBOOK_STATUS = [
  { value: '', label: 'Semua Status' },
  { value: 'pending', label: 'Menunggu Review' },
  { value: 'approved', label: 'Disetujui' },
  { value: 'rejected', label: 'Ditolak' },
];

type ReportKind = 'absensi' | 'logbooks' | 'pkl';

export const Laporan: React.FC = () => {
  const {
    userRole,
    perusahaanList,
    superClasses,
    loadCompanies,
    loadSuperClasses,
  } = useApp();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [absensiStatus, setAbsensiStatus] = useState('');
  const [logbookStatus, setLogbookStatus] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [classId, setClassId] = useState('');
  const [loadingKind, setLoadingKind] = useState<ReportKind | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  /*
  |--------------------------------------------------------------------------
  | Hak akses laporan
  |--------------------------------------------------------------------------
  |
  | Hubin       -> Penempatan PKL
  | Guru        -> Absensi + Logbook
  | Mentor      -> Absensi + Logbook
  | Super Admin -> Semua laporan
  | Siswa       -> Tidak memiliki laporan
  |
  */

  const isHubin = userRole === 'hubin';
  const isTeacher = userRole === 'teacher';
  const isMentor = userRole === 'mentor';
  const isSuperAdmin = userRole === 'super_admin';
  const isStudent = userRole === 'intern';

  const canViewAbsensi =
    isTeacher || isMentor || isSuperAdmin;

  const canViewLogbook =
    isTeacher || isMentor || isSuperAdmin;

  const canViewPkl =
    isHubin || isSuperAdmin;

  const canFilterScope =
    isHubin || isSuperAdmin;

  /*
  |--------------------------------------------------------------------------
  | Load filter data
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (canFilterScope) {
      loadCompanies();
      loadSuperClasses();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canFilterScope]);

  /*
  |--------------------------------------------------------------------------
  | Query builder
  |--------------------------------------------------------------------------
  */

  const buildQuery = (extra?: Record<string, string>) => {
    const params = new URLSearchParams();

    if (startDate) {
      params.set('startDate', startDate);
    }

    if (endDate) {
      params.set('endDate', endDate);
    }

    if (canFilterScope && companyId) {
      params.set('companyId', companyId);
    }

    if (canFilterScope && classId) {
      params.set('classId', classId);
    }

    if (extra) {
      Object.entries(extra).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        }
      });
    }

    return params.toString();
  };

  /*
  |--------------------------------------------------------------------------
  | Export PDF
  |--------------------------------------------------------------------------
  */

  const handleExport = async (kind: ReportKind) => {
    setError(null);
    setNotice(null);
    setLoadingKind(kind);

    try {
      if (kind === 'absensi') {
        const qs = buildQuery({
          status: absensiStatus,
        });

        await api.download(
          `/api/reports/absensi/pdf?${qs}`,
          'laporan-absensi.pdf'
        );
      }

      if (kind === 'logbooks') {
        const qs = buildQuery({
          status: logbookStatus,
        });

        await api.download(
          `/api/reports/logbooks/pdf?${qs}`,
          'laporan-logbook.pdf'
        );
      }

      if (kind === 'pkl') {
        const qs = buildQuery();

        await api.download(
          `/api/reports/pkl/pdf?${qs}`,
          'laporan-data-pkl.pdf'
        );
      }

      setNotice('PDF berhasil dibuat dan diunduh.');
    } catch (err: any) {
      setError(
        err?.data?.error ||
          err?.message ||
          'Gagal membuat laporan PDF.'
      );
    } finally {
      setLoadingKind(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Label berdasarkan role
  |--------------------------------------------------------------------------
  */

  const roleLabel =
    isTeacher
      ? 'siswa bimbingan Anda'
      : isMentor
      ? 'siswa yang menjadi tanggung jawab Anda'
      : isHubin
      ? 'data penempatan PKL'
      : isSuperAdmin
      ? 'seluruh data sistem'
      : isStudent
      ? 'data Anda sendiri'
      : 'data PKL';

  /*
  |--------------------------------------------------------------------------
  | Siswa tidak memiliki laporan
  |--------------------------------------------------------------------------
  */

  if (isStudent) {
    return (
      <div className="h-full w-full flex items-center justify-center p-5">
        <div className="w-full max-w-md bg-white rounded-[24px] border border-mist/60 shadow-sm p-7 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#F1F4F8] flex items-center justify-center mb-4">
            <FileText className="w-6 h-6 text-navy/50" />
          </div>

          <h1 className="text-lg font-bold text-navy">
            Laporan
          </h1>

          <p className="text-sm text-navy/50 font-semibold mt-2 leading-relaxed">
            Menu laporan hanya tersedia untuk Guru, Mentor,
            Hubin, dan Super Admin.
          </p>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="h-full w-full flex flex-col gap-3 md:gap-4 overflow-y-auto custom-scrollbar">

      {/* HEADER */}
      <div className="shrink-0 bg-white rounded-[24px] border border-mist/60 shadow-sm p-5">
        <div className="flex items-center gap-3">

          <div className="w-11 h-11 rounded-[10px] bg-navy flex items-center justify-center shadow-md shadow-navy/20">
            <FileText className="w-5 h-5 text-white" />
          </div>

          <div>
            <h1 className="text-lg font-bold text-navy leading-tight">
              Laporan
            </h1>

            <p className="text-xs font-semibold text-navy/50 mt-0.5">
              Export laporan PDF untuk {roleLabel}
            </p>
          </div>

        </div>
      </div>

      {/* FILTER */}

      <div className="shrink-0 bg-white rounded-[24px] border border-mist/60 shadow-sm p-5">

        <p className="text-xs font-bold uppercase tracking-widest text-navy/50 mb-3">
          Filter (opsional)
        </p>

        <div
          className={`grid grid-cols-1 sm:grid-cols-2 ${
            canFilterScope
              ? 'lg:grid-cols-4'
              : 'lg:grid-cols-2'
          } gap-3`}
        >

          {/* TANGGAL MULAI */}

          <div>
            <label className="text-[11px] font-bold text-navy/60 block mb-1.5">
              Tanggal Mulai
            </label>

            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-[#F1F4F8] border border-mist rounded-xl px-3 py-2.5 text-sm font-medium text-navy outline-none focus:border-steel transition-all"
            />
          </div>

          {/* TANGGAL AKHIR */}

          <div>
            <label className="text-[11px] font-bold text-navy/60 block mb-1.5">
              Tanggal Akhir
            </label>

            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-[#F1F4F8] border border-mist rounded-xl px-3 py-2.5 text-sm font-medium text-navy outline-none focus:border-steel transition-all"
            />
          </div>

          {/* PERUSAHAAN */}

          {canFilterScope && (
            <div>
              <label className="text-[11px] font-bold text-navy/60 block mb-1.5">
                Perusahaan
              </label>

              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="w-full bg-[#F1F4F8] border border-mist rounded-xl px-3 py-2.5 text-sm font-medium text-navy outline-none focus:border-steel transition-all"
              >
                <option value="">
                  Semua Perusahaan
                </option>

                {perusahaanList.map((company) => (
                  <option
                    key={company.id}
                    value={company.id}
                  >
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* KELAS */}

          {canFilterScope && (
            <div>
              <label className="text-[11px] font-bold text-navy/60 block mb-1.5">
                Kelas
              </label>

              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full bg-[#F1F4F8] border border-mist rounded-xl px-3 py-2.5 text-sm font-medium text-navy outline-none focus:border-steel transition-all"
              >
                <option value="">
                  Semua Kelas
                </option>

                {superClasses.map((schoolClass) => (
                  <option
                    key={schoolClass.id}
                    value={schoolClass.id}
                  >
                    {schoolClass.name}
                  </option>
                ))}
              </select>
            </div>
          )}

        </div>

        {/* ERROR */}

        {error && (
          <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl mt-4">

            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />

            <p className="text-xs font-semibold text-rose-700">
              {error}
            </p>

          </div>
        )}

        {/* SUCCESS */}

        {notice && (
          <div className="flex items-start gap-2 p-3 bg-[#E4F0F1] border border-[#CBE2E4] rounded-xl mt-4">

            <FileDown className="w-4 h-4 text-steel shrink-0 mt-0.5" />

            <p className="text-xs font-semibold text-steel">
              {notice}
            </p>

          </div>
        )}

      </div>

      {/* KARTU LAPORAN */}

      <div
        className={`grid grid-cols-1 ${
          canViewAbsensi &&
          canViewLogbook &&
          canViewPkl
            ? 'md:grid-cols-3'
            : canViewAbsensi &&
              canViewLogbook
            ? 'md:grid-cols-2'
            : 'md:grid-cols-1'
        } gap-3 md:gap-4`}
      >

        {/* =====================================================
            LAPORAN ABSENSI
        ====================================================== */}

        {canViewAbsensi && (
          <div className="bg-white rounded-[24px] border border-mist/60 shadow-sm p-5 flex flex-col gap-3">

            <div className="w-10 h-10 rounded-xl bg-[#F1F4F8] flex items-center justify-center">
              <Users className="w-4 h-4 text-navy/60" />
            </div>

            <div>
              <p className="text-sm font-bold text-navy">
                Laporan Absensi
              </p>

              <p className="text-xs text-navy/50 font-semibold mt-0.5">
                Rekap kehadiran siswa PKL
              </p>
            </div>

            <select
              value={absensiStatus}
              onChange={(e) =>
                setAbsensiStatus(e.target.value)
              }
              className="w-full bg-[#F1F4F8] border border-mist rounded-xl px-3 py-2 text-xs font-semibold text-navy outline-none focus:border-steel transition-all"
            >
              {ABSENSI_STATUS.map((status) => (
                <option
                  key={status.value}
                  value={status.value}
                >
                  {status.label}
                </option>
              ))}
            </select>

            <button
              onClick={() => handleExport('absensi')}
              disabled={loadingKind !== null}
              className="mt-1 w-full bg-navy text-white py-2.5 rounded-xl text-sm font-bold hover:bg-navy/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loadingKind === 'absensi' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}

              {loadingKind === 'absensi'
                ? 'Membuat PDF...'
                : 'Export PDF Absensi'}
            </button>

          </div>
        )}

        {/* =====================================================
            LAPORAN LOGBOOK
        ====================================================== */}

        {canViewLogbook && (
          <div className="bg-white rounded-[24px] border border-mist/60 shadow-sm p-5 flex flex-col gap-3">

            <div className="w-10 h-10 rounded-xl bg-[#F1F4F8] flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-navy/60" />
            </div>

            <div>
              <p className="text-sm font-bold text-navy">
                Laporan Logbook
              </p>

              <p className="text-xs text-navy/50 font-semibold mt-0.5">
                Rekap kegiatan & status logbook
              </p>
            </div>

            <select
              value={logbookStatus}
              onChange={(e) =>
                setLogbookStatus(e.target.value)
              }
              className="w-full bg-[#F1F4F8] border border-mist rounded-xl px-3 py-2 text-xs font-semibold text-navy outline-none focus:border-steel transition-all"
            >
              {LOGBOOK_STATUS.map((status) => (
                <option
                  key={status.value}
                  value={status.value}
                >
                  {status.label}
                </option>
              ))}
            </select>

            <button
              onClick={() => handleExport('logbooks')}
              disabled={loadingKind !== null}
              className="mt-1 w-full bg-navy text-white py-2.5 rounded-xl text-sm font-bold hover:bg-navy/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loadingKind === 'logbooks' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}

              {loadingKind === 'logbooks'
                ? 'Membuat PDF...'
                : 'Export PDF Logbook'}
            </button>

          </div>
        )}

        {/* =====================================================
            DATA PENEMPATAN PKL
        ====================================================== */}

        {canViewPkl && (
          <div className="bg-white rounded-[24px] border border-mist/60 shadow-sm p-5 flex flex-col gap-3">

            <div className="w-10 h-10 rounded-xl bg-[#F1F4F8] flex items-center justify-center">
              <Building2 className="w-4 h-4 text-navy/60" />
            </div>

            <div>
              <p className="text-sm font-bold text-navy">
                Data Penempatan PKL
              </p>

              <p className="text-xs text-navy/50 font-semibold mt-0.5">
                Daftar siswa, perusahaan, guru & mentor
              </p>
            </div>

            <div className="flex-1" />

            <button
              onClick={() => handleExport('pkl')}
              disabled={loadingKind !== null}
              className="mt-1 w-full bg-navy text-white py-2.5 rounded-xl text-sm font-bold hover:bg-navy/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loadingKind === 'pkl' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}

              {loadingKind === 'pkl'
                ? 'Membuat PDF...'
                : 'Export PDF Data PKL'}
            </button>

          </div>
        )}

      </div>

    </div>
  );
};