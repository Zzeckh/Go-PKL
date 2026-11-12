export const REQUIRED_STUDENT_IMPORT_HEADERS = [
  'NIS',
  'Nama Siswa',
  'Kelas',
  'Jurusan',
  'Tahun Ajaran',
];

export const OPTIONAL_STUDENT_IMPORT_HEADERS = ['Email'];
export const STUDENT_IMPORT_TEMPLATE_SAMPLE_NAME = 'CONTOH - HAPUS BARIS INI';
const MAX_EXCEL_NUMERIC_NIS = 999_999_999_999_999;

const normalizeText = (value) =>
  String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('id');

export const normalizeStudentNis = (value) => {
  if (typeof value === 'number') {
    return Number.isSafeInteger(value) &&
      value > 0 &&
      value <= MAX_EXCEL_NUMERIC_NIS
      ? value
      : null;
  }
  if (typeof value !== 'string' || !/^\d+$/.test(value.trim())) return null;
  const numericNis = Number(value.trim());
  return Number.isSafeInteger(numericNis) &&
    numericNis > 0 &&
    numericNis <= MAX_EXCEL_NUMERIC_NIS
    ? numericNis
    : null;
};

export const readStudentImportNisCell = (cell) => {
  if (cell?.v == null || cell.v === '') {
    return { nis: null, issue: undefined };
  }

  if (
    cell.t === 'n' &&
    typeof cell.v === 'number' &&
    Number.isSafeInteger(cell.v) &&
    cell.v > 0 &&
    cell.v <= MAX_EXCEL_NUMERIC_NIS
  ) {
    return { nis: cell.v, issue: undefined };
  }

  return {
    nis: null,
    issue:
      'NIS harus berupa angka bulat positif maksimal 15 digit di Excel.',
  };
};

export const normalizeStudentEmail = (value) =>
  String(value ?? '').trim().toLocaleLowerCase('en-US');

export const resolveStudentImportEmail = (row) => {
  const email = normalizeStudentEmail(row.email);
  const nis = normalizeStudentNis(row.nis);
  return email || (nis !== null ? `${nis}@gopkl.id` : '');
};

export const validateStudentImportHeaders = (headers) => {
  const normalizedHeaders = headers.map(normalizeText);
  const errors = [];

  const repeatedHeaders = normalizedHeaders.filter(
    (header, index) => header && normalizedHeaders.indexOf(header) !== index
  );

  if (repeatedHeaders.length > 0) {
    errors.push('Nama kolom tidak boleh duplikat.');
  }

  const headerMap = new Map();
  const supportedHeaders = [
    ...REQUIRED_STUDENT_IMPORT_HEADERS,
    ...OPTIONAL_STUDENT_IMPORT_HEADERS,
  ];
  supportedHeaders
    .forEach((canonicalHeader) => {
      const normalizedCanonical = normalizeText(canonicalHeader);
      const index = normalizedHeaders.indexOf(normalizedCanonical);
      if (index >= 0) headerMap.set(canonicalHeader, index);
    });

  const supportedNormalizedHeaders = new Set(supportedHeaders.map(normalizeText));
  const unknownHeaders = normalizedHeaders.filter(
    (header) => header && !supportedNormalizedHeaders.has(header)
  );
  if (unknownHeaders.length > 0) {
    errors.push(`Kolom tidak dikenal: ${unknownHeaders.join(', ')}.`);
  }

  const missingHeaders = REQUIRED_STUDENT_IMPORT_HEADERS.filter(
    (header) => !headerMap.has(header)
  );

  if (missingHeaders.length > 0) {
    errors.push(`Kolom wajib tidak ditemukan: ${missingHeaders.join(', ')}.`);
  }

  return {
    valid: errors.length === 0,
    errors,
    headerMap,
  };
};

const countBy = (rows, getValue, normalizeValue) => {
  const counts = new Map();
  rows.forEach((row) => {
    const value = normalizeValue(getValue(row));
    if (value) counts.set(value, (counts.get(value) || 0) + 1);
  });
  return counts;
};

export const previewStudentImportRows = ({
  rows,
  students,
  emails,
  classes,
  academicYears,
}) => {
  const nisOccurrences = countBy(rows, (row) => row.nis, normalizeStudentNis);
  const emailOccurrences = countBy(
    rows,
    resolveStudentImportEmail,
    normalizeStudentEmail
  );

  const studentsByNis = new Map();
  students.forEach((student) => {
    const nis = normalizeStudentNis(student.nis);
    if (!nis) return;
    const matches = studentsByNis.get(nis) || [];
    matches.push(student);
    studentsByNis.set(nis, matches);
  });

  const nonStudentNis = new Set(
    emails
      .filter((account) => account.role !== 'student')
      .map((account) => normalizeStudentNis(account.nis))
      .filter(Boolean)
  );
  const emailOwners = new Map(
    emails.map((account) => [normalizeStudentEmail(account.email), account])
  );
  const yearsByName = new Map(
    academicYears.map((year) => [normalizeText(year.name), year])
  );
  const classesByIdentity = new Map();

  classes.forEach((schoolClass) => {
    const yearName = schoolClass.academicYear?.name;
    if (!yearName) return;

    const identity = [
      normalizeText(schoolClass.name),
      normalizeText(schoolClass.programKeahlian?.name ?? schoolClass.major),
      normalizeText(yearName),
    ].join('|');
    const matches = classesByIdentity.get(identity) || [];
    matches.push(schoolClass);
    classesByIdentity.set(identity, matches);
  });

  const results = rows.map((row) => {
    const nis = normalizeStudentNis(row.nis);
    const email = resolveStudentImportEmail({ ...row, nis });
    const reasons = [];

    if (nis && (nisOccurrences.get(nis) || 0) > 1) {
      reasons.push('NIS duplikat di dalam file.');
    }

    if (reasons.length > 0) {
      return { ...row, status: 'duplicate', reason: reasons.join(' ') };
    }

    if (nis === null) {
      reasons.push(
        'NIS wajib diisi sebagai angka bulat positif maksimal 15 digit.'
      );
    }
    if (row.nisIssue) reasons.push(row.nisIssue);
    if (nis !== null && nonStudentNis.has(nis)) {
      reasons.push('NIS sudah digunakan oleh akun non-siswa.');
    }

    const existingMatches =
      nis !== null ? studentsByNis.get(nis) || [] : [];
    if (existingMatches.length > 1) {
      reasons.push('NIS cocok dengan lebih dari satu akun siswa.');
    }
    if (existingMatches.length === 1 && reasons.length === 0) {
      return {
        ...row,
        nis,
        status: 'existing',
        reason: 'NIS ditemukan; data siswa existing tidak akan diubah.',
      };
    }

    if (reasons.length > 0) {
      return { ...row, nis, status: 'invalid', reason: reasons.join(' ') };
    }

    if (nis !== null && email && (emailOccurrences.get(email) || 0) > 1) {
      return {
        ...row,
        nis,
        status: 'duplicate',
        reason: 'Email duplikat di dalam file.',
      };
    }

    if (!normalizeText(row.name)) reasons.push('Nama Siswa wajib diisi.');
    if (!normalizeText(row.className)) reasons.push('Kelas wajib diisi.');
    if (!normalizeText(row.major)) reasons.push('Jurusan wajib diisi.');
    if (!normalizeText(row.academicYear)) reasons.push('Tahun Ajaran wajib diisi.');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      reasons.push('Format Email tidak valid.');
    }

    const year = yearsByName.get(normalizeText(row.academicYear));
    if (normalizeText(row.academicYear) && !year) {
      reasons.push('Tahun Ajaran tidak ditemukan.');
    }

    const classIdentity = [
      normalizeText(row.className),
      normalizeText(row.major),
      normalizeText(row.academicYear),
    ].join('|');
    const classMatches = classesByIdentity.get(classIdentity) || [];

    if (year && classMatches.length === 0) {
      reasons.push('Kombinasi Kelas, Jurusan, dan Tahun Ajaran tidak ditemukan.');
    } else if (classMatches.length > 1) {
      reasons.push('Kombinasi Kelas, Jurusan, dan Tahun Ajaran tidak unik.');
    }

    const emailOwner = emailOwners.get(email);
    if (emailOwner) {
      reasons.push('Email sudah digunakan akun lain.');
    }

    const matchedClass = classMatches.length === 1 ? classMatches[0] : null;
    if (reasons.length > 0) {
      return { ...row, status: 'invalid', reason: reasons.join(' ') };
    }

    return {
      ...row,
      nis,
      email,
      classId: matchedClass.id,
      academicYearId: year.id,
      academicYearName: year.name,
      status: 'new-candidate',
      reason: 'Akun baru siap dibuat setelah konfirmasi.',
    };
  });

  const existingCount = results.filter((row) => row.status === 'existing').length;
  const newCandidateCount = results.filter((row) => row.status === 'new-candidate').length;
  const duplicateCount = results.filter((row) => row.status === 'duplicate').length;
  const invalidCount = results.filter((row) => row.status === 'invalid').length;

  return {
    totalRows: results.length,
    validRows: existingCount + newCandidateCount,
    existingRows: existingCount,
    newAccountCandidates: newCandidateCount,
    duplicateRows: duplicateCount,
    invalidRows: invalidCount,
    rows: results,
  };
};