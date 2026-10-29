import path from 'node:path';
import bcrypt from 'bcryptjs';
import XLSX from 'xlsx';
import prisma from '../src/config/db.js';

const projectDir = process.env.PROJECTS_DIR || path.resolve(process.cwd(), '..');
const studentBook = XLSX.readFile(path.join(projectDir, 'DATA SISWA UNTUK APK.xlsx'), { cellDates: true });
const unitBook = XLSX.readFile(path.join(projectDir, 'DATA UNIT KERJA.xlsx'), { cellDates: true });
const students = XLSX.utils.sheet_to_json(studentBook.Sheets['Daftar Peserta Didik'], { defval: '' }).filter((r) => String(r['Rombel Saat Ini']).startsWith('12'));
const staff = XLSX.utils.sheet_to_json(unitBook.Sheets.NIP, { defval: '' });
const password = await bcrypt.hash(process.env.DEFAULT_STUDENT_PASSWORD || '123456', 10);

for (const row of staff) {
  const name = String(row['NAMA '] || row.NAMA || '').trim();
  const nip = String(row['NIP / NUPTK'] || '').trim();
  if (name && nip) await prisma.user.updateMany({ where: { name }, data: { nip } });
}

for (const row of students) {
  const nis = String(row.NIS).trim();
  const rombel = String(row['Rombel Saat Ini']).trim();
  const klass = await prisma.class.findFirst({ where: { name: rombel } });
  const data = {
    name: String(row.Nama).trim(), nis, gender: String(row.JK).trim(), nisn: String(row.NISN).trim(),
    birthPlace: String(row['Tempat Lahir']).trim(), birthDate: row['Tanggal Lahir'] ? new Date(row['Tanggal Lahir']) : null,
    nik: String(row.NIK).trim(), religion: String(row.Agama).trim(), email: `${nis}@gopkl.id`, password,
    role: 'student', isActive: true, academicYear: '2026/2027', ...(klass ? { classId: klass.id } : {}),
  };
  const old = await prisma.user.findFirst({ where: { OR: [{ nis }, { email: data.email }] } });
  if (old) await prisma.user.update({ where: { id: old.id }, data });
  else await prisma.user.create({ data });
}
console.log(`Imported ${students.length} siswa kelas XII and updated ${staff.length} staff NIP.`);
await prisma.$disconnect();
