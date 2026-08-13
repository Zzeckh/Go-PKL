import React, { useState } from 'react';
import { Map as MapIcon, X, MapPin, Award, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useApp } from '../context/AppContext';

// --- MENTOR ATTENDANCE ---

export const MentorAttendance: React.FC = () => {
  const { siswaList, attendances } = useApp();
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedDate] = useState(new Date());

  const openMap = (student: any) => {
    setSelectedStudent(student);
    setShowMapModal(true);
  };

  return (
    <div className="h-full w-full flex flex-col gap-4 animate-in fade-in duration-300">
      <div className="flex-1 bg-white/70 backdrop-blur-xl border border-white rounded-[24px] shadow-sm flex flex-col overflow-hidden hover:shadow-md transition-all duration-300">
        <div className="p-5 border-b border-black/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
          <div>
            <h3 className="font-bold text-black text-lg">Live Attendance Tracking</h3>
            <p className="text-xs font-semibold text-black/50 mt-0.5">Real-time clock-in data and geofence verification</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Date Navigator */}
            <div className="flex items-center gap-2 bg-black/5 px-3 py-1.5 rounded-xl border border-black/5">
              <button className="text-black/40 hover:text-black transition-colors p-1"><ChevronLeft className="w-4 h-4" /></button>
              <div className="flex items-center gap-1.5 px-2">
                <Calendar className="w-3.5 h-3.5 text-black/60" />
                <span className="text-xs font-bold text-black whitespace-nowrap">
                  {selectedDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <button className="text-black/40 hover:text-black transition-colors p-1"><ChevronRight className="w-4 h-4" /></button>
            </div>
            
            {/* Live Indicator */}
            <div className="bg-black/5 px-4 py-2.5 rounded-xl flex items-center gap-2 border border-black/10">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-40"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-black"></span>
              </span>
              <span className="text-xs font-bold text-black">Live</span>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-black/5">
                <th className="p-4 text-xs font-bold text-black/40 uppercase tracking-widest bg-black/[0.02]">Student Name</th>
                <th className="p-4 text-xs font-bold text-black/40 uppercase tracking-widest bg-black/[0.02]">Status</th>
                <th className="p-4 text-xs font-bold text-black/40 uppercase tracking-widest bg-black/[0.02]">Clock-In</th>
                <th className="p-4 text-xs font-bold text-black/40 uppercase tracking-widest bg-black/[0.02]">Clock-Out</th>
                <th className="p-4 text-xs font-bold text-black/40 uppercase tracking-widest bg-black/[0.02]">Verification</th>
              </tr>
            </thead>
            <tbody>
              {siswaList.map((siswa) => {
                const isCheckedIn = attendances.some(a => a.date === new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }));
                const statusLabel = isCheckedIn ? 'Hadir' : 'Belum Absen';
                return (
                  <tr key={siswa.id} className="border-b border-black/5 transition-colors cursor-pointer group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full border border-black/10 bg-black/5 flex items-center justify-center font-bold text-xs">
                          {siswa.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-bold text-sm text-black">{siswa.name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${
                        statusLabel === 'Hadir' ? 'bg-black text-white' : 'bg-white text-black border border-black border-dashed'
                      }`}>
                        {statusLabel}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-xs font-bold text-black/70">{isCheckedIn ? '07:45 WIB' : '-'}</td>
                    <td className="p-4 font-mono text-xs font-bold text-black/70">-</td>
                    <td className="p-4">
                      <button 
                        onClick={() => openMap(siswa)}
                        className="flex items-center gap-2 bg-black text-white px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-sm"
                      >
                        <MapIcon className="w-3.5 h-3.5" /> GPS & Photo
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showMapModal && selectedStudent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] max-w-2xl w-full h-[85vh] max-h-[620px] shadow-2xl flex flex-col overflow-hidden border border-black/10">
            <div className="p-4 border-b border-black/5 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                <MapIcon className="w-5 h-5 text-black" />
                <div>
                  <h3 className="font-bold text-black">Verification: {selectedStudent.name}</h3>
                  <p className="text-[10px] font-bold text-black/50 uppercase tracking-widest">{selectedStudent.in}</p>
                </div>
              </div>
              <button onClick={() => setShowMapModal(false)} className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-black/50 hover:bg-black/10 hover:text-black transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-black/5">
              {/* Map Mockup */}
              <div className="flex-1 relative min-h-[200px] border-r border-black/10">
                <div className="absolute inset-0 bg-white" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="w-32 h-32 bg-black/5 rounded-full border border-black/20 absolute -inset-14 pointer-events-none"></div>
                    <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center shadow-xl border-2 border-white relative z-10">
                      <MapPin className="w-5 h-5" />
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-3 left-3 bg-white px-3 py-1.5 rounded-xl border border-black/10 shadow-md text-[10px] font-bold text-black flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-black"></div> Geofence Valid
                </div>
              </div>
              {/* Photo Mockup */}
              <div className="w-full md:w-64 p-4 flex flex-col items-center justify-center bg-white shrink-0">
                <p className="text-xs font-bold text-black/50 uppercase tracking-wide mb-3">Selfie Clock-In</p>
                <div className="w-40 h-52 rounded-2xl overflow-hidden border border-black/10 shadow-sm bg-black/5">
                  <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80" alt="Selfie" className="w-full h-full object-cover grayscale opacity-90 hover:grayscale-0 transition-all duration-300" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- MENTOR ROSTER ---

export const MentorRoster: React.FC = () => {
  const { siswaList, submitEvaluation } = useApp();
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [gradeDUDI, setGradeDUDI] = useState('90');

  const openEval = (student: any) => {
    setSelectedStudent(student);
    setShowEvalModal(true);
  };

  const handleSaveEval = () => {
    if (selectedStudent) {
      submitEvaluation(selectedStudent.id, gradeDUDI, selectedStudent.nilaiGuru || '85', 100);
      setShowEvalModal(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col gap-4 animate-in fade-in duration-300">
      <div className="flex-1 bg-white/70 backdrop-blur-xl border border-white rounded-[24px] shadow-sm overflow-hidden flex flex-col transition-all duration-300">
        <div className="p-5 border-b border-black/5 shrink-0">
          <h3 className="font-bold text-black text-lg">Student Roster & Grading</h3>
          <p className="text-xs font-semibold text-black/50 mt-0.5">Manage and evaluate your assigned interns</p>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 content-start">
          {siswaList.map(student => (
            <div key={student.id} className="bg-white rounded-[24px] p-5 border border-black/5 shadow-sm flex flex-col transition-all duration-300">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-[16px] bg-black/5 border border-black/10 flex items-center justify-center font-bold text-sm text-black">
                  {student.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-base text-black">{student.name}</h4>
                  <p className="text-xs font-semibold text-black/50">{student.kelas} • {student.perusahaan}</p>
                </div>
              </div>
              
              <div className="space-y-3 mb-5">
                <div>
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-wide mb-1">
                    <span className="text-black/50">Attendance</span>
                    <span className="text-black">{student.kehadiran}%</span>
                  </div>
                  <div className="h-2 w-full bg-black/5 rounded-full overflow-hidden">
                    <div className="h-full bg-black rounded-full" style={{ width: `${student.kehadiran}%` }}></div>
                  </div>
                </div>
                <div className="flex justify-between items-center bg-black/5 p-2.5 rounded-xl border border-black/5">
                  <span className="text-xs font-bold text-black/60">Nilai Industri</span>
                  <span className="text-sm font-bold text-black">{student.nilaiDUDI}</span>
                </div>
              </div>

              <button 
                onClick={() => openEval(student)}
                className="mt-auto w-full bg-white border border-black/10 text-black py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 group"
              >
                <Award className="w-4 h-4 text-black/40" /> Evaluate & Grade
              </button>
            </div>
          ))}
        </div>
      </div>

      {showEvalModal && selectedStudent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] max-w-2xl w-full h-[85vh] max-h-[620px] shadow-2xl flex flex-col overflow-hidden border border-black/10">
            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-black">Evaluate Student</h3>
                  <p className="text-xs font-semibold text-black/50 mt-1">Submit monthly evaluation for {selectedStudent.name}</p>
                </div>
                <button onClick={() => setShowEvalModal(false)} className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-black/50 shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="text-xs font-bold text-black block mb-1">Nilai Evaluasi Industri (0-100)</label>
                  <input 
                    type="number" 
                    value={gradeDUDI} 
                    onChange={e => setGradeDUDI(e.target.value)}
                    className="w-full bg-black/5 border border-transparent rounded-2xl px-4 py-3 text-sm font-bold text-black outline-none focus:border-black focus:bg-white transition-all" 
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-black block mb-2">Feedback & Catatan Evaluasi</label>
                  <textarea rows={3} placeholder="Tuliskan catatan perkembangan siswa..." className="w-full bg-black/5 border border-transparent rounded-2xl px-4 py-3 text-sm font-medium text-black outline-none focus:border-black focus:bg-white transition-all resize-none"></textarea>
                </div>

                <div className="pt-4 border-t border-black/5 flex gap-3">
                  <button onClick={() => setShowEvalModal(false)} className="flex-1 py-3.5 rounded-2xl font-bold text-sm bg-black/5 text-black/60">Cancel</button>
                  <button onClick={handleSaveEval} className="flex-1 py-3.5 rounded-2xl font-bold text-sm bg-black text-white shadow-md">Submit Evaluation</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};