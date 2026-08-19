import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const PASSWORD = 'gopkl123';
const ACADEMIC_YEAR = '2025/2026';

async function main() {
  console.log('🧹 Membersihkan isi tabel...');
  await prisma.evaluation.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.logbook.deleteMany();
  await prisma.absensi.deleteMany();
  await prisma.user.deleteMany();
  await prisma.class.deleteMany();
  await prisma.company.deleteMany();
  await prisma.school.deleteMany();

  const hash = await bcrypt.hash(PASSWORD, 10);

  /* ── SUPER ADMIN (lintas sekolah, pengelola semua role) ── */
  console.log('👑 Membuat Super Admin...');
  await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'superadmin@gopkl.id',
      password: hash,
      role: 'super_admin',
      isActive: true,
    },
  });

  console.log('🏫 Membuat master data minimal...');
  const school = await prisma.school.create({
    data: { name: 'SMK Negeri 1 Nusantara', address: 'Jl. Pendidikan Raya No. 1' },
  });

  const company = await prisma.company.create({
    data: {
      name: 'PT Teknologi Nusantara',
      address: 'Jl. Jend. Sudirman Kav. 52-53, Jakarta Selatan',
      category: 'Information Technology',
      quota: 10,
      latitude: -6.2276,
      longitude: 106.8086,
      radiusMeters: 500,
    },
  });

  console.log('📚 Membuat kelas...');
  const classRPL = await prisma.class.create({
    data: { name: 'XII RPL 1', major: 'Rekayasa Perangkat Lunak', schoolId: school.id },
  });
  await prisma.class.create({
    data: { name: 'XII TKJ 1', major: 'Teknik Komputer Jaringan', schoolId: school.id },
  });

  console.log('👤 Membuat akun per role...');
  const teacher = await prisma.user.create({
    data: {
      name: 'Guru Pembimbing',
      email: 'guru@gopkl.id',
      password: hash,
      role: 'teacher',
      schoolId: school.id,
      academicYear: ACADEMIC_YEAR,
    },
  });

  const mentor = await prisma.user.create({
    data: {
      name: 'Mentor Industri',
      email: 'mentor@gopkl.id',
      password: hash,
      role: 'mentor',
      academicYear: ACADEMIC_YEAR,
    },
  });
  await prisma.company.update({ where: { id: company.id }, data: { mentorId: mentor.id } });

  await prisma.user.create({
    data: {
      name: 'Tim Hubin',
      email: 'hubin@gopkl.id',
      password: hash,
      role: 'hubin',
      schoolId: school.id,
      academicYear: ACADEMIC_YEAR,
    },
  });

  await prisma.user.create({
    data: {
      name: 'Siswa PKL',
      email: 'siswa@gopkl.id',
      password: hash,
      role: 'student',
      schoolId: school.id,
      companyId: company.id,
      teacherId: teacher.id,
      classId: classRPL.id,
      academicYear: ACADEMIC_YEAR,
    },
  });

  console.log('\n✅ SELESAI! Akun login (password: gopkl123):');
  console.log('   superadmin@gopkl.id → super_admin (KEPALA SEMUA)');
  console.log('   siswa@gopkl.id      → student (intern) · Kelas: XII RPL 1');
  console.log('   guru@gopkl.id       → teacher');
  console.log('   mentor@gopkl.id     → mentor');
  console.log('   hubin@gopkl.id      → hubin');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());