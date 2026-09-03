import React, { useEffect, useState } from 'react';
import { BarChart3, Loader2 } from 'lucide-react';
import { api } from '../utils/api';

type ChartItem = { name: string; count: number };
type Stats = {
  studentsPerCompany: ChartItem[];
  companyStatus: { active: number; inactive: number; full: number };
  studentLocations: ChartItem[];
  studentStatus?: { active: number; permission: number; sick: number; notPlaced: number };
  logbookStatus?: { pending: number; approved: number; revision: number };
  attendancePerStudent?: ChartItem[];
};

const chartColors = ['#2f7f95', '#e0a458', '#c96b6b', '#6c7acb', '#58a77c', '#d47baf', '#7c8794'];

const BarList: React.FC<{ title: string; items: ChartItem[]; colors?: string[] }> = ({ title, items, colors = chartColors }) => {
  const max = Math.max(...items.map(item => item.count), 1);
  return (
    <div className="bg-white border border-mist/60 rounded-[24px] p-4 shadow-sm min-w-0">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center"><BarChart3 className="w-4 h-4 text-white" /></div>
        <h3 className="text-sm font-bold text-navy">{title}</h3>
      </div>
      {items.length === 0 ? <p className="text-xs font-semibold text-navy/50 py-6 text-center">Tidak ada data untuk ditampilkan.</p> : (
        <div className="flex items-end gap-3 min-h-52 max-h-72 overflow-x-auto custom-scrollbar px-2 pb-1" style={{ perspective: '900px' }}>
          {items.map((item, index) => <div key={item.name} title={`${item.name}: ${item.count}`} className="h-52 min-w-[58px] flex-1 flex flex-col items-center justify-end gap-1">
            <span className="text-[11px] font-bold text-navy tabular-nums">{item.count}</span>
            <div className="relative w-full h-36 flex items-end">
              <div className="w-full rounded-t-lg transition-all duration-500 hover:-translate-y-1 hover:brightness-110" style={{ height: `${(item.count / max) * 100}%`, backgroundColor: colors[index % colors.length], transform: 'rotateX(8deg) rotateY(-8deg)', transformOrigin: 'bottom', boxShadow: '8px 8px 0 rgba(21,42,66,0.16), inset -6px 0 0 rgba(0,0,0,0.12), inset 5px 0 0 rgba(255,255,255,0.16)' }} />
            </div>
            <span className="w-full text-center text-[10px] font-bold text-navy/60 truncate" title={item.name}>{item.name}</span>
          </div>)}
        </div>
      )}
    </div>
  );
};

const Donut3D: React.FC<{ title: string; values: { label: string; value: number; color: string }[] }> = ({ title, values }) => {
  const total = values.reduce((sum, item) => sum + item.value, 0);
  let start = 0;
  const segments = values.map(item => {
    const end = start + (item.value / Math.max(total, 1)) * 360;
    const segment = `${item.color} ${start}deg ${end}deg`;
    start = end;
    return segment;
  });

  return (
    <div className="bg-white border border-mist/60 rounded-[24px] p-4 shadow-sm min-w-0">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center"><BarChart3 className="w-4 h-4 text-white" /></div>
        <h3 className="text-sm font-bold text-navy">{title}</h3>
      </div>
      {total === 0 ? <p className="text-xs font-semibold text-navy/50 py-6 text-center">Tidak ada data untuk ditampilkan.</p> : (
        <div className="flex items-center gap-4">
          <div className="relative w-32 h-32 shrink-0" style={{ perspective: '700px' }}>
            <div className="absolute inset-2 rounded-full transition-transform duration-300 hover:rotate-x-12" title={`Total: ${total}`} style={{ background: `conic-gradient(${segments.join(', ')})`, transform: 'rotateX(58deg) rotateZ(-12deg)', boxShadow: '0 14px 0 rgba(21,42,66,0.18), 0 18px 22px rgba(21,42,66,0.12)' }} />
            <div className="absolute inset-[34px] rounded-full bg-white border-4 border-white/90 flex items-center justify-center text-lg font-bold text-navy shadow-inner">{total}</div>
          </div>
          <div className="space-y-2 min-w-0 flex-1">{values.map(item => <div key={item.label} className="flex items-center gap-2 text-[11px] font-bold text-navy/70"><span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.color, boxShadow: '2px 2px 0 rgba(21,42,66,0.16)' }} /> <span className="truncate">{item.label}</span><span className="ml-auto text-navy tabular-nums">{item.value}</span></div>)}</div>
        </div>
      )}
    </div>
  );
};

export const DashboardCharts: React.FC<{ role: 'super_admin' | 'hubin' | 'teacher' | 'mentor'; location?: string }> = ({ role, location }) => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const query = location ? `?location=${encodeURIComponent(location)}` : '';
    setStats(null);
    setError(false);
    api.get<Stats>(`/api/dashboard/stats${query}`).then(result => { if (!cancelled) setStats(result); }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [role, location]);

  if (error) return <div className="bg-navy/5 border border-navy/15 rounded-[24px] p-4 text-xs font-semibold text-navy">Gagal memuat statistik.</div>;
  if (!stats) return <div className="flex items-center justify-center gap-2 p-8 text-navy/60"><Loader2 className="w-4 h-4 animate-spin text-steel" /><span className="text-xs font-semibold">Memuat statistik...</span></div>;

  if (role === 'teacher') return <div className="grid grid-cols-1 lg:grid-cols-2 gap-3"><Donut3D title="Status Siswa Bimbingan" values={[{ label: 'Aktif PKL', value: stats.studentStatus?.active || 0, color: '#2f7f95' }, { label: 'Izin', value: stats.studentStatus?.permission || 0, color: '#e0a458' }, { label: 'Sakit', value: stats.studentStatus?.sick || 0, color: '#c96b6b' }, { label: 'Belum Ditempatkan', value: stats.studentStatus?.notPlaced || 0, color: '#7c8794' }]} /><BarList title="Siswa per Perusahaan Bimbingan" items={stats.studentsPerCompany} /></div>;
  if (role === 'mentor') return <div className="grid grid-cols-1 lg:grid-cols-2 gap-3"><Donut3D title="Status Logbook Siswa" values={[{ label: 'Pending', value: stats.logbookStatus?.pending || 0, color: '#e0a458' }, { label: 'Approved', value: stats.logbookStatus?.approved || 0, color: '#2f7f95' }, { label: 'Revision', value: stats.logbookStatus?.revision || 0, color: '#c96b6b' }]} /><BarList title="Kehadiran Siswa" items={stats.attendancePerStudent || []} /></div>;
  return <div className="grid grid-cols-1 lg:grid-cols-2 gap-3"><BarList title="Jumlah Siswa per Perusahaan" items={stats.studentsPerCompany} /><Donut3D title="Status Perusahaan" values={[{ label: 'Aktif', value: stats.companyStatus.active, color: '#2f7f95' }, { label: 'Tidak Aktif', value: stats.companyStatus.inactive, color: '#7c8794' }, { label: 'Kuota Penuh', value: stats.companyStatus.full, color: '#e0a458' }]} />{role === 'hubin' && <BarList title="Distribusi Siswa berdasarkan Lokasi" items={stats.studentLocations} />}</div>;
};
