import test from 'node:test';
import assert from 'node:assert/strict';

import {
  previewStudentImportRows,
  validateStudentImportHeaders,
} from './studentImportPreviewService.js';

const headers = ['NIS', 'Nama Siswa', 'Kelas', 'Jurusan', 'Tahun Ajaran', 'Email'];

const masterData = {
  students: [
    {
      id: 10,
      name: 'Alya Siswa',
      email: '0010@siswa.test',
      classId: 5,
      academicYearId: 2,
    },
  ],
  emails: [{ id: 10, email: '0010@siswa.test' }],
  classes: [
    {
      id: 5,
      name: 'XII RPL 1',
      major: 'RPL',
      academicYearId: 2,
      academicYear: { name: '2026/2027' },
    },
  ],
  academicYears: [{ id: 2, name: '2026/2027' }],
};

const row = (overrides = {}) => ({
  rowNumber: 2,
  nis: '0010',
  name: 'Alya Siswa',
  className: 'XII RPL 1',
  major: 'RPL',
  academicYear: '2026/2027',
  email: '',
  ...overrides,
});

test('rejects a workbook with missing required columns', () => {
  const result = validateStudentImportHeaders(['NIS', 'Nama Siswa']);
  assert.equal(result.valid, false);
  assert.match(result.errors[0], /Kelas, Jurusan, Tahun Ajaran/);
});

test('matches an existing NIS without mutating existing account data', () => {
  const students = structuredClone(masterData.students);
  const result = previewStudentImportRows({ rows: [row()], ...masterData });

  assert.equal(result.rows[0].status, 'existing');
  assert.equal(result.existingRows, 1);
  assert.deepEqual(masterData.students, students);
});

test('marks an unknown NIS as a pending new-account candidate', () => {
  const result = previewStudentImportRows({
    rows: [row({ rowNumber: 3, nis: '0099', name: 'Budi Baru' })],
    ...masterData,
  });

  assert.equal(result.rows[0].status, 'new-candidate');
  assert.equal(result.newAccountCandidates, 1);
  assert.match(result.rows[0].reason, /menunggu kebijakan kredensial/);
});

test('marks every repeated NIS row as a duplicate', () => {
  const result = previewStudentImportRows({
    rows: [row({ rowNumber: 2 }), row({ rowNumber: 3 })],
    ...masterData,
  });

  assert.equal(result.duplicateRows, 2);
  assert.ok(result.rows.every((item) => item.status === 'duplicate'));
});

test('rejects duplicate emails and emails owned by another account', () => {
  const duplicateFile = previewStudentImportRows({
    rows: [
      row({ nis: '0041', name: 'Orang Satu', email: 'same@example.test' }),
      row({ rowNumber: 3, nis: '0042', name: 'Orang Dua', email: 'same@example.test' }),
    ],
    ...masterData,
  });
  assert.equal(duplicateFile.duplicateRows, 2);

  const conflict = previewStudentImportRows({
    rows: [row({ nis: '0099', name: 'Calon Baru', email: '0010@siswa.test' })],
    ...masterData,
  });
  assert.equal(conflict.rows[0].status, 'invalid');
  assert.match(conflict.rows[0].reason, /Email sudah digunakan/);
});

test('rejects unknown class, major, and academic year combinations', () => {
  const result = previewStudentImportRows({
    rows: [row({ nis: '0099', name: 'Calon Baru', className: 'Kelas Asing' })],
    ...masterData,
  });

  assert.equal(result.rows[0].status, 'invalid');
  assert.match(result.rows[0].reason, /Kombinasi Kelas/);
});

test('rejects an existing NIS whose name conflicts and does not classify it as a candidate', () => {
  const result = previewStudentImportRows({
    rows: [row({ name: 'Nama Berbeda' })],
    ...masterData,
  });

  assert.equal(result.rows[0].status, 'invalid');
  assert.equal(result.newAccountCandidates, 0);
  assert.match(result.rows[0].reason, /Nama tidak cocok/);
});

test('rejects unsupported headers', () => {
  const result = validateStudentImportHeaders([
    ...headers,
    'Password',
  ]);

  assert.equal(result.valid, false);
  assert.match(result.errors[0], /Kolom tidak dikenal: password/);
});

test('rejects numeric NIS cells that may have lost leading zeroes', () => {
  const result = previewStudentImportRows({
    rows: [row({ nis: '10', nisIsNumeric: true })],
    ...masterData,
  });

  assert.equal(result.rows[0].status, 'invalid');
  assert.match(result.rows[0].reason, /disimpan sebagai teks/);
});