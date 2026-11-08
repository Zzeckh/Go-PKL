import prisma from '../config/db.js';

const httpError = (status, message) =>
  Object.assign(new Error(message), { status });

const clean = (value) =>
  typeof value === 'string' ? value.trim() : '';

/**
 * Cari Program Keahlian berdasarkan id, atau buat berdasarkan nama.
 * Dipakai oleh form kelas, import siswa, dan endpoint lain agar nama
 * program tetap konsisten di database.
 */
export const resolveProgramKeahlian = async (
  client,
  { programKeahlianId, programKeahlian, major } = {}
) => {
  const db = client || prisma;

  if (programKeahlianId !== undefined && programKeahlianId !== null && programKeahlianId !== '') {
    const id = Number(programKeahlianId);
    if (!Number.isInteger(id) || id <= 0) {
      throw httpError(400, 'ID Program Keahlian tidak valid.');
    }

    const found = await db.programKeahlian.findUnique({ where: { id } });
    if (!found) {
      throw httpError(404, 'Program Keahlian tidak ditemukan.');
    }
    return found;
  }

  const name = clean(programKeahlian) || clean(major);
  if (!name) return null;

  return db.programKeahlian.upsert({
    where: { name },
    update: {},
    create: { name },
  });
};

/**
 * Cari Konsentrasi Keahlian berdasarkan id, atau buat berdasarkan nama
 * di dalam Program Keahlian tertentu.
 */
export const resolveKonsentrasiKeahlian = async (
  client,
  { konsentrasiKeahlianId, konsentrasiKeahlian, programKeahlianId } = {}
) => {
  const db = client || prisma;

  if (
    konsentrasiKeahlianId !== undefined &&
    konsentrasiKeahlianId !== null &&
    konsentrasiKeahlianId !== ''
  ) {
    const id = Number(konsentrasiKeahlianId);
    if (!Number.isInteger(id) || id <= 0) {
      throw httpError(400, 'ID Konsentrasi Keahlian tidak valid.');
    }

    const found = await db.konsentrasiKeahlian.findUnique({ where: { id } });
    if (!found) {
      throw httpError(404, 'Konsentrasi Keahlian tidak ditemukan.');
    }

    if (
      programKeahlianId &&
      found.programKeahlianId !== Number(programKeahlianId)
    ) {
      throw httpError(400, 'Konsentrasi Keahlian tidak sesuai dengan Program Keahlian.');
    }

    return found;
  }

  const name = clean(konsentrasiKeahlian);
  if (!name) return null;

  if (!programKeahlianId) {
    throw httpError(400, 'Pilih Program Keahlian sebelum mengisi Konsentrasi Keahlian.');
  }

  const programId = Number(programKeahlianId);
  if (!Number.isInteger(programId) || programId <= 0) {
    throw httpError(400, 'ID Program Keahlian tidak valid.');
  }

  return db.konsentrasiKeahlian.upsert({
    where: {
      programKeahlianId_name: {
        programKeahlianId: programId,
        name,
      },
    },
    update: {},
    create: {
      programKeahlianId: programId,
      name,
    },
  });
};

export const programSelect = {
  id: true,
  name: true,
};

export const concentrationSelect = {
  id: true,
  name: true,
  programKeahlianId: true,
};
