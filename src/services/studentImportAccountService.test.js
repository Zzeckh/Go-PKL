import assert from 'node:assert/strict';
import test from 'node:test';
import bcrypt from 'bcryptjs';

import { createStudentImportAccounts } from './studentImportAccountService.js';

const candidate = {
  rowNumber: 2,
  nis: 99,
  name: 'Budi Baru',
  email: '99@gopkl.id',
  classId: 5,
  academicYearName: '2026/2027',
  academicYearId: 2,
  status: 'new-candidate',
};

test('creates a student with bcrypt password and academic relations, without returning a password', async () => {
  let createdData;
  const prisma = {
    $transaction: (callback) =>
      callback({
        user: {
          findFirst: async () => null,
          findUnique: async () => null,
          create: async ({ data }) => {
            createdData = data;
            return { id: 21 };
          },
        },
      }),
  };

  const result = await createStudentImportAccounts({
    rows: [candidate],
    prisma,
    hashPassword: (password) => bcrypt.hash(password, 4),
  });

  assert.equal(createdData.role, 'student');
  assert.equal(createdData.nis, '99');
  assert.equal(createdData.classId, 5);
  assert.equal(createdData.academicYear, '2026/2027');
  assert.equal(createdData.academicYearId, 2);
  assert.notEqual(createdData.password, 'gopkl123');
  assert.equal(await bcrypt.compare('gopkl123', createdData.password), true);
  assert.deepEqual(result.summary, {
    total: 1,
    created: 1,
    existing: 0,
    failed: 0,
  });
  assert.equal(JSON.stringify(result).includes('gopkl123'), false);
  assert.equal(Object.hasOwn(result.rows[0], 'password'), false);
});

test('skips an account that appeared after preview without creating a duplicate', async () => {
  let createCalled = false;
  const prisma = {
    $transaction: (callback) =>
      callback({
        user: {
          findUnique: async ({ where }) =>
            where.nis === '99' ? { id: 22, role: 'student' } : null,
          create: async () => {
            createCalled = true;
            return { id: 23 };
          },
        },
      }),
  };

  const result = await createStudentImportAccounts({
    rows: [candidate],
    prisma,
    hashPassword: async () => 'unused-hash',
  });

  assert.equal(createCalled, false);
  assert.equal(result.summary.existing, 1);
});

test('does not attempt to create invalid or duplicate rows', async () => {
  let hashCalled = false;
  const result = await createStudentImportAccounts({
    rows: [
      { rowNumber: 2, nis: '', status: 'invalid', reason: 'NIS wajib diisi.' },
      {
        rowNumber: 3,
        nis: '0099',
        status: 'duplicate',
        reason: 'NIS duplikat di dalam file.',
      },
    ],
    prisma: {
      $transaction: async () => {
        throw new Error('transaction should not run');
      },
    },
    hashPassword: async () => {
      hashCalled = true;
      return 'hash';
    },
  });

  assert.equal(hashCalled, false);
  assert.equal(result.summary.failed, 2);
  assert.match(result.rows[0].reason, /NIS wajib diisi/);
});
