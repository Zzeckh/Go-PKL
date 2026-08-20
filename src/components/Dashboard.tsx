import React, { useState, useEffect } from 'react';
import { 
  Edit2, Check, Play, Pause, Square, Bell, MapPin, Clock, 
  BookOpen, UserCheck, Zap, CheckCircle2, ArrowRight, 
  Target, Calendar, ChevronRight, Plus, X, ShieldCheck, ShieldAlert
} from 'lucide-react';
import { LogEntry, AttendanceRecord } from '../types';
import { useApp } from '../context/AppContext';

interface DashboardProps {
  userName: string;
  recentLogs: LogEntry[];
  attendances: AttendanceRecord[];
  onOpenLogbookModal: () => void;
  onCheckIn: () => void;
  onGoToProfile: () => void;
  onNavigate?: (page: string) => void;
}

/* ── Indikator "Mode Edit" dengan dot pulse ── */
const EditModeBadge = () => (
  <span className="flex items-center gap-1.5 text-[11px] font-bold text-steel bg-steel/10 px-2.5 py-1 rounded-full">
    <span className="w-1.5 h-1.5 rounded-full bg-steel animate-pulse" />
    Mode Edit
  </span>
);

export const Dashboard: React.FC<DashboardProps> = ({ 
  userName, 
  recentLogs,
  attendances, 
  onOpenLogbookModal,
  onCheckIn,
  onGoToProfile,
  onNavigate
}) => {
  const totalHadir = attendances.filter(a => a.status === 'Hadir').length;
  const totalDays = 90;
  const pct = Math.min(100, Math.round((totalHadir / totalDays) * 100));

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
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  /* ── Tasks ── */
  const [todos, setTodos] = useState([
    { id: 1, text: 'Interview Session', done: true },
    { id: 2, text: 'Team Meeting', done: true },
    { id: 3, text: 'Project Update', done: false },
    { id: 4, text: 'Discuss Q3 Goals', done: false },
  ]);
  const [editing, setEditing] = useState(false);
  const [newTodo, setNewTodo] = useState('');
  const done = todos.filter(t => t.done).length;

  const addTodo = () => {
    if (!newTodo.trim()) return;
    setTodos(prev => [...prev, { id: Date.now(), text: newTodo.trim(), done: false }]);
    setNewTodo('');
  };

  const deleteTodo = (id: number) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  };

  /* ── Notes ── */
  const [notes, setNotes] = useState('- ID Card Digital\n- Laptop Pribadi\n- Jurnal Cetak\n- Alat Tulis\n\nPastikan selalu kemeja rapi!');
  const [editNotes, setEditNotes] = useState(false);

  const { perizinanList } = useApp();

  const notifications = [
    ...recentLogs.filter(log => log.status === 'approved' || log.status === 'revision').map((log) => ({
      id: Number(log.id.replace('LOG-', '')),
      title: log.status === 'approved' ? `Logbook Disetujui: ${log.title}` : `Logbook Revisi: ${log.title}`,
      time: log.date,
      unread: log.status === 'revision',
      type: 'logbook' as const,
    })),
    ...perizinanList.filter(p => p.status === 'approved' || p.status === 'rejected').map((p) => ({
      id: p.id + 10000,
      title: p.status === 'approved' ? `Izin Disetujui: ${p.type} ${p.date}` : `Izin Ditolak: ${p.type} ${p.date}`,
      time: p.date,
      unread: p.status === 'rejected',
      type: 'perizinan' as const,
    })),
  ].slice(0, 5);

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getGreeting = () => {
    const hour = time.getHours();
    if (hour < 11) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const checkedInToday = attendances.some(a => a.date === today);

  const todayIdx = (new Date().getDay() + 6) % 7;
  const weekData = Array.from({ length: 7 }, (_, i) => {
    const target = new Date();
    target.setDate(target.getDate() - (todayIdx - i));
    const key = target.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    return attendances.some(a => a.date === key && a.status === 'Hadir') ? 1 : 0;
  });

  const statusStyle = (s: string) =>
    s === 'approved' ? 'bg-steel/15 text-steel'
    : s === 'revision' ? 'bg-navy text-white'
    : 'bg-mist text-navy/70';
  const statusLabel = (s: string) =>
    s === 'approved' ? 'Disetujui' : s === 'revision' ? 'Revisi' : 'Menunggu';

  return (
    <div className="h-full flex flex-col gap-3 md:gap-4 overflow-y-auto custom-scrollbar">
      
      {/* ── HEADER ─ */}
      <div className="flex items-center justify-between shrink-0 c0">
        <div className="flex items-center gap-3 min-w-0">
          <button 
            onClick={onGoToProfile}
            className="w-12 h-12 rounded-[24px] bg-navy text-white flex items-center justify-center font-bold text-lg shadow-md shadow-steel/40 shrink-0 hover:scale-105 transition-transform"
          >
            {getInitials(userName)}
          </button>
          <div className="min-w-0">
            <p className="text-[13px] font-bold uppercase tracking-widest text-steel">{getGreeting()}</p>
            <h1 className="text-xl md:text-2xl font-bold text-navy leading-tight truncate">{userName || 'User'}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white/70 backdrop-blur-sm border border-white rounded-full px-4 py-2 shadow-sm shrink-0">
          <Calendar className="w-4 h-4 text-steel" />
          <span className="text-xs md:text-sm font-bold text-navy/80 tabular-nums">
            {time.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
          </span>
        </div>
      </div>

      {/* ── ROW 1 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 md:gap-4 shrink-0">
        
        {/* ⭐ HERO CTA */}
        <div className="lg:col-span-2 c1 bg-navy text-white rounded-[24px] p-6 relative overflow-hidden h-[210px] flex flex-col justify-between shadow-xl shadow-steel/30 border border-white/10">
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${checkedInToday ? 'bg-steel' : 'bg-mist animate-pulse'}`} />
              <span className="text-xs font-bold uppercase tracking-widest text-white/60">
                {checkedInToday ? 'Sudah Absen Hari Ini' : 'Siap Untuk Absen'}
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold leading-tight">
              {checkedInToday ? 'Kerja Bagus! 👋' : 'Saatnya Absen!'}
            </h2>
            <p className="text-sm text-white/70 mt-1 flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              PT Tokopedia Tower • GPS Valid
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-3">
            <button
              onClick={() => {
                if (!checkedInToday) {
                  onNavigate ? onNavigate('absensi') : onCheckIn();
                }
              }}
              disabled={checkedInToday}
              className="flex-1 bg-white text-navy font-bold py-3.5 px-5 rounded-[24px] flex items-center justify-center gap-2 hover:bg-shell transition-all shadow-lg shadow-navy/30 disabled:opacity-60 disabled:cursor-not-allowed group"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>{checkedInToday ? 'Sudah Absen' : 'Absen Sekarang'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button 
              onClick={onOpenLogbookModal}
              className="w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-[24px] flex items-center justify-center transition-all border border-white/20 shrink-0"
              title="Buka Logbook"
            >
              <BookOpen className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 📊 Attendance */}
        <div className="c2 bg-white rounded-[24px] border border-mist/60 shadow-sm p-5 h-[210px] flex flex-col">
          <div className="flex items-center justify-between shrink-0">
            <div className="w-9 h-9 rounded-[24px] bg-mist/70 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-steel" />
            </div>
            <span className="text-xs font-bold text-navy/40 uppercase tracking-wider">Kehadiran</span>
          </div>

          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-3xl font-light text-navy tabular-nums tracking-tight">{totalHadir}</span>
            <span className="text-sm font-semibold text-navy/50">/ {totalDays}</span>
            <span className="ml-auto text-sm font-bold text-steel">{pct}%</span>
          </div>
          <div className="w-full h-1.5 bg-mist/60 rounded-full overflow-hidden mt-2">
            <div 
              className="h-full bg-steel rounded-full transition-all duration-1000 ease-out" 
              style={{ width: `${pct}%` }} 
            />
          </div>

          <div className="mt-auto pt-3">
            <div className="flex items-end gap-1 h-8">
              {weekData.map((v, i) => (
                <div 
                  key={i} 
                  className={`flex-1 rounded-full transition-all duration-500 ${v ? 'bg-steel' : 'bg-mist/60'} ${i === todayIdx ? 'ring-2 ring-mist' : ''}`}
                  style={{ height: v ? '100%' : '30%' }}
                />
              ))}
            </div>
            <div className="flex gap-1 mt-1">
              {['S', 'S', 'R', 'K', 'J', 'S', 'M'].map((d, i) => (
                <span key={i} className={`flex-1 text-center text-[10px] font-bold ${i === todayIdx ? 'text-steel' : 'text-navy/30'}`}>
                  {d}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 🕐 Clock */}
        <div className="c3 bg-white/70 backdrop-blur-xl rounded-[24px] border border-white shadow-sm p-4 h-[210px] flex flex-col">
          <div className="flex gap-1 bg-mist/60 p-1 rounded-full mb-2">
            <button 
              onClick={() => setMode('clock')} 
              className={`flex-1 text-xs font-bold py-1.5 rounded-full transition-all ${mode === 'clock' ? 'bg-steel text-white shadow' : 'text-navy/60'}`}
            >
              Jam
            </button>
            <button 
              onClick={() => setMode('sw')} 
              className={`flex-1 text-xs font-bold py-1.5 rounded-full transition-all ${mode === 'sw' ? 'bg-steel text-white shadow' : 'text-navy/60'}`}
            >
              Stopwatch
            </button>
          </div>

          {mode === 'clock' ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <span className="text-4xl md:text-5xl font-light text-navy font-mono tabular-nums leading-none">
                {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="text-sm font-bold text-steel mt-2 tabular-nums">
                :{String(time.getSeconds()).padStart(2, '0')}
              </span>
              <div className="mt-3 flex items-center gap-1.5 text-[13px] font-semibold text-navy/50">
                <Clock className="w-3.5 h-3.5" />
                <span>{time.toLocaleDateString('id-ID', { weekday: 'long' })}</span>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <span className="text-4xl md:text-5xl font-light text-navy font-mono tabular-nums">{fmtSw(sw)}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSwRun(!swRun)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-all hover:scale-105 border ${swRun ? 'bg-white border-mist text-navy' : 'bg-steel border-steel text-white'}`}
                >
                  {swRun ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                </button>
                <button
                  onClick={() => { setSwRun(false); setSw(0); }}
                  className="w-10 h-10 rounded-full bg-white border border-mist flex items-center justify-center text-navy/70 hover:bg-mist/50 transition-all hover:scale-105 shadow-sm"
                >
                  <Square className="w-4 h-4 fill-current" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── ROW 2 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 md:gap-4 flex-1 min-h-[260px]">
        
        {/* ✓ Tasks — dengan Mode Edit + Indikator */}
        <div className={`c4 bg-white rounded-[24px] border shadow-sm p-5 flex flex-col min-h-0 transition-all ${editing ? 'border-steel/40 ring-2 ring-steel/20' : 'border-mist/60'}`}>
          <div className="flex items-center justify-between mb-4 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center">
                <Target className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-navy/60 leading-none">Onboarding</p>
                <p className="text-sm font-bold text-navy leading-tight mt-0.5">Tasks</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {editing ? (
                <EditModeBadge />
              ) : (
                <span className="text-xs font-bold bg-mist/70 px-2.5 py-1 rounded-full text-navy/70">
                  {done}/{todos.length}
                </span>
              )}
              <button
                onClick={() => setEditing(!editing)}
                title={editing ? 'Selesai edit' : 'Edit tasks'}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${editing ? 'bg-steel text-white shadow-md shadow-steel/30' : 'bg-mist/60 text-navy/60 hover:bg-mist'}`}
              >
                {editing ? <Check className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto custom-scrollbar min-h-0">
            {todos.map((todo, i) => (
              <div key={todo.id} className="flex items-center gap-2 min-h-0 group/item">
                {editing ? (
                  <>
                    <input
                      value={todo.text}
                      onChange={e => {
                        const next = [...todos];
                        next[i] = { ...next[i], text: e.target.value };
                        setTodos(next);
                      }}
                      className="flex-1 bg-mist/30 border border-mist focus:border-steel rounded-lg px-3 py-1.5 text-sm text-navy outline-none transition-all min-w-0"
                    />
                    <button
                      onClick={() => deleteTodo(todo.id)}
                      title="Hapus task"
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-navy/40 hover:bg-navy/5 hover:text-navy/70 transition-colors shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setTodos(todos.map((t, idx) => idx === i ? { ...t, done: !t.done } : t))}
                    className="flex items-center gap-2.5 w-full text-left group min-w-0"
                  >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${todo.done ? 'bg-steel border-steel' : 'border-navy/20 group-hover:border-steel/60'}`}>
                      {todo.done && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className={`text-sm font-semibold leading-tight transition-all truncate ${todo.done ? 'line-through text-navy/40' : 'text-navy'}`}>
                      {todo.text}
                    </span>
                  </button>
                )}
              </div>
            ))}

            {/* Input tambah task (hanya saat edit) */}
            {editing && (
              <div className="flex items-center gap-2 pt-1 shrink-0">
                <input
                  value={newTodo}
                  onChange={e => setNewTodo(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addTodo()}
                  placeholder="Task baru..."
                  className="flex-1 bg-transparent border-b border-dashed border-steel/40 focus:border-steel text-sm text-navy outline-none transition-all min-w-0 py-1.5 placeholder:text-navy/30"
                />
                <button
                  onClick={addTodo}
                  disabled={!newTodo.trim()}
                  title="Tambah task"
                  className="w-7 h-7 rounded-lg flex items-center justify-center bg-steel/10 text-steel hover:bg-steel hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-mist/60 shrink-0">
            <div className="w-full h-1.5 bg-mist/60 rounded-full overflow-hidden">
              <div 
                className="h-full bg-steel rounded-full transition-all duration-700" 
                style={{ width: `${todos.length ? (done / todos.length) * 100 : 0}%` }} 
              />
            </div>
            <p className="text-xs font-bold text-steel mt-1.5">
              {todos.length ? Math.round((done / todos.length) * 100) : 0}% selesai
            </p>
          </div>
        </div>

        {/* 🔔 Notifications */}
        <div className="lg:col-span-2 c5 bg-white/70 backdrop-blur-xl rounded-[24px] border border-white shadow-sm flex flex-col min-h-0">
          <div className="flex items-center justify-between p-5 pb-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center relative">
                <Bell className="w-4 h-4 text-white" />
                {notifications.filter(n => n.unread).length > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-steel rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-white/70">
                    {notifications.filter(n => n.unread).length}
                  </div>
                )}
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-navy/60 leading-none">Pembaruan</p>
                <p className="text-sm font-bold text-navy leading-tight mt-0.5">Notifikasi</p>
              </div>
            </div>
            <button className="text-xs font-bold text-steel hover:text-steel/70 transition-colors">
              Tandai Dibaca
            </button>
          </div>

          <div className="flex-1 px-3 pb-3 min-h-0 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1 p-1">
              {notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className="flex gap-3 p-3 rounded-[24px] hover:bg-white/60 transition-colors cursor-pointer group"
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${notif.unread ? 'bg-steel text-white' : 'bg-mist/60 text-navy/40'}`}>
                    {notif.unread ? (
                      (notif as any).type === 'perizinan' ? <ShieldAlert className="w-4 h-4" /> : <Bell className="w-4 h-4" />
                    ) : (
                      (notif as any).type === 'perizinan' ? <ShieldCheck className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm font-bold truncate ${notif.unread ? 'text-navy' : 'text-navy/70'}`}>
                        {notif.title}
                      </p>
                      {notif.unread && (
                        <div className="w-2 h-2 rounded-full bg-steel shrink-0" />
                      )}
                    </div>
                    <p className="text-[13px] font-semibold text-navy/50 mt-0.5">
                      {notif.time}
                    </p>
                  </div>
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="flex-1 flex items-center justify-center py-8">
                  <p className="text-sm font-medium text-navy/40">Tidak ada notifikasi</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 📝 Notes — dengan Mode Edit + Indikator */}
        <div className={`c5 bg-white/70 backdrop-blur-xl rounded-[24px] border shadow-sm flex flex-col min-h-0 transition-all ${editNotes ? 'border-steel/40 ring-2 ring-steel/20' : 'border-white'}`}>
          <div className="flex items-center justify-between p-5 pb-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-mist/70 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-navy" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-navy/60 leading-none">Catatan</p>
                <p className="text-sm font-bold text-navy leading-tight mt-0.5">Notes</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {editNotes && <EditModeBadge />}
              <button
                onClick={() => setEditNotes(!editNotes)}
                title={editNotes ? 'Simpan catatan' : 'Edit catatan'}
                className={`w-8 h-8 rounded-[24px] flex items-center justify-center border transition-all ${editNotes ? 'bg-navy text-white border-navy shadow-md shadow-navy/30' : 'bg-white text-navy/60 border-mist hover:border-steel hover:text-steel'}`}
              >
                {editNotes ? <Check className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          <div className="flex-1 px-5 pb-4 min-h-0 flex flex-col">
            {editNotes ? (
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                autoFocus
                className="w-full flex-1 min-h-[120px] text-sm font-medium text-navy bg-white/60 border border-mist focus:border-steel rounded-[24px] p-3 outline-none resize-none leading-relaxed placeholder:text-navy/40 transition-all"
                placeholder="Ketik catatanmu..."
              />
            ) : (
              <div className="w-full flex-1 min-h-[120px] overflow-y-auto custom-scrollbar text-sm font-medium text-navy/80 whitespace-pre-line leading-relaxed">
                {notes || <span className="text-navy/40 italic text-xs">Belum ada catatan.</span>}
              </div>
            )}
            {/* Footer indikator karakter saat edit */}
            {editNotes && (
              <div className="flex items-center justify-between pt-2 shrink-0">
                <span className="text-[11px] font-semibold text-navy/40">
                  Tekan ✓ untuk menyimpan
                </span>
                <span className="text-[11px] font-bold text-steel tabular-nums">
                  {notes.length} karakter
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── ROW 3 ── */}
      <div className="c5 shrink-0 bg-white/70 backdrop-blur-xl rounded-[24px] border border-white shadow-sm">
        <div className="flex items-center justify-between p-5 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-steel/15 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-steel" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-navy/60 leading-none">Logbook</p>
              <p className="text-sm font-bold text-navy leading-tight mt-0.5">Aktivitas Terbaru</p>
            </div>
          </div>
          <button 
            onClick={onOpenLogbookModal} 
            className="flex items-center gap-1 text-xs font-bold text-steel hover:text-steel/70 transition-colors"
          >
            Lihat Semua <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {recentLogs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-mist/60 px-5 pb-5">
            {recentLogs.slice(0, 3).map(log => (
              <div key={log.id} className="py-3 md:py-2 md:px-5 md:first:pl-0 md:last:pr-0 flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-navy/40">{log.date}</span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${statusStyle(log.status)}`}>
                    {statusLabel(log.status)}
                  </span>
                </div>
                <p className="text-sm font-bold text-navy leading-snug line-clamp-2">{log.title}</p>
                <p className="text-[13px] font-semibold text-navy/50">{log.hours} jam • {log.category}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 pb-6 pt-2 text-center">
            <p className="text-sm font-medium text-navy/40">Belum ada aktivitas. Tulis logbook pertamamu! ✍️</p>
          </div>
        )}
      </div>
    </div>
  );
};