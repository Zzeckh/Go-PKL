import path from 'node:path';
import bcrypt from 'bcryptjs';
import XLSX from 'xlsx';
import prisma from '../src/config/db.js';

const projectDir = process.env.PROJECTS_DIR || path.resolve(process.cwd(), '..');
const workbook = XLSX.readFile(path.join(projectDir, 'DATA UNIT KERJA.xlsx'), { cellDates: true });
const rows = XLSX.utils.sheet_to_json(workbook.Sheets.NIP, { defval: '' });
const password = await bcrypt.hash(process.env.DEFAULT_TEACHER_PASSWORD || '123456', 10);

const teachers = rows.map((row) => {
  const name = String(row['NAMA '] || row.NAMA || '').trim();
  const nip = String(row['NIP / NUPTK'] || '').trim();
  const loginNip = nip.replace(/\s+/g, '');
  return { name, nip, email: `${loginNip}@gopkl.id` };
}).filter((row) => row.name && row.nip);

await prisma.user.updateMany({ where: { teacherId: { not: null } }, data: { teacherId: null } });
await prisma.company.updateMany({ where: { mentorId: { not: null } }, data: { mentorId: null } });
const oldTeachers = await prisma.user.findMany({ where: { role: 'teacher' }, select: { id: true } });
if (oldTeachers.length) await prisma.companyMentor.deleteMany({ where: { mentorId: { in: oldTeachers.map((teacher) => teacher.id) } } });
await prisma.user.deleteMany({ where: { role: 'teacher' } });
await prisma.user.createMany({ data: teachers.map((teacher) => ({ name: teacher.name, email: teacher.email, password, nip: teacher.nip, role: 'teacher', isActive: true })) });

console.log(`Created ${teachers.length} teacher accounts.`);
console.log(`Login format: NIP tanpa spasi + @gopkl.id; password awal: 123456`);
await prisma.$disconnect();
