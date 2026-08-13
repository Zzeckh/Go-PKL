import bcrypt from 'bcryptjs';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function main() {
  console.log('Running Prisma seed...');

  await prisma.logbook.deleteMany();
  await prisma.absensi.deleteMany();
  await prisma.user.deleteMany();

  const password = await bcrypt.hash('Password123!', 10);

  const [student, teacher, mentor, hubin] = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Budi Santoso',
        email: 'budi@student.local',
        password,
        role: 'student',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Siti Rahma',
        email: 'siti@teacher.local',
        password,
        role: 'teacher',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Ahmad Yasin',
        email: 'ahmad@mentor.local',
        password,
        role: 'mentor',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Dewi Lestari',
        email: 'dewi@hubin.local',
        password,
        role: 'hubin',
      },
    }),
  ]);

  await prisma.absensi.createMany({
    data: [
      {
        userId: student.id,
        status: 'hadir',
        location: 'PT Tokopedia Tower',
        date: new Date('2026-08-10T07:40:00Z'),
        imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f',
      },
      {
        userId: student.id,
        status: 'hadir',
        location: 'PT Tokopedia Tower',
        date: new Date('2026-08-11T07:45:00Z'),
        imageUrl: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0',
      },
      {
        userId: student.id,
        status: 'izin',
        location: 'SMK Negeri 1 Jakarta',
        date: new Date('2026-08-12T07:50:00Z'),
        imageUrl: null,
      },
    ],
  });

  await prisma.logbook.createMany({
    data: [
      {
        userId: student.id,
        activityTitle: 'Membuat tampilan dashboard PKL',
        description: 'Mengimplementasikan halaman dashboard dan navigasi utama.',
        status: 'approved',
        date: new Date('2026-08-10T10:00:00Z'),
      },
      {
        userId: student.id,
        activityTitle: 'Melakukan integrasi API absensi',
        description: 'Menghubungkan modul absensi dengan endpoint backend dan menyimpan data.',
        status: 'pending',
        date: new Date('2026-08-11T11:00:00Z'),
      },
      {
        userId: student.id,
        activityTitle: 'Menyusun laporan kegiatan harian',
        description: 'Menulis logbook harian kegiatan praktik kerja lapangan.',
        status: 'approved',
        date: new Date('2026-08-12T12:00:00Z'),
      },
    ],
  });

  console.log('Seed complete.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
