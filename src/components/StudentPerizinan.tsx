import React, { useState } from 'react';
import {
  FileCheck, Plus, X, Loader2, Calendar, Clock, CheckCircle2, AlertCircle, Hourglass, FileText
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const getInitials = (name: string) =>
  (name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

export const StudentPerizinan: React.FC = () => {
  const { perizinanList, createPermission } = useApp();
  const [showModal, setShowModal] = useState(false);

  const pending = perizinanList.filter(p => p.status === 'pending').length;
  const approved = perizinanList.filter(p => p.status === 'approved').length;
  const rejected = perizinanList.filter(p => p.status === 'rejected').length;

  const statusBadge = (status: string) => {
    if (status === 'approved') return { cls: 'bg-steel/15 text-steel', label: 'Disetujui', icon: CheckCircle2 };
    if (status === 'rejected') return { cls: 'bg-navy/10 text-navy', label: 'Ditolak', icon: AlertCircle };
    return { cls: 'bg-steel/10 text-steel', label: 'Menunggu', icon: Hourglass };
  };

  return (
    <div className="h-full w-full flex flex-col gap-3 md:gap-4 overflow-hidden">
      <div className="flex items-center justify-between shrink-0 bg-white rounded-[24px] p-4 md:p-5 border border-mist/60 shadow-sm">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <div className="w-11 h-11 md:w-12 md:h-12 bg-navy rounded-[10px] flex items-center justify-center text-white shadow-md shadow-navy/20 shrink-0">
            <FileCheck className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-lg md:text-xl text-navy leading-tight">Perizinan</h2>
            <p className="text-[13px] text-navy/60 font-semibold mt-0.5 truncate">
              Ajukan izin bila berhalangan hadir
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 bg-steel text-white text-xs font-bold px-4 py-2 rounded-[24px] shadow-md shadow-steel/25 hover:bg-steel/90 hover:-translate-y-0.5 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> Ajukan Izin
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
        <div className="bg-white border border-mist/60 rounded-[24px] p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-[10px] bg-steel/10 flex items-center justify-center">
            <Hourglass className="w-5 h-5 text-steel" />
          </div>
          <div>
            <p className="text-2xl font-bold text-navy tabular-nums leading-none">{pending}</p>
            <p className="text-[11px] font-bold text-navy/50 uppercase tracking-wide mt-1">Menunggu</p>
          </div>
        </div>
        <div className="bg-white border border-mist/60 rounded-[24px] p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-[10px] bg-steel/15 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-steel" />
          </div>
          <div>
            <p className="text-2xl font-bold text-navy tabular-nums leading-none">{approved}</p>
            <p className="text-[11px] font-bold text-navy/50 uppercase tracking-wide mt-1">Disetujui</p>
          </div>
        </div>
        <div className="bg-white border border-mist/60 rounded-[24px] p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-[10px] bg-navy/10 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-navy" />
          </div>
          <div>
            <p className="text-2xl font-bold text-navy tabular-nums leading-none">{rejected}</p>
            <p className="text-[11px] font-bold text-navy/50 uppercase tracking-wide mt-1">Ditolak</p>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[24px] border border-mist/60 shadow-sm overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-5">
          {perizinanList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-[10px] bg-shell flex items-center justify-center mb-3">
                <FileCheck className="w-6 h-6 text-navy/30" />
              </div>
              <p className="text-sm font-bold text-navy mb-1">Belum ada perizinan</p>
              <p className="text-xs text-navy/50 max-w-xs">
                Ajukan izin bila kamu berhalangan hadir di tempat PKL.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {perizinanList.map((p) => {
                const badge = statusBadge(p.status);
                const Icon = badge.icon;
                return (
                  <div key={p.id} className="p-3.5 rounded-[24px] border border-mist/60 bg-white flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${p.type === 'Sakit' ? 'bg-navy/10 text-navy' : 'bg-steel text-white'}`}>
                      {getInitials(p.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[13px] font-bold text-navy truncate capitalize">{p.type}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 ${badge.cls}`}>
                          <Icon className="w-3 h-3" /> {badge.label}
                        </span>
                      </div>
                      <p className="text-[11px] font-semibold text-navy/50 truncate mt-0.5">{p.reason}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="flex items-center gap-1 text-[10px] font-bold text-navy/50">
                          <Calendar className="w-3 h-3" /> {p.date}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-navy/50">
                          <Clock className="w-3 h-3" /> {p.type}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <PermissionModal onClose={() => setShowModal(false)} onCreate={createPermission} />
      )}
    </div>
  );
};

const PermissionModal: React.FC<{
  onClose: () => void;
  onCreate: (data: { type: string; reason: string; date: string; file?: File | null; attachmentUrl?: string }) => Promise<any>;
}> = ({ onClose, onCreate }) => {
  const [form, setForm] = useState({ type: 'izin', reason: '', date: '' });
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFileError(null);
    if (selected && selected.type !== 'application/pdf' && !selected.name.toLowerCase().endsWith('.pdf')) {
      setFileError('Hanya file PDF yang diperbolehkan.');
      setFile(null);
      e.target.value = '';
      return;
    }
    if (selected && selected.size > 5 * 1024 * 1024) {
      setFileError('Ukuran file maksimal 5 MB.');
      setFile(null);
      e.target.value = '';
      return;
    }
    setFile(selected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!file) {
      setFileError('Surat keterangan (file PDF) wajib diunggah.');
      return;
    }
    setLoading(true);
    try {
      await onCreate({
        type: form.type,
        reason: form.reason,
        date: form.date,
        file,
        attachmentUrl: undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.data?.error || err?.message || 'Gagal mengajukan izin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy/50 backdrop-blur-md">
      <div className="bg-white rounded-[24px] max-w-md w-full shadow-2xl border border-mist/60">
        <div className="p-5 border-b border-mist/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-navy flex items-center justify-center">
              <FileCheck className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-bold text-navy">Ajukan Izin</h3>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-[10px] bg-mist/60 hover:bg-mist flex items-center justify-center">
            <X className="w-4 h-4 text-navy/60" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="text-[11px] font-bold text-navy/70 uppercase tracking-wide block mb-1.5">
              Jenis Izin *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, type: 'izin' })}
                className={`py-2.5 rounded-[24px] border text-sm font-bold transition-all ${
                  form.type === 'izin' ? 'bg-steel border-steel text-white' : 'bg-shell border-mist text-navy/60'
                }`}
              >
                Izin
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, type: 'sakit' })}
                className={`py-2.5 rounded-[24px] border text-sm font-bold transition-all ${
                  form.type === 'sakit' ? 'bg-navy border-navy text-white' : 'bg-shell border-mist text-navy/60'
                }`}
              >
                Sakit
              </button>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-bold text-navy/70 uppercase tracking-wide block mb-1.5">
              Tanggal *
            </label>
            <input
              type="date"
              required
              value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
              className="w-full bg-shell border border-mist rounded-[24px] px-3 py-2.5 text-sm font-semibold text-navy outline-none focus:border-steel transition-all"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-navy/70 uppercase tracking-wide block mb-1.5">
              Alasan / Keterangan *
            </label>
            <textarea
              required
              rows={3}
              value={form.reason}
              onChange={e => setForm({ ...form, reason: e.target.value })}
              placeholder="Tuliskan alasan berhalangan hadir..."
              className="w-full bg-shell border border-mist rounded-[24px] px-3 py-2.5 text-sm font-semibold text-navy outline-none focus:border-steel transition-all resize-none"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-navy/70 uppercase tracking-wide block mb-1.5">
              Surat Keterangan (PDF wajib) *
            </label>
            <label className="w-full flex items-center gap-2.5 bg-shell border border-dashed border-navy/20 rounded-[24px] px-3 py-3 text-sm font-semibold text-navy/60 cursor-pointer hover:border-steel hover:text-steel transition-all">
              <FileText className="w-4 h-4 shrink-0" />
              <span className="truncate">
                {file ? file.name : 'Unggah surat keterangan sakit (PDF)...'}
              </span>
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            {fileError ? (
              <p className="text-[11px] font-bold text-navy/70 mt-1.5">{fileError}</p>
            ) : file ? (
              <p className="text-[11px] font-bold text-steel mt-1.5">
                {(file.size / (1024 * 1024)).toFixed(2)} MB · siap diunggah
              </p>
            ) : (
              <p className="text-[11px] text-navy/40 mt-1.5">
                Wajib unggah PDF, maksimal 5 MB (surat yang sudah ditandatangani).
              </p>
            )}
          </div>
          {error && (
            <div className="p-3 bg-navy/5 border border-navy/15 rounded-[24px] text-xs font-semibold text-navy">
              {error}
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-mist/60 text-navy/70 font-bold text-sm py-3 rounded-[24px]">
              Batal
            </button>
            <button type="submit" disabled={loading} className="flex-1 bg-steel text-white font-bold text-sm py-3 rounded-[24px] hover:bg-steel/90 shadow-lg shadow-steel/25 disabled:opacity-60">
              {loading ? <span className="flex items-center justify-center gap-1.5"><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</span> : 'Kirim Izin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};