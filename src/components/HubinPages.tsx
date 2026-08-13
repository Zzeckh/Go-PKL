import React, { useState } from 'react';
import { 
  Users, Building, CheckCircle2, 
  X, Search, FileText, Briefcase, GraduationCap
} from 'lucide-react';
import { useApp } from '../context/AppContext';

// --- HUBIN DATA SISWA PAGE ---
export const HubinSiswa: React.FC = () => {
  const { siswaList, perusahaanList } = useApp();
  const [tab, setTab] = useState<'siswa' | 'perusahaan'>('siswa');
  const [search, setSearch] = useState('');
  const [selectedSiswa, setSelectedSiswa] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const [selectedPerusahaan, setSelectedPerusahaan] = useState<any>(null);
  const [showPerusahaanModal, setShowPerusahaanModal] = useState(false);

  const filteredSiswa = siswaList.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.perusahaan.toLowerCase().includes(search.toLowerCase()) ||
    s.kelas.toLowerCase().includes(search.toLowerCase())
  );

  const filteredPerusahaan = perusahaanList.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full w-full flex flex-col gap-4 animate-in fade-in duration-300">
      <div className="flex-1 bg-white/70 backdrop-blur-xl border border-white rounded-[24px] shadow-sm flex flex-col overflow-hidden transition-all">
        
        {/* Header Bar */}
        <div className="p-5 border-b border-black/5 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/40">
          <div>
            <h3 className="font-bold text-black text-lg">Kelola Data Siswa & Perusahaan</h3>
            <p className="text-xs font-semibold text-black/50 mt-0.5">Direktori seluruh siswa magang (PKL) dan perusahaan mitra DUDI</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Sub Tabs */}
            <div className="flex gap-1 bg-black/5 p-1 rounded-xl border border-black/10">
              <button 
                onClick={() => { setTab('siswa'); setSearch(''); }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === 'siswa' ? 'bg-black text-white shadow-sm' : 'text-black/60'}`}
              >
                Data Siswa
              </button>
              <button 
                onClick={() => { setTab('perusahaan'); setSearch(''); }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === 'perusahaan' ? 'bg-black text-white shadow-sm' : 'text-black/60'}`}
              >
                Data Perusahaan
              </button>
            </div>

            {/* Search Input */}
            <div className="bg-white border border-black/10 rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-sm focus-within:border-black/30 transition-colors">
              <Search className="w-4 h-4 text-black/40" />
              <input 
                type="text" 
                placeholder={`Cari ${tab === 'siswa' ? 'siswa, kelas...' : 'perusahaan...'}...`}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-transparent outline-none text-xs w-full sm:w-48 font-semibold text-black placeholder:text-black/30" 
              />
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 bg-white/30">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            
            {tab === 'siswa' && filteredSiswa.map(siswa => (
              <div 
                key={siswa.id} 
                onClick={() => { setSelectedSiswa(siswa); setShowModal(true); }} 
                className="bg-white rounded-[24px] p-5 border border-black/5 shadow-sm transition-all cursor-pointer flex flex-col gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-black/5 border border-black/10 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-6 h-6 text-black/50" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-black">{siswa.name}</h4>
                    <p className="text-[10px] font-bold text-black/50 mt-0.5">{siswa.kelas} • {siswa.perusahaan}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-auto">
                  <div className="bg-black/5 p-2.5 rounded-xl text-center border border-black/5">
                    <p className="text-sm font-bold text-black">{siswa.kehadiran}%</p>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-black/50 mt-0.5">Kehadiran</p>
                  </div>
                  <div className="bg-black/5 p-2.5 rounded-xl text-center border border-black/5">
                    <p className="text-sm font-bold text-black">{siswa.logs}</p>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-black/50 mt-0.5">Logbook</p>
                  </div>
                </div>
              </div>
            ))}

            {tab === 'perusahaan' && filteredPerusahaan.map(c => (
              <div 
                key={c.id} 
                onClick={() => { setSelectedPerusahaan(c); setShowPerusahaanModal(true); }}
                className="bg-white rounded-[24px] p-5 border border-black/5 shadow-sm transition-all cursor-pointer flex flex-col"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-black/5 rounded-2xl flex items-center justify-center shrink-0 border border-black/10">
                    <Building className="w-6 h-6 text-black/40" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-black">{c.name}</h4>
                    <p className="text-[10px] font-semibold text-black/50 line-clamp-1 mt-0.5">{c.address}</p>
                  </div>
                </div>
                <div className="space-y-2 mt-auto">
                  <div className="flex justify-between items-center text-xs bg-black/5 p-2 rounded-xl border border-black/5">
                    <span className="font-bold text-black/50 px-2">Kuota Tersisa</span>
                    <span className="font-bold text-black bg-white px-3 py-1 rounded-lg shadow-sm border border-black/5">{c.quota - c.filled} dari {c.quota}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs p-2">
                    <span className="font-bold text-black/50">Mentor DUDI</span>
                    <span className="font-bold text-black">{c.mentor}</span>
                  </div>
                </div>
              </div>
            ))}

          </div>
        </div>
      </div>

      {/* DETAIL SISWA MODAL */}
      {showModal && selectedSiswa && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] max-w-2xl w-full h-[85vh] max-h-[620px] shadow-2xl flex flex-col overflow-hidden border border-black/10">
            <div className="p-6 border-b border-black/5 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center border border-black/10">
                  <GraduationCap className="w-6 h-6 text-black/50" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-black">{selectedSiswa.name}</h3>
                  <p className="text-xs font-semibold text-black/50 mt-0.5">{selectedSiswa.kelas} • {selectedSiswa.perusahaan}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-black/50 hover:bg-black/10 hover:text-black transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-black/[0.02]">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white p-4 rounded-[24px] border border-black/5 shadow-sm hover:shadow-md transition-all">
                  <h4 className="text-[10px] font-bold text-black/40 uppercase tracking-widest mb-1">Total Kehadiran</h4>
                  <p className="text-2xl font-bold text-black">{selectedSiswa.kehadiran}%</p>
                </div>
                <div className="bg-white p-4 rounded-[24px] border border-black/5 shadow-sm hover:shadow-md transition-all">
                  <h4 className="text-[10px] font-bold text-black/40 uppercase tracking-widest mb-1">Jurnal Disetujui</h4>
                  <p className="text-2xl font-bold text-black">{selectedSiswa.logs}</p>
                </div>
              </div>
              
              <h4 className="font-bold text-sm text-black mb-3">Riwayat Logbook Terakhir</h4>
              <div className="space-y-3">
                {[1, 2].map((log) => (
                  <div key={log} className="bg-white p-5 rounded-[24px] border border-black/5 shadow-sm flex items-start gap-4 hover:border-black/20 transition-all cursor-pointer">
                    <div className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-black/40" />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-black">Aktivitas Pengembangan Modul Web</h5>
                      <p className="text-[10px] font-semibold text-black/50 mt-1 mb-2">14 Sep 2024 • Pekerjaan Reguler</p>
                      <span className="text-[10px] font-bold bg-black text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 w-max">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approved by Mentor
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-5 border-t border-black/5 bg-white shrink-0 flex justify-end">
              <button 
                onClick={() => setShowModal(false)} 
                className="px-6 py-3 bg-black text-white text-xs font-bold rounded-xl shadow-md"
              >
                Tutup Jendela
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL PERUSAHAAN MODAL (DAFTAR SISWA MAGANG) */}
      {showPerusahaanModal && selectedPerusahaan && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] max-w-2xl w-full h-[85vh] max-h-[620px] shadow-2xl flex flex-col overflow-hidden border border-black/10">
            <div className="p-6 border-b border-black/5 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center border border-black/10">
                  <Building className="w-6 h-6 text-black/50" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-black">{selectedPerusahaan.name}</h3>
                  <p className="text-xs font-semibold text-black/50 mt-0.5">{selectedPerusahaan.address}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPerusahaanModal(false)} 
                className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-black/50 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-black/[0.02]">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white p-4 rounded-[24px] border border-black/5 shadow-sm">
                  <h4 className="text-[10px] font-bold text-black/40 uppercase tracking-widest mb-1">Mentor DUDI</h4>
                  <p className="text-lg font-bold text-black">{selectedPerusahaan.mentor}</p>
                </div>
                <div className="bg-white p-4 rounded-[24px] border border-black/5 shadow-sm">
                  <h4 className="text-[10px] font-bold text-black/40 uppercase tracking-widest mb-1">Terisi / Kuota Total</h4>
                  <p className="text-lg font-bold text-black">{selectedPerusahaan.filled} dari {selectedPerusahaan.quota} Siswa</p>
                </div>
              </div>

              <h4 className="font-bold text-sm text-black mb-3">Daftar Siswa Magang di {selectedPerusahaan.name}</h4>
              
              {siswaList.filter(s => s.perusahaan.toLowerCase() === selectedPerusahaan.name.toLowerCase()).length > 0 ? (
                <div className="space-y-3">
                  {siswaList.filter(s => s.perusahaan.toLowerCase() === selectedPerusahaan.name.toLowerCase()).map(siswa => (
                    <div key={siswa.id} className="bg-white p-4 rounded-[24px] border border-black/5 shadow-sm flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-black/5 border border-black/10 flex items-center justify-center shrink-0">
                          <GraduationCap className="w-5 h-5 text-black/50" />
                        </div>
                        <div>
                          <h5 className="font-bold text-sm text-black">{siswa.name}</h5>
                          <p className="text-[10px] font-bold text-black/50 mt-0.5">{siswa.kelas}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="bg-black/5 px-3 py-1.5 rounded-xl border border-black/5 text-center">
                          <p className="text-xs font-bold text-black">{siswa.kehadiran}%</p>
                          <p className="text-[8px] font-bold text-black/40 uppercase">Kehadiran</p>
                        </div>
                        <div className="bg-black/5 px-3 py-1.5 rounded-xl border border-black/5 text-center">
                          <p className="text-xs font-bold text-black">{siswa.logs}</p>
                          <p className="text-[8px] font-bold text-black/40 uppercase">Logbook</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white p-6 rounded-[24px] border border-black/5 text-center">
                  <p className="text-xs font-bold text-black/50">Belum ada data siswa yang terdaftar di perusahaan ini.</p>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-black/5 bg-white shrink-0 flex justify-end">
              <button 
                onClick={() => setShowPerusahaanModal(false)} 
                className="px-6 py-3 bg-black text-white text-xs font-bold rounded-xl shadow-md"
              >
                Tutup Jendela
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- HUBIN DATA PEMBIMBING PAGE ---
export const HubinPembimbing: React.FC = () => {
  const { siswaList, guruList, mentorList } = useApp();
  const [tab, setTab] = useState<'guru' | 'mentor'>('guru');
  const [search, setSearch] = useState('');

  const [selectedPembimbing, setSelectedPembimbing] = useState<any>(null);
  const [pembimbingType, setPembimbingType] = useState<'guru' | 'mentor'>('guru');
  const [showPembimbingModal, setShowPembimbingModal] = useState(false);

  const filteredGuru = guruList.filter(g => 
    g.name.toLowerCase().includes(search.toLowerCase()) || 
    g.subject.toLowerCase().includes(search.toLowerCase())
  );

  const filteredMentor = mentorList.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    m.perusahaan.toLowerCase().includes(search.toLowerCase()) ||
    m.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full w-full flex flex-col gap-4 animate-in fade-in duration-300">
      <div className="flex-1 bg-white/70 backdrop-blur-xl border border-white rounded-[24px] shadow-sm flex flex-col overflow-hidden transition-all">
        
        {/* Header Bar */}
        <div className="p-5 border-b border-black/5 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/40">
          <div>
            <h3 className="font-bold text-black text-lg">Kelola Data Pembimbing</h3>
            <p className="text-xs font-semibold text-black/50 mt-0.5">Direktori Guru Pembimbing Sekolah dan Mentor Industri DUDI</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Sub Tabs */}
            <div className="flex gap-1 bg-black/5 p-1 rounded-xl border border-black/10">
              <button 
                onClick={() => { setTab('guru'); setSearch(''); }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === 'guru' ? 'bg-black text-white shadow-sm' : 'text-black/60'}`}
              >
                Guru Pembimbing
              </button>
              <button 
                onClick={() => { setTab('mentor'); setSearch(''); }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === 'mentor' ? 'bg-black text-white shadow-sm' : 'text-black/60'}`}
              >
                Mentor DUDI
              </button>
            </div>

            {/* Search Input */}
            <div className="bg-white border border-black/10 rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-sm focus-within:border-black/30 transition-colors">
              <Search className="w-4 h-4 text-black/40" />
              <input 
                type="text" 
                placeholder={`Cari ${tab === 'guru' ? 'guru...' : 'mentor, DUDI...'}...`}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-transparent outline-none text-xs w-full sm:w-48 font-semibold text-black placeholder:text-black/30" 
              />
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 bg-white/30">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            
            {tab === 'guru' && filteredGuru.map(g => (
              <div 
                key={g.id} 
                onClick={() => {
                  setSelectedPembimbing(g);
                  setPembimbingType('guru');
                  setShowPembimbingModal(true);
                }}
                className="bg-white rounded-[24px] p-5 border border-black/5 shadow-sm transition-all cursor-pointer flex flex-col"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-black/5 rounded-full flex items-center justify-center border border-black/10">
                    <Users className="w-5 h-5 text-black/50" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-black">{g.name}</h4>
                    <p className="text-[10px] font-bold text-black/50 mt-0.5 uppercase tracking-wide">{g.subject}</p>
                  </div>
                </div>
                <div className="flex gap-3 mt-auto">
                  <div className="flex-1 bg-black/5 p-3 rounded-2xl border border-black/5 text-center">
                    <p className="text-lg font-bold text-black">{g.totalSiswa}</p>
                    <p className="text-[9px] font-bold text-black/50 uppercase tracking-widest mt-1">Siswa</p>
                  </div>
                  <div className="flex-1 bg-black/5 p-3 rounded-2xl border border-black/5 text-center">
                    <p className="text-lg font-bold text-black">{g.totalDUDI}</p>
                    <p className="text-[9px] font-bold text-black/50 uppercase tracking-widest mt-1">DUDI</p>
                  </div>
                </div>
              </div>
            ))}

            {tab === 'mentor' && filteredMentor.map(m => (
              <div 
                key={m.id} 
                onClick={() => {
                  setSelectedPembimbing(m);
                  setPembimbingType('mentor');
                  setShowPembimbingModal(true);
                }}
                className="bg-white rounded-[24px] p-5 border border-black/5 shadow-sm transition-all cursor-pointer flex flex-col"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-black/5 rounded-full flex items-center justify-center border border-black/10">
                    <Briefcase className="w-5 h-5 text-black/50" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-black">{m.name}</h4>
                    <p className="text-[10px] font-bold text-black/50 mt-0.5">{m.role}</p>
                  </div>
                </div>
                <div className="space-y-2 mt-auto bg-black/5 p-3 rounded-2xl border border-black/5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-black/50 flex items-center gap-1.5"><Building className="w-3.5 h-3.5"/> DUDI</span>
                    <span className="font-bold text-black">{m.perusahaan}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-black/5">
                    <span className="font-bold text-black/50 flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5"/> Bimbingan</span>
                    <span className="font-bold text-black">{m.totalSiswa} Siswa</span>
                  </div>
                </div>
              </div>
            ))}

          </div>
        </div>
      </div>

      {/* DETAIL PEMBIMBING MODAL (DAFTAR SISWA BIMBINGAN) */}
      {showPembimbingModal && selectedPembimbing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] max-w-2xl w-full h-[85vh] max-h-[620px] shadow-2xl flex flex-col overflow-hidden border border-black/10">
            <div className="p-6 border-b border-black/5 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center border border-black/10">
                  {pembimbingType === 'guru' ? (
                    <Users className="w-6 h-6 text-black/50" />
                  ) : (
                    <Briefcase className="w-6 h-6 text-black/50" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-black">{selectedPembimbing.name}</h3>
                  <p className="text-xs font-semibold text-black/50 mt-0.5">
                    {pembimbingType === 'guru' 
                      ? `Guru Pembimbing • ${selectedPembimbing.subject}` 
                      : `Mentor DUDI • ${selectedPembimbing.role} di ${selectedPembimbing.perusahaan}`}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowPembimbingModal(false)} 
                className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-black/50 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-black/[0.02]">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white p-4 rounded-[24px] border border-black/5 shadow-sm">
                  <h4 className="text-[10px] font-bold text-black/40 uppercase tracking-widest mb-1">
                    {pembimbingType === 'guru' ? 'Mata Pelajaran / Bidang' : 'Instansi DUDI'}
                  </h4>
                  <p className="text-sm font-bold text-black">
                    {pembimbingType === 'guru' ? selectedPembimbing.subject : selectedPembimbing.perusahaan}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-[24px] border border-black/5 shadow-sm">
                  <h4 className="text-[10px] font-bold text-black/40 uppercase tracking-widest mb-1">Anak Bimbingan</h4>
                  <p className="text-sm font-bold text-black">{selectedPembimbing.totalSiswa} Siswa PKL</p>
                </div>
              </div>

              <h4 className="font-bold text-sm text-black mb-3">
                Daftar Murid dalam Bimbingan {selectedPembimbing.name}
              </h4>
              
              {(() => {
                const bimbinganList = siswaList.filter((s: any) => 
                  pembimbingType === 'guru' 
                    ? s.guruPembimbing?.toLowerCase().includes(selectedPembimbing.name.split(',')[0].toLowerCase())
                    : (s.mentor?.toLowerCase().includes(selectedPembimbing.name.split(',')[0].toLowerCase()) || s.perusahaan.toLowerCase() === selectedPembimbing.perusahaan?.toLowerCase())
                );

                return bimbinganList.length > 0 ? (
                  <div className="space-y-3">
                    {bimbinganList.map((siswa: any) => (
                      <div key={siswa.id} className="bg-white p-4 rounded-[24px] border border-black/5 shadow-sm flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-black/5 border border-black/10 flex items-center justify-center shrink-0">
                            <GraduationCap className="w-5 h-5 text-black/50" />
                          </div>
                          <div>
                            <h5 className="font-bold text-sm text-black">{siswa.name}</h5>
                            <p className="text-[10px] font-bold text-black/50 mt-0.5">{siswa.kelas} • {siswa.perusahaan}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="bg-black/5 px-3 py-1.5 rounded-xl border border-black/5 text-center">
                            <p className="text-xs font-bold text-black">{siswa.kehadiran}%</p>
                            <p className="text-[8px] font-bold text-black/40 uppercase">Kehadiran</p>
                          </div>
                          <div className="bg-black/5 px-3 py-1.5 rounded-xl border border-black/5 text-center">
                            <p className="text-xs font-bold text-black">{siswa.logs}</p>
                            <p className="text-[8px] font-bold text-black/40 uppercase">Logbook</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white p-6 rounded-[24px] border border-black/5 text-center">
                    <p className="text-xs font-bold text-black/50">Belum ada siswa yang tercatat di bawah bimbingan pembimbing ini.</p>
                  </div>
                );
              })()}
            </div>

            <div className="p-5 border-t border-black/5 bg-white shrink-0 flex justify-end">
              <button 
                onClick={() => setShowPembimbingModal(false)} 
                className="px-6 py-3 bg-black text-white text-xs font-bold rounded-xl shadow-md"
              >
                Tutup Jendela
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
