import React, { useState, useEffect, useRef } from 'react';
import { Camera, CheckCircle2, MapPin, Loader2, Image as ImageIcon, RefreshCw, AlertTriangle } from 'lucide-react';

interface AbsensiProps {
  onCheckIn: () => void;
  hasCheckedIn: boolean;
}

// KOORDINAT TARGET & RADIUS
const TARGET_LAT = -6.2223; // Contoh: Lat Tokopedia Tower / Sekolah
const TARGET_LNG = 106.8228; // Contoh: Lng Tokopedia Tower / Sekolah
const MAX_RADIUS_METERS = 500; // Radius maksimal dalam meter

// Fungsi Menghitung Jarak Antara 2 Koordinat (Rumus Haversine dalam Meter)
const getDistanceInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // Radius bumi dalam meter
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c); // Hasil dalam meter
};

export const Absensi: React.FC<AbsensiProps> = ({ onCheckIn, hasCheckedIn }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [time, setTime] = useState(new Date());

  // WebRTC Kamera
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Geolocation & Radius State
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Ambil Lokasi GPS User
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

        // Hitung jarak ke lokasi target
        const dist = getDistanceInMeters(latitude, longitude, TARGET_LAT, TARGET_LNG);
        setDistance(dist);
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

  // WebRTC Kamera Functions
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

        const dataUrl = canvas.toDataURL('image/jpeg');
        setImageSrc(dataUrl);
        stopCamera();
      }
    }
  };

  const handleRetake = () => {
    setImageSrc(null);
    startCamera();
  };

  // Cek apakah user berada di dalam radius aman
  const isWithinRadius = distance !== null && distance <= MAX_RADIUS_METERS;

  const handleSubmit = () => {
    if (!imageSrc || !isWithinRadius) return;
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
      <canvas ref={canvasRef} className="hidden" />

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
              <button onClick={handleRetake} className="text-[10px] font-bold bg-black/5 hover:bg-black/10 text-black px-3 py-1.5 rounded-full transition-colors flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> Ulangi Foto
              </button>
            )}
          </div>
          
          <div className="flex-1 relative bg-black/5 rounded-[24px] overflow-hidden border border-black/10 group flex items-center justify-center">
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
                {!isCameraActive && (
                  <div className="text-center flex flex-col items-center p-4">
                    <ImageIcon className="w-12 h-12 text-black/20 mb-3" />
                    <p className="text-sm font-bold text-black/40">
                      {cameraError ? cameraError : 'Mengaktifkan Kamera...'}
                    </p>
                    {cameraError && (
                      <button onClick={startCamera} className="mt-3 text-xs bg-black text-white px-4 py-2 rounded-xl font-bold">
                        Coba Lagi
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
            
            {/* Viewfinder Corners */}
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
                <div className="flex-1">
                  <h4 className="font-bold text-sm">PT Tokopedia Tower</h4>
                  <p className="text-xs font-medium text-white/60 mt-1 leading-relaxed">Jl. Prof. DR. Satrio No.11, Setiabudi, Jakarta Selatan</p>
                  
                  {/* Status Radius & GPS */}
                  <div className="mt-3">
                    {isLoadingLocation ? (
                      <div className="inline-flex items-center gap-2 bg-white/10 px-2.5 py-1 rounded-full text-[10px] font-bold text-white/80">
                        <Loader2 className="w-3 h-3 animate-spin" /> Mengambil Lokasi GPS...
                      </div>
                    ) : locationError ? (
                      <div className="flex items-center justify-between bg-red-500/20 border border-red-500/40 p-2 rounded-xl text-xs text-red-200 mt-1">
                        <span>{locationError}</span>
                        <button onClick={getCurrentLocation} className="underline text-[10px] font-bold ml-2">Coba Lagi</button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
                          isWithinRadius 
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' 
                            : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isWithinRadius ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                          <span className="text-[10px] font-bold">
                            {isWithinRadius ? 'Dalam Radius Aman' : 'Di Luar Radius Aman'} ({distance}m)
                          </span>
                        </div>
                        <button onClick={getCurrentLocation} className="text-[10px] text-white/50 hover:text-white underline">
                          Refresh GPS
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-xl rounded-[24px] border border-white shadow-sm p-6 flex-1 flex flex-col">
            <p className="text-xs font-bold uppercase tracking-widest text-black/50 mb-4 shrink-0">Metode Absensi</p>
            
            <div className="flex-1 flex flex-col justify-center">
              <button
                type="button"
                onClick={capturePhoto}
                disabled={!isCameraActive || !!imageSrc}
                className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-sm ${
                  !isCameraActive || !!imageSrc
                    ? 'bg-black/5 text-black/30 border border-black/10 cursor-not-allowed'
                    : 'bg-black text-white hover:bg-black/80 hover:scale-[1.01] active:scale-100'
                }`}
              >
                <Camera className="w-5 h-5" />
                <span className="text-sm font-bold">
                  {imageSrc ? 'Foto Berhasil Diambil' : 'Ambil Foto Selfie'}
                </span>
              </button>
            </div>

            {/* Peringatan jika di luar radius */}
            {!isLoadingLocation && !isWithinRadius && !locationError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>Jarak Anda ({distance}m) melebihi batas 500m dari lokasi absensi. Anda tidak dapat mengirim foto.</span>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!imageSrc || isSubmitting || !isWithinRadius}
              className={`w-full mt-4 py-4 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-xl ${
                !imageSrc || !isWithinRadius
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