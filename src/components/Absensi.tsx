import React, { useState, useEffect } from 'react';
import { Camera, UploadCloud, CheckCircle2, MapPin, Loader2, Image as ImageIcon } from 'lucide-react';

interface AbsensiProps {
  onCheckIn: () => void;
  hasCheckedIn: boolean;
}

export const Absensi: React.FC<AbsensiProps> = ({ onCheckIn, hasCheckedIn }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setImageSrc(url);
    }
  };

  const handleSubmit = () => {
    if (!imageSrc) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onCheckIn();
    }, 1200);
  };

  if (hasCheckedIn) {
    return (
      <div className="h-full w-full flex items-center justify-center animate-in fade-in duration-500">
        <div className="bg-white/70 backdrop-blur-xl border border-white shadow-xl rounded-[24px] p-8 max-w-sm w-full flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-black text-white rounded-[24px] flex items-center justify-center mb-6 shadow-lg shadow-black/20">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-black mb-2">Absensi Berhasil</h2>
          <p className="text-sm font-medium text-black/60 leading-relaxed mb-6">
            Terima kasih, kehadiran Anda hari ini telah tercatat di sistem pada pukul {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB.
          </p>
          <div className="w-full bg-black/5 rounded-2xl p-4 flex items-center justify-center gap-3">
            <MapPin className="w-4 h-4 text-black/40" />
            <span className="text-xs font-bold text-black/70">PT Tokopedia (Geofence Valid)</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col gap-4 animate-in fade-in duration-500 overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 bg-white/70 backdrop-blur-xl rounded-[24px] p-5 border border-white shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white shadow-md">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-xl text-black leading-tight">Absensi Harian</h2>
            <p className="text-xs text-black/60 font-semibold mt-1">Silakan ambil foto selfie untuk verifikasi kehadiran</p>
          </div>
        </div>
        <div className="hidden sm:block text-right">
          <p className="text-2xl font-light text-black tabular-nums tracking-tight">
            {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-xs font-bold text-black/50 uppercase tracking-widest mt-0.5">
            {time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      {/* Main Content Split */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
        
        {/* Left: Camera/Image Area */}
        <div className="bg-white/70 backdrop-blur-xl rounded-[24px] border border-white shadow-sm p-6 flex flex-col relative overflow-hidden">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <p className="text-xs font-bold uppercase tracking-widest text-black/50">Preview Kamera</p>
            {imageSrc && (
              <button onClick={() => setImageSrc(null)} className="text-[10px] font-bold bg-black/5 hover:bg-black/10 text-black px-3 py-1.5 rounded-full transition-colors">
                Ulangi Foto
              </button>
            )}
          </div>
          
          <div className="flex-1 relative bg-black/5 rounded-[24px] overflow-hidden border border-black/10 group flex items-center justify-center">
            {imageSrc ? (
              <img src={imageSrc} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center flex flex-col items-center">
                <ImageIcon className="w-12 h-12 text-black/20 mb-3" />
                <p className="text-sm font-bold text-black/40">Kamera tidak aktif</p>
                <p className="text-xs font-medium text-black/30 mt-1">Pilih metode di panel samping</p>
              </div>
            )}
            
            {/* Viewfinder Corners (Decorative) */}
            <div className="absolute top-6 left-6 w-8 h-8 border-t-4 border-l-4 border-black/20 rounded-tl-lg pointer-events-none" />
            <div className="absolute top-6 right-6 w-8 h-8 border-t-4 border-r-4 border-black/20 rounded-tr-lg pointer-events-none" />
            <div className="absolute bottom-6 left-6 w-8 h-8 border-b-4 border-l-4 border-black/20 rounded-bl-lg pointer-events-none" />
            <div className="absolute bottom-6 right-6 w-8 h-8 border-b-4 border-r-4 border-black/20 rounded-br-lg pointer-events-none" />
          </div>
        </div>

        {/* Right: Actions & Details */}
        <div className="flex flex-col gap-4 min-h-0">
          <div className="bg-white/70 backdrop-blur-xl rounded-[24px] border border-white shadow-sm p-6 shrink-0">
            <p className="text-xs font-bold uppercase tracking-widest text-black/50 mb-4">Lokasi Saat Ini</p>
            <div className="bg-black rounded-2xl p-4 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4" />
              <div className="relative z-10 flex items-start gap-3">
                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">PT Tokopedia Tower</h4>
                  <p className="text-xs font-medium text-white/60 mt-1 leading-relaxed">Jl. Prof. DR. Satrio No.11, Setiabudi, Jakarta Selatan</p>
                  <div className="inline-flex items-center gap-1.5 mt-3 bg-white/10 px-2.5 py-1 rounded-full border border-white/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-bold text-white/90">Dalam Radius Radius Aman</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-xl rounded-[24px] border border-white shadow-sm p-6 flex-1 flex flex-col">
            <p className="text-xs font-bold uppercase tracking-widest text-black/50 mb-4 shrink-0">Metode Absensi</p>
            
            <div className="flex-1 flex flex-col justify-center gap-4">
              <label className="w-full py-4 border-2 border-dashed border-black/20 rounded-2xl flex items-center justify-center gap-3 text-black/70 hover:bg-black hover:border-black hover:text-white transition-all cursor-pointer group shadow-sm">
                <Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-bold">Ambil Foto Langsung</span>
                <input type="file" accept="image/*" capture="user" className="hidden" onChange={handleImageChange} />
              </label>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-black/10"></div></div>
                <div className="relative flex justify-center text-xs"><span className="bg-[#F5F4E8] px-3 font-bold text-black/40">ATAU</span></div>
              </div>

              <label className="w-full py-4 bg-white border border-black/10 rounded-2xl flex items-center justify-center gap-3 text-black hover:bg-black/5 transition-all cursor-pointer shadow-sm">
                <UploadCloud className="w-5 h-5" />
                <span className="text-sm font-bold">Unggah dari Galeri</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!imageSrc || isSubmitting}
              className={`w-full mt-6 py-4 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-xl ${
                !imageSrc 
                  ? 'bg-black/10 text-black/40 cursor-not-allowed shadow-none' 
                  : 'bg-black text-white hover:bg-black/80 hover:-translate-y-0.5 active:translate-y-0'
              }`}
            >
              {isSubmitting ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Mengirim Data...</>
              ) : (
                <><CheckCircle2 className="w-5 h-5" /> Kirim Absensi Sekarang</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};