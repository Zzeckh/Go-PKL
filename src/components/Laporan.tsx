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
type AttendancePreview = {
  reportType?: string;
  title?: string;
  period?: string;
  info?: Record<string, string | number | null>;
  summary: { totalStudents: number; hadir: number; izin: number; sakit: number; alpha: number; total: number };
  rows: Array<{
    id: number;
    name: string;
    username: string;
    className: string;
    companyName: string;
    teacherName: string;
    mentorName: string;
    hadir: number;
    izin: number;
    sakit: number;
    alpha: number;
    total: number;
    percentage: number;
    attendance: Array<{ date: string; status: string; reason: string; checkIn: string }>;
  }>;
};

export const Laporan: React.FC = () => {
  const {
    userRole,
    siswaList,
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
  const [studentId, setStudentId] = useState('');
  const [reportType, setReportType] = useState<'mentor' | 'teacher' | 'student' | 'class' | 'company'>('student');
  const [expandedStudentId, setExpandedStudentId] = useState<number | null>(null);
  const [loadingKind, setLoadingKind] = useState<ReportKind | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [preview, setPreview] = useState<AttendancePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

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
    isTeacher || isMentor || isHubin || isSuperAdmin || isStudent;

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

    if (studentId) {
      params.set('studentId', studentId);
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
          reportType,
        });

        await api.download(
          `/api/reports/preview/pdf?${qs}`,
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

  const handlePreview = async () => {
    setError(null);
    setNotice(null);
    setPreviewLoading(true);
    try {
      const result = await api.get<AttendancePreview>(`/api/reports/preview?${buildQuery({ status: absensiStatus, reportType })}`);
      setPreview(result);
    } catch (err: any) {
      setPreview(null);
      setError(err?.data?.error || err?.message || 'Gagal memuat preview rekap absensi.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (!preview) return;
    // PENTING: satu baris per siswa, PERSIS seperti tabel Preview di atas —
    // jangan di-flatten ke per-tanggal, supaya jumlah baris Excel selalu
    // sama dengan jumlah baris yang tampil di Preview.
    const rows = preview.rows.map((student) => [
      student.username,
      student.name,
      student.className,
      student.companyName,
      student.teacherName,
      student.mentorName,
      student.hadir,
      student.izin,
      student.sakit,
      student.total,
      `${student.percentage}%`,
    ]);
    const csv = [
      ['NIS / Username', 'Nama Siswa', 'Kelas', 'Perusahaan', 'Guru Pembimbing', 'Mentor', 'Hadir', 'Izin', 'Sakit', 'Total', 'Persentase'],
      ...rows,
    ].map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'rekap-kehadiran.csv';
    link.click();
    URL.revokeObjectURL(url);
    setNotice('Rekap berhasil diexport ke Excel/CSV.');
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
                Preview dan export rekap untuk {roleLabel}
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
              ? 'lg:grid-cols-5'
              : 'lg:grid-cols-3'
          } gap-3`}
        >

          <div>
            <label className="text-[11px] font-bold text-navy/60 block mb-1.5">Jenis Laporan</label>
            <select value={reportType} onChange={(e) => setReportType(e.target.value as typeof reportType)} className="w-full bg-[#F1F4F8] border border-mist rounded-xl px-3 py-2.5 text-sm font-medium text-navy outline-none focus:border-steel transition-all">
              {isMentor && <option value="mentor">Mentor</option>}
              {isTeacher && <option value="teacher">Guru</option>}
                {isStudent && <option value="student">Siswa</option>}
              {(isHubin || isSuperAdmin) && <>
                <option value="mentor">Mentor</option>
                <option value="teacher">Guru</option>
                <option value="student">Siswa</option>
                <option value="class">Kelas</option>
                <option value="company">Perusahaan</option>
              </>}
            </select>
          </div>

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

          {canViewAbsensi && (
            <div>
              <label className="text-[11px] font-bold text-navy/60 block mb-1.5">Siswa</label>
              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full bg-[#F1F4F8] border border-mist rounded-xl px-3 py-2.5 text-sm font-medium text-navy outline-none focus:border-steel transition-all"
              >
                <option value="">Semua Siswa</option>
                {siswaList.map((student) => (
                  <option key={student.id} value={student.id}>{student.name}</option>
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

        {canViewAbsensi && (
          <button
            onClick={handlePreview}
            disabled={previewLoading || loadingKind !== null}
            className="mt-4 w-full bg-steel text-white py-2.5 rounded-xl text-sm font-bold hover:bg-steel/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {previewLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            {previewLoading ? 'Memuat Preview...' : 'Preview Rekap Absensi'}
          </button>
        )}

      </div>

      {preview && (
        <div className="bg-white rounded-[24px] border border-mist/60 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-base font-bold text-navy">Preview Rekap Kehadiran</h2>
              <p className="text-xs font-semibold text-navy/50 mt-1">Data preview dan export berasal dari query yang sama.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={handleExportExcel} className="flex items-center gap-1.5 bg-steel text-white text-xs font-bold px-3 py-2 rounded-xl"><FileDown className="w-3.5 h-3.5" /> Export Excel</button>
              <button onClick={async () => { setLoadingKind('absensi'); setError(null); try { await api.download(`/api/reports/preview/pdf?${buildQuery({ status: absensiStatus, reportType })}`, 'laporan-preview.pdf'); setNotice('Laporan PDF berhasil dibuat dan diunduh.'); } catch (err: any) { setError(err?.data?.error || err?.message || 'Gagal membuat laporan PDF.'); } finally { setLoadingKind(null); } }} disabled={loadingKind !== null} className="flex items-center gap-1.5 bg-navy text-white text-xs font-bold px-3 py-2 rounded-xl disabled:opacity-60"><FileDown className="w-3.5 h-3.5" /> Export PDF</button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              ['Total Siswa', preview.summary.totalStudents],
              ['Hadir', preview.summary.hadir],
              ['Izin', preview.summary.izin],
              ['Sakit', preview.summary.sakit],
              ['Total', preview.summary.total],
            ].map(([label, value]) => (
              <div key={label} className="bg-mist/30 border border-mist/60 rounded-xl p-3">
                <p className="text-[10px] font-bold uppercase text-navy/50">{label}</p>
                <p className="text-xl font-bold text-navy mt-1 tabular-nums">{value}</p>
              </div>
            ))}
          </div>

          {preview.info && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {Object.entries(preview.info).map(([label, value]) => (
                <div key={label} className="bg-mist/20 border border-mist/60 rounded-xl p-3">
                  <p className="text-[10px] font-bold uppercase text-navy/50">{label}</p>
                  <p className="text-xs font-bold text-navy mt-1 truncate">{value ?? '-'}</p>
                </div>
              ))}
            </div>
          )}

          {preview.rows.length === 0 ? (
            <p className="rounded-xl border border-mist/60 bg-mist/20 px-4 py-8 text-center text-xs font-semibold text-navy/50">Tidak ada data rekap untuk filter yang dipilih.</p>
          ) : (
          <div className="overflow-x-auto rounded-xl border border-mist/60">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="bg-navy text-white"><tr><th className="p-3">Siswa</th><th className="p-3">Kelas</th><th className="p-3">Perusahaan</th><th className="p-3">Hadir</th><th className="p-3">Izin</th><th className="p-3">Sakit</th><th className="p-3">Total</th><th className="p-3">Persentase</th></tr></thead>
              <tbody>{preview.rows.map(row => <React.Fragment key={row.id}><tr className="border-t border-mist/60"><td className="p-3 font-bold text-navy"><button type="button" onClick={() => setExpandedStudentId(expandedStudentId === row.id ? null : row.id)} className="text-left hover:text-steel">{row.name}<span className="block text-[10px] font-semibold text-navy/50">{row.username} · {expandedStudentId === row.id ? 'Tutup histori' : 'Lihat histori'}</span></button></td><td className="p-3 text-navy/70">{row.className}</td><td className="p-3 text-navy/70">{row.companyName}</td><td className="p-3 font-bold text-navy">{row.hadir}</td><td className="p-3 font-bold text-navy">{row.izin}</td><td className="p-3 font-bold text-navy">{row.sakit}</td><td className="p-3 font-bold text-navy">{row.total}</td><td className="p-3 font-bold text-steel">{row.percentage}%</td></tr>{expandedStudentId === row.id && <tr className="border-t border-mist/40 bg-mist/20"><td colSpan={8} className="p-3"><div className="overflow-x-auto"><table className="w-full min-w-[520px] text-left text-[11px]"><thead><tr className="text-navy/50"><th className="p-2">Tanggal</th><th className="p-2">Status</th><th className="p-2">Check In</th><th className="p-2">Keterangan</th></tr></thead><tbody>{row.attendance.map((item) => <tr key={`${row.id}-${item.date}`} className="border-t border-mist/40"><td className="p-2 text-navy/70">{item.date}</td><td className="p-2 font-bold text-navy">{item.status}</td><td className="p-2 text-navy/70">{item.checkIn}</td><td className="p-2 text-navy/70">{item.reason}</td></tr>)}</tbody></table></div></td></tr>}</React.Fragment>)}</tbody>
            </table>
          </div>
          )}
        </div>
      )}

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
              onClick={handlePreview}
              disabled={loadingKind !== null}
              className="mt-1 w-full bg-navy text-white py-2.5 rounded-xl text-sm font-bold hover:bg-navy/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {previewLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}

              {previewLoading ? 'Memuat Preview...' : 'Preview Rekap Absensi'}
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