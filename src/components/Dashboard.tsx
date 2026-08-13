import React, { useState, useEffect } from 'react';
import { Edit2, Check, Play, Pause, Square, Bell } from 'lucide-react';
import { LogEntry, AttendanceRecord } from '../types';

interface DashboardProps {
  userName: string;
  recentLogs: LogEntry[];
  attendances: AttendanceRecord[];
  onOpenLogbookModal: () => void;
  onCheckIn: () => void;
  onGoToProfile: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ userName, attendances, onGoToProfile }) => {
  const totalHadir = attendances.filter(a => a.status === 'Hadir').length;
  const totalDays = 90;
  const pct = Math.round((totalHadir / totalDays) * 100);

  /* clock */
  const [time, setTime] = useState(new Date());
  const [mode, setMode] = useState<'clock' | 'sw'>('clock');
  const [sw, setSw] = useState(0);
  const [swRun, setSwRun] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!swRun) return;
    const t = setInterval(() => setSw(p => p + 1), 1000);
    return () => clearInterval(t);
  }, [swRun]);

  const fmtSw = (s: number) => {
    const m = Math.floor(s / 60), sec = s % 60;
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };

  /* todos — editable text */
  const [todos, setTodos] = useState([
    { id: 1, text: 'Interview Session', done: true },
    { id: 2, text: 'Team Meeting', done: true },
    { id: 3, text: 'Project Update', done: false },
    { id: 4, text: 'Discuss Q3 Goals', done: false },
  ]);
  const [editing, setEditing] = useState(false);
  const done = todos.filter(t => t.done).length;

  /* notes */
  const [notes, setNotes] = useState('- ID Card Digital\n- Laptop Pribadi\n- Jurnal Cetak\n- Alat Tulis\n\nPastikan selalu kemeja rapi!');
  const [editNotes, setEditNotes] = useState(false);

  /* notifications */
  const notifications = [
    { id: 1, title: 'Logbook Disetujui', time: '10 menit yang lalu', unread: true },
    { id: 2, title: 'Jadwal Meeting Pembimbing', time: '1 jam yang lalu', unread: true },
    { id: 3, title: 'Pengumuman Libur Nasional', time: 'Kemarin', unread: false },
    { id: 4, title: 'Tugas Baru: UI Design', time: 'Kemarin', unread: false },
  ];

  return (
    <div className="h-full w-full flex flex-col gap-4">

      {/* ── Header ── */}
      <div className="shrink-0 flex items-center justify-between c0">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-black/60">Selamat Pagi</p>
          <h1 className="text-3xl font-bold text-black leading-tight">{userName}</h1>
        </div>
        <div className="flex items-center gap-2 bg-white/70 backdrop-blur-sm border border-white rounded-2xl px-4 py-2 shadow-sm">
          <div className="w-2.5 h-2.5 rounded-full bg-black"></div>
          <span className="text-sm font-bold text-black/80">
            {time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* ── Top Row: 4 Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0 h-[240px]">

        {/* Profile */}
        <button
          onClick={onGoToProfile}
          className="c1 bg-white/70 backdrop-blur-xl rounded-[24px] border border-white shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col items-center justify-center gap-3 p-5 relative overflow-hidden hover:bg-white/90"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-transparent pointer-events-none" />
          <div className="relative w-[80px] h-[80px] rounded-[24px] overflow-hidden ring-2 ring-white ring-offset-1 shadow-md">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
              alt="Avatar"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-black rounded-full border-2 border-white" />
          </div>
          <div className="text-center">
            <p className="text-base font-bold text-black leading-tight">Budi Santoso</p>
            <p className="text-xs font-semibold text-black/60 mt-0.5">Siswa PKL · IT</p>
          </div>
          <div className="w-full bg-black rounded-xl py-2 px-3 flex justify-between items-center mt-auto">
            <span className="text-xs font-semibold text-white/70">Tempat</span>
            <span className="text-xs font-bold text-white">PT Tokopedia</span>
          </div>
        </button>

        {/* Kehadiran — solid white */}
        <div className="c2 bg-white rounded-[24px] border border-black/5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col p-5">
          <div className="flex items-start justify-between mb-auto">
            <div>
              <span className="inline-block bg-black/5 text-black/70 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">Progress PKL</span>
              <p className="text-sm font-bold text-black mt-2">Kehadiran</p>
            </div>
          </div>
          <div className="mt-auto">
            <div className="flex items-baseline gap-1.5">
              <span className="text-6xl font-light text-black tabular-nums tracking-tight">{totalHadir}</span>
              <span className="text-sm font-semibold text-black/50">/ {totalDays}</span>
            </div>
            <div className="mt-3 w-full h-2 bg-black/5 rounded-full overflow-hidden">
              <div className="h-full bg-black rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-xs font-bold text-black/60 mt-2">{pct}% dari target</p>
          </div>
        </div>

        {/* Clock / Stopwatch */}
        <div className="c3 bg-white/70 backdrop-blur-xl rounded-[24px] border border-white shadow-sm hover:shadow-md transition-all duration-300 flex flex-col p-4">
          <div className="flex gap-1 bg-black/5 p-1 rounded-full mb-3">
            <button onClick={() => setMode('clock')} className={`flex-1 text-xs font-bold py-1.5 rounded-full transition-all ${mode === 'clock' ? 'bg-black text-white shadow' : 'text-black/60'}`}>Jam</button>
            <button onClick={() => setMode('sw')} className={`flex-1 text-xs font-bold py-1.5 rounded-full transition-all ${mode === 'sw' ? 'bg-black text-white shadow' : 'text-black/60'}`}>Stopwatch</button>
          </div>

          {mode === 'clock' ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <span className="text-5xl font-light text-black font-mono tabular-nums leading-none">
                {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="text-sm font-bold text-black/50 mt-2 tabular-nums">
                :{String(time.getSeconds()).padStart(2,'0')}
              </span>
              <span className="text-xs font-semibold text-black/50 mt-1.5">
                {time.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <span className="text-5xl font-light text-black font-mono tabular-nums">{fmtSw(sw)}</span>
              <div className="flex gap-3">
                <button
                  onClick={() => setSwRun(!swRun)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-all hover:scale-105 border ${swRun ? 'bg-white border-black/10 text-black' : 'bg-black border-black text-white'}`}
                >
                  {swRun ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                </button>
                <button
                  onClick={() => { setSwRun(false); setSw(0); }}
                  className="w-10 h-10 rounded-full bg-white border border-black/10 flex items-center justify-center text-black/70 hover:bg-black/5 transition-all hover:scale-105 shadow-sm"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Onboarding Todo List */}
        <div className="c4 bg-black rounded-[24px] border border-black/80 shadow-lg flex flex-col p-5 text-white">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-white/60">Onboarding</p>
              <p className="text-sm font-bold text-white">Task List</p>
            </div>
            <div className="flex items-center gap-2">
              {!editing && (
                <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full text-white/90">
                  {done}/{todos.length}
                </span>
              )}
              <button
                onClick={() => setEditing(!editing)}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${editing ? 'bg-white text-black' : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'}`}
              >
                {editing ? <Check className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-between gap-2 overflow-hidden">
            {todos.map((todo, i) => (
              <div key={todo.id} className="flex items-center gap-3 min-h-0">
                {editing ? (
                  <input
                    value={todo.text}
                    onChange={e => {
                      const next = [...todos];
                      next[i] = { ...next[i], text: e.target.value };
                      setTodos(next);
                    }}
                    className="flex-1 bg-white/10 border border-white/30 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-white transition-all min-w-0"
                  />
                ) : (
                  <button
                    onClick={() => setTodos(todos.map((t, idx) => idx === i ? { ...t, done: !t.done } : t))}
                    className="flex items-center gap-3 w-full text-left group min-w-0"
                  >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-all ${todo.done ? 'bg-white border-white' : 'border-white/30 group-hover:border-white/60'}`}>
                      {todo.done && <Check className="w-3.5 h-3.5 text-black" />}
                    </div>
                    <span className={`text-sm font-semibold leading-tight transition-all truncate ${todo.done ? 'line-through text-white/40' : 'text-white'}`}>
                      {todo.text}
                    </span>
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Progress strip */}
          <div className="mt-4 pt-4 border-t border-white/10 shrink-0">
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${(done / todos.length) * 100}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Row: Notes + Notifications ── */}
      <div className="flex gap-4 flex-1 min-h-0">

        {/* Personal Notes */}
        <div className="c5 hidden lg:flex flex-col w-[300px] shrink-0 bg-white/70 backdrop-blur-xl rounded-[24px] border border-white shadow-sm h-full hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between p-5 pb-3 shrink-0">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-black/60">Catatan</p>
              <p className="text-sm font-bold text-black">Personal Notes</p>
            </div>
            <button
              onClick={() => setEditNotes(!editNotes)}
              className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all shadow-sm ${editNotes ? 'bg-black text-white border-black' : 'bg-white text-black/60 border-black/10 hover:border-black/30'}`}
            >
              {editNotes ? <Check className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex-1 mx-4 mb-4 bg-white/80 rounded-[24px] border border-black/5 overflow-hidden shadow-inner">
            {editNotes ? (
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full h-full p-4 text-sm font-medium text-black bg-transparent outline-none resize-none leading-relaxed"
                placeholder="Ketik catatanmu..."
              />
            ) : (
              <div className="w-full h-full overflow-y-auto custom-scrollbar p-4 text-sm font-medium text-black/80 whitespace-pre-line leading-relaxed">
                {notes || <span className="text-black/40 italic text-xs">Belum ada catatan.</span>}
              </div>
            )}
          </div>
        </div>

        {/* Notifications */}
        <div className="c5 flex-1 bg-white/70 backdrop-blur-xl rounded-[24px] border border-white shadow-sm h-full flex flex-col hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between p-5 pb-3 shrink-0">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-black/60">Pembaruan</p>
              <p className="text-sm font-bold text-black">Notifikasi Terkini</p>
            </div>
            <button className="bg-black text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-black/80 transition-colors">
              Tandai Dibaca
            </button>
          </div>

          <div className="flex-1 mx-4 mb-4 bg-white/80 rounded-[24px] border border-black/5 shadow-inner flex flex-col overflow-hidden p-3 min-h-0">
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-2">
              {notifications.map((notif) => (
                <div key={notif.id} className="flex gap-4 p-3 rounded-[16px] hover:bg-white transition-colors cursor-pointer group border border-transparent hover:border-black/5 hover:shadow-sm">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notif.unread ? 'bg-black text-white' : 'bg-black/5 text-black/40'}`}>
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm font-bold truncate ${notif.unread ? 'text-black' : 'text-black/70'}`}>
                        {notif.title}
                      </p>
                      {notif.unread && (
                        <div className="w-2 h-2 rounded-full bg-black shrink-0" />
                      )}
                    </div>
                    <p className="text-xs font-semibold text-black/50 mt-0.5">
                      {notif.time}
                    </p>
                  </div>
                </div>
              ))}
              <div className="mt-2 text-center py-4">
                <p className="text-xs font-bold text-black/40">Tidak ada notifikasi lainnya</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
