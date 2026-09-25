import React, { useEffect, useMemo, useState } from 'react';
import {
  FileDown,
  Loader2,
  AlertCircle,
  FileText,
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

type AttendancePreview = {
  reportType?: string;
  title?: string;
  period?: string;

  info?: Record<string, string | number | null>;

  summary: {
    totalStudents: number;
    hadir: number;
    izin: number;
    sakit: number;
    alpha: number;
    total: number;
  };

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

    attendance: Array<{
      date: string;
      status: string;
      reason: string;
      checkIn: string;
    }>;
  }>;
};

type ReportType =
  | 'mentor'
  | 'teacher'
  | 'student'
  | 'class'
  | 'company';

export const Laporan: React.FC = () => {
  const {
    userRole,
    siswaList,
    perusahaanList,
    superClasses,
    academicYears,
    selectedAcademicYearId,
    loadCompanies,
    loadSuperClasses,
  } = useApp();

  /* ============================================================
     STATE
  ============================================================ */

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [absensiStatus, setAbsensiStatus] = useState('');

  const [companyId, setCompanyId] = useState('');
  const [classId, setClassId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [teacherId, setTeacherId] = useState('');

  /*
   * Tahun ajaran untuk laporan.
   *
   * Untuk Super Admin / Hubin:
   * bisa memilih tahun ajaran secara manual.
   *
   * Default mengikuti selectedAcademicYearId
   * dari AppContext.
   */
  const [reportAcademicYearId, setReportAcademicYearId] =
    useState<string>(
      selectedAcademicYearId
        ? String(selectedAcademicYearId)
        : ''
    );

  const [reportType, setReportType] =
    useState<ReportType>('student');

  const [expandedStudentId, setExpandedStudentId] =
    useState<number | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const [notice, setNotice] =
    useState<string | null>(null);

  const [preview, setPreview] =
    useState<AttendancePreview | null>(null);

  const [previewLoading, setPreviewLoading] =
    useState(false);

  const [excelLoading, setExcelLoading] =
    useState(false);

  const [pdfLoading, setPdfLoading] =
    useState(false);

  /* ============================================================
     ROLE
  ============================================================ */

  const isHubin = userRole === 'hubin';
  const isTeacher = userRole === 'teacher';
  const isMentor = userRole === 'mentor';
  const isSuperAdmin = userRole === 'super_admin';
  const isStudent = userRole === 'intern';

  const canViewAbsensi =
    isTeacher ||
    isMentor ||
    isHubin ||
    isSuperAdmin ||
    isStudent;

  const canFilterScope =
    isHubin ||
    isSuperAdmin;

  /*
   * Hanya Hubin dan Super Admin yang bisa
   * memilih tahun ajaran laporan.
   */
  const canFilterAcademicYear =
    isHubin ||
    isSuperAdmin;

  /* ============================================================
     SYNC TAHUN AJARAN DARI APPCONTEXT
  ============================================================ */

  useEffect(() => {
    if (
      selectedAcademicYearId &&
      canFilterAcademicYear
    ) {
      setReportAcademicYearId(
        String(selectedAcademicYearId)
      );
    }
  }, [
    selectedAcademicYearId,
    canFilterAcademicYear,
  ]);

  /* ============================================================
     LOAD DATA
  ============================================================ */

  useEffect(() => {
    if (canFilterScope) {
      loadCompanies();
      loadSuperClasses();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canFilterScope]);

  /* ============================================================
     DAFTAR GURU
  ============================================================ */

  const teacherOptions = useMemo(() => {
    const teacherMap = new Map<
      number,
      {
        id: number;
        name: string;
      }
    >();

    (siswaList as any[]).forEach((student) => {
      const studentTeacherId =
        student.teacherId ??
        student.teacher?.id;

      const studentTeacherName =
        student.teacherName ??
        student.teacher?.name;

      if (
        !studentTeacherId ||
        !studentTeacherName
      ) {
        return;
      }

      /* Filter perusahaan */

      if (companyId) {
        const studentCompanyId =
          student.companyId ??
          student.company?.id;

        if (
          String(studentCompanyId ?? '') !==
          String(companyId)
        ) {
          return;
        }
      }

      /* Filter kelas */

      if (classId) {
        const studentClassId =
          student.classId ??
          student.class?.id;

        if (
          String(studentClassId ?? '') !==
          String(classId)
        ) {
          return;
        }
      }

      teacherMap.set(
        Number(studentTeacherId),
        {
          id: Number(studentTeacherId),
          name: String(studentTeacherName),
        }
      );
    });

    return Array.from(
      teacherMap.values()
    ).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [
    siswaList,
    companyId,
    classId,
  ]);

  /* ============================================================
     SISWA YANG SESUAI FILTER
  ============================================================ */

  const filteredStudents = useMemo(() => {
    return (siswaList as any[]).filter(
      (student) => {
        /* Filter perusahaan */

        if (companyId) {
          const studentCompanyId =
            student.companyId ??
            student.company?.id;

          if (
            String(studentCompanyId ?? '') !==
            String(companyId)
          ) {
            return false;
          }
        }

        /* Filter kelas */

        if (classId) {
          const studentClassId =
            student.classId ??
            student.class?.id;

          if (
            String(studentClassId ?? '') !==
            String(classId)
          ) {
            return false;
          }
        }

        /* Filter guru */

        if (teacherId) {
          const studentTeacherId =
            student.teacherId ??
            student.teacher?.id;

          if (
            String(studentTeacherId ?? '') !==
            String(teacherId)
          ) {
            return false;
          }
        }

        return true;
      }
    );
  }, [
    siswaList,
    companyId,
    classId,
    teacherId,
  ]);

  /* ============================================================
     RESET GURU KETIKA PERUSAHAAN / KELAS BERUBAH
  ============================================================ */

  useEffect(() => {
    if (!teacherId) {
      return;
    }

    const exists = teacherOptions.some(
      (teacher) =>
        String(teacher.id) ===
        String(teacherId)
    );

    if (!exists) {
      setTeacherId('');
    }
  }, [
    teacherOptions,
    teacherId,
  ]);

  /* ============================================================
     RESET FILTER SAAT JENIS LAPORAN BERUBAH
  ============================================================ */

  useEffect(() => {
    setTeacherId('');
    setStudentId('');
    setPreview(null);
    setExpandedStudentId(null);
    setError(null);
    setNotice(null);
  }, [reportType]);

  /* ============================================================
     QUERY BUILDER
  ============================================================ */

  const buildQuery = (
    extra?: Record<string, string>
  ) => {
    const params =
      new URLSearchParams();

    /* ========================================================
       TANGGAL
    ======================================================== */

    if (startDate) {
      params.set(
        'startDate',
        startDate
      );
    }

    if (endDate) {
      params.set(
        'endDate',
        endDate
      );
    }

    /* ========================================================
       TAHUN AJARAN
    ======================================================== */

    if (
      canFilterAcademicYear &&
      reportAcademicYearId
    ) {
      params.set(
        'academicYearId',
        reportAcademicYearId
      );
    }

    /* ========================================================
       PERUSAHAAN
    ======================================================== */

    if (
      canFilterScope &&
      companyId
    ) {
      params.set(
        'companyId',
        companyId
      );
    }

    /* ========================================================
       KELAS
    ======================================================== */

    if (
      canFilterScope &&
      classId
    ) {
      params.set(
        'classId',
        classId
      );
    }

    /* ========================================================
       SISWA
    ======================================================== */

    if (studentId) {
      params.set(
        'studentId',
        studentId
      );
    }

    /* ========================================================
       GURU
    ======================================================== */

    if (
      teacherId &&
      reportType === 'teacher'
    ) {
      params.set(
        'teacherId',
        teacherId
      );
    }

    /* ========================================================
       JENIS LAPORAN
    ======================================================== */

    if (reportType) {
      params.set(
        'reportType',
        reportType
      );
    }

    /* ========================================================
       EXTRA QUERY
    ======================================================== */

    if (extra) {
      Object.entries(extra).forEach(
        ([key, value]) => {
          if (value) {
            params.set(
              key,
              value
            );
          }
        }
      );
    }

    return params.toString();
  };

  /* ============================================================
     GANTI TAHUN AJARAN
  ============================================================ */

  const handleAcademicYearChange = (
    value: string
  ) => {
    setReportAcademicYearId(value);

    /*
     * Preview lama jangan tetap tampil,
     * karena sudah menggunakan tahun sebelumnya.
     */
    setPreview(null);
    setExpandedStudentId(null);
    setError(null);
    setNotice(null);

    /*
     * Filter siswa/guru juga direset.
     */
    setCompanyId('');
    setClassId('');
    setStudentId('');
    setTeacherId('');
  };

  /* ============================================================
     PREVIEW
  ============================================================ */

  const handlePreview = async () => {
    setError(null);
    setNotice(null);
    setPreviewLoading(true);
    setExpandedStudentId(null);

    try {
      /*
       * Untuk Super Admin / Hubin,
       * tahun ajaran wajib dipilih.
       */
      if (
        canFilterAcademicYear &&
        !reportAcademicYearId
      ) {
        setError(
          'Silakan pilih tahun ajaran terlebih dahulu.'
        );
        setPreviewLoading(false);
        return;
      }

      const qs = buildQuery({
        status: absensiStatus,
      });

      const result =
        await api.get<AttendancePreview>(
          `/api/reports/preview?${qs}`
        );

      setPreview(result);
    } catch (err: any) {
      setPreview(null);

      setError(
        err?.data?.error ||
          err?.message ||
          'Gagal memuat preview rekap absensi.'
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  /* ============================================================
     EXPORT EXCEL
  ============================================================ */

  const handleExportExcel = async () => {
    setError(null);
    setNotice(null);

    if (!preview) {
      setError(
        'Silakan Preview Rekap terlebih dahulu.'
      );
      return;
    }

    setExcelLoading(true);

    try {
      const XLSX =
        await import('xlsx');

      const rows =
        preview.rows.flatMap(
          (student) => {
            if (
              student.attendance &&
              student.attendance.length > 0
            ) {
              return student.attendance.map(
                (item) => ({
                  'Tahun Ajaran':
                    academicYears.find(
                      (year: any) =>
                        String(year.id) ===
                        String(
                          reportAcademicYearId
                        )
                    )?.name || '-',

                  'NIS / Username':
                    student.username || '-',

                  'Nama Siswa':
                    student.name || '-',

                  Kelas:
                    student.className || '-',

                  Perusahaan:
                    student.companyName || '-',

                  'Guru Pembimbing':
                    student.teacherName || '-',

                  Mentor:
                    student.mentorName || '-',

                  Tanggal:
                    item.date || '-',

                  Status:
                    item.status || '-',

                  Keterangan:
                    item.reason || '-',

                  'Check In':
                    item.checkIn || '-',
                })
              );
            }

            return [
              {
                'Tahun Ajaran':
                  academicYears.find(
                    (year: any) =>
                      String(year.id) ===
                      String(
                        reportAcademicYearId
                      )
                  )?.name || '-',

                'NIS / Username':
                  student.username || '-',

                'Nama Siswa':
                  student.name || '-',

                Kelas:
                  student.className || '-',

                Perusahaan:
                  student.companyName || '-',

                'Guru Pembimbing':
                  student.teacherName || '-',

                Mentor:
                  student.mentorName || '-',

                Tanggal:
                  '-',

                Status:
                  'Belum ada absensi',

                Keterangan:
                  'Siswa belum memiliki data kehadiran.',

                'Check In':
                  '-',
              },
            ];
          }
        );

      if (rows.length === 0) {
        setError(
          'Tidak ada siswa atau data yang sesuai dengan filter.'
        );
        return;
      }

      const worksheet =
        XLSX.utils.json_to_sheet(
          rows
        );

      worksheet['!cols'] = [
        { wch: 18 },
        { wch: 18 },
        { wch: 30 },
        { wch: 15 },
        { wch: 30 },
        { wch: 25 },
        { wch: 25 },
        { wch: 15 },
        { wch: 20 },
        { wch: 40 },
        { wch: 15 },
      ];

      const workbook =
        XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        'Rekap Kehadiran'
      );

      XLSX.writeFile(
        workbook,
        'rekap-kehadiran.xlsx'
      );

      setNotice(
        'Rekap berhasil diexport ke Excel.'
      );
    } catch (err: any) {
      console.error(
        'Export Excel error:',
        err
      );

      setError(
        err?.message ||
          'Gagal membuat file Excel.'
      );
    } finally {
      setExcelLoading(false);
    }
  };

  /* ============================================================
     EXPORT PDF
  ============================================================ */

  const handleExportPDF = async () => {
    setError(null);
    setNotice(null);
    setPdfLoading(true);

    try {
      /*
       * Pastikan tahun ajaran ikut dikirim
       * ke backend PDF.
       */
      if (
        canFilterAcademicYear &&
        !reportAcademicYearId
      ) {
        setError(
          'Silakan pilih tahun ajaran terlebih dahulu.'
        );
        setPdfLoading(false);
        return;
      }

      const qs = buildQuery({
        status: absensiStatus,
      });

      await api.download(
        `/api/reports/preview/pdf?${qs}`,
        'laporan-absensi.pdf'
      );

      setNotice(
        'Laporan PDF berhasil dibuat dan diunduh.'
      );
    } catch (err: any) {
      setError(
        err?.data?.error ||
          err?.message ||
          'Gagal membuat laporan PDF.'
      );
    } finally {
      setPdfLoading(false);
    }
  };

  /* ============================================================
     ROLE LABEL
  ============================================================ */

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

  /* ============================================================
     NAMA TAHUN AJARAN TERPILIH
  ============================================================ */

  const selectedReportAcademicYear =
    academicYears.find(
      (year: any) =>
        String(year.id) ===
        String(reportAcademicYearId)
    );

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div className="h-full w-full flex flex-col gap-3 md:gap-4 overflow-y-auto custom-scrollbar">

      {/* ============================================================
          HEADER
      ============================================================ */}

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

      {/* ============================================================
          FILTER
      ============================================================ */}

      <div className="shrink-0 bg-white rounded-[24px] border border-mist/60 shadow-sm p-5">

        <p className="text-xs font-bold uppercase tracking-widest text-navy/50 mb-3">
          Filter Laporan
        </p>

        <div
          className={`grid grid-cols-1 sm:grid-cols-2 ${
            canFilterScope
              ? 'lg:grid-cols-4'
              : 'lg:grid-cols-3'
          } gap-3`}
        >

          {/* ======================================================
              TAHUN AJARAN
          ====================================================== */}

          {canFilterAcademicYear && (
            <div>

              <label className="text-[11px] font-bold text-navy/60 block mb-1.5">
                Tahun Ajaran
              </label>

              <select
                value={reportAcademicYearId}
                onChange={(e) =>
                  handleAcademicYearChange(
                    e.target.value
                  )
                }
                className="w-full bg-[#F1F4F8] border border-mist rounded-xl px-3 py-2.5 text-sm font-medium text-navy outline-none focus:border-steel transition-all"
              >

                <option value="">
                  Pilih Tahun Ajaran
                </option>

                {academicYears.map(
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
                )}

              </select>

            </div>
          )}

          {/* ======================================================
              JENIS LAPORAN
          ====================================================== */}

          <div>

            <label className="text-[11px] font-bold text-navy/60 block mb-1.5">
              Jenis Laporan
            </label>

            <select
              value={reportType}
              onChange={(e) =>
                setReportType(
                  e.target.value as ReportType
                )
              }
              className="w-full bg-[#F1F4F8] border border-mist rounded-xl px-3 py-2.5 text-sm font-medium text-navy outline-none focus:border-steel transition-all"
            >

              {isMentor && (
                <option value="mentor">
                  Mentor
                </option>
              )}

              {isTeacher && (
                <option value="teacher">
                  Guru
                </option>
              )}

              {isStudent && (
                <option value="student">
                  Siswa
                </option>
              )}

              {(isHubin ||
                isSuperAdmin) && (
                <>
                  <option value="mentor">
                    Mentor
                  </option>

                  <option value="teacher">
                    Guru
                  </option>

                  <option value="student">
                    Siswa
                  </option>

                  <option value="class">
                    Kelas
                  </option>

                  <option value="company">
                    Perusahaan
                  </option>
                </>
              )}

            </select>

          </div>

          {/* ======================================================
              TANGGAL MULAI
          ====================================================== */}

          <div>

            <label className="text-[11px] font-bold text-navy/60 block mb-1.5">
              Tanggal Mulai
            </label>

            <input
              type="date"
              value={startDate}
              onChange={(e) =>
                setStartDate(
                  e.target.value
                )
              }
              className="w-full bg-[#F1F4F8] border border-mist rounded-xl px-3 py-2.5 text-sm font-medium text-navy outline-none focus:border-steel transition-all"
            />

          </div>

          {/* ======================================================
              TANGGAL AKHIR
          ====================================================== */}

          <div>

            <label className="text-[11px] font-bold text-navy/60 block mb-1.5">
              Tanggal Akhir
            </label>

            <input
              type="date"
              value={endDate}
              onChange={(e) =>
                setEndDate(
                  e.target.value
                )
              }
              className="w-full bg-[#F1F4F8] border border-mist rounded-xl px-3 py-2.5 text-sm font-medium text-navy outline-none focus:border-steel transition-all"
            />

          </div>

          {/* ======================================================
              PERUSAHAAN
          ====================================================== */}

          {canFilterScope && (
            <div>

              <label className="text-[11px] font-bold text-navy/60 block mb-1.5">
                Perusahaan
              </label>

              <select
                value={companyId}
                onChange={(e) => {
                  setCompanyId(
                    e.target.value
                  );

                  setTeacherId('');
                  setStudentId('');
                  setPreview(null);
                }}
                className="w-full bg-[#F1F4F8] border border-mist rounded-xl px-3 py-2.5 text-sm font-medium text-navy outline-none focus:border-steel transition-all"
              >

                <option value="">
                  Semua Perusahaan
                </option>

                {perusahaanList.map(
                  (company) => (
                    <option
                      key={company.id}
                      value={company.id}
                    >
                      {company.name}
                    </option>
                  )
                )}

              </select>

            </div>
          )}

          {/* ======================================================
              GURU
          ====================================================== */}

          {canFilterScope &&
            reportType ===
              'teacher' && (
              <div>

                <label className="text-[11px] font-bold text-navy/60 block mb-1.5">
                  Guru Pembimbing
                </label>

                <select
                  value={teacherId}
                  onChange={(e) => {
                    setTeacherId(
                      e.target.value
                    );

                    setStudentId('');
                    setPreview(null);
                  }}
                  className="w-full bg-[#F1F4F8] border border-mist rounded-xl px-3 py-2.5 text-sm font-medium text-navy outline-none focus:border-steel transition-all"
                >

                  <option value="">
                    Semua Guru
                  </option>

                  {teacherOptions.map(
                    (teacher) => (
                      <option
                        key={teacher.id}
                        value={teacher.id}
                      >
                        {teacher.name}
                      </option>
                    )
                  )}

                </select>

              </div>
            )}

          {/* ======================================================
              KELAS
          ====================================================== */}

          {canFilterScope && (
            <div>

              <label className="text-[11px] font-bold text-navy/60 block mb-1.5">
                Kelas
              </label>

              <select
                value={classId}
                onChange={(e) => {
                  setClassId(
                    e.target.value
                  );

                  setTeacherId('');
                  setStudentId('');
                  setPreview(null);
                }}
                className="w-full bg-[#F1F4F8] border border-mist rounded-xl px-3 py-2.5 text-sm font-medium text-navy outline-none focus:border-steel transition-all"
              >

                <option value="">
                  Semua Kelas
                </option>

                {superClasses.map(
                  (schoolClass) => (
                    <option
                      key={schoolClass.id}
                      value={schoolClass.id}
                    >
                      {schoolClass.name}
                    </option>
                  )
                )}

              </select>

            </div>
          )}

          {/* ======================================================
              SISWA
          ====================================================== */}

          {canViewAbsensi && (
            <div>

              <label className="text-[11px] font-bold text-navy/60 block mb-1.5">
                Siswa
              </label>

              <select
                value={studentId}
                onChange={(e) => {
                  setStudentId(
                    e.target.value
                  );

                  setPreview(null);
                }}
                className="w-full bg-[#F1F4F8] border border-mist rounded-xl px-3 py-2.5 text-sm font-medium text-navy outline-none focus:border-steel transition-all"
              >

                <option value="">
                  Semua Siswa
                </option>

                {filteredStudents.map(
                  (student: any) => (
                    <option
                      key={student.id}
                      value={student.id}
                    >
                      {student.name}
                    </option>
                  )
                )}

              </select>

            </div>
          )}

          {/* ======================================================
              STATUS
          ====================================================== */}

          <div>

            <label className="text-[11px] font-bold text-navy/60 block mb-1.5">
              Status Kehadiran
            </label>

            <select
              value={absensiStatus}
              onChange={(e) => {
                setAbsensiStatus(
                  e.target.value
                );

                setPreview(null);
              }}
              className="w-full bg-[#F1F4F8] border border-mist rounded-xl px-3 py-2.5 text-sm font-medium text-navy outline-none focus:border-steel transition-all"
            >

              {ABSENSI_STATUS.map(
                (status) => (
                  <option
                    key={status.value}
                    value={status.value}
                  >
                    {status.label}
                  </option>
                )
              )}

            </select>

          </div>

        </div>

        {/* ========================================================
            TAHUN AJARAN TERPILIH
        ======================================================== */}

        {canFilterAcademicYear &&
          selectedReportAcademicYear && (
            <div className="mt-4 flex items-center gap-2 px-3 py-2.5 bg-[#E4F0F1] border border-[#CBE2E4] rounded-xl">

              <div className="w-2 h-2 rounded-full bg-steel" />

              <p className="text-xs font-bold text-steel">
                Laporan menggunakan tahun ajaran{' '}
                {selectedReportAcademicYear.name}
              </p>

            </div>
          )}

        {/* ========================================================
            ERROR
        ======================================================== */}

        {error && (
          <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl mt-4">

            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />

            <p className="text-xs font-semibold text-rose-700">
              {error}
            </p>

          </div>
        )}

        {/* ========================================================
            NOTICE
        ======================================================== */}

        {notice && (
          <div className="flex items-start gap-2 p-3 bg-[#E4F0F1] border border-[#CBE2E4] rounded-xl mt-4">

            <FileDown className="w-4 h-4 text-steel shrink-0" />

            <p className="text-xs font-semibold text-steel">
              {notice}
            </p>

          </div>
        )}

        {/* ========================================================
            PREVIEW BUTTON
        ======================================================== */}

        {canViewAbsensi && (
          <button
            onClick={handlePreview}
            disabled={
              previewLoading ||
              excelLoading ||
              pdfLoading
            }
            className="mt-4 w-full bg-steel text-white py-2.5 rounded-xl text-sm font-bold hover:bg-steel/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >

            {previewLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}

            {previewLoading
              ? 'Memuat Preview...'
              : 'Preview Rekap Absensi'}

          </button>
        )}

      </div>

      {/* ============================================================
          PREVIEW
      ============================================================ */}

      {preview && (
        <div className="bg-white rounded-[24px] border border-mist/60 shadow-sm p-5 space-y-4">

          {/* ========================================================
              HEADER
          ======================================================== */}

          <div className="flex items-center justify-between gap-3 flex-wrap">

            <div>

              <h2 className="text-base font-bold text-navy">
                Preview Rekap Kehadiran
              </h2>

              <p className="text-xs font-semibold text-navy/50 mt-1">
                Data preview dan export berasal dari filter yang dipilih.
              </p>

            </div>

            <div className="flex gap-2">

              {/* EXCEL */}

              <button
                onClick={
                  handleExportExcel
                }
                disabled={
                  previewLoading ||
                  excelLoading ||
                  pdfLoading
                }
                className="flex items-center gap-1.5 bg-steel text-white text-xs font-bold px-3 py-2 rounded-xl disabled:opacity-60 hover:bg-steel/90 transition-colors"
              >

                {excelLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileDown className="w-3.5 h-3.5" />
                )}

                {excelLoading
                  ? 'Membuat Excel...'
                  : 'Export Excel'}

              </button>

              {/* PDF */}

              <button
                onClick={
                  handleExportPDF
                }
                disabled={
                  previewLoading ||
                  excelLoading ||
                  pdfLoading
                }
                className="flex items-center gap-1.5 bg-navy text-white text-xs font-bold px-3 py-2 rounded-xl disabled:opacity-60 hover:bg-navy/90 transition-colors"
              >

                {pdfLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileDown className="w-3.5 h-3.5" />
                )}

                {pdfLoading
                  ? 'Membuat PDF...'
                  : 'Export PDF'}

              </button>

            </div>

          </div>

          {/* ========================================================
              SUMMARY
          ======================================================== */}

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">

            {[
              [
                'Total Siswa',
                preview.summary
                  .totalStudents,
              ],
              [
                'Hadir',
                preview.summary.hadir,
              ],
              [
                'Izin',
                preview.summary.izin,
              ],
              [
                'Sakit',
                preview.summary.sakit,
              ],
              [
                'Total',
                preview.summary.total,
              ],
            ].map(
              ([label, value]) => (
                <div
                  key={String(label)}
                  className="bg-mist/30 border border-mist/60 rounded-xl p-3"
                >

                  <p className="text-[10px] font-bold uppercase text-navy/50">
                    {label}
                  </p>

                  <p className="text-xl font-bold text-navy mt-1 tabular-nums">
                    {value}
                  </p>

                </div>
              )
            )}

          </div>

          {/* ========================================================
              INFO
          ======================================================== */}

          {preview.info && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">

              {Object.entries(
                preview.info
              ).map(
                ([label, value]) => (
                  <div
                    key={label}
                    className="bg-mist/20 border border-mist/60 rounded-xl p-3"
                  >

                    <p className="text-[10px] font-bold uppercase text-navy/50">
                      {label}
                    </p>

                    <p className="text-xs font-bold text-navy mt-1 truncate">
                      {value ?? '-'}
                    </p>

                  </div>
                )
              )}

            </div>
          )}

          {/* ========================================================
              EMPTY
          ======================================================== */}

          {preview.rows.length === 0 ? (

            <p className="rounded-xl border border-mist/60 bg-mist/20 px-4 py-8 text-center text-xs font-semibold text-navy/50">
              Tidak ada data rekap untuk filter yang dipilih.
            </p>

          ) : (

            <div className="overflow-x-auto rounded-xl border border-mist/60">

              <table className="w-full min-w-[760px] text-left text-xs">

                <thead className="bg-navy text-white">

                  <tr>

                    <th className="p-3">
                      Siswa
                    </th>

                    <th className="p-3">
                      Kelas
                    </th>

                    <th className="p-3">
                      Perusahaan
                    </th>

                    <th className="p-3">
                      Hadir
                    </th>

                    <th className="p-3">
                      Izin
                    </th>

                    <th className="p-3">
                      Sakit
                    </th>

                    <th className="p-3">
                      Total
                    </th>

                    <th className="p-3">
                      Persentase
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {preview.rows.map(
                    (row) => (
                      <React.Fragment
                        key={row.id}
                      >

                        <tr className="border-t border-mist/60">

                          <td className="p-3 font-bold text-navy">

                            <button
                              type="button"
                              onClick={() =>
                                setExpandedStudentId(
                                  expandedStudentId ===
                                    row.id
                                    ? null
                                    : row.id
                                )
                              }
                              className="text-left hover:text-steel"
                            >

                              {row.name}

                              <span className="block text-[10px] font-semibold text-navy/50">

                                {row.username}
                                {' · '}

                                {expandedStudentId ===
                                row.id
                                  ? 'Tutup histori'
                                  : 'Lihat histori'}

                              </span>

                            </button>

                          </td>

                          <td className="p-3 text-navy/70">
                            {row.className}
                          </td>

                          <td className="p-3 text-navy/70">
                            {row.companyName}
                          </td>

                          <td className="p-3 font-bold text-navy">
                            {row.hadir}
                          </td>

                          <td className="p-3 font-bold text-navy">
                            {row.izin}
                          </td>

                          <td className="p-3 font-bold text-navy">
                            {row.sakit}
                          </td>

                          <td className="p-3 font-bold text-navy">
                            {row.total}
                          </td>

                          <td className="p-3 font-bold text-steel">
                            {row.percentage}%
                          </td>

                        </tr>

                        {/* ==================================================
                            DETAIL HISTORI
                        ================================================== */}

                        {expandedStudentId ===
                          row.id && (

                          <tr className="border-t border-mist/40 bg-mist/20">

                            <td
                              colSpan={8}
                              className="p-3"
                            >

                              <div className="overflow-x-auto">

                                <table className="w-full min-w-[520px] text-left text-[11px]">

                                  <thead>

                                    <tr className="text-navy/50">

                                      <th className="p-2">
                                        Tanggal
                                      </th>

                                      <th className="p-2">
                                        Status
                                      </th>

                                      <th className="p-2">
                                        Check In
                                      </th>

                                      <th className="p-2">
                                        Keterangan
                                      </th>

                                    </tr>

                                  </thead>

                                  <tbody>

                                    {row.attendance.map(
                                      (
                                        item,
                                        index
                                      ) => (

                                        <tr
                                          key={`${row.id}-${item.date}-${index}`}
                                          className="border-t border-mist/40"
                                        >

                                          <td className="p-2 text-navy/70">
                                            {item.date}
                                          </td>

                                          <td className="p-2 font-bold text-navy">
                                            {item.status}
                                          </td>

                                          <td className="p-2 text-navy/70">
                                            {item.checkIn}
                                          </td>

                                          <td className="p-2 text-navy/70">
                                            {item.reason}
                                          </td>

                                        </tr>

                                      )
                                    )}

                                  </tbody>

                                </table>

                              </div>

                            </td>

                          </tr>

                        )}

                      </React.Fragment>
                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>
      )}

    </div>
  );
};