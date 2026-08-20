import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Compass, MapPin, CheckCircle2, Navigation, Users, Clock, 
  Building2, LocateFixed, Tag, ShieldCheck, ShieldAlert,
  GraduationCap, Briefcase, AlertTriangle, Loader2, Map as MapIcon
} from 'lucide-react';
import { AttendanceRecord } from '../types';
import { useApp } from '../context/AppContext';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  STREET_TILE, createCompanyIcon, createUserIcon,
  haversineMeters, isValidCoord,
} from '../utils/leafletHelpers';

interface MapsProps {
  locations: any[];
  attendances: AttendanceRecord[];
  onCheckIn: () => void;
}

const getInitials = (name: string) => {
  if (!name || name === '-') return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export const Maps: React.FC<MapsProps> = ({ attendances, onCheckIn }) => {
  const {
    perusahaanList, siswaList,
    userCompanyName, userCompanyLocation,
  } = useApp();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const companyMarkersRef = useRef<Map<number, L.Marker>>(new Map());
  const companyCirclesRef = useRef<Map<number, L.Circle>>(new Map());

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isLoadingGps, setIsLoadingGps] = useState(true);

  /* ── FIX ERROR #1: null-check sebelum isValidCoord ── */
  const companiesWithCoords = useMemo(
    () =>
      perusahaanList.filter(
        c => c.latitude != null && c.longitude != null && isValidCoord(c.latitude, c.longitude)
      ),
    [perusahaanList]
  );

  const userCompany = useMemo(
    () => perusahaanList.find(c => c.name === userCompanyName),
    [perusahaanList, userCompanyName]
  );

  const internsCountByCompany = useMemo(() => {
    const map: Record<string, number> = {};
    siswaList.forEach(s => {
      if (s.perusahaan && s.perusahaan !== '-') {
        map[s.perusahaan] = (map[s.perusahaan] || 0) + 1;
      }
    });
    return map;
  }, [siswaList]);

  const selected = useMemo(
    () =>
      companiesWithCoords.find(c => c.id === selectedId) ||
      companiesWithCoords.find(c => c.name === userCompanyName) ||
      companiesWithCoords[0] ||
      null,
    [companiesWithCoords, selectedId, userCompanyName]
  );

  const todayString = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const hasCheckedIn = attendances.some(a => a.date === todayString);

  const [distance, setDistance] = useState<number | null>(null);
  const [isWithinRadius, setIsWithinRadius] = useState<boolean | null>(null);

  useEffect(() => {
    if (!userPos || !selected?.latitude || !selected?.longitude) {
      setDistance(null);
      setIsWithinRadius(null);
      return;
    }
    const d = haversineMeters(userPos.lat, userPos.lng, selected.latitude, selected.longitude);
    setDistance(d);
    const radius = selected.radiusMeters ?? 500;
    setIsWithinRadius(d <= radius);
  }, [userPos, selected]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsError('Browser tidak mendukung Geolocation.');
      setIsLoadingGps(false);
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsError(null);
        setIsLoadingGps(false);
      },
      (err) => {
        setGpsError(err.message || 'Gagal mendapatkan lokasi GPS.');
        setIsLoadingGps(false);
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const center: [number, number] =
      userCompanyLocation?.lat && userCompanyLocation?.lng
        ? [userCompanyLocation.lat, userCompanyLocation.lng]
        : [-6.2088, 106.8456];

    const map = L.map(mapContainerRef.current, {
      center,
      zoom: userCompanyLocation ? 15 : 12,
      zoomControl: false,
      attributionControl: true,
    });

    L.tileLayer(STREET_TILE.url, {
      attribution: STREET_TILE.attribution,
      maxZoom: STREET_TILE.maxZoom,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      userMarkerRef.current = null;
      polylineRef.current = null;
      companyMarkersRef.current.clear();
      companyCirclesRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const existingIds = new Set(companyMarkersRef.current.keys());
    const nextIds = new Set(companiesWithCoords.map(c => c.id));

    existingIds.forEach(id => {
      if (!nextIds.has(id)) {
        companyMarkersRef.current.get(id)?.remove();
        companyCirclesRef.current.get(id)?.remove();
        companyMarkersRef.current.delete(id);
        companyCirclesRef.current.delete(id);
      }
    });

    companiesWithCoords.forEach(c => {
      const latlng: L.LatLngExpression = [c.latitude as number, c.longitude as number];
      const isSel = (selectedId !== null ? selectedId : userCompany?.id) === c.id;

      if (!companyMarkersRef.current.has(c.id)) {
        const marker = L.marker(latlng, {
          icon: createCompanyIcon(isSel),
          zIndexOffset: isSel ? 1000 : 0,
        }).addTo(map);
        marker.on('click', () => setSelectedId(c.id));
        companyMarkersRef.current.set(c.id, marker);
      } else {
        const marker = companyMarkersRef.current.get(c.id)!;
        marker.setLatLng(latlng);
        marker.setIcon(createCompanyIcon(isSel));
        marker.setZIndexOffset(isSel ? 1000 : 0);
      }

      if (!companyCirclesRef.current.has(c.id)) {
        const circle = L.circle(latlng, {
          radius: c.radiusMeters ?? 500,
          color: '#4478AE',
          weight: 2,
          fillColor: '#4478AE',
          fillOpacity: 0.08,
          dashArray: '4 4',
        }).addTo(map);
        companyCirclesRef.current.set(c.id, circle);
      } else {
        const circle = companyCirclesRef.current.get(c.id)!;
        circle.setLatLng(latlng);
        circle.setRadius(c.radiusMeters ?? 500);
      }
    });
  }, [companiesWithCoords, selectedId, userCompany]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userPos) return;

    const latlng: L.LatLngExpression = [userPos.lat, userPos.lng];
    if (!userMarkerRef.current) {
      const marker = L.marker(latlng, { icon: createUserIcon(), zIndexOffset: 2000 }).addTo(map);
      userMarkerRef.current = marker;
    } else {
      userMarkerRef.current.setLatLng(latlng);
    }
  }, [userPos]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userPos || !selected?.latitude || !selected?.longitude) {
      if (polylineRef.current) {
        polylineRef.current.remove();
        polylineRef.current = null;
      }
      return;
    }
    const latlngs: L.LatLngExpression[] = [
      [userPos.lat, userPos.lng],
      [selected.latitude, selected.longitude],
    ];
    if (!polylineRef.current) {
      polylineRef.current = L.polyline(latlngs, {
        color: '#4478AE',
        weight: 2,
        dashArray: '6 8',
        opacity: 0.8,
      }).addTo(map);
    } else {
      polylineRef.current.setLatLngs(latlngs);
    }
  }, [userPos, selected]);

  const handleLocateMe = () => {
    if (userPos && mapRef.current) {
      mapRef.current.flyTo([userPos.lat, userPos.lng], 16, { duration: 0.8 });
    } else if (navigator.geolocation) {
      setIsLoadingGps(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          mapRef.current?.flyTo([pos.coords.latitude, pos.coords.longitude], 16, { duration: 0.8 });
          setIsLoadingGps(false);
        },
        (err) => {
          setGpsError(err.message);
          setIsLoadingGps(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

  const mentorName = selected?.mentor || 'Mentor Industri';
  const teacherName = selected
    ? siswaList.find(s => s.perusahaan === selected.name && s.guruPembimbing !== '-')?.guruPembimbing || 'Guru Pembimbing'
    : 'Guru Pembimbing';
  const internsCount = selected ? internsCountByCompany[selected.name] || 0 : 0;

  if (companiesWithCoords.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center p-4">
        <div className="bg-white rounded-[24px] border border-mist/60 shadow-sm max-w-sm w-full flex flex-col items-center text-center p-8">
          <div className="w-16 h-16 rounded-2xl bg-shell flex items-center justify-center mb-4">
            <Compass className="w-7 h-7 text-navy/40" />
          </div>
          <h2 className="text-lg font-bold text-navy mb-1">Belum Ada Lokasi PKL</h2>
          <p className="text-sm text-navy/60 leading-relaxed">
            Titik koordinat perusahaan akan muncul di sini setelah tim Hubin
            mengatur lokasi geofence melalui menu Kelola Data.
          </p>
        </div>
      </div>
    );
  }

  if (!userCompany) {
    return (
      <div className="h-full w-full flex items-center justify-center p-4">
        <div className="bg-white rounded-[24px] border border-mist/60 shadow-sm max-w-sm w-full flex flex-col items-center text-center p-8">
          <div className="w-16 h-16 rounded-2xl bg-steel/10 flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7 text-steel" />
          </div>
          <h2 className="text-lg font-bold text-navy mb-1">Kamu Belum Dipetakan</h2>
          <p className="text-sm text-navy/60 leading-relaxed">
            Kamu belum dipetakan ke perusahaan PKL. Hubungi tim Hubin untuk penempatan terlebih dahulu.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col gap-3 md:gap-4 overflow-hidden">

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between shrink-0 bg-white rounded-[24px] p-4 md:p-5 border border-mist/60 shadow-sm">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <div className="w-11 h-11 md:w-12 md:h-12 bg-navy rounded-2xl flex items-center justify-center text-white shadow-md shadow-navy/20 shrink-0">
            <Compass className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-lg md:text-xl text-navy leading-tight">Geofencing & Lokasi PKL</h2>
            <p className="text-[13px] text-navy/60 font-semibold mt-0.5 truncate">
              Pantau titik koordinat perusahaan mitra secara real-time
            </p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-navy/60 bg-shell border border-mist px-3 py-2 rounded-full">
            <Building2 className="w-3.5 h-3.5" />
            {companiesWithCoords.length} Lokasi · {siswaList.length} Siswa
          </span>
        </div>
      </div>

      {/* ── MAIN GRID ── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-3 md:gap-4 min-h-0">

        {/* ══ LEFT: MAP (Leaflet asli) ══ */}
        <div className="lg:col-span-3 bg-white rounded-[24px] border border-mist/60 shadow-sm overflow-hidden flex flex-col min-h-[380px] lg:min-h-0">
          <div className="flex items-center justify-between px-4 md:px-5 pt-4 pb-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-steel/15 flex items-center justify-center">
                <MapPin className="w-3.5 h-3.5 text-steel" />
              </div>
              <p className="text-[13px] font-bold uppercase tracking-widest text-navy/70">Peta Sebaran</p>
            </div>
            <span className="text-[11px] font-bold bg-shell text-navy/60 border border-mist px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <MapIcon className="w-3 h-3" /> Peta Jalan
            </span>
          </div>

          <div className="flex-1 relative overflow-hidden mx-4 md:mx-5 mb-4 md:mb-5 rounded-[20px] border border-navy/10">
            <div ref={mapContainerRef} className="absolute inset-0" />

            {/* ── GPS Status badge ── */}
            <div className="absolute left-3 bottom-3 z-[500] flex flex-col gap-2">
              {isLoadingGps ? (
                <div className="bg-white/95 backdrop-blur-sm px-3.5 py-2.5 rounded-xl border border-mist shadow-lg flex items-center gap-2.5">
                  <Loader2 className="w-3.5 h-3.5 text-steel animate-spin" />
                  <span className="text-xs font-bold text-navy">Mencari sinyal GPS...</span>
                </div>
              ) : gpsError ? (
                <div className="bg-white/95 backdrop-blur-sm px-3.5 py-2.5 rounded-xl border border-navy/15 shadow-lg flex items-start gap-2.5 max-w-[240px]">
                  <AlertTriangle className="w-3.5 h-3.5 text-navy/60 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-navy leading-tight">GPS tidak aktif</p>
                    <p className="text-[10px] text-navy/60 mt-0.5 line-clamp-2">{gpsError}</p>
                  </div>
                </div>
              ) : (
                <div className={`px-3.5 py-2.5 rounded-xl border shadow-lg flex items-center gap-2.5 ${
                  isWithinRadius === true
                    ? 'bg-white/95 backdrop-blur-sm border-steel/40'
                    : isWithinRadius === false
                      ? 'bg-white/95 backdrop-blur-sm border-navy/15'
                      : 'bg-white/95 backdrop-blur-sm border-mist'
                }`}>
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-40 ${
                      isWithinRadius === true ? 'bg-steel' : isWithinRadius === false ? 'bg-navy' : 'bg-steel'
                    }`} />
                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                      isWithinRadius === true ? 'bg-steel' : isWithinRadius === false ? 'bg-navy' : 'bg-steel'
                    }`} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-navy leading-tight">
                      {isWithinRadius === true
                        ? 'GPS Aktif · Dalam Radius'
                        : isWithinRadius === false
                          ? 'GPS Aktif · Di Luar Radius'
                          : 'GPS Aktif'}
                    </p>
                    {distance != null && selected && (
                      <p className="text-[10px] font-semibold text-navy/60 tabular-nums">
                        {distance}m dari {selected.name}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── Locate me ── */}
            <button
              onClick={handleLocateMe}
              title="Pusatkan ke lokasi saya"
              className="absolute left-3 top-3 z-[500] w-9 h-9 rounded-xl bg-white/95 backdrop-blur-sm border border-mist shadow-lg flex items-center justify-center text-steel hover:bg-shell transition-colors"
            >
              <LocateFixed className="w-4 h-4" />
            </button>

            {/* ── Legend ── */}
            <div className="absolute right-3 top-3 z-[500] bg-white/95 backdrop-blur-sm border border-mist rounded-xl p-2.5 shadow-lg flex flex-col gap-1.5 text-[10px] font-bold">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-navy border-2 border-white shadow" />
                <span className="text-navy/70">Lokasi Kamu</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-white border-2 border-steel" />
                <span className="text-navy/70">Perusahaan</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-0.5 border-t-2 border-dashed border-steel" />
                <span className="text-navy/70">Geofence</span>
              </div>
            </div>
          </div>
        </div>

        {/* ══ RIGHT: STACKED CARDS ══ */}
        <div className="lg:col-span-2 flex flex-col gap-3 md:gap-4 min-h-0">

          {/* ── Card navy: Lokasi Aktif ── */}
          {selected && (
            <div className="bg-navy rounded-[24px] p-5 shrink-0 relative overflow-hidden shadow-lg shadow-navy/20">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-white/60">Lokasi Aktif</p>
                  </div>
                  {distance != null && (
                    <span className={`text-[11px] font-bold px-3 py-1.5 rounded-full tabular-nums ${
                      isWithinRadius ? 'bg-steel text-white' : 'bg-navy text-white'
                    }`}>
                      {distance}m
                    </span>
                  )}
                </div>

                <h4 className="font-bold text-base text-white leading-tight">{selected.name}</h4>
                <p className="text-[13px] font-medium text-white/60 mt-1 leading-relaxed line-clamp-2">
                  {selected.address}
                </p>

                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border ${
                    isWithinRadius === true
                      ? 'bg-steel/20 border-steel/40'
                      : isWithinRadius === false
                        ? 'bg-navy/10 border-navy/30'
                        : 'bg-white/10 border-white/15'
                  }`}>
                    <div className="flex items-center gap-2 min-w-0">
                      {isWithinRadius === false ? (
                        <ShieldAlert className="w-4 h-4 text-white/70 shrink-0" />
                      ) : (
                        <ShieldCheck className="w-4 h-4 text-steel shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-[12px] font-bold text-white leading-tight">
                          {isWithinRadius === true
                            ? 'Geofence Terverifikasi'
                            : isWithinRadius === false
                              ? 'Di Luar Radius'
                              : 'Menunggu GPS'}
                        </p>
                        <p className="text-[11px] text-white/60 font-semibold">
                          {isWithinRadius === true
                            ? `Radius ${selected.radiusMeters ?? 500}m · ${internsCount} siswa aktif`
                            : isWithinRadius === false
                              ? `Melebihi batas ${selected.radiusMeters ?? 500}m`
                              : `Radius ${selected.radiusMeters ?? 500}m`}
                        </p>
                      </div>
                    </div>
                    {isWithinRadius === true && (
                      <div className="w-2 h-2 rounded-full bg-steel animate-pulse shrink-0" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Card putih: Stats + CTA ── */}
          {selected && (
            <div className="bg-white rounded-[24px] border border-mist/60 shadow-sm p-4 shrink-0">
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-shell border border-mist rounded-xl px-3 py-2.5 flex items-center gap-2.5">
                  <Tag className="w-4 h-4 text-navy/50 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-navy/50 uppercase tracking-wide leading-none">Kategori</p>
                    <p className="text-[13px] font-bold text-navy truncate mt-1">
                      {(selected as any).category || 'DUDI Mitra'}
                    </p>
                  </div>
                </div>
                <div className="bg-shell border border-mist rounded-xl px-3 py-2.5 flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-navy/50 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-navy/50 uppercase tracking-wide leading-none">Siswa PKL</p>
                    <p className="text-[13px] font-bold text-navy mt-1">{internsCount} orang</p>
                  </div>
                </div>
                <div className="bg-shell border border-mist rounded-xl px-3 py-2.5 flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-navy/50 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-navy/50 uppercase tracking-wide leading-none">Radius</p>
                    <p className="text-[13px] font-bold text-navy mt-1 tabular-nums">
                      {selected.radiusMeters ?? 500}m
                    </p>
                  </div>
                </div>
                <div className="bg-shell border border-mist rounded-xl px-3 py-2.5 flex items-center gap-2.5">
                  <Navigation className="w-4 h-4 text-navy/50 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-navy/50 uppercase tracking-wide leading-none">Status</p>
                    <p className="text-[13px] font-bold text-steel mt-1">Aktif</p>
                  </div>
                </div>
              </div>

              <button
                onClick={onCheckIn}
                disabled={hasCheckedIn || isWithinRadius === false}
                className={`w-full py-3.5 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  hasCheckedIn
                    ? 'bg-mist/70 text-navy/40 cursor-not-allowed'
                    : isWithinRadius === false
                      ? 'bg-mist text-navy/40 cursor-not-allowed'
                      : 'bg-steel text-white hover:bg-steel/90 hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-steel/25'
                }`}
              >
                {hasCheckedIn
                  ? <><CheckCircle2 className="w-4 h-4" /> Sudah Check-in Hari Ini</>
                  : isWithinRadius === false
                    ? <><AlertTriangle className="w-4 h-4" /> Di Luar Radius</>
                    : <><Navigation className="w-4 h-4" /> Validasi Kehadiran</>
                }
              </button>
            </div>
          )}

          {/* ── Card putih: PEMBIMBING + List Perusahaan ── */}
          <div className="bg-white rounded-[24px] border border-mist/60 shadow-sm p-4 flex-1 flex flex-col min-h-[200px]">
            {selected ? (
              <>
                <div className="flex items-center justify-between mb-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-mist flex items-center justify-center">
                      <Users className="w-3.5 h-3.5 text-navy" />
                    </div>
                    <p className="text-[13px] font-bold text-navy">Pembimbing</p>
                  </div>
                  <span className="text-[11px] font-bold text-navy/40 tabular-nums">2 orang</span>
                </div>

                <div className="flex flex-col gap-2.5 mb-3 shrink-0">
                  <div className="p-3.5 rounded-2xl border border-mist/60 bg-shell/60">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-navy text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-md shadow-navy/20">
                        {getInitials(teacherName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-navy truncate">{teacherName}</p>
                        <p className="text-[11px] font-semibold text-navy/50 mt-0.5 truncate">
                          Monitoring akademik
                        </p>
                      </div>
                      <span className="text-[10px] font-bold bg-navy text-white px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
                        <GraduationCap className="w-3 h-3" /> GURU
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl border border-steel/30 bg-steel/5">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-steel text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-md shadow-steel/25">
                        {getInitials(mentorName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-navy truncate">{mentorName}</p>
                        <p className="text-[11px] font-semibold text-navy/50 mt-0.5 truncate">
                          Bimbingan harian
                        </p>
                      </div>
                      <span className="text-[10px] font-bold bg-steel text-white px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
                        <Briefcase className="w-3 h-3" /> MENTOR
                      </span>
                    </div>
                  </div>
                </div>

                {/* List perusahaan (pilih pin) */}
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                  <div className="flex items-center justify-between mb-2 shrink-0">
                    <p className="text-[11px] font-bold text-navy/50 uppercase tracking-wide">
                      Perusahaan Lain
                    </p>
                    <span className="text-[10px] font-bold text-navy/40 tabular-nums">
                      {companiesWithCoords.length} total
                    </span>
                  </div>
                  <div className="flex-1 flex flex-col gap-1.5 min-h-0 overflow-y-auto custom-scrollbar pr-1">
                    {companiesWithCoords.map(c => {
                      const isSel = selected.id === c.id;
                      const count = internsCountByCompany[c.name] || 0;
                      return (
                        <button
                          key={c.id}
                          onClick={() => {
                            setSelectedId(c.id);
                            mapRef.current?.flyTo([c.latitude as number, c.longitude as number], 15, { duration: 0.6 });
                          }}
                          className={`w-full text-left p-2.5 rounded-xl border transition-all shrink-0 flex items-center gap-2.5 ${
                            isSel
                              ? 'bg-steel/10 border-steel/40'
                              : 'bg-white border-mist/60 hover:border-steel/30 hover:bg-shell/50'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isSel ? 'bg-steel text-white' : 'bg-shell text-navy/50'
                          }`}>
                            <MapPin className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-[12px] font-bold truncate ${isSel ? 'text-steel' : 'text-navy'}`}>
                              {c.name}
                            </p>
                            <p className="text-[10px] font-semibold text-navy/50 truncate mt-0.5">
                              {count} siswa · {c.radiusMeters ?? 500}m
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center py-8">
                <p className="text-sm text-navy/50">Pilih perusahaan di peta</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};