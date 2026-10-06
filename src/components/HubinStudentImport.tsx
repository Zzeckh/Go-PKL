import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
  UserRoundPlus,
  XCircle,
} from 'lucide-react';
import { api } from '../utils/api';

interface StudentImportRow {
  rowNumber: number;
  nis: string;
  name: string;
  className: string;
  major: string;
  academicYear: string;
  email: string;
  status: 'existing' | 'new-candidate' | 'duplicate' | 'invalid';
  reason: string;
}

interface StudentImportPreview {
  totalRows: number;
  validRows: number;
  existingRows: number;
  newAccountCandidates: number;
  duplicateRows: number;
  invalidRows: number;
  rows: StudentImportRow[];
  saveEnabled: false;
  message: string;
}

const statusLabels: Record<StudentImportRow['status'], string> = {
  existing: 'Siswa sudah terdaftar',
  'new-candidate': 'Calon akun baru',
  duplicate: 'Duplikat',
  invalid: 'Ditolak',
};

export const HubinStudentImport: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<StudentImportPreview | null>(null);
  const [uploading, setUploading] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleDownloadTemplate = async () => {
    setError(null);
    setNotice(null);
    setDownloadingTemplate(true);

    try {
      await api.download(
        '/api/hubin/students/import-template',
        'template-import-siswa.xlsx'
      );
    } catch (requestError: any) {
      setError(
        requestError?.data?.error ||
          requestError?.message ||
          'Gagal mengunduh template siswa.'
      );
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handlePreview = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError('Pilih file Excel terlebih dahulu.');
      return;
    }

    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      setError('Format file harus .xlsx.');
      return;
    }

    setError(null);
    setNotice(null);
    setPreview(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await api.upload<StudentImportPreview>(
        '/api/hubin/students/import-preview',
        formData
      );
      setPreview(result);
    } catch (requestError: any) {
      const details = requestError?.data?.details;
      setError(
        Array.isArray(details)
          ? details.join(' ')
          : requestError?.data?.error ||
              requestError?.message ||
              'Gagal memvalidasi file siswa.'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleExportValidation = async () => {
    if (!preview) return;

    try {
      const XLSX = await import('xlsx');
      const worksheet = XLSX.utils.json_to_sheet(
        preview.rows.map((row) => ({
          'Baris Excel': row.rowNumber,
          NIS: row.nis,
          'Nama Siswa': row.name,
          Kelas: row.className,
          Jurusan: row.major,
          'Tahun Ajaran': row.academicYear,
          Email: row.email,
          Status: statusLabels[row.status],
          Alasan: row.reason,
        }))
      );
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Hasil Validasi');
      XLSX.writeFile(workbook, 'hasil-validasi-import-siswa.xlsx');
      setNotice('Laporan validasi berhasil diunduh.');
    } catch (exportError: any) {
      setError(exportError?.message || 'Gagal mengunduh laporan validasi.');
    }
  };

  const summaryItems = preview
    ? [
        { label: 'Total baris', value: preview.totalRows, icon: FileSpreadsheet },
        { label: 'Baris valid', value: preview.validRows, icon: CheckCircle2 },
        { label: 'Sudah terdaftar', value: preview.existingRows, icon: CheckCircle2 },
        { label: 'Calon akun baru', value: preview.newAccountCandidates, icon: UserRoundPlus },
        { label: 'Duplikat', value: preview.duplicateRows, icon: AlertCircle },
        { label: 'Ditolak', value: preview.invalidRows, icon: XCircle },
      ]
    : [];

  return (
    <div className="h-full w-full flex flex-col gap-3 md:gap-4 overflow-y-auto custom-scrollbar">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0 bg-white rounded-[24px] p-4 md:p-5 border border-mist/60 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 bg-navy rounded-[10px] flex items-center justify-center text-white shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-lg md:text-xl text-navy">Import Data Siswa</h2>
            <p className="text-[13px] text-navy/60 font-semibold mt-0.5">
              Validasi dan preview saja; belum ada data yang disimpan.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDownloadTemplate}
          disabled={downloadingTemplate || uploading}
          className="flex items-center justify-center gap-2 bg-white border border-steel/30 text-steel font-bold text-xs px-4 py-2.5 rounded-[18px] hover:bg-steel/5 disabled:opacity-50"
        >
          {downloadingTemplate ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Unduh Template Excel Siswa
        </button>
      </div>

      <section className="shrink-0 bg-white rounded-[24px] border border-mist/60 shadow-sm p-4 md:p-5 space-y-3">
        <div>
          <label htmlFor="student-import-file" className="text-xs font-bold text-navy block mb-1.5">
            File Excel (.xlsx)
          </label>
          <input
            id="student-import-file"
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            onChange={() => {
              setPreview(null);
              setError(null);
              setNotice(null);
            }}
            className="block w-full text-sm text-navy file:mr-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-mist/60 file:text-navy file:font-bold"
          />
        </div>

        <button
          type="button"
          onClick={handlePreview}
          disabled={uploading || downloadingTemplate}
          className="flex items-center justify-center gap-2 bg-steel text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-steel/90 disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          {uploading ? 'Memvalidasi...' : 'Validasi & Preview'}
        </button>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs font-medium text-amber-900">
          Siswa existing hanya dicocokkan berdasarkan NIS dan tidak diperbarui. Calon akun baru belum dibuat; proses pembuatan menunggu kebijakan email dan kredensial.
        </div>

        {error && (
          <p role="alert" className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="text-xs font-semibold text-steel bg-mist/40 border border-mist rounded-xl p-3">
            {notice}
          </p>
        )}
      </section>

      {preview && (
        <>
          <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2 shrink-0">
            {summaryItems.map((item) => (
              <div key={item.label} className="bg-white border border-mist/60 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-navy/50">
                  <item.icon className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase">{item.label}</span>
                </div>
                <p className="text-xl font-bold text-navy tabular-nums mt-2">{item.value}</p>
              </div>
            ))}
          </section>

          <section className="bg-white border border-mist/60 rounded-[24px] shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4 border-b border-mist/60">
              <div>
                <h3 className="text-sm font-bold text-navy">Hasil Validasi</h3>
                <p className="text-xs text-navy/55 mt-1">{preview.message}</p>
              </div>
              <button
                type="button"
                onClick={handleExportValidation}
                className="flex items-center justify-center gap-2 bg-navy text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-navy/90"
              >
                <Download className="w-3.5 h-3.5" />
                Unduh Laporan
              </button>
            </div>

            <div className="overflow-x-auto max-h-[60vh] custom-scrollbar">
              <table className="w-full min-w-[1080px] text-left text-xs">
                <thead className="sticky top-0 bg-mist/60 text-navy/60 uppercase">
                  <tr>
                    <th className="px-3 py-2">Baris</th>
                    <th className="px-3 py-2">NIS</th>
                    <th className="px-3 py-2">Nama Siswa</th>
                    <th className="px-3 py-2">Kelas</th>
                    <th className="px-3 py-2">Jurusan</th>
                    <th className="px-3 py-2">Tahun Ajaran</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Alasan</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((row) => (
                    <tr key={`${row.rowNumber}-${row.nis}`} className="border-t border-mist/50 align-top">
                      <td className="px-3 py-2 tabular-nums">{row.rowNumber}</td>
                      <td className="px-3 py-2 font-mono">{row.nis || '-'}</td>
                      <td className="px-3 py-2">{row.name || '-'}</td>
                      <td className="px-3 py-2">{row.className || '-'}</td>
                      <td className="px-3 py-2">{row.major || '-'}</td>
                      <td className="px-3 py-2">{row.academicYear || '-'}</td>
                      <td className="px-3 py-2">{row.email || '-'}</td>
                      <td className="px-3 py-2 font-bold">{statusLabels[row.status]}</td>
                      <td className="px-3 py-2 whitespace-normal">{row.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
};
