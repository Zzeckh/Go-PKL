export const REQUIRED_STUDENT_IMPORT_HEADERS = [
  'NIS',
  'Nama Siswa',
  'Kelas',
  'Jurusan',
  'Tahun Ajaran',
];

export const OPTIONAL_STUDENT_IMPORT_HEADERS = ['Email'];

const normalizeText = (value) =>
  String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('id');

export const normalizeStudentNis = (value) =>
  String(value ?? '')
    .trim()
    .replace(/\.0$/, '')
    .toLocaleLowerCase('id');

export const normalizeStudentEmail = (value) =>
  String(value ?? '').trim().toLocaleLowerCase('en-US');

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
  const emailOccurrences = countBy(rows, (row) => row.email, normalizeStudentEmail);

  const studentsByNis = new Map();
  students.forEach((student) => {
    const nis = normalizeStudentNis(String(student.email || '').split('@')[0]);
    if (!nis) return;
    const matches = studentsByNis.get(nis) || [];
    matches.push(student);
    studentsByNis.set(nis, matches);
  });

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
      normalizeText(schoolClass.major),
      normalizeText(yearName),
    ].join('|');
    const matches = classesByIdentity.get(identity) || [];
    matches.push(schoolClass);
    classesByIdentity.set(identity, matches);
  });

  const results = rows.map((row) => {
    const nis = normalizeStudentNis(row.nis);
    const email = normalizeStudentEmail(row.email);
    const reasons = [];

    if (nis && (nisOccurrences.get(nis) || 0) > 1) {
      reasons.push('NIS duplikat di dalam file.');
    }
    if (email && (emailOccurrences.get(email) || 0) > 1) {
      reasons.push('Email duplikat di dalam file.');
    }

    if (reasons.length > 0) {
      return { ...row, status: 'duplicate', reason: reasons.join(' ') };
    }

    if (!nis) reasons.push('NIS wajib diisi.');
    if (row.nisIsNumeric) {
      reasons.push('NIS harus disimpan sebagai teks agar nol di depan tidak hilang.');
    }
    if (!normalizeText(row.name)) reasons.push('Nama Siswa wajib diisi.');
    if (!normalizeText(row.className)) reasons.push('Kelas wajib diisi.');
    if (!normalizeText(row.major)) reasons.push('Jurusan wajib diisi.');
    if (!normalizeText(row.academicYear)) reasons.push('Tahun Ajaran wajib diisi.');

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
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

    const existingMatches = nis ? studentsByNis.get(nis) || [] : [];
    if (existingMatches.length > 1) {
      reasons.push('NIS cocok dengan lebih dari satu akun siswa.');
    }

    const existingStudent = existingMatches.length === 1 ? existingMatches[0] : null;
    const emailOwner = email ? emailOwners.get(email) : null;

    if (emailOwner && emailOwner.id !== existingStudent?.id) {
      reasons.push('Email sudah digunakan akun lain.');
    }

    if (existingStudent && normalizeText(existingStudent.name) !== normalizeText(row.name)) {
      reasons.push('Nama tidak cocok dengan siswa yang ditemukan berdasarkan NIS.');
    }

    const matchedClass = classMatches.length === 1 ? classMatches[0] : null;
    if (existingStudent && matchedClass && existingStudent.classId !== matchedClass.id) {
      reasons.push('Kelas/Jurusan akun existing berbeda; data existing tidak diubah.');
    }
    if (existingStudent && year && existingStudent.academicYearId !== year.id) {
      reasons.push('Tahun Ajaran akun existing berbeda; data existing tidak diubah.');
    }
    if (
      existingStudent &&
      email &&
      normalizeStudentEmail(existingStudent.email) !== email
    ) {
      reasons.push('Email berbeda dari akun existing; data existing tidak diubah.');
    }

    if (reasons.length > 0) {
      return { ...row, status: 'invalid', reason: reasons.join(' ') };
    }

    if (existingStudent) {
      return {
        ...row,
        status: 'existing',
        reason: 'NIS ditemukan; data siswa existing tidak akan diubah.',
      };
    }

    return {
      ...row,
      status: 'new-candidate',
      reason: 'Calon akun baru; pembuatan akun menunggu kebijakan kredensial.',
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