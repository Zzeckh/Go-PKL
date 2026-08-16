import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const PASSWORD = 'gopkl123'; // ← password semua akun

async function main() {
  console.log('🧹 Membersihkan isi tabel...');
  await prisma.evaluation.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.logbook.deleteMany();
  await prisma.absensi.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();
  await prisma.school.deleteMany();

  const hash = await bcrypt.hash(PASSWORD, 10);

  console.log('🏫 Membuat master data minimal...');
  const school = await prisma.school.create({
    data: { name: 'SMK Negeri 1 Nusantara', address: 'Jl. Pendidikan Raya No. 1' },
  });

  // ⚠️ EDIT KOORDINAT DI SINI sesuai lokasi PKL utama kamu
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

  console.log('👤 Membuat akun per role...');
  const teacher = await prisma.user.create({
    data: { name: 'Guru Pembimbing', email: 'guru@gopkl.id', password: hash, role: 'teacher', schoolId: school.id },
  });

  const mentor = await prisma.user.create({
    data: { name: 'Mentor Industri', email: 'mentor@gopkl.id', password: hash, role: 'mentor' },
  });
  await prisma.company.update({ where: { id: company.id }, data: { mentorId: mentor.id } });

  await prisma.user.create({
    data: { name: 'Tim Hubin', email: 'hubin@gopkl.id', password: hash, role: 'hubin', schoolId: school.id },
  });

  await prisma.user.create({
    data: { name: 'Administrator', email: 'admin@gopkl.id', password: hash, role: 'admin', schoolId: school.id },
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
    },
  });

  console.log('\n✅ SELESAI! Akun login (password: gopkl123):');
  console.log('   siswa@gopkl.id  → student (intern)');
  console.log('   guru@gopkl.id   → teacher');
  console.log('   mentor@gopkl.id → mentor');
  console.log('   hubin@gopkl.id  → hubin');
  console.log('   admin@gopkl.id  → admin');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());