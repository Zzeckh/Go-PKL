import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, CheckCircle2, MapPin, Loader2, Image as ImageIcon, RefreshCw, 
  AlertTriangle, Clock, ShieldCheck, ShieldAlert, Building2, 
  ScanFace, Sun, History 
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface CompanyLocation {
  lat: number;
  lng: number;
  radius: number;
}

interface AbsensiProps {
  companyName: string;
  companyAddress: string;
  companyLocation: CompanyLocation | null;
  onCheckIn: (imageUrl?: string, latitude?: number, longitude?: number) => Promise<void>;
  hasCheckedIn: boolean;
}

const getDistanceInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

export const Absensi: React.FC<AbsensiProps> = ({ 
  companyName,
  companyAddress,
  companyLocation,
  onCheckIn, 
  hasCheckedIn 
}) => {
  const { attendances } = useApp();

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [time, setTime] = useState(new Date());
  const [justCheckedIn, setJustCheckedIn] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  const MAX_RADIUS = companyLocation?.radius ?? 500;

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getCurrentLocation = () => {
    setIsLoadingLocation(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Browser Anda tidak mendukung Geolocation.');
      setIsLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserCoords({ lat: latitude, lng: longitude });
        
        if (companyLocation) {
          const dist = getDistanceInMeters(
            latitude, 
            longitude, 
            companyLocation.lat, 
            companyLocation.lng
          );
          setDistance(dist);
        }
        setIsLoadingLocation(false);
      },
      (err) => {
        console.error('Gagal mengambil lokasi:', err);
        setLocationError('Gagal mendapatkan lokasi. Pastikan izin lokasi (GPS) diaktifkan.');
        setIsLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error('Kamera gagal diakses:', err);
      setCameraError('Akses kamera ditolak atau tidak tersedia.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  };

  useEffect(() => {
    if (!hasCheckedIn) {
      getCurrentLocation();
      if (!imageSrc) startCamera();
    }
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasCheckedIn]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setImageSrc(dataUrl);
        stopCamera();
      }
    }
  };

  const handleRetake = () => {
    setImageSrc(null);
    startCamera();
  };

  const isWithinRadius = !companyLocation 
    ? true 
    : (distance !== null && distance <= MAX_RADIUS);

  const handleSubmit = async () => {
    if (!isWithinRadius) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await onCheckIn(
        undefined,
        userCoords?.lat,
        userCoords?.lng
      );
      setJustCheckedIn(true);
    } catch (error: any) {
      setSubmitError(error?.message || 'Gagal mengirim absensi. Silakan coba lagi.');
      setIsSubmitting(false);
    }
  };

  const checkedIn = hasCheckedIn || justCheckedIn;

  if (checkedIn) {
    return (
      <div className="h-full w-full flex items-center justify-center animate-in fade-in duration-500 p-4">
        <div className="bg-white rounded-[24px] border border-mist/60 shadow-xl max-w-sm w-full flex flex-col items-center text-center p-8">
          <div className="w-20 h-20 bg-navy text-white rounded-[10px] flex items-center justify-center mb-6 shadow-lg shadow-navy/30">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-navy mb-2">Absensi Berhasil</h2>
          <p className="text-sm font-medium text-navy/60 leading-relaxed mb-6">
            Kehadiran Anda hari ini telah tercatat pada pukul{' '}
            <span className="font-bold text-navy">
              {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
            </span>
          </p>
          <div className="w-full bg-mist/50 rounded-[24px] p-4 flex items-center justify-center gap-3 border border-mist">
            <MapPin className="w-4 h-4 text-steel" />
            <span className="text-xs font-bold text-navy">{companyName} • Geofence Valid</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col gap-3 md:gap-4 animate-in fade-in duration-500 overflow-hidden">
      <canvas ref={canvasRef} className="hidden" />

      {/* ── HEADER ─ */}
      <div className="flex items-center justify-between shrink-0 bg-white rounded-[24px] p-4 md:p-5 border border-mist/60 shadow-sm">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <div className="w-11 h-11 md:w-12 md:h-12 bg-navy rounded-[10px] flex items-center justify-center text-white shadow-md shadow-navy/20 shrink-0">
            <Camera className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-lg md:text-xl text-navy leading-tight">Absensi Harian</h2>
            <p className="text-[13px] text-navy/60 font-semibold mt-0.5 truncate">
              Ambil foto selfie untuk verifikasi kehadiran
            </p>
          </div>
        </div>
        <div className="hidden sm:flex flex-col items-end shrink-0 pl-3">
          <p className="text-xl md:text-2xl font-light text-navy tabular-nums tracking-tight leading-none">
            {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-[11px] font-bold text-steel uppercase tracking-widest mt-1">
            {time.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
          </p>
        </div>
      </div>

      {/* ── MAIN GRID ── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-3 md:gap-4 min-h-0">
        
        {/* ══ LEFT: CAMERA PREVIEW ══ */}
        <div className="lg:col-span-3 bg-white rounded-[24px] border border-mist/60 shadow-sm p-4 md:p-5 flex flex-col relative overflow-hidden min-h-[320px] lg:min-h-0">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-steel/15 flex items-center justify-center">
                <Camera className="w-3.5 h-3.5 text-steel" />
              </div>
              <p className="text-[13px] font-bold uppercase tracking-widest text-navy/70">Preview Kamera</p>
            </div>
            {imageSrc && (
              <button 
                onClick={handleRetake} 
                className="text-[11px] font-bold bg-mist hover:bg-mist/80 text-navy px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Ulangi
              </button>
            )}
          </div>
          
          <div className="flex-1 relative bg-navy rounded-[20px] overflow-hidden border border-navy/20 group flex items-center justify-center min-h-0">
            {imageSrc ? (
              <img src={imageSrc} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover -scale-x-100 ${isCameraActive ? 'block' : 'hidden'}`}
                />
                {/* ── EMPTY STATE: panduan selfie (isi ruang kosong) ── */}
                {!isCameraActive && (
                  <div className="w-full max-w-sm px-6 py-4 flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-[10px] bg-white/10 border border-white/10 flex items-center justify-center mb-3">
                      <ImageIcon className="w-6 h-6 text-white/60" />
                    </div>
                    <p className="text-base font-bold text-white">
                      {cameraError ? 'Kamera Tidak Aktif' : 'Mengaktifkan Kamera...'}
                    </p>
                    <p className="text-[13px] text-white/60 font-medium mt-1 leading-relaxed">
                      {cameraError ? cameraError : 'Mohon tunggu sebentar'}
                    </p>
                    {cameraError && (
                      <button 
                        onClick={startCamera} 
                        className="mt-3 text-xs bg-white text-navy px-5 py-2.5 rounded-[24px] font-bold hover:bg-shell transition-colors"
                      >
                        Coba Lagi
                      </button>
                    )}

                    {/* Panduan selfie 3 langkah */}
                    <div className="w-full mt-5 pt-4 border-t border-white/10 grid grid-cols-3 gap-2">
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="w-9 h-9 rounded-[10px] bg-white/10 flex items-center justify-center">
                          <ScanFace className="w-4 h-4 text-steel" />
                        </div>
                        <p className="text-[11px] font-semibold text-white/70 leading-tight">Wajah di tengah frame</p>
                      </div>
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="w-9 h-9 rounded-[10px] bg-white/10 flex items-center justify-center">
                          <Sun className="w-4 h-4 text-steel" />
                        </div>
                        <p className="text-[11px] font-semibold text-white/70 leading-tight">Pencahayaan cukup</p>
                      </div>
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="w-9 h-9 rounded-[10px] bg-white/10 flex items-center justify-center">
                          <ShieldCheck className="w-4 h-4 text-steel" />
                        </div>
                        <p className="text-[11px] font-semibold text-white/70 leading-tight">Tanpa penutup wajah</p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            
            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-steel/60 rounded-tl-lg pointer-events-none" />
            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-steel/60 rounded-tr-lg pointer-events-none" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-steel/60 rounded-bl-lg pointer-events-none" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-steel/60 rounded-br-lg pointer-events-none" />

            {isCameraActive && !imageSrc && (
              <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-steel animate-pulse" />
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">Live</span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={capturePhoto}
            disabled={!isCameraActive || !!imageSrc}
            className={`mt-3 w-full py-3.5 rounded-[24px] flex items-center justify-center gap-2 transition-all shadow-sm shrink-0 ${
              !isCameraActive || !!imageSrc
                ? 'bg-mist/70 text-navy/40 cursor-not-allowed'
                : 'bg-steel text-white hover:bg-steel/90 active:scale-[0.99] shadow-steel/20 shadow-md'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span className="text-sm font-bold">
              {imageSrc ? 'Foto Berhasil Diambil ✓' : 'Ambil Foto Selfie'}
            </span>
          </button>
        </div>

        {/* ══ RIGHT: LOCATION + ACTIONS + RIWAYAT ══ */}
        <div className="lg:col-span-2 flex flex-col gap-3 md:gap-4 min-h-0">
          
          {/* Location Card */}
          <div className="bg-navy rounded-[24px] p-5 shrink-0 relative overflow-hidden shadow-lg shadow-navy/20">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-[10px] bg-white/15 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-white/60">Lokasi PKL</p>
                </div>
                <button 
                  onClick={getCurrentLocation} 
                  disabled={isLoadingLocation}
                  className="text-[11px] font-bold text-white/70 hover:text-white transition-colors flex items-center gap-1 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingLocation ? 'animate-spin' : ''}`} /> Refresh
                </button>
              </div>

              <h4 className="font-bold text-base text-white leading-tight">{companyName || 'Belum ada perusahaan'}</h4>
              <p className="text-[13px] font-medium text-white/60 mt-1 leading-relaxed">
                {companyAddress || 'Alamat perusahaan belum diatur'}
              </p>

              <div className="mt-4 pt-4 border-t border-white/10">
                {isLoadingLocation ? (
                  <div className="flex items-center gap-2 bg-white/10 px-3 py-2.5 rounded-[24px] text-xs font-bold text-white">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> 
                    <span>Mengambil Lokasi GPS...</span>
                  </div>
                ) : locationError ? (
                  <div className="flex items-start gap-2 bg-white/10 border border-white/15 p-3 rounded-[24px] text-xs text-white">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold leading-relaxed">{locationError}</p>
                      <button onClick={getCurrentLocation} className="underline text-[11px] font-bold mt-1">
                        Coba Lagi
                      </button>
                    </div>
                  </div>
                ) : !companyLocation ? (
                  <div className="flex items-start gap-2 bg-white/10 border border-white/15 p-3 rounded-[24px] text-xs text-white">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold leading-relaxed">Koordinat geofence belum diatur. Hubungi admin untuk setup.</p>
                    </div>
                  </div>
                ) : (
                  <div className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-[24px] border ${
                    isWithinRadius 
                      ? 'bg-steel/20 border-steel/40' 
                      : 'bg-white/10 border-white/15'
                  }`}>
                    <div className="flex items-center gap-2 min-w-0">
                      {isWithinRadius ? (
                        <ShieldCheck className="w-4 h-4 text-steel shrink-0" />
                      ) : (
                        <ShieldAlert className="w-4 h-4 text-white shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-[12px] font-bold text-white leading-tight">
                          {isWithinRadius ? 'Dalam Radius Aman' : 'Di Luar Radius Aman'}
                        </p>
                        <p className="text-[11px] text-white/60 font-semibold">
                          Jarak: <span className="text-white font-bold tabular-nums">{distance}m</span> / {MAX_RADIUS}m
                        </p>
                      </div>
                    </div>
                    <div className={`w-2 h-2 rounded-full shrink-0 ${isWithinRadius ? 'bg-steel animate-pulse' : 'bg-white/60'}`} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Panel — compact */}
          <div className="bg-white rounded-[24px] border border-mist/60 shadow-sm p-4 flex flex-col gap-3 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-steel/15 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5 text-steel" />
                </div>
                <p className="text-[13px] font-bold text-navy">Kirim Absensi</p>
              </div>
              <div className="flex items-center gap-1">
                <span className={`text-xs font-bold ${(imageSrc ? 1 : 0) + (isWithinRadius && !isLoadingLocation && !!companyLocation ? 1 : 0) === 2 ? 'text-steel' : 'text-navy/40'}`}>
                  {(imageSrc ? 1 : 0) + (isWithinRadius && !isLoadingLocation && !!companyLocation ? 1 : 0)}
                </span>
                <span className="text-xs font-bold text-navy/30">/2</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className={`p-3 rounded-[24px] border transition-all ${
                imageSrc ? 'bg-steel/5 border-steel/30' : 'bg-mist/30 border-mist/60'
              }`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 shrink-0 transition-all ${
                    imageSrc ? 'bg-steel border-steel' : 'border-navy/20'
                  }`}>
                    {imageSrc && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </div>
                  <span className={`text-xs font-bold ${imageSrc ? 'text-steel' : 'text-navy/50'}`}>Foto Selfie</span>
                </div>
                <p className="text-[11px] text-navy/60 font-medium leading-tight pl-7">
                  {imageSrc ? '✓ Sudah diambil' : 'Ambil foto selfie'}
                </p>
              </div>

              <div className={`p-3 rounded-[24px] border transition-all ${
                isWithinRadius && !isLoadingLocation && !!companyLocation ? 'bg-steel/5 border-steel/30' : 'bg-mist/30 border-mist/60'
              }`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 shrink-0 transition-all ${
                    isWithinRadius && !isLoadingLocation && !!companyLocation ? 'bg-steel border-steel' : 'border-navy/20'
                  }`}>
                    {isWithinRadius && !isLoadingLocation && !!companyLocation && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </div>
                  <span className={`text-xs font-bold ${isWithinRadius && !isLoadingLocation && !!companyLocation ? 'text-steel' : 'text-navy/50'}`}>Lokasi GPS</span>
                </div>
                <p className="text-[11px] text-navy/60 font-medium leading-tight pl-7">
                  {isLoadingLocation 
                    ? 'Memuat...' 
                    : !companyLocation
                      ? 'Belum diatur'
                      : isWithinRadius 
                        ? `✓ ${distance}m dari kantor`
                        : 'Di luar radius'}
                </p>
              </div>
            </div>

            {!isLoadingLocation && companyLocation && !isWithinRadius && !locationError && (
              <div className="p-2.5 bg-navy/5 border border-navy/10 rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-navy/60 mt-0.5" />
                <p className="text-[11px] font-semibold text-navy leading-snug">
                  Jarak <span className="font-bold">{distance}m</span> melebihi batas {MAX_RADIUS}m. Pindah ke area kantor.
                </p>
              </div>
            )}

            {submitError && (
              <div className="p-2.5 bg-navy/5 border border-navy/15 rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-navy/60 mt-0.5" />
                <p className="text-[11px] font-semibold text-navy leading-snug">{submitError}</p>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!imageSrc || isSubmitting || !isWithinRadius || !!locationError || !companyLocation}
              className={`w-full py-3.5 rounded-[24px] text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                !imageSrc || !isWithinRadius || !!locationError || !companyLocation
                  ? 'bg-mist text-navy/40 cursor-not-allowed' 
                  : 'bg-navy text-white hover:bg-navy/90 hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-navy/20'
              }`}
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Mengirim...</>
              ) : (
                <><CheckCircle2 className="w-4 h-4" /> Kirim Absensi</>
              )}
            </button>
          </div>

          {/* ── RIWAYAT KEHADIRAN (isi ruang kosong) ── */}
          <div className="bg-white rounded-[24px] border border-mist/60 shadow-sm p-4 flex-1 flex flex-col min-h-[180px]">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-mist flex items-center justify-center">
                  <History className="w-3.5 h-3.5 text-navy" />
                </div>
                <p className="text-[13px] font-bold text-navy">Riwayat Kehadiran</p>
              </div>
              <span className="text-[11px] font-bold text-navy/40 tabular-nums">{attendances.length} catatan</span>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 min-h-0 pr-1">
              {attendances.slice(0, 7).map((a) => (
                <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-[24px] bg-mist/30 border border-mist/50 shrink-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    a.status === 'Hadir' ? 'bg-steel/15 text-steel' : 'bg-mist text-navy/50'
                  }`}>
                    {a.status === 'Hadir' ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-navy leading-tight truncate">{a.date}</p>
                    <p className="text-[11px] font-semibold text-navy/50">
                      {a.checkInTime ? `Check-in ${a.checkInTime}` : 'Tanpa check-in'}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${
                    a.status === 'Hadir' ? 'bg-steel/15 text-steel' : 'bg-mist text-navy/60'
                  }`}>
                    {a.status}
                  </span>
                </div>
              ))}
              {attendances.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
                  <History className="w-8 h-8 text-navy/20 mb-2" />
                  <p className="text-xs font-semibold text-navy/40">Belum ada riwayat absensi</p>
                  <p className="text-[11px] text-navy/30 mt-0.5">Absensi pertamamu akan muncul di sini</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};