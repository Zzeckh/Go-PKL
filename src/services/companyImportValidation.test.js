import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeCompanyCategory } from '../utils/companyImport.js';

test('normalizes five External company categories to Eksternal', () => {
  const cimindiCompanies = [
    { name: 'Perusahaan Cimindi 1', category: 'External' },
    { name: 'Perusahaan Cimindi 2', category: ' external ' },
    { name: 'Perusahaan Cimindi 3', category: 'EXTERNAL' },
    { name: 'Perusahaan Cimindi 4', category: 'ExTeRnAl' },
    { name: 'Perusahaan Cimindi 5', category: ' External  ' },
  ];

  assert.deepEqual(
    cimindiCompanies.map((company) =>
      normalizeCompanyCategory(company.category)
    ),
    Array(5).fill('Eksternal')
  );
});

test('rejects unsupported company categories', () => {
  assert.equal(normalizeCompanyCategory('  INTERNAL  '), 'Internal');
  assert.equal(normalizeCompanyCategory(' Eksternal '), 'Eksternal');
  assert.equal(normalizeCompanyCategory('Partner'), null);
  assert.equal(normalizeCompanyCategory(''), null);
});
