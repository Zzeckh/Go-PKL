import React, { useState } from 'react';
import {
  AlertCircle,
  Check,
  FileSpreadsheet,
  Loader2,
  MapPin,
  Search,
  X,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { useApp, type CompanyImportResult, type PerusahaanItem } from '../context/AppContext';
import { api } from '../utils/api';
import {
  isValidCompanyLocation,
  normalizeCompanyCategory,
} from '../utils/companyImport.js';
import {
  createPickerIcon,
  STREET_TILE,
} from '../utils/leafletHelpers';

type LocationStatus =
  | 'automatic'
  | 'manual'
  | 'not-found'
  | 'failed'
  | 'searching';

type CompanyImportRow = {
  rowNumber: number;
  name: string;
  address: string;
  phone: string;
  category: string;
  radiusMeters: number;
  city: string;
  country: string;
  quotaSchool: number;
  quotaCompany: number;
  latitude: number | null;
  longitude: number | null;
  locationStatus: LocationStatus;
  issues: string[];
  coordinateIssue?: string;
  geocodeLabel?: string;
  geocodeDetails?: string;
};

const normalizeHeader = (value: unknown) =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const columnAliases: Record<string, string[]> = {
  name: ['namaperusahaan', 'name', 'companyname'],
  address: ['alamatlengkap', 'alamat', 'address', 'fulladdress'],
  phone: ['nomortelepon', 'telepon', 'phone', 'telephone'],
  category: ['kategoriperusahaan', 'kategori', 'category'],
  radiusMeters: ['radiuslokasimeter', 'radiusmeter', 'radiusmeters', 'radius'],
  city: ['kota', 'city'],
  country: ['negara', 'country'],
  quotaSchool: ['kuotasekolah', 'quotaschool'],
  quotaCompany: ['kuotaperusahaan', 'quotacompany'],
  latitude: ['latitude', 'lat'],
  longitude: ['longitude', 'lon', 'lng'],
};

const numberFromCell = (value: unknown, fallback: number) => {
  if (value === undefined || value === null || String(value).trim() === '') {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const isValidLocation = (row: CompanyImportRow) =>
  isValidCompanyLocation(
    row.latitude ?? Number.NaN,
    row.longitude ?? Number.NaN
  );

const duplicateKey = (name: string) =>
  name.trim().toLocaleLowerCase('id');

const findColumnIndexes = (headers: unknown[]) => {
  const normalizedHeaders = headers.map(normalizeHeader);
  const indexes: Record<string, number> = {};

  for (const [field, aliases] of Object.entries(columnAliases)) {
    const index = normalizedHeaders.findIndex((header) =>
      aliases.includes(header)
    );
    if (index >= 0) indexes[field] = index;
  }

  return indexes;
};

const parseCompanySheet = (sheetRows: unknown[][]) => {
  if (sheetRows.length === 0) {
    throw new Error('File tidak memiliki baris header.');
  }

  const indexes = findColumnIndexes(sheetRows[0]);
  const requiredColumns = ['name', 'address', 'phone', 'category', 'radiusMeters'];
  const missingColumns = requiredColumns.filter(
    (field) => indexes[field] === undefined
  );
  if (missingColumns.length > 0) {
    const labels: Record<string, string> = {
      name: 'Nama Perusahaan',
      address: 'Alamat Lengkap',
      phone: 'Nomor Telepon',
      category: 'Kategori Perusahaan',
      radiusMeters: 'Radius Lokasi (meter)',
    };
    throw new Error(
      `Kolom template belum lengkap: ${missingColumns.map((field) => labels[field]).join(', ')}.`
    );
  }

  const rows: CompanyImportRow[] = [];
  for (const [index, cells] of sheetRows.slice(1).entries()) {
    if (!cells.some((cell) => String(cell ?? '').trim())) continue;

    const read = (field: string) =>
      indexes[field] === undefined ? '' : cells[indexes[field]] ?? '';
    const name = String(read('name')).trim();
    const address = String(read('address')).trim();
    const rawCategory = String(read('category')).trim();
    const category = normalizeCompanyCategory(rawCategory);
    const isInternal = category === 'Internal';
    const radiusMeters = numberFromCell(read('radiusMeters'), 500);
    const quotaSchool = numberFromCell(
      read('quotaSchool'),
      isInternal ? 0 : 5
    );
    const quotaCompany = numberFromCell(
      read('quotaCompany'),
      0
    );
    const rawLatitude = String(read('latitude')).trim();
    const rawLongitude = String(read('longitude')).trim();
    const latitude = rawLatitude ? Number(rawLatitude) : null;
    const longitude = rawLongitude ? Number(rawLongitude) : null;
    const issues: string[] = [];

    if (!name) issues.push('Nama perusahaan wajib diisi.');
    if (!address) issues.push('Alamat lengkap wajib diisi.');
    if (!category) {
      issues.push('Kategori harus Internal atau Eksternal.');
    }
    if (
      radiusMeters === null ||
      !Number.isInteger(radiusMeters) ||
      radiusMeters < 50 ||
      radiusMeters > 2000
    ) {
      issues.push('Radius harus bilangan bulat antara 50 dan 2000 meter.');
    }
    if (
      quotaSchool === null ||
      quotaCompany === null ||
      !Number.isInteger(quotaSchool) ||
      !Number.isInteger(quotaCompany) ||
      quotaSchool < 0 ||
      quotaCompany < 0
    ) {
      issues.push('Kuota harus berupa bilangan bulat 0 atau lebih.');
    } else if (!isInternal && quotaSchool + quotaCompany <= 0) {
      issues.push('Total kuota perusahaan Eksternal harus lebih dari 0.');
    }

    const hasCoordinateInput = rawLatitude !== '' || rawLongitude !== '';
    const hasValidCoordinates =
      latitude !== null &&
      longitude !== null &&
      isValidCompanyLocation(latitude, longitude);
    const coordinateIssue =
      hasCoordinateInput && !hasValidCoordinates
        ? 'Latitude dan longitude harus berpasangan serta berada dalam rentang yang valid.'
        : undefined;

    rows.push({
      rowNumber: index + 2,
      name,
      address,
      phone: String(read('phone')).trim(),
      category: category || rawCategory,
      radiusMeters: radiusMeters ?? 500,
      city: String(read('city')).trim(),
      country: String(read('country')).trim(),
      quotaSchool: quotaSchool ?? (isInternal ? 0 : 5),
      quotaCompany: quotaCompany ?? 0,
      latitude: hasValidCoordinates ? latitude : null,
      longitude: hasValidCoordinates ? longitude : null,
      locationStatus: hasValidCoordinates ? 'manual' : 'not-found',
      issues,
      coordinateIssue,
    });
  }

  if (rows.length === 0) {
    throw new Error('File tidak memiliki baris data perusahaan.');
  }
  if (rows.length > 200) {
    throw new Error('Maksimal 200 perusahaan dalam satu kali import.');
  }

  return rows;
};

export const HubinCompanyImportModal: React.FC<{
  existingCompanies: PerusahaanItem[];
  onClose: () => void;
}> = ({ existingCompanies, onClose }) => {
  const { confirmCompanyImport } = useApp();
  const [rows, setRows] = useState<CompanyImportRow[]>([]);
  const [error, setError] = useState('');
  const [parsing, setParsing] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodingProgress, setGeocodingProgress] = useState({
    current: 0,
    total: 0,
  });
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] =
    useState<CompanyImportResult | null>(null);
  const [locationRow, setLocationRow] =
    useState<CompanyImportRow | null>(null);

  const geocodeRow = async (row: CompanyImportRow) => {
    setRows((currentRows) =>
      currentRows.map((currentRow) =>
        currentRow.rowNumber === row.rowNumber
          ? {
              ...currentRow,
              locationStatus: 'searching',
              coordinateIssue: undefined,
            }
          : currentRow
      )
    );

    try {
      const response = await api.post<{
        result: {
          latitude: number;
          longitude: number;
          label: string;
        } | null;
        error?: string;
        attempts?: Array<{
          query: string;
          status: string;
        }>;
      }>('/api/companies/import/geocode', {
        address: row.address,
        companyName: row.name,
        city: row.city,
        province: /cimahi|cimindi|jawa\s*barat/i.test(
          `${row.address} ${row.city}`
        )
          ? 'Jawa Barat'
          : undefined,
        country: row.country || 'Indonesia',
      });

      const result = response.result;
      if (
        result &&
        isValidCompanyLocation(result.latitude, result.longitude)
      ) {
        setRows((currentRows) =>
          currentRows.map((currentRow) =>
            currentRow.rowNumber === row.rowNumber
              ? {
                  ...currentRow,
                  latitude: result.latitude,
                  longitude: result.longitude,
                  locationStatus: 'automatic',
                  coordinateIssue: undefined,
                  geocodeLabel: result.label,
                  geocodeDetails: response.attempts
                    ?.map((attempt) => `${attempt.status}: ${attempt.query}`)
                    .join('\n'),
                }
              : currentRow
          )
        );
        return;
      }

      setRows((currentRows) =>
        currentRows.map((currentRow) =>
          currentRow.rowNumber === row.rowNumber
            ? {
                ...currentRow,
                latitude: null,
                longitude: null,
                locationStatus: 'not-found',
                coordinateIssue:
                  'Koordinat belum ditemukan. Silakan tentukan lokasi melalui peta.' +
                  (response.error ? ` Rincian: ${response.error}` : ''),
                geocodeDetails: response.attempts
                  ?.map((attempt) => `${attempt.status}: ${attempt.query}`)
                  .join('\n'),
              }
            : currentRow
        )
      );
    } catch (geocodeError: any) {
      const detail =
        geocodeError?.data?.error ||
        geocodeError?.message ||
        'Penyebab kegagalan tidak diketahui.';
      setRows((currentRows) =>
        currentRows.map((currentRow) =>
          currentRow.rowNumber === row.rowNumber
            ? {
                ...currentRow,
                locationStatus: 'failed',
                coordinateIssue: `Layanan Geocoding gagal: ${detail}`,
                geocodeDetails: geocodeError?.data?.attempts
                  ?.map(
                    (attempt: { status: string; query: string }) =>
                      `${attempt.status}: ${attempt.query}`
                  )
                  .join('\n'),
              }
            : currentRow
        )
      );
    }
  };

  const processFile = async (file?: File) => {
    if (!file) return;
    setError('');
    setRows([]);
    setImportResult(null);

    if (!/\.(xlsx|csv)$/i.test(file.name)) {
      setError('Format file harus .xlsx atau .csv.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran file maksimal 5 MB.');
      return;
    }

    setParsing(true);
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) throw new Error('File tidak memiliki worksheet.');

      const sheetRows = XLSX.utils.sheet_to_json<unknown[]>(
        workbook.Sheets[sheetName],
        { header: 1, defval: '', raw: false, blankrows: true }
      );
      const parsedRows = parseCompanySheet(sheetRows);
      const existingNames = new Set(
        existingCompanies.map((company) => duplicateKey(company.name))
      );
      const fileNameCounts = new Map<string, number>();
      for (const row of parsedRows) {
        const key = duplicateKey(row.name);
        if (key) fileNameCounts.set(key, (fileNameCounts.get(key) || 0) + 1);
      }

      for (const row of parsedRows) {
        const key = duplicateKey(row.name);
        if (key && existingNames.has(key)) {
          row.issues.push('Nama perusahaan sudah terdaftar.');
        } else if (key && (fileNameCounts.get(key) || 0) > 1) {
          row.issues.push('Nama perusahaan duplikat di dalam file.');
        }
      }

      setRows(parsedRows);
      const geocodeRows = parsedRows.filter(
        (row) =>
          !isValidLocation(row) &&
          row.name &&
          row.address &&
          !row.issues.some((issue) =>
            [
              'Nama perusahaan wajib diisi.',
              'Alamat lengkap wajib diisi.',
              'Kategori harus Internal atau Eksternal.',
            ].includes(issue)
          )
      );
      setRows((currentRows) =>
        currentRows.map((row) =>
          geocodeRows.some(
            (geocodeRow) => geocodeRow.rowNumber === row.rowNumber
          )
            ? { ...row, locationStatus: 'searching' }
            : row
        )
      );
      setGeocodingProgress({ current: 0, total: geocodeRows.length });
      if (geocodeRows.length === 0) return;

      setGeocoding(true);
      for (const [index, row] of geocodeRows.entries()) {
        await geocodeRow(row);
        setGeocodingProgress({
          current: index + 1,
          total: geocodeRows.length,
        });
      }
    } catch (fileError: any) {
      setError(fileError?.message || 'File tidak dapat dibaca.');
    } finally {
      setParsing(false);
      setGeocoding(false);
    }
  };

  const validRows = rows.filter(
    (row) =>
      row.name &&
      row.address &&
      row.issues.length === 0 &&
      isValidLocation(row)
  );
  const validCoordinateCount = rows.filter(isValidLocation).length;
  const problemCount = rows.length - validRows.length;

  const handleConfirmImport = async () => {
    if (validRows.length === 0) return;
    setImporting(true);
    setError('');
    try {
      const result = await confirmCompanyImport(
        validRows.map((row) => ({
          rowNumber: row.rowNumber,
          name: row.name,
          address: row.address,
          phone: row.phone,
          category: row.category,
          radiusMeters: row.radiusMeters,
          city: row.city,
          country: row.country,
          quotaSchool: row.quotaSchool,
          quotaCompany: row.quotaCompany,
          latitude: row.latitude,
          longitude: row.longitude,
        }))
      );
      const previewFailures = rows
        .filter((row) => !validRows.includes(row))
        .map((row) => ({
          row: row.rowNumber,
          name: row.name || undefined,
          error:
            [...row.issues, row.coordinateIssue]
              .filter(Boolean)
              .join(' ') || 'Data tidak memenuhi validasi import.',
        }));
      setImportResult({
        ...result,
        failed: [...previewFailures, ...result.failed],
        summary: {
          total: rows.length,
          imported: result.summary.imported,
          failed: previewFailures.length + result.summary.failed,
        },
      });
    } catch (importError: any) {
      setError(
        importError?.data?.error ||
          importError?.message ||
          'Import perusahaan gagal.'
      );
    } finally {
      setImporting(false);
    }
  };

  const updateLocation = (
    rowNumber: number,
    latitude: number,
    longitude: number
  ) => {
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.rowNumber === rowNumber
          ? {
              ...row,
              latitude,
              longitude,
              locationStatus: 'manual',
              coordinateIssue: undefined,
            }
          : row
      )
    );
    setLocationRow(null);
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/60 p-3 backdrop-blur-md">
        <div className="flex max-h-[94vh] w-full max-w-7xl flex-col overflow-hidden rounded-[24px] border border-white/40 bg-white shadow-2xl">
          <div className="flex shrink-0 items-center justify-between border-b border-mist/60 p-4 md:p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-navy">
                <FileSpreadsheet className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-navy">Import Perusahaan</h3>
                <p className="text-xs font-medium text-navy/60">
                  Unggah .xlsx atau .csv, periksa koordinat, lalu konfirmasi import.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={parsing || geocoding || importing}
              className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-mist/60 text-navy/60 hover:bg-mist disabled:opacity-50"
              aria-label="Tutup"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-4 md:p-5">
            <div className="flex flex-col gap-3 rounded-2xl border border-mist/60 bg-mist/20 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <label className="cursor-pointer rounded-full bg-steel px-4 py-2 text-xs font-bold text-white hover:bg-steel/90">
                  Pilih file Excel / CSV
                  <input
                    type="file"
                    accept=".xlsx,.csv"
                    className="hidden"
                    disabled={parsing || geocoding || importing}
                    onChange={(event) => {
                      void processFile(event.target.files?.[0]);
                      event.currentTarget.value = '';
                    }}
                  />
                </label>
              </div>
              <p className="text-[11px] font-medium text-navy/55">
                Maksimal 5 MB dan 200 baris. Koordinat dicari satu per satu sesuai batas layanan peta.
              </p>
            </div>

            {(parsing || geocoding) && (
              <div className="flex items-center gap-2 rounded-xl border border-steel/20 bg-steel/5 px-3 py-2.5 text-xs font-semibold text-navy">
                <Loader2 className="h-4 w-4 animate-spin text-steel" />
                {parsing
                  ? 'Membaca file...'
                  : `Mencari koordinat ${geocodingProgress.current} dari ${geocodingProgress.total}...`}
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {rows.length > 0 && (
              <>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <SummaryCard label="Siap diimpor" value={validRows.length} />
                  <SummaryCard label="Koordinat valid" value={validCoordinateCount} />
                  <SummaryCard label="Data bermasalah" value={problemCount} />
                </div>

                <div className="overflow-x-auto rounded-2xl border border-mist/70">
                  <table className="w-full min-w-[1000px] border-collapse text-left text-xs">
                    <thead className="sticky top-0 bg-mist/50 text-[10px] uppercase tracking-wide text-navy/60">
                      <tr>
                        <th className="px-3 py-2.5">Nama perusahaan</th>
                        <th className="px-3 py-2.5">Alamat</th>
                        <th className="px-3 py-2.5">Nomor telepon</th>
                        <th className="px-3 py-2.5">Latitude</th>
                        <th className="px-3 py-2.5">Longitude</th>
                        <th className="px-3 py-2.5">Status koordinat</th>
                        <th className="px-3 py-2.5">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-mist/60">
                      {rows.map((row) => (
                        <tr key={row.rowNumber} className="align-top">
                          <td className="max-w-[200px] px-3 py-3">
                            <p className="font-bold text-navy">{row.name || '—'}</p>
                            <p className="mt-1 text-[10px] text-navy/50">
                              {row.category || 'Kategori tidak diisi'} · radius {row.radiusMeters} m
                            </p>
                          </td>
                          <td className="max-w-[260px] px-3 py-3 text-navy/70">
                            {row.address || '—'}
                          </td>
                          <td className="px-3 py-3 text-navy/70">
                            {row.phone || '—'}
                          </td>
                          <td className="px-3 py-3 font-mono text-navy/70">
                            {row.latitude?.toFixed(6) ?? '—'}
                          </td>
                          <td className="px-3 py-3 font-mono text-navy/70">
                            {row.longitude?.toFixed(6) ?? '—'}
                            {row.geocodeLabel && (
                              <p className="mt-1 max-w-[190px] truncate font-sans text-[10px] text-navy/45" title={row.geocodeLabel}>
                                {row.geocodeLabel}
                              </p>
                            )}
                          </td>
                          <td className="max-w-[210px] px-3 py-3">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                row.locationStatus === 'automatic'
                                  ? 'bg-steel/10 text-steel'
                                  : row.locationStatus === 'manual'
                                    ? 'bg-amber-50 text-amber-700'
                                    : row.locationStatus === 'searching'
                                      ? 'bg-blue-50 text-blue-700'
                                      : row.locationStatus === 'failed'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-red-50 text-red-700'
                              }`}
                            >
                              {row.locationStatus === 'automatic'
                                ? 'Koordinat ditemukan'
                                : row.locationStatus === 'manual'
                                  ? 'Dipilih secara manual'
                                  : row.locationStatus === 'searching'
                                    ? 'Menunggu pencarian'
                                    : row.locationStatus === 'failed'
                                      ? 'Layanan Geocoding gagal'
                                      : 'Alamat tidak ditemukan'}
                            </span>
                            {(row.coordinateIssue || row.issues.length > 0) && (
                              <p className="mt-1 text-[10px] leading-relaxed text-red-600">
                                {[...row.issues, row.coordinateIssue]
                                  .filter(Boolean)
                                  .join(' ')}
                              </p>
                            )}
                            {row.geocodeDetails && (
                              <details className="mt-1 text-[10px] text-navy/55">
                                <summary className="cursor-pointer font-semibold">
                                  Rincian pencarian
                                </summary>
                                <p className="mt-1 whitespace-pre-line break-words">
                                  {row.geocodeDetails}
                                </p>
                              </details>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <button
                              type="button"
                              onClick={() => setLocationRow(row)}
                              className="inline-flex items-center gap-1 rounded-lg border border-mist px-2.5 py-1.5 text-[10px] font-bold text-navy hover:border-steel/40 hover:text-steel"
                            >
                              <MapPin className="h-3 w-3" />
                              Perbaiki lokasi
                            </button>
                            {(row.locationStatus === 'failed' ||
                              row.locationStatus === 'not-found') && (
                              <button
                                type="button"
                                disabled={geocoding}
                                onClick={async () => {
                                  setGeocoding(true);
                                  try {
                                    await geocodeRow(row);
                                  } finally {
                                    setGeocoding(false);
                                  }
                                }}
                                className="mt-1 block text-left text-[10px] font-bold text-steel underline disabled:opacity-50"
                              >
                                Coba geocoding lagi
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {importResult && (
              <div className="space-y-3 rounded-2xl border border-steel/20 bg-steel/5 p-4">
                <div className="flex items-center gap-2 font-bold text-navy">
                  <Check className="h-4 w-4 text-steel" />
                  Import selesai: {importResult.summary.imported} berhasil,{' '}
                  {importResult.summary.failed} gagal.
                </div>
                {importResult.created.length > 0 && (
                  <p className="text-xs text-navy/70">
                    Berhasil: {importResult.created.map((item) => item.name).join(', ')}
                  </p>
                )}
                {importResult.failed.length > 0 && (
                  <div className="max-h-36 space-y-1 overflow-y-auto text-xs text-red-700">
                    {importResult.failed.map((item, index) => (
                      <p key={`${item.row}-${index}`}>
                        Baris {item.row}{item.name ? ` (${item.name})` : ''}: {item.error}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex shrink-0 flex-col gap-3 border-t border-mist/60 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] font-semibold text-navy/60">
              {rows.length === 0
                ? 'Belum ada data untuk ditampilkan.'
                : `${validRows.length} perusahaan siap diimpor · ${validCoordinateCount} memiliki koordinat valid · ${problemCount} bermasalah.`}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={parsing || geocoding || importing}
                className="rounded-full bg-mist/60 px-5 py-2.5 text-xs font-bold text-navy hover:bg-mist disabled:opacity-50"
              >
                {importResult ? 'Tutup' : 'Batal'}
              </button>
              {!importResult && (
                <button
                  type="button"
                  onClick={() => void handleConfirmImport()}
                  disabled={
                    validRows.length === 0 ||
                    parsing ||
                    geocoding ||
                    importing
                  }
                  className="flex items-center justify-center gap-2 rounded-full bg-steel px-5 py-2.5 text-xs font-bold text-white hover:bg-steel/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {importing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Mengimpor...
                    </>
                  ) : (
                    'Konfirmasi Import'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {locationRow && (
        <LocationCorrectionModal
          row={locationRow}
          onClose={() => setLocationRow(null)}
          onSave={(latitude, longitude) =>
            updateLocation(locationRow.rowNumber, latitude, longitude)
          }
        />
      )}
    </>
  );
};

const SummaryCard: React.FC<{ label: string; value: number }> = ({
  label,
  value,
}) => (
  <div className="rounded-xl border border-mist/60 bg-white px-3 py-2.5">
    <p className="text-[10px] font-bold uppercase tracking-wide text-navy/50">
      {label}
    </p>
    <p className="mt-1 text-lg font-bold text-navy">{value}</p>
  </div>
);

const LocationCorrectionModal: React.FC<{
  row: CompanyImportRow;
  onClose: () => void;
  onSave: (latitude: number, longitude: number) => void;
}> = ({ row, onClose, onSave }) => {
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<L.Map | null>(null);
  const markerRef = React.useRef<L.Marker | null>(null);
  const coordinatesRef = React.useRef<{
    latitude: number | null;
    longitude: number | null;
  }>({
    latitude: row.latitude,
    longitude: row.longitude,
  });
  const syncMarkerRef = React.useRef<
    (latitude: number, longitude: number) => void
  >(() => undefined);
  const [latitude, setLatitude] = useState<number | null>(row.latitude);
  const [longitude, setLongitude] = useState<number | null>(row.longitude);
  const [search, setSearch] = useState(row.address);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [lookupStatus, setLookupStatus] = useState('');

  const updateCoordinates = (lat: number, lng: number) => {
    coordinatesRef.current = {
      latitude: lat,
      longitude: lng,
    };
    setLatitude(lat);
    setLongitude(lng);
  };

  React.useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const hasCoordinates = isValidCompanyLocation(
      row.latitude ?? Number.NaN,
      row.longitude ?? Number.NaN
    );
    const center: [number, number] = hasCoordinates
      ? [row.latitude as number, row.longitude as number]
      : [-6.87, 107.54];
    const map = L.map(mapContainerRef.current, {
      center,
      zoom: hasCoordinates ? 16 : 12,
    });
    L.tileLayer(STREET_TILE.url, {
      attribution: STREET_TILE.attribution,
      maxZoom: STREET_TILE.maxZoom,
    }).addTo(map);

    const updateMarker = (lat: number, lng: number) => {
      const position: L.LatLngExpression = [lat, lng];
      updateCoordinates(lat, lng);

      if (!markerRef.current) {
        const marker = L.marker(position, {
          icon: createPickerIcon(),
          draggable: true,
        }).addTo(map);
        marker.bindPopup(() => {
          const popup = document.createElement('div');
          const name = document.createElement('strong');
          name.textContent = row.name || 'Perusahaan';
          const address = document.createElement('div');
          address.textContent = row.address;
          popup.append(name, address);
          return popup;
        });
        marker.on('dragend', (event) => {
          const point = (event.target as L.Marker).getLatLng();
          updateCoordinates(point.lat, point.lng);
        });
        markerRef.current = marker;
      } else {
        markerRef.current.setLatLng(position);
      }
    };

    syncMarkerRef.current = updateMarker;
    if (hasCoordinates) {
      updateMarker(row.latitude as number, row.longitude as number);
    }
    map.on('click', (event) =>
      updateMarker(event.latlng.lat, event.latlng.lng)
    );
    mapRef.current = map;
    const resizeTimer = window.setTimeout(() => map.invalidateSize(), 100);

    return () => {
      window.clearTimeout(resizeTimer);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [row]);

  React.useEffect(() => {
    if (
      isValidCompanyLocation(
        row.latitude ?? Number.NaN,
        row.longitude ?? Number.NaN
      )
    ) {
      return;
    }

    let cancelled = false;
    setSearching(true);
    setLookupStatus('Mencari lokasi berdasarkan alamat perusahaan...');
    setSearchError('');

    api
      .post<{
        result: {
          latitude: number;
          longitude: number;
          label: string;
        } | null;
        error?: string;
      }>('/api/companies/import/geocode', {
        address: row.address,
        companyName: row.name,
        city: row.city,
        province: /cimahi|cimindi|jawa\s*barat/i.test(
          `${row.address} ${row.city}`
        )
          ? 'Jawa Barat'
          : undefined,
        country: row.country || 'Indonesia',
      })
      .then((response) => {
        if (cancelled) return;
        if (
          response.result &&
          isValidCompanyLocation(
            response.result.latitude,
            response.result.longitude
          )
        ) {
          setLookupStatus(
            'Lokasi ditemukan. Periksa marker dan simpan lokasi.'
          );
          setSearch(response.result.label || row.address);
          mapRef.current?.flyTo(
            [response.result.latitude, response.result.longitude],
            16
          );
          syncMarkerRef.current(
            response.result.latitude,
            response.result.longitude
          );
        } else {
          setLookupStatus('Alamat tidak ditemukan.');
          setSearchError(
            response.error ||
              'Koordinat belum ditemukan. Pilih titik pada peta atau cari alamat lain.'
          );
        }
      })
      .catch((error: any) => {
        if (cancelled) return;
        setLookupStatus('Layanan Geocoding gagal.');
        setSearchError(
          error?.data?.error ||
            error?.message ||
            'Tidak dapat terhubung ke layanan Geocoding.'
        );
      })
      .finally(() => {
        if (!cancelled) setSearching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [row]);

  const searchAddress = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!search.trim()) return;

    setSearching(true);
    setSearchError('');
    try {
      const response = await api.post<{
        result: {
          latitude: number;
          longitude: number;
          label: string;
        } | null;
        error?: string;
      }>('/api/companies/import/geocode', {
        address: search.trim(),
        companyName: row.name,
        city: row.city,
        province: /cimahi|cimindi|jawa\s*barat/i.test(
          `${row.address} ${row.city}`
        )
          ? 'Jawa Barat'
          : undefined,
        country: row.country || 'Indonesia',
      });

      if (
        !response.result ||
        !isValidCompanyLocation(
          response.result.latitude,
          response.result.longitude
        )
      ) {
        setLookupStatus('Alamat tidak ditemukan.');
        setSearchError(
          response.error ||
            'Alamat tidak ditemukan. Pilih titik secara manual pada peta.'
        );
        return;
      }

      const point = response.result;
      setLookupStatus('Lokasi ditemukan.');
      setSearch(point.label || search);
      mapRef.current?.flyTo([point.latitude, point.longitude], 16);
      syncMarkerRef.current(point.latitude, point.longitude);
    } catch (error: any) {
      setLookupStatus('Layanan Geocoding gagal.');
      setSearchError(
        error?.data?.error || error?.message || 'Gagal mencari alamat.'
      );
    } finally {
      setSearching(false);
    }
  };

  const valid = isValidCompanyLocation(
    latitude ?? Number.NaN,
    longitude ?? Number.NaN
  );

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-navy/65 p-3 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-[24px] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-mist/60 p-4">
          <div>
            <h4 className="font-bold text-navy">Perbaiki Lokasi Perusahaan</h4>
            <p className="mt-0.5 text-xs text-navy/60">
              {row.name || 'Nama belum diisi'} · {row.address || 'Alamat belum diisi'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-mist/50 text-navy/60"
            aria-label="Tutup peta"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-mist/60 p-3">
          <form onSubmit={searchAddress} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy/40" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari alamat atau tempat..."
                className="w-full rounded-full border border-mist bg-mist/30 py-2.5 pl-9 pr-3 text-sm text-navy outline-none focus:border-steel"
              />
            </div>
            <button
              type="submit"
              disabled={searching || !search.trim()}
              className="flex items-center gap-1.5 rounded-full bg-steel px-4 text-xs font-bold text-white disabled:opacity-50"
            >
              {searching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Cari
            </button>
          </form>
          {(lookupStatus || searchError) && (
            <p className="mt-2 text-xs font-medium text-amber-700">
              {lookupStatus && <span className="mr-1 font-bold">{lookupStatus}</span>}
              {searchError}
            </p>
          )}
        </div>

        <div
          ref={mapContainerRef}
          className="min-h-[300px] flex-1"
          aria-label="Peta untuk memilih titik perusahaan"
        />

        <div className="flex flex-col gap-3 border-t border-mist/60 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-mono text-navy/70">
            Latitude: {latitude?.toFixed(6) ?? '—'} · Longitude:{' '}
            {longitude?.toFixed(6) ?? '—'}
            <span className="ml-2 font-sans text-navy/50">
              Geser marker atau klik peta.
            </span>
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-mist/60 px-4 py-2 text-xs font-bold text-navy"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={!valid}
              onClick={() => {
                const current = coordinatesRef.current;
                if (
                  isValidCompanyLocation(
                    current.latitude ?? Number.NaN,
                    current.longitude ?? Number.NaN
                  )
                ) {
                  onSave(
                    current.latitude as number,
                    current.longitude as number
                  );
                }
              }}
              className="rounded-full bg-steel px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
            >
              Simpan Lokasi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
