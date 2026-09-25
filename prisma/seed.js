import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// =========================================================
// KONFIGURASI
// =========================================================

const PASSWORD = 'gopkl123';

// Master Tahun Ajaran. Yang isActive = true dipakai sebagai default siswa/akun baru.
const ACADEMIC_YEARS = [
  { name: '2025/2026', isActive: false },
  { name: '2026/2027', isActive: true },
  { name: '2027/2028', isActive: false },
];

const ACADEMIC_YEAR = ACADEMIC_YEARS.find((y) => y.isActive).name;

// true  → semua siswa otomatis dibagi ke guru & perusahaan (round-robin)
//         supaya alur PKL langsung bisa dicoba.
// false → siswa dibuat TANPA guru & perusahaan (diatur manual lewat Hubin).
const AUTO_PLACEMENT = true;

// =========================================================
// DATA KELAS XII 2026/2027 (sumber: ABSEN_KELAS_XII_26-27)
// Format siswa: [NIS, NAMA]
// =========================================================

const CLASSES = [
  {
    name: 'XII AK 1',
    major: 'Akuntansi dan Keuangan Lembaga',
    students: [
      ['2411110847', 'AGNIA KAMILAH'],
      ['2411110849', 'AIRA MAHARANI'],
      ['2411110855', 'ALMIRA NUR LISTIYANA'],
      ['2411110856', 'ALVINO RIDHO PERMANA'],
      ['2411110859', 'ANDRA RAMADHAN'],
      ['2411110862', 'ANGZALNA KHOIRUNNISA'],
      ['2411110864', 'ANNISA SINDI AGISTIANI'],
      ['2411110869', 'AUDREY VINANDYA KHOIRUNNISA'],
      ['2411110870', 'AULIA DECHA MONICHA'],
      ['2411110871', 'AUREL FEBRIANTI'],
      ['2411110872', 'AZZAHRA EVANNYA AJENG SUCIA'],
      ['2411110873', 'BINTANG LYSHANDRA RUSITO'],
      ['2411110875', 'CARISSA MELANIE PUTRI'],
      ['2411110877', 'CINDY ANGGRAENI'],
      ['2411110881', 'DESVITA AMMALYA PRAMBANA'],
      ['2411110884', 'DEWI MARLITA'],
      ['2411110885', 'DIMAS IHSANAT FATAN'],
      ['2411110890', 'FARDAN KOSWARA'],
      ['2411110894', 'FITRI RAMADHANI'],
      ['2411110902', 'JIHAN AWLIYA'],
      ['2411110909', 'KEYSHA AZALIA ZAHRA'],
      ['2411110913', 'LASDINI AMINARTI'],
      ['2411110921', 'MEISHA FADLILAH'],
      ['2411110926', 'MUHAMAD RIZAL MAULANA'],
      ['2411110927', 'MUHAMMAD ABDUL AZIZ'],
      ['2411110932', 'NAILA HASNA PUTRI'],
      ['2411110940', 'NESA APRILIANTI'],
      ['2411110944', 'PRIMA SETIAWAN'],
      ['2411110947', 'RAISSA KIRANIA HARUM'],
      ['2411110948', 'RANIAH IBNATY MULYYASARAH'],
      ['2411110953', 'RIZALDI SURYA SODIKIN'],
      ['2411110954', 'SALSABILA HANIPATUN NAJWA'],
      ['2411110962', 'SASKIA PUTRI JANNATI'],
      ['2411110969', 'SITI ROSANAH'],
      ['2411110978', 'TIARA DEWI RAHMADHANI'],
      ['2411110981', 'VIALYA FARADHITA UTAMI'],
    ],
  },
  {
    name: 'XII AK 2',
    major: 'Akuntansi dan Keuangan Lembaga',
    students: [
      ['2411110846', 'AGNI AULIA RAMDANI'],
      ['2411110851', 'AISYA REGINA PUTRI'],
      ['2411110857', 'ALYA HADIANI CAHYANI'],
      ['2411110866', 'ASHILLA PUTRI AFWU LATHIEF'],
      ['2411110874', 'BUNGA NIRMALA'],
      ['2411110876', 'CIKA YULIANINGSIH'],
      ['2411110879', 'DEBY KEYLA'],
      ['2411110880', 'DESTIANA NUR HALIZA'],
      ['2411110886', 'ELLENA SALSABILA'],
      ['2411110895', 'GHITSA SUKMA ALYA PUTRI'],
      ['2411110897', 'HAIRA NURMAYA'],
      ['2411110900', 'ISHYARA SYAIMA KHAMILAH'],
      ['2411110906', 'KEISHA NAFISAH'],
      ['2411110914', 'LAURA KASIH'],
      ['2411110915', 'LESTARI RAMADHANI'],
      ['2411110918', 'LUSI YANA'],
      ['2511111112', 'MARSHA THALITA ADINA'],
      ['2411110919', 'MAYA SARI'],
      ['2411110930', 'NAILA AMALIA PUTRI PRASASTI'],
      ['2411110933', 'NAJWA ATIRA RAMADHANI'],
      ['2411110938', 'NENG MELDA AULIA'],
      ['2411110950', 'RESTU ETTOPZ TAPHIA'],
      ['2411110952', 'RISMA YULIANTI'],
      ['2411110956', 'SALSABILA NURTISYA'],
      ['2411110960', 'SARAH HANIFAH'],
      ['2411110963', 'SASKYA BUNGA PARAMITHA'],
      ['2411110964', 'SEPTRIASA ZULAICHA HANOY'],
      ['2411110967', 'SILVI CAHYA AGUSTINA'],
      ['2411110970', 'SITI RUBAIAH ALDAWIYAH'],
      ['2411110971', 'SOPHIE WULAN APRILIANTY'],
      ['2411110976', 'SYAKILLA NAFISA'],
      ['2411110979', 'TIARA PERMATA SARI'],
      ['2411110980', 'TSANIA AMILA AFFIFA'],
      ['2411110982', 'WINDHI WAFA WASHFA'],
      ['2411110984', 'ZAHIRA SALIMATUL ALYA'],
      ['2411110988', 'ZERLINA KHANSA ALIFAH'],
    ],
  },
  {
    name: 'XII AK 3',
    major: 'Akuntansi dan Keuangan Lembaga',
    students: [
      ['2411110845', 'AFDAL'],
      ['2411110848', 'AINI NAZMA THUSYIFA'],
      ['2411110854', 'AL ZAHRA GIBRANI'],
      ['2411110858', 'AMELIA AYUNINGTYAS'],
      ['2411110861', 'ANGGITA NURUL FADHILAH'],
      ['2411110867', 'ASWA RAFI ZAIDAN'],
      ['2411110868', 'ASYLA NUR ALIFAH'],
      ['2411110882', 'DEVANI FITRIANI'],
      ['2411110887', 'ELMA SIFA MUNTAHA'],
      ['2411110888', 'ELSA AMALIA AYU NITA'],
      ['2411110889', 'FAKHRI AL FARISY'],
      ['2411110893', 'FITRI PURNAMA'],
      ['2411110898', 'HANIFATUS SA\'DIYAH'],
      ['2411110899', 'IQBAL RIDZWAN FADILLAH'],
      ['2411110907', 'KEVIN MAULIDAN'],
      ['2411110910', 'KEYSHA NUKE FADILLA'],
      ['2411110912', 'LAELA SARI'],
      ['2411110916', 'LINDAN HIKMATIAR'],
      ['2411110922', 'MELANI NURAENI'],
      ['2411110923', 'MONICHA LESTARI'],
      ['2411110924', 'MUHAMAD ASEP DARMAWAN'],
      ['2411110925', 'MUHAMAD LUTHFI KUSUMAH WARDANI'],
      ['2411110928', 'MUTIA PUTRI MARHAMAH'],
      ['2411110935', 'NAZLA NAZHIFAH'],
      ['2411110937', 'NAZWA ASTMAR RYANITA'],
      ['2411110941', 'NEYSA PUTRI AZKIA'],
      ['2411110943', 'NURALFIANDI WAHONO'],
      ['2411110945', 'RAIHANAH YASMIN'],
      ['2411110955', 'SALSABILA MUTHI\'AH AZ ZAHRA'],
      ['2411110957', 'SANNI NUR AULIA'],
      ['2411110959', 'SARAH'],
      ['2411110966', 'SHAIRA MEISYLA LESTARI'],
      ['2411110974', 'SUCI RAHMADANI'],
      ['2411110977', 'TALITA FATIN NAFISA'],
      ['2411110987', 'ZAHRA KHALIFAH'],
    ],
  },
  {
    name: 'XII AK 4',
    major: 'Akuntansi dan Keuangan Lembaga',
    students: [
      ['2411110850', 'AIRA PERMATA SARI'],
      ['2411110852', 'AJENG LARASATI'],
      ['2411110853', 'AL KHAIRATUNISA'],
      ['2411110863', 'ANNISA NURUL AZKIA'],
      ['2411110865', 'ARIN HANDAYANI'],
      ['2411110878', 'CLARISA CITRA MELVIANA'],
      ['2411110883', 'DEWI KHANSA ATHIYAH'],
      ['2411110891', 'FAY DIESA NUR AULIA'],
      ['2411110892', 'FEBRIANI PUTRI'],
      ['2411110901', 'ITATA YES ELLA'],
      ['2411110903', 'KANAYA PUTRI YANESA'],
      ['2411110904', 'KANIA NURDIANA PUTRI'],
      ['2411110905', 'KAYLA ZIKRIANI MIFTAH'],
      ['2411110908', 'KEYSHA AFIFA BUNGA ROSTANDI'],
      ['2411110911', 'LAELA NUR HIKMAH'],
      ['2411110917', 'LIRA LIDIA NAZWA'],
      ['2411110920', 'MEGA CAROLINA NURWANTINI'],
      ['2411110929', 'NABILA AZZAHRA'],
      ['2411110931', 'NAILA FAIRUZ KHALISA'],
      ['2411110934', 'NAZLA AMALIA'],
      ['2411110936', 'NAZMA SAFA SAKILA PUTRI'],
      ['2411110939', 'NENG RISKA MEYLANIE'],
      ['2411110942', 'NUR ALIA ROHALI'],
      ['2411110946', 'RAISHA NURUL AULIA'],
      ['2411110949', 'RENI ANGGRAENI'],
      ['2411110951', 'RIKA ROSITA'],
      ['2411110958', 'SARA ARBIA'],
      ['2411110961', 'SASKIA HASNA FAUZIAH'],
      ['2411110965', 'SESILIA NIKITA RAHMAWATI'],
      ['2411110968', 'SITI AROFAH NUZULUL RAMADHAN'],
      ['2411110972', 'SRI APRILIA WAHYUNINGSIH'],
      ['2411110973', 'SUCI HAWA RAMADHANI'],
      ['2411110975', 'SYABILA NURUL AINI'],
      ['2411110985', 'ZAHRA ALMIRA WIJAYA'],
      ['2411110986', 'ZAHRA AULIA'],
    ],
  },
  {
    name: 'XII BR 1',
    major: 'Bisnis Ritel',
    students: [
      ['2410810612', 'ADE RIZKI RIANSAH AKBAR'],
      ['2410810613', 'AGNA ALIFIA'],
      ['2410810614', 'ALIFIA AZAHRA ALFIANI'],
      ['2410810615', 'ALVINO ADITYA PRATAMA'],
      ['2410810616', 'ANISA LUTFIAH'],
      ['2410810618', 'ARRINDA PUTRI PARAMITA'],
      ['2410810619', 'AULIA ADINDA OKTAPIYANI'],
      ['2410810620', 'BIMA PUTRA'],
      ['2410810621', 'CHARISYA PUTRI KHODIJAH'],
      ['2410810623', 'DANNI DESTIAN'],
      ['2410810624', 'DANNISA AUREL MAYSARI'],
      ['2410810625', 'DAVID GREGORIO'],
      ['2410810630', 'DINDA KAILASARI'],
      ['2410810634', 'FIPI PEBRINATA'],
      ['2410810635', 'GILANG'],
      ['2410810636', 'HANI SYIFA FITRIA'],
      ['2410810638', 'KAIVA AYU SAPUTRI'],
      ['2410810643', 'KEYZHA SHERA SUCI RAHMAN'],
      ['2410810646', 'MOCHAMAD SHANDY PUTRA PRATAMA'],
      ['2410810647', 'MUCHAMAD RIZDWAN PARIJI'],
      ['2410810649', 'MUHAMAD FIKRI JOE SATRIANI'],
      ['2410810656', 'MUHAMMAD ZAKI KURNIAWAN'],
      ['2410810658', 'NABILA NUR ALIFAH'],
      ['2410810659', 'NAELA INDAH LESTARI'],
      ['2410810662', 'NUR FEBRI YANTI'],
      ['2410810664', 'PUTRI DIAN YULIANA'],
      ['2410810669', 'RAYSHA KHAIRUNNISA NURUL ARIFAH'],
      ['2410810671', 'RIDHO ZAKARIA'],
      ['2410810672', 'RIKA NABILA KHAIRUNISA'],
      ['2410810673', 'RISMA ROJABAH'],
      ['2410810678', 'SOFIE NURUL FADHILAH'],
      ['2410810679', 'THORIQ RIDHO BISALLAM'],
      ['2410810680', 'VENI SINTA LESTARI'],
    ],
  },
  {
    name: 'XII BR 2',
    major: 'Bisnis Ritel',
    students: [
      ['2410810617', 'ARGA LAMRO TUA FRANSISKO NADEAK'],
      ['2410810622', 'DAFFA RIZKIA AKBAR'],
      ['2410810626', 'DEA LISANA SIDQIN'],
      ['2410810627', 'DESI ZASKIA DZULFAH'],
      ['2410810631', 'DINI SRIWAHYUNI'],
      ['2410810632', 'FAJAR SHIHAB AS SHIDIK'],
      ['2410810633', 'FERA PEBIOLA'],
      ['2410810637', 'HASBI MAULANA ATHAR'],
      ['2410810640', 'KAYLA SALSA PUTRI'],
      ['2410810641', 'KENZHA KHALILAH'],
      ['2410810642', 'KEYLA SYIFA SALSABILA'],
      ['2410810644', 'MELLY TRI UTAMY'],
      ['2410810645', 'MESYA PUTRI HAPSARI'],
      ['2410810648', 'MUHAMAD AKBAR MUHAEMIN'],
      ['2410810651', 'MUHAMAD RIZKI'],
      ['2410810652', 'MUHAMMAD AKMAL'],
      ['2410810653', 'MUHAMMAD FAHMI AL-GHIFARI'],
      ['2410810654', 'MUHAMMAD FIKRI APRIANSYAH'],
      ['2410810650', 'MUHAMMAD GILANG SAHID'],
      ['2410810655', 'MUHAMMAD REZA SYAPUTRA'],
      ['2410810657', 'NABILA AVRILIANI'],
      ['2410810660', 'NAYSHILA MUSTIKA'],
      ['2410810661', 'NOVI PEMA SAPUTRI'],
      ['2410810663', 'NURUL AFIFAH MUNAWAROH'],
      ['2410810665', 'PUTRI FANISA AL\'ZAHRA'],
      ['2410810666', 'RADITYA RAMA SAHIDA PRATAMA'],
      ['2410810667', 'RAFFA SHAKILA RAMADHANI'],
      ['2410810670', 'REVANIAR AURELIA ZAHRA'],
      ['2410810674', 'RIZKY RAHMADHANI'],
      ['2410810675', 'SALSABILA APRILIANI'],
      ['2410810676', 'SITI FATIMAH AL WAFA'],
      ['2410810677', 'SITI SOVINA'],
    ],
  },
  {
    name: 'XII DKV 1',
    major: 'Desain Komunikasi Visual',
    students: [
      ['2406710493', 'AHMAD FAJAR'],
      ['2406710496', 'ALBI FAHREZA'],
      ['2406710500', 'ALISYA PUSPITASARI'],
      ['2406710502', 'ALYA NUR AZIZAH'],
      ['2406710504', 'ANDREA FRISCA OKTAVIANA'],
      ['2406710507', 'ATHINA FITRIANI KARIMA'],
      ['2406710509', 'AURELIA PUTRI FITRIANITA MAULANA'],
      ['2406710510', 'AZIRA KAYYISAH AGHNIYA SYAHIDAH'],
      ['2406710512', 'DEKAS BRATADIKARA'],
      ['2406710515', 'ELVY APRILIANA PURWANINGRUM'],
      ['2406710516', 'FADILLAH AL-HAKIM'],
      ['2406710518', 'FEBRY SIRODJUDIN KAMIL'],
      ['2406710520', 'GINSYA ACHMAD ALIF PRIANTO'],
      ['2406710523', 'KHANZA NAURAH AGIES'],
      ['2406710525', 'MEISYA NUR AJIZAH'],
      ['2406710526', 'MELINDA ZAHRA'],
      ['2406710527', 'MUHAMAD RIDWAN HILMI ARDIANSYAH'],
      ['2406710528', 'MUHAMAD RIZKI ARRABANI'],
      ['2406710530', 'MUHAMMAD ANJAR PUTRA PRATAMA'],
      ['2406710533', 'MUHAMMAD RABBANI ALGHIFARI'],
      ['2406710534', 'NABILLA AINISWA PUTRI'],
      ['2406710537', 'NENG AJENG WAHDAH SARIPAH'],
      ['2406710538', 'NENG SYAAIRA SITI ATHIFA'],
      ['2406710542', 'REISYA RAIHAN RAMADHAN'],
      ['2406710544', 'RIANA NURUL QOLBI'],
      ['2406710545', 'RIANTI DESTIO PURNAMA'],
      ['2406710548', 'RIZKY JULIANSYAH PRATAMA'],
      ['2406710550', 'SALMA ALIFAH'],
      ['2406710551', 'SALMAN ALFARIZY PUTRA'],
      ['2406710555', 'SHOFIE SHOLEHA'],
      ['2406710556', 'SHOFURA AULIA LESTARI'],
      ['2406710557', 'SINDY'],
      ['2406710559', 'SYAIRA KHOIROTUL BANAT'],
      ['2406710562', 'YURIKO SYIFA AULIA'],
    ],
  },
  {
    name: 'XII DKV 2',
    major: 'Desain Komunikasi Visual',
    students: [
      ['2406710494', 'AISYA NOVIYANTI EFFENDI'],
      ['2406710495', 'AISYAH NUR SHALIHAH'],
      ['2406710497', 'ALDY'],
      ['2406710499', 'ALIPAH'],
      ['2406710501', 'ALVIN YUDISTIRA QODRI AMANULLAH'],
      ['2406710503', 'ALYA NUR SHIDQIYAH'],
      ['2406710505', 'ANGELICA PUTRI APRILA'],
      ['2406710506', 'ARI BAWONO SAPUTRO'],
      ['2406710508', 'AURA OCTAVIANIE'],
      ['2406710511', 'AZZAHRA ALIYA SOVIANA'],
      ['2406710513', 'DESTI FEBRI AURANI'],
      ['2406710514', 'DIMAS AGUNG PRAYUDHA'],
      ['2406710517', 'FATTAN RUSYDI MAULANA'],
      ['2406710521', 'HAFSHAH SITI RAIHANAH'],
      ['2406710522', 'KAFKA BISMA WIJAKSANA'],
      ['2406710524', 'M RIFAL RAMADANI'],
      ['2406710529', 'MUHAMMAD ABDHIENA VIHA'],
      ['2406710531', 'MUHAMMAD ILHAM RIZKI PRATAMA'],
      ['2406710532', 'MUHAMMAD KASYFI ASSHIDQI'],
      ['2406710535', 'NADINE NADILA'],
      ['2406710536', 'NASYA PUTRI RIZAKKI'],
      ['2406710539', 'NENG TIARA PRATAMA'],
      ['2406710540', 'RAIHAN FIRJATULLOH'],
      ['2406710541', 'REGGA ARYA IRAWAN'],
      ['2406710543', 'REKY KHAIRUL INSANI'],
      ['2406710546', 'RIDHA QONITAH MAULIDINA'],
      ['2406710547', 'RISMA REVA RIYANTI'],
      ['2406710549', 'RIZQITA RAIHANY'],
      ['2406710552', 'SALMAN PUTRA PRATAMA'],
      ['2406710553', 'SARAH TRI KURNIAWATI'],
      ['2406710554', 'SHABRINA NUR LATHIFAH'],
      ['2406710558', 'SITI NAZWA FAZRIATUZAHRA'],
      ['2406710560', 'SYIFA ALVIRA PUTRI'],
      ['2406710561', 'YONA AULIA PRAMESTI'],
      ['2406710563', 'ZAHIRA INSANI IMANIA ISLAMI'],
    ],
  },
  {
    name: 'XII MLOG',
    major: 'Manajemen Logistik',
    students: [
      ['2411010845', 'AGFI SAFARAZ ZAULIKA'],
      ['2411010852', 'ANGGIA PUTRI KHAIRUNISSA'],
      ['2411010855', 'ANISA NUR OKTAVIA'],
      ['2411010859', 'ARDIVO VACCA RASYAD'],
      ['2411010866', 'AYU SINTA'],
      ['2411010873', 'CHARISYA KAHFI PRATIWI'],
      ['2411010875', 'CITRA KHAIRUNNISA'],
      ['2411010876', 'DANIS FEBRIAN SAPUTRA'],
      ['2411010883', 'FADLY OCTAFIARLY'],
      ['2411010889', 'FERNANDA DESTIANA KHUSNUL KHATAMI'],
      ['2411010890', 'FINA RAHMAWATI'],
      ['2411010901', 'KAHLA KHOIRUNNISA'],
      ['2411010913', 'MOCHAMAD JAVIER ANDIYANA'],
      ['2411010914', 'MUHAMAD ARYA NUR SIDDIK'],
      ['2411010915', 'MUHAMAD DANDI SAPUTRA'],
      ['2411010917', 'MUHAMMAD RIJAL DZULPIKRI'],
      ['2411010918', 'MUHAMMAD WILDAN ABDUL ROCHMAN'],
      ['2411010919', 'NABILA PUTRI AULIA'],
      ['2411010920', 'NABILA SALSABILA'],
      ['2411010924', 'NADIRA TRISKA SAFITRY'],
      ['2411010935', 'NUR SHIVA FAUZIAH'],
      ['2411010936', 'NURAENI'],
      ['2411010938', 'PINA AGHNIA FITRIYANI'],
      ['2411010950', 'REYVANSYACH ADZIKRA ZAKARIA'],
      ['2411010952', 'RIANTI CINDY NURRAHMA'],
      ['2411010956', 'RIFQI SUHERLI'],
      ['2411010957', 'RIZKY APRIANTI S'],
      ['2411010958', 'ROYHAN MUSYAFA'],
      ['2411010961', 'SALMA RIZKIA FATHYANISA'],
      ['2411010965', 'SALWA AULIA'],
      ['2411010975', 'SINTA DEWI RAHAYU'],
      ['2411010981', 'SYFA NURFADILAH'],
      ['2411010986', 'WAHDANATUL FITRAH'],
    ],
  },
  {
    name: 'XII MP 1',
    major: 'Manajemen Perkantoran',
    students: [
      ['2411010847', 'ALIFA SALSABILA'],
      ['2411010849', 'ALYA SAPRINA'],
      ['2411010850', 'AMELIA DALIAN PUTRI'],
      ['2411010851', 'AMELIA KHANYA DEWI'],
      ['2411010853', 'ANINDYA AQUIRA GHANIAH'],
      ['2411010854', 'ANISA AULIA'],
      ['2411010860', 'ARIFIN HIDAYAT'],
      ['2411010861', 'ASEP SARIP HIDDAYAH TULOH'],
      ['2411010864', 'AURA SYAHRANI PUTRI'],
      ['2411010865', 'AURANI GIANTI RAHAYU'],
      ['2411010867', 'AZKIA FRATIWI'],
      ['2411010868', 'AZKIA KHOLIPAH'],
      ['2411010870', 'BUNGA ADILLA NOVIANTRRY'],
      ['2411010881', 'ERVINA ISMAWATI'],
      ['2411010884', 'FAHRI PRATAMA'],
      ['2411010886', 'FATIMAH ALIVIA A'],
      ['2411010904', 'KEISHA ALVINA ZAHRA'],
      ['2411010905', 'KEYSHA ZALFAA ALIIFAH'],
      ['2411010907', 'KHONSA SOFWAH NAZZAHRI'],
      ['2411010909', 'MARLIANA ASTUTI'],
      ['2411010921', 'NADIA AULIA FITRIANI'],
      ['2411010926', 'NAMIRA PUTRI AWALIA'],
      ['2411010929', 'NAZWA HUMAIRA BILQIS'],
      ['2411010930', 'NENG LINDA RAMADANIA'],
      ['2411010934', 'NUR LAELATUL FITRIAH'],
      ['2411010941', 'RAISA DEVIANI'],
      ['2411010944', 'RANTHI MEYSYA'],
      ['2411010947', 'RAYSA TUZAHRA MAULINA'],
      ['2411010948', 'REISSA QOLBY NURSOFIAN'],
      ['2411010951', 'REZKIA MELANI PUTRI'],
      ['2411010966', 'SALWA AULIA'],
      ['2411010968', 'SASKIA KHOIRUN NUR SYIFA M'],
      ['2411010969', 'SEKAR NURROHIMAH'],
      ['2411010970', 'SHABIYYAH KAHLA ARDIANY'],
      ['2411010980', 'SYERRA LUTHFI AUGUSTINE'],
      ['2411010988', 'YULIANI'],
    ],
  },
  {
    name: 'XII MP 2',
    major: 'Manajemen Perkantoran',
    students: [
      ['2411010862', 'ASTRI RACHMA SULISTIATI'],
      ['2411010863', 'ATAYA SYAPUTRI'],
      ['2411010872', 'BUNGA ANISA LESTARI'],
      ['2411010877', 'DEVIRA NAIDA'],
      ['2411010878', 'DIANA NOVITASARI'],
      ['2411010880', 'DINDA AMELIA'],
      ['2411010882', 'EXZA FARLA AULIA AZZAHRA'],
      ['2411010887', 'FELINDA JESSICA'],
      ['2411010888', 'FERLITA PUTRI KEYLA'],
      ['2411010891', 'GISELLA ALIFA PUTRI'],
      ['2411010893', 'HASNA KHAIRUNNISA'],
      ['2411010899', 'JIHAN MUTIA ZULVA'],
      ['2411010906', 'KHANIA AZQIA NURAZIZAH'],
      ['2411010908', 'LULU IMANIAR'],
      ['2411010910', 'MEISYA ANDINI'],
      ['2411010911', 'MESSI PUTRIA SEPTIANTI'],
      ['2411010916', 'MUHAMMAD RIFKY AR RACHMY'],
      ['2411010925', 'NADYA ZAKIA ULFATULHAQ'],
      ['2411010927', 'NASYWA NUR PADLIANSAHIRA'],
      ['2411010931', 'NENG PITRI KAMALIA'],
      ['2411010932', 'NISRINA NASYWA HANIFAH'],
      ['2411010933', 'NUNUNG NURWATI'],
      ['2411010943', 'RANGGA GUSTIANA'],
      ['2411010945', 'RASYID ALI YAHYA'],
      ['2411010946', 'RATU NUR ANJANI'],
      ['2411010949', 'RESTIA MAULIDIA'],
      ['2411010953', 'RIANTY RAHAYU PRATIWI'],
      ['2411010959', 'SALMA ANGGUNI PUTRI'],
      ['2411010964', 'SALSAH NABIL OKTAPIANI'],
      ['2411010967', 'SALWA KHAIRUNNISA'],
      ['2411010971', 'SHAYNA MAIZA ANCIKA MANTRE'],
      ['2411010973', 'SIFA HAQ FAUZIAH'],
      ['2411010976', 'SITI PATIMAH'],
      ['2411010977', 'SOFITRIYANI'],
      ['2411010985', 'VIRA AMELIA'],
    ],
  },
  {
    name: 'XII MP 3',
    major: 'Manajemen Perkantoran',
    students: [
      ['2411010846', 'AGNIA MUTIARA DEWI'],
      ['2411010848', 'ALMIRA RUSMAYANTI'],
      ['2411010856', 'ANNISA DAVINA AULIA'],
      ['2411010858', 'ANNISSA AULIA SATRIANI'],
      ['2411010869', 'BERLIANA FEBRIANTI SETIAWATI'],
      ['2411010871', 'BUNGA AMALIA AGUSTINA'],
      ['2411010874', 'CHESTA NURUL ANINDYA'],
      ['2411010879', 'DIENA ELFRILLIA'],
      ['2411010885', 'FARAH SILVANA HAFSHAH'],
      ['2411010892', 'HANI VALENTINA JAENI'],
      ['2411010894', 'HASNA PUTRI ALETA'],
      ['2411010895', 'INAYAH DWI MULYANI'],
      ['2411010896', 'INTANSYA ADINDA MEIREYLA'],
      ['2411010897', 'IQVINA MASA\'ALNA ANWAR'],
      ['2411010898', 'JELVIA RATU AZAHRA'],
      ['2411010900', 'JUWITA'],
      ['2411010902', 'KAILA ADELIA ZAHRA'],
      ['2411010903', 'KAREN RENA LESTARI'],
      ['2411010912', 'MEYLIANA PUTRI AMELIA'],
      ['2411010923', 'NADINE ADHA MASVUPAH'],
      ['2411010928', 'NASYWAA PUTRI NUUR ZAHRAH'],
      ['2411010937', 'NURUL LATIFAH'],
      ['2411010939', 'PUSPITA ANGELY PUTRI RIYANTO'],
      ['2411010940', 'RADEN NIKITA SACIFA'],
      ['2411010942', 'RAISYA SABIELA NATYA'],
      ['2411010954', 'RIDZKIA ZAHRA PRATIWI'],
      ['2411010955', 'RIFKY AKMAL ARDYANSYAH'],
      ['2411010960', 'SALMA NURLINDYA'],
      ['2411010963', 'SALSABILA FEBRIYANTI'],
      ['2411010972', 'SHEILA FYER RENDI SUPRIA P'],
      ['2411010974', 'SILVIA FEBRIANI'],
      ['2411010978', 'SYAFHIRA KANYA RADISTI'],
      ['2411010984', 'TIVANI SAMI SHAHARA'],
      ['2411010987', 'WILDAN SATRIA NEGARA'],
    ],
  },
  {
    name: 'XII RPL 1',
    major: 'Rekayasa Perangkat Lunak',
    students: [
      ['2406510564', 'AKBAR MIRAJ NUGRAHA'],
      ['2406510566', 'ARI NURJAMAN'],
      ['2406510570', 'BILY ALBANI MAHENDRA'],
      ['2406510571', 'BINTANG PUTRA SEFIYAN'],
      ['2406510573', 'DENIS NURIZKI'],
      ['2406510574', 'DHAFIN SYAWAL ANUGERAH'],
      ['2406510577', 'FADHIL AL HAFIDZH'],
      ['2406510581', 'FERLY JULIAN'],
      ['2406510582', 'FHAIZA SOPIYANA'],
      ['2406510583', 'FITRA HERDIANSYAH FADLURROHMAN'],
      ['2406510584', 'GALANG AULIA AL BUKHORI'],
      ['2406510588', 'HENGKY TERNANDO'],
      ['2406510589', 'JAVIER DELIAN ARYATAMA'],
      ['2406510592', 'KEYSA CITRA PUSPITASARI'],
      ['2406510595', 'KHUMAIRA MAHESWARI'],
      ['2406510597', 'MEDYNA JUNISTIA MUMTAZA'],
      ['2406510601', 'MUHAMAD RIZKI ANDIKA'],
      ['2406510603', 'MUHAMMAD DWI FEBRIAN AL FATH'],
      ['2406510606', 'MUHAMMAD FARGAN HABIBURROHMAN'],
      ['2406510607', 'MUHAMMAD KHOERUL FATHURROHMAN'],
      ['2406510608', 'MUHAMMAD RIZQI BINTANG RAMADHAN'],
      ['2406510609', 'MUSTIKA KUSUMAPRIANGAN'],
      ['2406510610', 'NAZMI SEPTIANSAH'],
      ['2406510611', 'NAZWA NURHAFIZA'],
      ['2406510615', 'PUTRI AYU LESTARI'],
      ['2406510616', 'RAFFA PRATAMA PUTRA'],
      ['2406510620', 'REIZA RAHMAWARDANA'],
      ['2406510623', 'SAEFUL ROHMAN'],
      ['2406510628', 'SYAWAL NURRAHMAN'],
      ['2406510631', 'TSABIT AQIL MUBAROK'],
      ['2406510632', 'YOGA AKSHAYA PRATAMA'],
      ['2406510633', 'YONATAN HIDAYAT'],
    ],
  },
  {
    name: 'XII RPL 2',
    major: 'Rekayasa Perangkat Lunak',
    students: [
      ['2406510562', 'AHMAD MALADZI'],
      ['2406510563', 'AHMAD MATIINU SOLIHIN'],
      ['2406510565', 'ANDARA GEIFARRA ASYFAURRAHMANY'],
      ['2406510568', 'ARIQ RAFIF KOMARA'],
      ['2406510569', 'ARYA JUHARY'],
      ['2406510572', 'DARIN KINDI'],
      ['2406510575', 'DINI IZHARI RAMADHANIAH'],
      ['2406510576', 'FABIAN NAUFAL RAFFASHA'],
      ['2406510578', 'FADHIL RUSHDI'],
      ['2406510579', 'FADLI HARIANSAH'],
      ['2406510580', 'FAUZAN AHMAD MUTAQIN'],
      ['2406510585', 'GAZA GYBRANI AL GHYFARI'],
      ['2406510586', 'GUSNALDI RAYHAN PUTRA HIDAYAT'],
      ['2406510587', 'HELMI FADILLAH'],
      ['2406510591', 'KEVINDA REGAN ZULFIKAR'],
      ['2406510594', 'KHALIFAH NAZRAN WIGUNA MUSTIKA'],
      ['2406510596', 'MALYA MARITZA'],
      ['2406510598', 'MUFLIH ABDUL GHONI'],
      ['2406510600', 'MUHAMAD FERHAN PRATAMA SODIKIN'],
      ['2406510602', 'MUHAMAD RIZKIANSYAH'],
      ['2406510604', 'MUHAMMAD FADHLAN PRATAMA'],
      ['2406510605', 'MUHAMMAD FAIZ FADHILLAH'],
      ['2406510612', 'NIKITA SYIFA IVANKA'],
      ['2406510613', 'NISRINA SITI LUTHFIYAH'],
      ['2406510614', 'NOVRIZAL ALDIANSYAH'],
      ['2406510617', 'RAIHAN ZACKY ADIANSYAH'],
      ['2406510618', 'RAISHYA DWI SAVITRI'],
      ['2406510619', 'RASYID SYAIRIL IRHAM'],
      ['2406510621', 'REVAN IRAWANSYAH NUGRAHA'],
      ['2406510622', 'RIFKY NUROHMAN HAKIKY'],
      ['2406510624', 'SALMA INTAN NUR AINI'],
      ['2406510625', 'SARAH NUR AGISNA'],
      ['2406510626', 'SATRIA BAMBANG SAMUDRA'],
      ['2406510627', 'SUN DEAN NUR AKBAR'],
      ['2406510629', 'SYIFA FAUZIA AZAHRA'],
    ],
  },
  {
    name: 'XII TKJ',
    major: 'Teknik Komputer dan Jaringan',
    students: [
      ['2406610280', 'ACHMAD FIRMANSYAH'],
      ['2406610281', 'ADHITIYA PRAYOGA'],
      ['2406610282', 'ADZKIA NAUFAL PUTRA'],
      ['2406610283', 'AKBAR TRI HAMDANI'],
      ['2406610284', 'ANGGARA SAPUTRA'],
      ['2406610285', 'AZKIA PUTRI JASMINE RAMADANI'],
      ['2406610286', 'CHELSEA RIZKI BUKHORI'],
      ['2406610287', 'DESWITA CHIKA ARYANI'],
      ['2406610288', 'DIAZ MOVIC PERMANA'],
      ['2406610289', 'EVAN RIYADI'],
      ['2406610290', 'FARIS CHANDRA PUTRA'],
      ['2406610292', 'GOLDEN BOY SITOHANG'],
      ['2406610293', 'HAIKAL ALFIANSYAH'],
      ['2406610294', 'HAMIZ BAKHTIAR AZKA'],
      ['2406610295', 'HENDRI LANOVA'],
      ['2406610296', 'LUTFI SAKHI ZAIDAN'],
      ['2406610297', 'MALIQ RACHMAT PERDANA'],
      ['2406610298', 'MOCHAMAD DWI BINTANG PRATAMA'],
      ['2406610299', 'MUHAMAD BAHRUL ULUM'],
      ['2406610300', 'MUHAMAD NABIL MUZAKI'],
      ['2406610301', 'MUHAMMAD ASSLAM RAIHAN PUTRA'],
      ['2406610302', 'MUHAMMAD FACHRI FAJARI'],
      ['2406610303', 'MUHAMMAD HANIF HAIDAR'],
      ['2406610304', 'MUHAMMAD IHSAN RIFKI'],
      ['2406610305', 'MUHAMAD RIZQI RISNANDAR'],
      ['2406610306', 'NADIFT RADITYA HIDAYAT'],
      ['2406610307', 'PUSPA ANJANI'],
      ['2406610308', 'RASYID HASIM TORRES'],
      ['2406610309', 'REHAN RASI FAUZY'],
      ['2406610310', 'RIZKITA AMELIA'],
      ['2406610311', 'SANDI PIRMANSAH'],
      ['2406610312', 'SHALMA NOOR ALIFFA'],
      ['2406610313', 'SYAHRUL HIDAYAT'],
      ['2406610314', 'ZOLA SEVCHENKO VAN MELOSEVIC'],
    ],
  }
];

// =========================================================
// HELPER
// =========================================================

function toUsername(name) {
  return name
    .toLowerCase()
    .replace(/['`]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim()
    .replace(/\s+/g, '.');
}

function line(char = '=', length = 50) {
  console.log(char.repeat(length));
}

async function main() {
  console.log('');
  line();
  console.log('              GO PKL DATABASE SEED');
  line();
  console.log('');

  // =========================================================
  // 1. MEMBERSIHKAN DATA LAMA
  // =========================================================

  console.log('🧹 Membersihkan data lama...');

  await prisma.evaluation.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.logbook.deleteMany();
  await prisma.absensi.deleteMany();

  await prisma.company.updateMany({ data: { mentorId: null } });
  await prisma.user.updateMany({ data: { companyId: null } });
  await prisma.user.updateMany({ data: { teacherId: null } });
  await prisma.user.updateMany({ data: { classId: null } });

  await prisma.user.deleteMany();
  await prisma.company.deleteMany();
  await prisma.class.deleteMany();
  await prisma.academicYear.deleteMany();

  console.log('✅ Data lama berhasil dibersihkan.');
  console.log('');

  // =========================================================
  // 2. PASSWORD HASH
  // =========================================================

  const hash = await bcrypt.hash(PASSWORD, 10);

  // =========================================================
  // 3a. TAHUN AJARAN
  // =========================================================

  console.log('📅 Membuat tahun ajaran...');

  for (const year of ACADEMIC_YEARS) {
    await prisma.academicYear.create({ data: year });
    console.log(`   ✓ ${year.name}${year.isActive ? '  (AKTIF)' : ''}`);
  }

  console.log('');

  // =========================================================
  // 3b. KELAS (SELURUH KELAS XII)
  // =========================================================

  console.log(`📚 Membuat ${CLASSES.length} kelas XII...`);

  const classIdByName = new Map();

  for (const cls of CLASSES) {
    const created = await prisma.class.create({
      data: {
        name: cls.name,
        major: cls.major,
      },
    });

    classIdByName.set(cls.name, created.id);

    console.log(
      `   ✓ ${cls.name.padEnd(10)} | ${cls.major} (${cls.students.length} siswa)`
    );
  }

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
    const teacher = await prisma.user.create({
      data: {
        name: teacherName,
        email: `${toUsername(teacherName)}@gopkl.id`,
        password: hash,
        role: 'teacher',
        isActive: true,
        academicYear: ACADEMIC_YEAR,
      },
    });

    teachers.push(teacher);
    console.log(`   ✓ ${teacher.name} → ${teacher.email}`);
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
    const mentor = await prisma.user.create({
      data: {
        name: mentorName,
        email: `${toUsername(mentorName)}@gopkl.id`,
        password: hash,
        role: 'mentor',
        isActive: true,
        academicYear: ACADEMIC_YEAR,
      },
    });

    mentors.push(mentor);
    console.log(`   ✓ ${mentor.name} → ${mentor.email}`);
  }

  console.log('');

  // =========================================================
  // 8. PERUSAHAAN PKL
  // =========================================================

  console.log('🏢 Membuat perusahaan PKL...');

  const totalStudents = CLASSES.reduce((sum, c) => sum + c.students.length, 0);

  // Kuota otomatis menyesuaikan jumlah siswa kalau AUTO_PLACEMENT aktif.
  // Kalau tidak, pakai kuota default 6.
  const companyQuota = AUTO_PLACEMENT
    ? Math.ceil(totalStudents / 6)
    : 6;

  const companyData = [
    {
      name: 'PT Teknologi Budi Nusantara',
      address: 'Jl. Budi, Cimindi, Kota Cimahi',
      phone: '022-7001001',
      category: 'Teknologi Informasi',
      latitude: -6.8945,
      longitude: 107.5585,
      mentorIndex: 0,
    },
    {
      name: 'CV Digital Kreatif Cimindi',
      address: 'Jl. Budi Raya, Cimindi, Kota Cimahi',
      phone: '022-7001002',
      category: 'Software House',
      latitude: -6.8948,
      longitude: 107.5588,
      mentorIndex: 1,
    },
    {
      name: 'PT Inovasi Digital Bandung',
      address: 'Jl. Budi, Cimindi, Kota Cimahi',
      phone: '022-7001003',
      category: 'Teknologi Informasi',
      latitude: -6.8951,
      longitude: 107.5591,
      mentorIndex: 2,
    },
    {
      name: 'Studio Kreatif Nusantara',
      address: 'Jl. Budi, Komplek Cimindi Raya, Cimahi',
      phone: '022-7001004',
      category: 'Digital Creative',
      latitude: -6.8954,
      longitude: 107.5594,
      mentorIndex: 3,
    },
    {
      name: 'PT Solusi Teknologi Indonesia',
      address: 'Jl. Budi, Cimindi, Kota Cimahi',
      phone: '022-7001005',
      category: 'IT Consultant',
      latitude: -6.8957,
      longitude: 107.5597,
      mentorIndex: 4,
    },
    {
      name: 'CV Kreatif Digital Mandiri',
      address: 'Jl. Budi, Cimindi Raya, Kota Cimahi',
      phone: '022-7001006',
      category: 'Web Development',
      latitude: -6.896,
      longitude: 107.56,
      mentorIndex: 5,
    },
  ];

  const companies = [];

  for (const item of companyData) {
    const mentor = mentors[item.mentorIndex];

    const company = await prisma.company.create({
      data: {
        name: item.name,
        address: item.address,
        phone: item.phone,
        category: item.category,
        quota: companyQuota,
        latitude: item.latitude,
        longitude: item.longitude,
        radiusMeters: 500,
        isActive: true,
        mentor: { connect: { id: mentor.id } },
      },
    });

    companies.push(company);

    console.log(`   ✓ ${company.name}`);
    console.log(`     Mentor : ${mentor.name}`);
    console.log(`     Lokasi : ${company.address}`);
    console.log('');
  }

  // =========================================================
  // 9. SISWA (SELURUH KELAS XII)
  // =========================================================

  console.log(`👨‍🎓 Membuat ${totalStudents} siswa...`);
  console.log('');

  const perClass = new Map();
  const perTeacher = new Map();
  const perCompany = new Map();

  const loginSamples = [];

  let globalIndex = 0;

  for (const cls of CLASSES) {
    const classId = classIdByName.get(cls.name);

    for (const [nis, name] of cls.students) {
      const email = `${nis}@${toUsername(name)}`;

      const teacher = AUTO_PLACEMENT
        ? teachers[globalIndex % teachers.length]
        : null;

      const company = AUTO_PLACEMENT
        ? companies[globalIndex % companies.length]
        : null;

      await prisma.user.create({
        data: {
          name,
          email,
          password: hash,
          role: 'student',
          isActive: true,
          academicYear: ACADEMIC_YEAR,
          classId,
          ...(teacher ? { teacherId: teacher.id } : {}),
          ...(company ? { companyId: company.id } : {}),
        },
      });

      perClass.set(cls.name, (perClass.get(cls.name) ?? 0) + 1);

      if (teacher) {
        perTeacher.set(teacher.id, (perTeacher.get(teacher.id) ?? 0) + 1);
      }

      if (company) {
        perCompany.set(company.id, (perCompany.get(company.id) ?? 0) + 1);
      }

      if (perClass.get(cls.name) === 1) {
        loginSamples.push({ className: cls.name, email });
      }

      globalIndex++;
    }

    console.log(
      `   ✓ ${cls.name.padEnd(10)} → ${perClass.get(cls.name)} siswa`
    );
  }

  console.log('');

  // =========================================================
  // 10. RINGKASAN KELAS
  // =========================================================

  line();
  console.log('                  RINGKASAN KELAS');
  line();
  console.log('');

  for (const cls of CLASSES) {
    console.log(
      `📘 ${cls.name.padEnd(10)} | ${String(perClass.get(cls.name) ?? 0).padStart(2)} siswa | ${cls.major}`
    );
  }

  console.log('');
  console.log(`   TOTAL: ${totalStudents} siswa di ${CLASSES.length} kelas`);
  console.log('');

  // =========================================================
  // 11. RINGKASAN PENEMPATAN
  // =========================================================

  if (AUTO_PLACEMENT) {
    line();
    console.log('             RINGKASAN PENEMPATAN');
    line();
    console.log('');

    companies.forEach((company, i) => {
      console.log(`🏢 ${company.name}`);
      console.log(`   Mentor : ${mentors[i].name}`);
      console.log(`   Siswa  : ${perCompany.get(company.id) ?? 0} / ${companyQuota}`);
      console.log('');
    });

    line();
    console.log('             RINGKASAN GURU PEMBIMBING');
    line();
    console.log('');

    for (const teacher of teachers) {
      console.log(
        `👨‍🏫 ${teacher.name.padEnd(18)} → ${perTeacher.get(teacher.id) ?? 0} siswa`
      );
    }

    console.log('');
  }

  // =========================================================
  // 12. AKUN LOGIN
  // =========================================================

  line();
  console.log('                 AKUN LOGIN');
  line();
  console.log('');

  console.log('👑 SUPER ADMIN : superadmin@gopkl.id');
  console.log('🏫 HUBIN       : hubin@gopkl.id');
  console.log('');

  console.log('👨‍🏫 GURU PEMBIMBING');
  for (const teacher of teachers) {
    console.log(`   ${teacher.name} → ${teacher.email}`);
  }
  console.log('');

  console.log('🧑‍💼 MENTOR INDUSTRI');
  for (const mentor of mentors) {
    console.log(`   ${mentor.name} → ${mentor.email}`);
  }
  console.log('');

  console.log('👨‍🎓 CONTOH LOGIN SISWA (username = NIS@nama.siswa)');
  for (const sample of loginSamples) {
    console.log(`   ${sample.className.padEnd(10)} → ${sample.email}`);
  }
  console.log('');

  // =========================================================
  // 13. SELESAI
  // =========================================================

  line();
  console.log('                 SEED BERHASIL');
  line();
  console.log('');

  console.log(`✓ Super Admin : 1`);
  console.log(`✓ Hubin       : 1`);
  console.log(`✓ Guru        : ${teachers.length}`);
  console.log(`✓ Mentor      : ${mentors.length}`);
  console.log(`✓ Perusahaan  : ${companies.length}`);
  console.log(`✓ Tahun Ajaran: ${ACADEMIC_YEARS.length}`);
  console.log(`✓ Kelas       : ${CLASSES.length}`);
  console.log(`✓ Siswa       : ${totalStudents}`);
  console.log('');
  console.log(`📅 Tahun ajaran aktif : ${ACADEMIC_YEAR}`);
  console.log('🔐 Password semua akun:', PASSWORD);
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
