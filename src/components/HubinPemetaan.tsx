import React, { useState } from 'react';
import {
  MapPin, Users, Briefcase, GraduationCap, Compass, Building, Search, Pencil, Save, X, CheckCircle2
} from 'lucide-react';
import { useApp, SiswaItem } from '../context/AppContext';

const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, ' ').trim();

export const HubinPemetaan: React.FC = () => {
  const { mapLocations, siswaList, guruList, mentorList, updateSiswaMapping } = useApp();

  const [search, setSearch] = useState('');
  const [selectedSiswa, setSelectedSiswa] = useState<SiswaItem | null>(null);
  const [editing, setEditing] = useState(false);

  // Edit form state
  const [formTempatId, setFormTempatId] = useState<number | string>('');
  const [formGuruId, setFormGuruId] = useState<number>(0);
  const [formMentorId, setFormMentorId] = useState<number>(0);

  const filteredSiswa = siswaList.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  const matchLocation = (company?: string) => {
    if (!company) return undefined;
    const q = normalize(company);
    return mapLocations.find(l =>
      normalize(l.companyName).includes(q) || q.includes(normalize(l.companyName).split('(')[0].trim())
    );
  };

  const selectedLoc = selectedSiswa
    ? matchLocation(selectedSiswa.perusahaan)
    : undefined;

  const selectedGuru = selectedSiswa
    ? guruList.find(g => g.name.split(',')[0] === selectedSiswa.guruPembimbing?.split(',')[0]) || null
    : null;

  const selectedMentor = selectedSiswa
    ? mentorList.find(m => m.name.split(',')[0] === selectedSiswa.mentor?.split(',')[0]) || null
    : null;

  const handleSelectSiswa = (s: SiswaItem) => {
    setSelectedSiswa(s);
    setEditing(false);
    const loc = matchLocation(s.perusahaan);
    if (loc) setFormTempatId(loc.id);
  };

  const handleEdit = () => {
    if (!selectedSiswa) return;
    const loc = matchLocation(selectedSiswa.perusahaan);
    const guru = guruList.find(g => g.name.split(',')[0] === selectedSiswa.guruPembimbing?.split(',')[0]);
    const mentor = mentorList.find(m => m.name.split(',')[0] === selectedSiswa.mentor?.split(',')[0]);
    setFormTempatId(loc?.id ?? '');
    setFormGuruId(guru?.id ?? 0);
    setFormMentorId(mentor?.id ?? 0);
    setEditing(true);
  };

  const handleSave = () => {
    if (!selectedSiswa) return;
    const loc = mapLocations.find(l => l.id === formTempatId);
    const guru = guruList.find(g => g.id === formGuruId);
    const mentor = mentorList.find(m => m.id === formMentorId);
    updateSiswaMapping(selectedSiswa.id, {
      perusahaan: loc ? loc.companyName.replace(/\s*\(.*\)$/, '') : selectedSiswa.perusahaan,
      guruPembimbing: guru ? guru.name : selectedSiswa.guruPembimbing,
      mentor: mentor ? mentor.name : selectedSiswa.mentor,
    });
    setEditing(false);
    setSelectedSiswa(prev => prev ? {
      ...prev,
      perusahaan: loc ? loc.companyName.replace(/\s*\(.*\)$/, '') : prev.perusahaan,
      guruPembimbing: guru ? guru.name : prev.guruPembimbing,
      mentor: mentor ? mentor.name : prev.mentor,
    } : prev);
  };

  const mappedCount = siswaList.filter(s => s.perusahaan && s.perusahaan !== '-' && matchLocation(s.perusahaan)).length;

  return (
    <div className="h-full w-full flex flex-col gap-4 animate-in fade-in duration-300">
      {/* Header */}
      <div className="shrink-0 bg-white/70 backdrop-blur-xl rounded-[24px] border border-white shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center">
            <Compass className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-black/50">Hubin · Map Planning</p>
            <h2 className="text-xl font-bold text-black">Pemetaan Sebaran PKL</h2>
          </div>
        </div>
        <p className="text-xs font-semibold text-black/50 max-w-sm leading-relaxed">
          Pilih siswa untuk melihat tempat PKL, guru pembimbing, dan guru mentor. Pemetaan dapat diedit langsung.
        </p>
      </div>

      {/* Map + Panel */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">

        {/* Map */}
        <div className="lg:col-span-2 bg-white/70 backdrop-blur-xl rounded-[24px] border border-white shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all duration-300">
          <div className="flex-1 relative overflow-hidden">
            <div className="absolute inset-0 transition-all duration-700 bg-gradient-to-br from-white via-black/5 to-black/10" />
            <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            <div className="absolute top-1/2 left-0 right-0 h-4 bg-white shadow-sm -translate-y-1/2" />
            <div className="absolute left-1/2 top-0 bottom-0 w-4 bg-white shadow-sm -translate-x-1/2" />

            {/* Selected place ring */}
            {selectedLoc && (
              <>
                <div
                  className="absolute rounded-full border-2 border-dashed border-black/40 pointer-events-none transition-all duration-500"
                  style={{ width: '170px', height: '170px', left: `${selectedLoc.coordinates.x}%`, top: `${selectedLoc.coordinates.y}%`, transform: 'translate(-50%,-50%)' }}
                />
                <div
                  className="absolute rounded-full pointer-events-none"
                  style={{ width: '170px', height: '170px', left: `${selectedLoc.coordinates.x}%`, top: `${selectedLoc.coordinates.y}%`, transform: 'translate(-50%,-50%)', background: 'rgba(0,0,0,0.05)' }}
                />
              </>
            )}

            {/* Pins */}
            {mapLocations.map(loc => {
              const isSel = selectedLoc?.id === loc.id;
              return (
                <button
                  key={loc.id}
                  style={{ left: `${loc.coordinates.x}%`, top: `${loc.coordinates.y}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${isSel ? 'scale-125 z-30' : 'hover:scale-110 z-10'}`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl border-2 transition-all ${isSel ? 'bg-black border-black ring-4 ring-black/20' : 'bg-white border-white hover:border-black/30'}`}>
                    <MapPin className={`w-5 h-5 ${isSel ? 'text-white' : 'text-black/60'}`} />
                  </div>
                  {isSel && (
                    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-black text-white text-xs font-bold px-3 py-2 rounded-xl shadow-xl whitespace-nowrap animate-in fade-in zoom-in-95 duration-200">
                      {loc.companyName}
                      <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-black rotate-45 -z-10" />
                    </div>
                  )}
                </button>
              );
            })}

            {/* Legend */}
            <div className="absolute left-4 top-4 bg-white/95 backdrop-blur-sm px-3 py-2.5 rounded-2xl border border-black/5 shadow-lg flex items-center gap-4 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-black/70"><GraduationCap className="w-3.5 h-3.5" />{siswaList.length} Siswa</span>
              <span className="flex items-center gap-1.5 text-black/70"><Building className="w-3.5 h-3.5" />{mapLocations.length} DUDI</span>
              <span className="flex items-center gap-1.5 text-black/70"><CheckCircle2 className="w-3.5 h-3.5" />{mappedCount} Terpetakan</span>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="bg-white/70 backdrop-blur-xl rounded-[24px] border border-white shadow-sm flex flex-col p-5 overflow-hidden hover:shadow-md transition-all duration-300">
          {/* Search */}
          <div className="bg-white border border-black/10 rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-sm focus-within:border-black/30 transition-colors shrink-0 mb-4">
            <Search className="w-4 h-4 text-black/40" />
            <input
              type="text"
              placeholder="Cari siswa..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent outline-none text-xs w-full font-semibold text-black placeholder:text-black/30"
            />
          </div>

          <div className="flex items-center justify-between shrink-0 mb-3">
            <p className="text-xs font-bold uppercase tracking-widest text-black/50">
              {editing ? 'Edit Pemetaan' : selectedSiswa ? 'Detail Pemetaan' : 'Daftar Siswa PKL'}
            </p>
            {selectedSiswa && !editing && (
              <button
                onClick={handleEdit}
                className="flex items-center gap-1.5 bg-black text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm hover:bg-black/80 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
            {!editing && !selectedSiswa && (
              <div className="space-y-3">
                {filteredSiswa.map(s => {
                  const mapped = s.perusahaan && s.perusahaan !== '-' && matchLocation(s.perusahaan);
                  return (
                    <button
                      key={s.id}
                      onClick={() => handleSelectSiswa(s)}
                      className="w-full text-left flex items-center gap-3 bg-white/80 border border-black/5 rounded-2xl p-4 transition-all hover:border-black/40 hover:shadow-sm"
                    >
                      <div className="w-10 h-10 rounded-full bg-black/5 border border-black/10 flex items-center justify-center shrink-0">
                        <GraduationCap className="w-5 h-5 text-black/50" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-black truncate">{s.name}</p>
                        <p className="text-[10px] font-bold text-black/50 mt-0.5">{s.kelas}</p>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-1 rounded-lg shrink-0 ${mapped ? 'bg-black text-white' : 'bg-black/5 text-black/50'}`}>
                        {mapped ? 'Terpetakan' : 'Belum'}
                      </span>
                    </button>
                  );
                })}
                {filteredSiswa.length === 0 && (
                  <p className="text-xs font-bold text-black/50 text-center py-6">Tidak ada siswa yang cocok.</p>
                )}
              </div>
            )}

            {!editing && selectedSiswa && (
              <div className="space-y-3">
                {/* Siswa */}
                <div className="flex items-center gap-3 bg-black text-white rounded-2xl p-4">
                  <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{selectedSiswa.name}</p>
                    <p className="text-[10px] font-bold text-white/60">{selectedSiswa.kelas}</p>
                  </div>
                </div>

                {/* Tempat PKL */}
                <div className={`flex items-start gap-3 bg-white/80 border rounded-2xl p-4 ${selectedLoc ? 'border-black/40' : 'border-black/5'}`}>
                  <div className="w-10 h-10 rounded-xl bg-black/5 border border-black/10 flex items-center justify-center shrink-0">
                    <Building className="w-5 h-5 text-black/60" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-black/40 uppercase tracking-wide">Tempat PKL</p>
                    <p className="text-sm font-bold text-black mt-1">{selectedSiswa.perusahaan && selectedSiswa.perusahaan !== '-' ? selectedSiswa.perusahaan : 'Belum dipetakan'}</p>
                    {selectedLoc && <p className="text-[10px] font-semibold text-black/50 mt-1 line-clamp-2">{selectedLoc.address}</p>}
                  </div>
                  {selectedLoc && <MapPin className="w-4 h-4 text-black/40 shrink-0" />}
                </div>

                {/* Guru Pembimbing */}
                <div className="flex items-start gap-3 bg-white/80 border border-black/5 rounded-2xl p-4">
                  <div className="w-10 h-10 rounded-full bg-black/5 border border-black/10 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-black/60" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-black/40 uppercase tracking-wide">Guru Pembimbing</p>
                    <p className="text-sm font-bold text-black mt-1">{selectedSiswa.guruPembimbing && selectedSiswa.guruPembimbing !== '-' ? selectedSiswa.guruPembimbing : 'Belum ditentukan'}</p>
                    {selectedGuru && <p className="text-[10px] font-semibold text-black/50 mt-1">{selectedGuru.subject}</p>}
                  </div>
                </div>

                {/* Guru Mentor */}
                <div className="flex items-start gap-3 bg-white/80 border border-black/5 rounded-2xl p-4">
                  <div className="w-10 h-10 rounded-full bg-black/5 border border-black/10 flex items-center justify-center shrink-0">
                    <Briefcase className="w-5 h-5 text-black/60" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-black/40 uppercase tracking-wide">Guru Mentor</p>
                    <p className="text-sm font-bold text-black mt-1">{selectedSiswa.mentor && selectedSiswa.mentor !== '-' ? selectedSiswa.mentor : 'Belum ditentukan'}</p>
                    {selectedMentor && <p className="text-[10px] font-semibold text-black/50 mt-1">{selectedMentor.role} • {selectedMentor.perusahaan}</p>}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedSiswa(null)}
                  className="w-full py-2.5 bg-black/5 text-black/60 text-xs font-bold rounded-xl hover:bg-black/10 transition-colors"
                >
                  Kembali ke Daftar
                </button>
              </div>
            )}

            {/* Edit form */}
            {editing && selectedSiswa && (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-black/40 uppercase tracking-wide">Tempat PKL</label>
                  <select
                    value={formTempatId}
                    onChange={e => setFormTempatId(e.target.value)}
                    className="mt-1.5 w-full bg-white border border-black/10 rounded-xl px-3 py-2.5 text-xs font-bold text-black outline-none focus:border-black/30"
                  >
                    <option value="">— Pilih Tempat PKL —</option>
                    {mapLocations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.companyName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-black/40 uppercase tracking-wide">Guru Pembimbing</label>
                  <select
                    value={formGuruId}
                    onChange={e => setFormGuruId(Number(e.target.value))}
                    className="mt-1.5 w-full bg-white border border-black/10 rounded-xl px-3 py-2.5 text-xs font-bold text-black outline-none focus:border-black/30"
                  >
                    <option value={0}>— Pilih Guru Pembimbing —</option>
                    {guruList.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-black/40 uppercase tracking-wide">Guru Mentor</label>
                  <select
                    value={formMentorId}
                    onChange={e => setFormMentorId(Number(e.target.value))}
                    className="mt-1.5 w-full bg-white border border-black/10 rounded-xl px-3 py-2.5 text-xs font-bold text-black outline-none focus:border-black/30"
                  >
                    <option value={0}>— Pilih Guru Mentor —</option>
                    {mentorList.map(m => (
                      <option key={m.id} value={m.id}>{m.name} • {m.perusahaan}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleSave}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-black text-white text-xs font-bold py-2.5 rounded-xl shadow-sm hover:bg-black/80 transition-colors"
                  >
                    <Save className="w-4 h-4" /> Simpan
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="flex items-center justify-center gap-1.5 bg-black/5 text-black/60 text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-black/10 transition-colors"
                  >
                    <X className="w-4 h-4" /> Batal
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};