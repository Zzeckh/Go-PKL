import test from 'node:test';
import assert from 'node:assert/strict';
import XLSX from 'xlsx';

import {
  downloadStudentImportTemplate,
  previewStudentImport,
} from './studentImportController.js';

const createResponse = () => ({
  statusCode: 200,
  headers: {},
  body: null,
  setHeader(name, value) {
    this.headers[name] = value;
  },
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
  send(body) {
    this.body = body;
    return this;
  },
});

test('downloads the student template with required and optional headers', async () => {
  const response = createResponse();
  let nextError;

  await downloadStudentImportTemplate({}, response, (error) => {
    nextError = error;
  });

  assert.equal(nextError, undefined);
  assert.equal(response.statusCode, 200);
  assert.match(response.headers['Content-Disposition'], /template-import-siswa\.xlsx/);
  assert.equal(
    response.headers['Content-Type'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );

  const workbook = XLSX.read(response.body, { type: 'buffer' });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
  assert.deepEqual(rows[0], [
    'NIS',
    'Nama Siswa',
    'Kelas',
    'Jurusan',
    'Tahun Ajaran',
    'Email',
  ]);
});

test('rejects a preview request without a file before accessing Prisma', async () => {
  const response = createResponse();
  let nextError;

  await previewStudentImport({ file: null }, response, (error) => {
    nextError = error;
  });

  assert.equal(nextError, undefined);
  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error, 'File Excel wajib diunggah.');
});

test('rejects a non-XLSX preview file before accessing Prisma', async () => {
  const response = createResponse();
  let nextError;

  await previewStudentImport(
    { file: { originalname: 'students.csv', buffer: Buffer.from('') } },
    response,
    (error) => {
      nextError = error;
    }
  );

  assert.equal(nextError, undefined);
  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error, 'Format file harus .xlsx.');
});
