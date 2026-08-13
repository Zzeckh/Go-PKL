import pkg from '@prisma/client';
import bcrypt from 'bcryptjs';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding static data...');

  await prisma.company.deleteMany();
  await prisma.perizinan.deleteMany();
  await prisma.mapLocation.deleteMany();

  await prisma.company.createMany({
    data: [
      { name: 'PT Tokopedia', address: 'Tokopedia Tower, Jl. Prof. DR. Satrio', quota: 10, filled: 8, mentor: 'Siti Rahma, S.T.' },
      { name: 'Gojek Indonesia', address: 'Pasaraya Blok M, Jakarta Selatan', quota: 5, filled: 4, mentor: 'Ahmad Yasin, M.Kom.' },
      { name: 'Traveloka', address: 'Traveloka Campus, BSD Tangerang', quota: 5, filled: 3, mentor: 'Budi Hartono, S.Kom.' },
      { name: 'Shopee Indonesia', address: 'Pacific Century Place, SCBD', quota: 8, filled: 6, mentor: 'Rina Kusuma, S.T.' },
    ],
  });

  await prisma.perizinan.createMany({
    data: [
      { name: 'Riko Wijaya', company: 'PT Tokopedia', date: new Date('2026-08-14T08:00:00Z'), type: 'Sakit', reason: 'Demam tinggi', attachment: 'surat-dokter-riko.pdf', status: 'pending' },
      { name: 'Sinta Larasati', company: 'Traveloka', date: new Date('2026-08-15T08:00:00Z'), type: 'Izin', reason: 'Acara keluarga', attachment: 'surat-izin-sinta.pdf', status: 'pending' },
    ],
  });

  await prisma.mapLocation.createMany({
    data: [
      { companyName: 'PT Tokopedia (Tokopedia Tower)', address: 'Jl. Prof. DR. Satrio No.11, Setiabudi, Jakarta Selatan', category: 'E-Commerce & Tech', internsCount: 12, mentorName: 'Siti Rahma, S.T.', coordX: 38, coordY: 45, distance: '0.4 km', status: 'geofenced' },
      { companyName: 'Gojek Indonesia', address: 'Pasaraya Blok M, Melawai, Jakarta Selatan', category: 'Transportasi & Teknologi', internsCount: 4, mentorName: 'Ahmad Yasin, M.Kom.', coordX: 24, coordY: 62, distance: '1.1 km', status: 'geofenced' },
      { companyName: 'Traveloka', address: 'Traveloka Campus, ICE BSD, Tangerang Selatan', category: 'Travel & Tech', internsCount: 3, mentorName: 'Budi Hartono, S.Kom.', coordX: 72, coordY: 30, distance: '2.3 km', status: 'geofenced' },
      { companyName: 'Shopee Indonesia', address: 'Pacific Century Place, SCBD, Jakarta Selatan', category: 'E-Commerce & Tech', internsCount: 6, mentorName: 'Rina Kusuma, S.T.', coordX: 55, coordY: 72, distance: '0.9 km', status: 'geofenced' },
    ],
  });

  console.log('Static seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
