import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const PASSWORD = 'gopkl123';
const ACADEMIC_YEAR = '2025/2026';

async function main() {
  console.log('');
  console.log('==================================================');
  console.log('              GO PKL DATABASE SEED');
  console.log('==================================================');
  console.log('');

  // =========================================================
  // 1. MEMBERSIHKAN DATA LAMA
  // =========================================================

  console.log('🧹 Membersihkan data lama...');

  // Hapus data yang mempunyai relasi ke User
  await prisma.evaluation.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.logbook.deleteMany();
  await prisma.absensi.deleteMany();

  // Lepaskan mentor dari perusahaan
  await prisma.company.updateMany({
    data: {
      mentorId: null,
    },
  });

  // Lepaskan siswa dari perusahaan
  await prisma.user.updateMany({
    data: {
      companyId: null,
    },
  });

  // Lepaskan siswa dari guru pembimbing
  await prisma.user.updateMany({
    data: {
      teacherId: null,
    },
  });

  // Lepaskan siswa dari kelas
  await prisma.user.updateMany({
    data: {
      classId: null,
    },
  });

  // Hapus user
  await prisma.user.deleteMany();

  // Hapus perusahaan
  await prisma.company.deleteMany();

  // Hapus kelas
  await prisma.class.deleteMany();

  console.log('✅ Data lama berhasil dibersihkan.');
  console.log('');

  // =========================================================
  // 2. PASSWORD HASH
  // =========================================================

  const hash = await bcrypt.hash(PASSWORD, 10);

  // =========================================================
  // 3. KELAS
  // =========================================================

  console.log('📚 Membuat kelas...');

  const classRPL = await prisma.class.create({
    data: {
      name: 'XII RPL 2',
      major: 'Rekayasa Perangkat Lunak',
    },
  });

  console.log(`   ✓ ${classRPL.name}`);
  console.log('');

  // =========================================================
  // 4. SUPER ADMIN
  // =========================================================

  console.log('👑 Membuat Super Admin...');

  const superAdmin = await prisma.user.create({
    data: {
      name: 'Super Admin GO PKL',
      email: 'superadmin@gopkl.id',
      password: hash,
      role: 'super_admin',
      isActive: true,
      academicYear: ACADEMIC_YEAR,
    },
  });

  console.log(`   ✓ ${superAdmin.email}`);
  console.log('');

  // =========================================================
  // 5. HUBIN
  // =========================================================

  console.log('🏫 Membuat Hubin...');

  const hubin = await prisma.user.create({
    data: {
      name: 'Tim Hubin SMKN 11 Bandung',
      email: 'hubin@gopkl.id',
      password: hash,
      role: 'hubin',
      isActive: true,
      academicYear: ACADEMIC_YEAR,
    },
  });

  console.log(`   ✓ ${hubin.email}`);
  console.log('');

  // =========================================================
  // 6. GURU PEMBIMBING
  // =========================================================

  console.log('👨‍🏫 Membuat guru pembimbing...');

  const teacherNames = [
    'Engkus Kusnadi',
    'Hima',
    'Ani Nuraeni',
    'Yudi Subekti',
    'Mona Marantika',
    'Rini Melati',
  ];

  const teachers = [];

  for (const teacherName of teacherNames) {
    const username = teacherName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '.');

    const teacher = await prisma.user.create({
      data: {
        name: teacherName,
        email: `${username}@gopkl.id`,
        password: hash,
        role: 'teacher',
        isActive: true,
        academicYear: ACADEMIC_YEAR,
      },
    });

    teachers.push(teacher);

    console.log(
      `   ✓ ${teacher.name} → ${teacher.email}`
    );
  }

  console.log('');

  // =========================================================
  // 7. MENTOR INDUSTRI
  // =========================================================

  console.log('🧑‍💼 Membuat mentor industri...');

  const mentorNames = [
    'Budi Santoso',
    'Rizky Maulana',
    'Fajar Nugraha',
    'Dewi Lestari',
    'Nadia Putri',
    'Arif Maulana',
  ];

  const mentors = [];

  for (const mentorName of mentorNames) {
    const username = mentorName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '.');

    const mentor = await prisma.user.create({
      data: {
        name: mentorName,
        email: `${username}@gopkl.id`,
        password: hash,
        role: 'mentor',
        isActive: true,
        academicYear: ACADEMIC_YEAR,
      },
    });

    mentors.push(mentor);

    console.log(
      `   ✓ ${mentor.name} → ${mentor.email}`
    );
  }

  console.log('');

  // =========================================================
  // 8. DATA PERUSAHAAN PKL
  // =========================================================
  //
  // CATATAN:
  // Data perusahaan dan koordinat di bawah digunakan sebagai
  // DATA SIMULASI / DEMO untuk project GO PKL.
  //
  // Lokasi dibuat berada di sekitar area Jl. Budi / Cimindi.
  //
  // Jika nanti digunakan untuk absensi GPS sungguhan,
  // koordinat sebaiknya diganti dengan titik lokasi resmi
  // perusahaan masing-masing.
  //
  // =========================================================

  console.log('🏢 Membuat perusahaan PKL...');

  const companyData = [
    {
      name: 'PT Teknologi Budi Nusantara',
      address: 'Jl. Budi, Cimindi, Kota Cimahi',
      phone: '022-7001001',
      category: 'Teknologi Informasi',
      quota: 6,

      // KOORDINAT DEMO
      latitude: -6.894500,
      longitude: 107.558500,

      radiusMeters: 500,
      mentorIndex: 0,
    },

    {
      name: 'CV Digital Kreatif Cimindi',
      address: 'Jl. Budi Raya, Cimindi, Kota Cimahi',
      phone: '022-7001002',
      category: 'Software House',
      quota: 6,

      // KOORDINAT DEMO
      latitude: -6.894800,
      longitude: 107.558800,

      radiusMeters: 500,
      mentorIndex: 1,
    },

    {
      name: 'PT Inovasi Digital Bandung',
      address: 'Jl. Budi, Cimindi, Kota Cimahi',
      phone: '022-7001003',
      category: 'Teknologi Informasi',
      quota: 6,

      // KOORDINAT DEMO
      latitude: -6.895100,
      longitude: 107.559100,

      radiusMeters: 500,
      mentorIndex: 2,
    },

    {
      name: 'Studio Kreatif Nusantara',
      address: 'Jl. Budi, Komplek Cimindi Raya, Cimahi',
      phone: '022-7001004',
      category: 'Digital Creative',
      quota: 6,

      // KOORDINAT DEMO
      latitude: -6.895400,
      longitude: 107.559400,

      radiusMeters: 500,
      mentorIndex: 3,
    },

    {
      name: 'PT Solusi Teknologi Indonesia',
      address: 'Jl. Budi, Cimindi, Kota Cimahi',
      phone: '022-7001005',
      category: 'IT Consultant',
      quota: 6,

      // KOORDINAT DEMO
      latitude: -6.895700,
      longitude: 107.559700,

      radiusMeters: 500,
      mentorIndex: 4,
    },

    {
      name: 'CV Kreatif Digital Mandiri',
      address: 'Jl. Budi, Cimindi Raya, Kota Cimahi',
      phone: '022-7001006',
      category: 'Web Development',
      quota: 6,

      // KOORDINAT DEMO
      latitude: -6.896000,
      longitude: 107.560000,

      radiusMeters: 500,
      mentorIndex: 5,
    },
  ];

  const companies = [];

  for (const companyDataItem of companyData) {
    const mentor = mentors[companyDataItem.mentorIndex];

    const company = await prisma.company.create({
      data: {
        name: companyDataItem.name,
        address: companyDataItem.address,
        phone: companyDataItem.phone,
        category: companyDataItem.category,
        quota: companyDataItem.quota,
        latitude: companyDataItem.latitude,
        longitude: companyDataItem.longitude,
        radiusMeters: companyDataItem.radiusMeters,
        isActive: true,

        mentor: {
          connect: {
            id: mentor.id,
          },
        },
      },
    });

    companies.push(company);

    console.log(
      `   ✓ ${company.name}`
    );

    console.log(
      `     Mentor : ${mentor.name}`
    );

    console.log(
      `     Lokasi : ${company.address}`
    );

    console.log('');
  }

  // =========================================================
  // 9. DATA 35 SISWA
  // =========================================================

  const students = [
    {
      nis: '2406510562',
      name: 'AHMAD MALADZI',
    },
    {
      nis: '2406510563',
      name: 'AHMAD MATINUS SOLIHIN',
    },
    {
      nis: '2406510565',
      name: 'ACHMAD GEIFARRA ASYFAURRAHMANY',
    },
    {
      nis: '2406510568',
      name: 'ARIQ RAFI KOMARA',
    },
    {
      nis: '2406510569',
      name: 'ARYA JUHARY',
    },
    {
      nis: '2406510572',
      name: 'DARIN KINDI',
    },
    {
      nis: '2406510575',
      name: 'DINI IZZAHARI RAMADHANIAH',
    },
    {
      nis: '2406510576',
      name: 'FABIAN NAUFAL RAFFASHA',
    },
    {
      nis: '2406510578',
      name: 'FADHIL RUSHDI',
    },
    {
      nis: '2406510579',
      name: 'FADLI HARIANSYAH',
    },
    {
      nis: '2406510580',
      name: 'FAUZAN AHMAD MUTAQIN',
    },
    {
      nis: '2406510585',
      name: 'GAZA GYBRIAN AL GHYFARI',
    },
    {
      nis: '2406510586',
      name: 'GUSNALDI RAYHAN PUTRA HIDAYAT',
    },
    {
      nis: '2406510587',
      name: 'HELMI FADILLAH',
    },
    {
      nis: '2406510591',
      name: 'KEVINDA REGAN ZULFIKAR',
    },
    {
      nis: '2406510594',
      name: 'KHALIFAH NAZRAN WIGUNA MUSTIKA',
    },
    {
      nis: '2406510596',
      name: 'MALYA MARITZA',
    },
    {
      nis: '2406510598',
      name: 'MUFLIH ABDUL GHONI',
    },
    {
      nis: '2406510600',
      name: 'MUHAMAD FERHAN PRATAMA SODIKIN',
    },
    {
      nis: '2406510602',
      name: 'MUHAMAD RIZKIANSYAH',
    },
    {
      nis: '2406510604',
      name: 'MUHAMMAD FADHLAN PRATAMA',
    },
    {
      nis: '2406510605',
      name: 'MUHAMMAD FAIZ FADHILLAH',
    },
    {
      nis: '2406510612',
      name: 'NIKIIA SYIFA IVANKA',
    },
    {
      nis: '2406510613',
      name: 'NISRINA SITI LUTHFIYAH',
    },
    {
      nis: '2406510614',
      name: 'NOWRIZAL ALDI INSYAH',
    },
    {
      nis: '2406510617',
      name: 'RAIHAN ZACKY ANDIANSYAH',
    },
    {
      nis: '2406510618',
      name: 'RAISHYA DWI SAVITRI',
    },
    {
      nis: '2406510619',
      name: 'RASYID SYAIRIL IRHAM',
    },
    {
      nis: '2406510621',
      name: 'REVAN IRAWANSYAH NUGRAHA',
    },
    {
      nis: '2406510622',
      name: 'RIFKY NUROHMAN HAKIKY',
    },
    {
      nis: '2406510624',
      name: 'SALMA INTAN NUR AINI',
    },
    {
      nis: '2406510625',
      name: 'SARAH NUR AGISNA',
    },
    {
      nis: '2406510626',
      name: 'SATRIA BAMBANG SAMUDRA',
    },
    {
      nis: '2406510627',
      name: 'SUN DEAN NUR AKBAR',
    },
    {
      nis: '2406510629',
      name: 'SYIFA FAUZIA AZAHRA',
    },
  ];

  // =========================================================
  // 10. MEMBUAT 35 SISWA
  // =========================================================

  console.log('👨‍🎓 Membuat 35 siswa...');
  console.log('');

  const createdStudents = [];

  for (let i = 0; i < students.length; i++) {
    const student = students[i];

    // -------------------------------------------------------
    // FORMAT USERNAME
    // -------------------------------------------------------
    //
    // Contoh:
    //
    // AHMAD MALADZI
    //
    // menjadi:
    //
    // ahmad.maladzi
    //
    // Kemudian:
    //
    // 2406510562@ahmad.maladzi
    //
    // -------------------------------------------------------

    const nameUsername = student.name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '.');

    const email = `${student.nis}@${nameUsername}`;

    // -------------------------------------------------------
    // GURU PEMBIMBING
    // -------------------------------------------------------

    const teacher = teachers[i % teachers.length];

    // -------------------------------------------------------
    // PERUSAHAAN PKL
    // -------------------------------------------------------

    const company = companies[i % companies.length];

    // -------------------------------------------------------
    // CREATE USER
    // -------------------------------------------------------

    const createdStudent = await prisma.user.create({
      data: {
        name: student.name,
        email: email,
        password: hash,
        role: 'student',
        isActive: true,
        academicYear: ACADEMIC_YEAR,

        class: {
          connect: {
            id: classRPL.id,
          },
        },

        teacher: {
          connect: {
            id: teacher.id,
          },
        },

        company: {
          connect: {
            id: company.id,
          },
        },
      },

      include: {
        class: true,
        teacher: true,
        company: {
          include: {
            mentor: true,
          },
        },
      },
    });

    createdStudents.push(createdStudent);

    console.log(
      `${String(i + 1).padStart(2, '0')}. ${createdStudent.name}`
    );

    console.log(
      `    NIS       : ${student.nis}`
    );

    console.log(
      `    Username  : ${createdStudent.email}`
    );

    console.log(
      `    Password  : ${PASSWORD}`
    );

    console.log(
      `    Guru      : ${teacher.name}`
    );

    console.log(
      `    Perusahaan: ${company.name}`
    );

    console.log(
      `    Mentor    : ${company.mentorId}`
    );

    console.log('');
  }

  // =========================================================
  // 11. RINGKASAN PENEMPATAN
  // =========================================================

  console.log('');
  console.log('==================================================');
  console.log('             RINGKASAN PENEMPATAN');
  console.log('==================================================');
  console.log('');

  for (let i = 0; i < companies.length; i++) {
    const company = companies[i];
    const mentor = mentors[i];

    const studentsInCompany = createdStudents.filter(
      (student) => student.companyId === company.id
    );

    console.log(`🏢 ${company.name}`);
    console.log(`   Mentor : ${mentor.name}`);
    console.log(`   Siswa  : ${studentsInCompany.length}`);

    for (const student of studentsInCompany) {
      console.log(`      - ${student.name}`);
    }

    console.log('');
  }

  // =========================================================
  // 12. RINGKASAN GURU
  // =========================================================

  console.log('==================================================');
  console.log('             RINGKASAN GURU PEMBIMBING');
  console.log('==================================================');
  console.log('');

  for (const teacher of teachers) {
    const studentsOfTeacher = createdStudents.filter(
      (student) => student.teacherId === teacher.id
    );

    console.log(`👨‍🏫 ${teacher.name}`);
    console.log(`   Jumlah siswa: ${studentsOfTeacher.length}`);

    for (const student of studentsOfTeacher) {
      console.log(`      - ${student.name}`);
    }

    console.log('');
  }

  // =========================================================
  // 13. LOGIN INFORMATION
  // =========================================================

  console.log('==================================================');
  console.log('                 AKUN LOGIN');
  console.log('==================================================');
  console.log('');

  console.log('👑 SUPER ADMIN');
  console.log('Username : superadmin@gopkl.id');
  console.log(`Password : ${PASSWORD}`);
  console.log('');

  console.log('🏫 HUBIN');
  console.log('Username : hubin@gopkl.id');
  console.log(`Password : ${PASSWORD}`);
  console.log('');

  console.log('👨‍🏫 GURU PEMBIMBING');

  for (const teacher of teachers) {
    console.log(
      `${teacher.name} → ${teacher.email}`
    );
  }

  console.log('');

  console.log('🧑‍💼 MENTOR INDUSTRI');

  for (const mentor of mentors) {
    console.log(
      `${mentor.name} → ${mentor.email}`
    );
  }

  console.log('');

  // =========================================================
  // 14. SELESAI
  // =========================================================

  console.log('==================================================');
  console.log('                 SEED BERHASIL');
  console.log('==================================================');
  console.log('');

  console.log(`✓ Super Admin : 1`);
  console.log(`✓ Hubin       : 1`);
  console.log(`✓ Guru        : ${teachers.length}`);
  console.log(`✓ Mentor      : ${mentors.length}`);
  console.log(`✓ Perusahaan  : ${companies.length}`);
  console.log(`✓ Siswa       : ${createdStudents.length}`);
  console.log(`✓ Kelas       : 1`);
  console.log('');

  console.log('🔐 Password semua akun:');
  console.log(PASSWORD);
  console.log('');

  console.log('🚀 GO PKL siap digunakan!');
  console.log('');
}

// =========================================================
// ERROR HANDLING
// =========================================================

main()
  .catch((error) => {
    console.error('');
    console.error('❌ SEED GAGAL!');
    console.error('');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });