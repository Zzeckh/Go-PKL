import React, { useEffect, useState } from 'react';
import {
  UserRound, Phone, MapPin, School, Building2, Pencil, Check, X,
  Loader2, IdCard, ShieldCheck, BadgeCheck, CheckCircle2,
} from 'lucide-react';
import { api } from '../utils/api';

const emptyProfile = { name: '', email: '', nis: '', gender: '', birthPlace: '', birthDate: '', major: '', concentration: '', address: '', whatsapp: '', parentName: '', parentAddress: '', parentPhone: '', teacherName: '', teacherNip: '', className: '', schoolName: 'SMKN Negeri 11 Bandung', schoolAddress: 'Cilember, Bandung 40175' };
const display = (v: unknown) => v === null || v === undefined || v === '' ? 'Belum diisi' : String(v);
const dateFmt = (v: unknown) => v ? new Date(String(v)).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Belum diisi';
const isoVal = (v: unknown) => (v ? String(v).slice(0, 10) : '');

/* field mandiri (tanggung jawab siswa) — untuk bar kelengkapan */
const SELF_KEYS = ['gender', 'birthPlace', 'birthDate', 'concentration', 'address', 'whatsapp', 'parentName', 'parentAddress', 'parentPhone'];
const countFilled = (d: any) => SELF_KEYS.filter((k) => { const v = d?.[k]; return v !== null && v !== undefined && String(v).trim() !== ''; }).length;

/* ── Indikator "Mode Edit" — identik dengan dashboard ── */
const EditModeBadge = () => (
  <span className="flex items-center gap-1.5 text-[11px] font-bold text-steel bg-steel/10 px-2.5 py-1 rounded-full shrink-0">
    <span className="w-1.5 h-1.5 rounded-full bg-steel animate-pulse" />
    Mode Edit
  </span>
);

type Kind = 'text' | 'date' | 'textarea' | 'gender';
type Row = [string, string, unknown, boolean, Kind?];

export const ProfileIntern: React.FC = () => {
  const [profile, setProfile] = useState<any>(emptyProfile);
  const [draft, setDraft] = useState<any>(emptyProfile);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const user = await api.get<any>('/api/auth/me'); setProfile(user); setDraft(user); }
    catch (e: any) { setError(e?.message || 'Profil gagal dimuat'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const change = (key: string, value: string) => setDraft((p: any) => ({ ...p, [key]: value }));

  const startEdit = () => { setError(''); setSaved(false); setEditing(true); };
  const cancelEdit = () => { setDraft(profile); setError(''); setEditing(false); };

  const save = async () => {
    setSaving(true); setError('');
    try {
      const user = await api.put<any>('/api/auth/profile', {
        whatsapp: draft.whatsapp || null, gender: draft.gender || null,
        birthPlace: draft.birthPlace || null, birthDate: draft.birthDate || null,
        concentration: draft.concentration || null, address: draft.address || null,
        parentName: draft.parentName || null, parentAddress: draft.parentAddress || null,
        parentPhone: draft.parentPhone || null,
      });
      setProfile(user); setDraft(user); setEditing(false);
      setSaved(true); window.setTimeout(() => setSaved(false), 2000);
    } catch (e: any) { setError(e?.message || 'Profil gagal disimpan'); }
    finally { setSaving(false); }
  };

  const name = display(profile.name);
  const initials = name.split(' ').map((x: string) => x[0]).slice(0, 2).join('').toUpperCase();
  const filled = countFilled(draft);
  const pct = Math.round((filled / SELF_KEYS.length) * 100);
  const complete = pct === 100;

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <div className="flex items-center gap-2 text-sm font-bold text-navy/50">
        <Loader2 className="w-4 h-4 animate-spin text-steel" /> Memuat profil…
      </div>
    </div>
  );

  return (
    <div className="h-full w-full overflow-y-auto custom-scrollbar flex flex-col gap-3 md:gap-4">

      {/* ── c0 · HERO navy (shrink-0: kunci tinggi alami, tak ter-crop) ── */}
      <section className="c0 shrink-0 relative overflow-hidden rounded-[24px] bg-navy text-white p-6 md:p-8 shadow-xl shadow-steel/30 border border-white/10">
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center gap-5">
          <div className="w-24 h-24 rounded-[20px] bg-white/15 border border-white/20 flex items-center justify-center text-3xl font-extrabold shrink-0 shadow-lg shadow-black/20">
            {initials}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold truncate">{name}</h1>
              <span className="px-3 py-1 rounded-full bg-steel text-[10px] font-extrabold uppercase tracking-wider shrink-0">Siswa PKL</span>
              {editing && <EditModeBadge />}
            </div>
            <p className="text-white/65 text-sm font-semibold mt-1 truncate">{display(profile.className)} · {display(profile.major)}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              <HeroBadge icon={<IdCard className="w-3.5 h-3.5" />} text={`NIS ${display(profile.nis)}`} />
              {profile.companyName && <HeroBadge icon={<MapPin className="w-3.5 h-3.5" />} text={String(profile.companyName)} />}
            </div>
          </div>

          {/* aksi global */}
          <div className="flex items-center gap-2 self-start shrink-0">
            {saved && !editing && (
              <span className="px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-[11px] font-bold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-steel" /> Tersimpan
              </span>
            )}
            {!editing ? (
              <button onClick={startEdit}
                className="px-4 py-2.5 rounded-full bg-white text-navy text-xs font-extrabold flex items-center gap-2 hover:bg-shell transition-colors shadow-lg shadow-navy/20">
                <Pencil className="w-4 h-4" /> Edit Profil
              </button>
            ) : (
              <>
                <button onClick={cancelEdit} disabled={saving}
                  className="px-4 py-2.5 rounded-full bg-white/10 text-white border border-white/20 text-xs font-extrabold flex items-center gap-2 hover:bg-white/20 transition-colors disabled:opacity-50">
                  <X className="w-4 h-4" /> Batal
                </button>
                <button onClick={save} disabled={saving}
                  className="px-4 py-2.5 rounded-full bg-steel text-white text-xs font-extrabold flex items-center gap-2 hover:bg-steel/90 transition-colors shadow-lg shadow-steel/30 disabled:opacity-60">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {saving ? 'Menyimpan…' : 'Simpan'}
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {error && (
        <div className="shrink-0 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm font-bold text-red-600 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {/* ── c1 · Kelengkapan + Data Pribadi ── */}
      <div className="c1 shrink-0 grid grid-cols-1 lg:grid-cols-4 gap-3 md:gap-4">
        <GlassCard className="lg:col-span-1">
          <CardHead kicker="Progres" title="Kelengkapan Profil" icon={<BadgeCheck className="w-4 h-4 text-white" />} />
          <div className="px-5 pb-5">
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-light text-navy tabular-nums tracking-tight">{pct}</span>
              <span className="text-sm font-semibold text-navy/50">% lengkap</span>
              <span className="ml-auto text-xs font-bold text-steel tabular-nums">{filled}/{SELF_KEYS.length}</span>
            </div>
            <div className="w-full h-1.5 bg-mist/60 rounded-full overflow-hidden mt-2">
              <div className="h-full bg-steel rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-[12px] font-semibold text-navy/50 mt-2 leading-relaxed">
              {complete
                ? <span className="flex items-center gap-1.5 text-steel font-bold"><CheckCircle2 className="w-3.5 h-3.5" /> Semua data mandiri terisi.</span>
                : `Lengkapi data mandiri kamu — ${SELF_KEYS.length - filled} kolom lagi.`}
            </p>
          </div>
        </GlassCard>

        <GlassCard className={`lg:col-span-3 transition-all ${editing ? 'border-steel/40 ring-2 ring-steel/20' : ''}`}>
          <CardHead kicker="Identitas" title="Data Pribadi" icon={<UserRound className="w-4 h-4 text-white" />} right={editing ? <EditModeBadge /> : undefined} />
          <Fields rows={[
            ['Nama Lengkap', 'name', profile.name, false],
            ['NIS', 'nis', profile.nis, false],
            ['Jenis Kelamin', 'gender', profile.gender, true, 'gender'],
            ['Tempat Lahir', 'birthPlace', profile.birthPlace, true],
            ['Tanggal Lahir', 'birthDate', profile.birthDate, true, 'date'],
            ['Program Keahlian', 'major', profile.major, false],
            ['Konsentrasi Keahlian', 'concentration', profile.concentration, true],
            ['Alamat Tinggal', 'address', profile.address, true, 'textarea'],
          ]} editing={editing} draft={draft} change={change} />
        </GlassCard>
      </div>

      {/* ── c2 · Kontak + Sekolah ── */}
      <div className="c2 shrink-0 grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
        <GlassCard className={`transition-all ${editing ? 'border-steel/40 ring-2 ring-steel/20' : ''}`}>
          <CardHead kicker="Kontak" title="Kontak & Orang Tua" icon={<Phone className="w-4 h-4 text-white" />} right={editing ? <EditModeBadge /> : undefined} />
          <Fields rows={[
            ['Email', 'email', profile.email, false],
            ['No. Telepon / HP', 'whatsapp', profile.whatsapp, true],
            ['Nama Orang Tua', 'parentName', profile.parentName, true],
            ['Alamat Orang Tua', 'parentAddress', profile.parentAddress, true, 'textarea'],
            ['No. HP Orang Tua', 'parentPhone', profile.parentPhone, true],
          ]} editing={editing} draft={draft} change={change} />
        </GlassCard>

        <GlassCard>
          <CardHead kicker="Institusi" title="Sekolah & Pembimbing" icon={<School className="w-4 h-4 text-white" />}
            right={<ReadOnlyBadge />} />
          <Fields rows={[
            ['Sekolah', 'school', `${display(profile.schoolName)} · ${display(profile.schoolAddress)}`, false],
            ['Pembimbing Sekolah', 'teacherName', profile.teacherName, false],
            ['NIP Pembimbing', 'teacherNip', profile.teacherNip, false],
          ]} editing={editing} draft={draft} change={change} />
        </GlassCard>
      </div>

      {/* ── c3 · Penempatan PKL ── */}
      <div className="c3 shrink-0 grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
        <GlassCard className="lg:col-span-2">
          <CardHead kicker="Penempatan" title="Penempatan PKL" icon={<Building2 className="w-4 h-4 text-white" />} right={<ReadOnlyBadge />} />
          <Fields rows={[
            ['Perusahaan', 'companyName', profile.companyName, false],
            ['Alamat Perusahaan', 'companyAddress', profile.companyAddress, false],
          ]} editing={editing} draft={draft} change={change} />
        </GlassCard>
      </div>
    </div>
  );
};

/* ═══════════ building blocks (bahasa dashboard web) ═══════════ */

function HeroBadge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="max-w-[60%] px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-[10px] font-bold text-white/80 flex items-center gap-1.5">
      <span className="shrink-0">{icon}</span><span className="truncate">{text}</span>
    </span>
  );
}

function ReadOnlyBadge() {
  return (
    <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-navy/50 bg-mist/70 px-2.5 py-1 rounded-full">
      <ShieldCheck className="w-3 h-3" /> Ditetapkan sekolah
    </span>
  );
}

function GlassCard({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <section className={`bg-white/70 backdrop-blur-xl rounded-[24px] border border-white shadow-sm ${className}`}>{children}</section>;
}

function CardHead({ kicker, title, icon, right }: { kicker: string; title: string; icon: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 p-5 pb-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center shrink-0">{icon}</div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-widest text-navy/60 leading-none">{kicker}</p>
          <p className="text-sm font-bold text-navy leading-tight mt-0.5 truncate">{title}</p>
        </div>
      </div>
      {right}
    </div>
  );
}

function Fields({ rows, editing, draft, change }: { rows: Row[]; editing: boolean; draft: any; change: (k: string, v: string) => void }) {
  return (
    <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
      {rows.map(([label, key, value, editable, kind = 'text']) => {
        const showInput = editing && editable;
        const raw = key === 'school' ? value : draft?.[key];
        return (
          <div key={label} className="bg-white/60 rounded-[16px] border border-mist/60 p-3">
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-navy/40">{label}</p>

            {showInput ? (
              kind === 'gender' ? (
                <div className="mt-1.5 flex gap-1 bg-mist/60 p-1 rounded-full">
                  {([{ k: 'L', l: 'Laki-laki' }, { k: 'P', l: 'Perempuan' }] as const).map((g) => (
                    <button key={g.k} type="button" onClick={() => change(key, g.k)}
                      className={`flex-1 text-[11px] font-bold py-1.5 rounded-full transition-all ${draft?.[key] === g.k ? 'bg-steel text-white shadow' : 'text-navy/60 hover:text-navy'}`}>
                      {g.l}
                    </button>
                  ))}
                </div>
              ) : kind === 'date' ? (
                <input type="date" value={isoVal(raw)} onChange={(e) => change(key, e.target.value)}
                  className="mt-1 w-full bg-transparent border-b border-mist focus:border-steel outline-none text-[13px] font-bold text-navy py-1" />
              ) : kind === 'textarea' ? (
                <textarea value={raw || ''} onChange={(e) => change(key, e.target.value)} rows={2} placeholder="Belum diisi"
                  className="mt-1 w-full bg-transparent border-b border-mist focus:border-steel outline-none text-[13px] font-bold text-navy py-1 resize-none placeholder:text-navy/30" />
              ) : (
                <input type="text" value={raw || ''} onChange={(e) => change(key, e.target.value)} placeholder="Belum diisi"
                  className="mt-1 w-full bg-transparent border-b border-mist focus:border-steel outline-none text-[13px] font-bold text-navy py-1 placeholder:text-navy/30" />
              )
            ) : (
              <p className={`text-[13px] font-bold mt-1 break-words ${display(value) === 'Belum diisi' ? 'text-navy/35' : editing && !editable ? 'text-navy/50' : 'text-navy/80'}`}>
                {kind === 'date' ? dateFmt(value) : display(value)}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}