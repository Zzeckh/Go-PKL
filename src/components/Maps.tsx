import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Compass, MapPin, Navigation, Users, Clock, 
  Building2, LocateFixed, Tag, ShieldCheck, ShieldAlert,
  GraduationCap, Briefcase, AlertTriangle, Loader2, Map as MapIcon
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  STREET_TILE, createCompanyIcon, createUserIcon,
  haversineMeters, isValidCoord,
} from '../utils/leafletHelpers';

interface MapsProps {
  locations?: any[];
  attendances?: any[];
  onCheckIn?: (...args: any[]) => void;
}

const getInitials = (name: string) => {
  if (!name || name === '-') return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export const Maps: React.FC<MapsProps> = () => {
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
          color: '#152A42',
          weight: 2,
          fillColor: '#152A42',
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
        color: '#152A42',
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
          <div className="w-16 h-16 rounded-[10px] bg-navy flex items-center justify-center mb-4">
            <Compass className="w-7 h-7 text-white" />
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
          <div className="w-16 h-16 rounded-[10px] bg-navy flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7 text-white" />
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
    <div className="h-full w-full flex flex-col gap-3 md:gap-4 overflow-y-auto custom-scrollbar">

      {/* ── HEADER ─ */}
      <div className="flex items-center justify-between shrink-0 bg-white rounded-[24px] p-4 md:p-5 border border-mist/60 shadow-sm">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <div className="w-11 h-11 md:w-12 md:h-12 bg-navy rounded-[10px] flex items-center justify-center text-white shadow-md shadow-navy/20 shrink-0">
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
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-navy/60 bg-mist/40 border border-mist px-3 py-2 rounded-full">
            <Building2 className="w-3.5 h-3.5" />
            {companiesWithCoords.length} Lokasi · {siswaList.length} Siswa
          </span>
        </div>
      </div>

      {/* ── MAIN GRID ── */}
      <div className="lg:flex-1 grid grid-cols-1 lg:grid-cols-5 gap-3 md:gap-4 lg:min-h-0">

        {/* ══ LEFT: MAP (Leaflet asli) ══ */}
        <div className="lg:col-span-3 bg-white rounded-[24px] border border-mist/60 shadow-sm overflow-hidden flex flex-col min-h-[300px] sm:min-h-[380px] lg:min-h-0">
          <div className="flex items-center justify-between px-4 md:px-5 pt-4 pb-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-navy flex items-center justify-center">
                <MapPin className="w-3.5 h-3.5 text-white" />
              </div>
              <p className="text-[13px] font-bold uppercase tracking-widest text-navy/70">Peta Sebaran</p>
            </div>
            <span className="text-[11px] font-bold bg-mist/40 text-navy/60 border border-mist px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <MapIcon className="w-3 h-3" /> Peta Jalan
            </span>
          </div>

          <div className="flex-1 relative overflow-hidden mx-4 md:mx-5 mb-4 md:mb-5 rounded-[20px] border border-navy/10">
            <div ref={mapContainerRef} className="absolute inset-0" />

            {/* ── GPS Status badge ── */}
            <div className="absolute left-3 bottom-3 z-[500] flex flex-col gap-2">
              {isLoadingGps ? (
                <div className="bg-white/95 backdrop-blur-sm px-3.5 py-2.5 rounded-[24px] border border-mist shadow-lg flex items-center gap-2.5">
                  <Loader2 className="w-3.5 h-3.5 text-steel animate-spin" />
                  <span className="text-xs font-bold text-navy">Mencari sinyal GPS...</span>
                </div>
              ) : gpsError ? (
                <div className="bg-white/95 backdrop-blur-sm px-3.5 py-2.5 rounded-[24px] border border-navy/15 shadow-lg flex items-start gap-2.5 max-w-[240px]">
                  <AlertTriangle className="w-3.5 h-3.5 text-navy/60 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-navy leading-tight">GPS tidak aktif</p>
                    <p className="text-[10px] text-navy/60 mt-0.5 line-clamp-2">{gpsError}</p>
                  </div>
                </div>
              ) : (
                <div className={`px-3.5 py-2.5 rounded-[24px] border shadow-lg flex items-center gap-2.5 ${
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
              className="absolute left-3 top-3 z-[500] w-9 h-9 rounded-[10px] bg-white/95 backdrop-blur-sm border border-mist shadow-lg flex items-center justify-center text-steel hover:bg-shell transition-colors"
            >
              <LocateFixed className="w-4 h-4" />
            </button>

            {/* ── Legend ── */}
            <div className="absolute right-3 top-3 z-[500] bg-white/95 backdrop-blur-sm border border-mist rounded-[24px] p-2.5 shadow-lg hidden sm:flex flex-col gap-1.5 text-[10px] font-bold">
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
        <div className="lg:col-span-2 flex flex-col gap-3 md:gap-4 lg:min-h-0">

          {/* ── Card navy: Lokasi Aktif ── */}
          {selected && (
            <div className="bg-navy rounded-[24px] p-5 shrink-0 relative overflow-hidden shadow-lg shadow-navy/20">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-white/60">Lokasi Aktif</p>
                  </div>
                  {distance != null && (
                    <span className={`text-[11px] font-bold px-3 py-1.5 rounded-full tabular-nums ${
                      isWithinRadius ? 'bg-steel text-white' : 'bg-white/10 text-white'
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
                  <div className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-[24px] border ${
                    isWithinRadius === true
                      ? 'bg-steel/20 border-steel/40'
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

          {/* ── Card putih: Stats — ukuran SEDANG & seimbang ── */}
          {selected && (
            <div className="bg-white rounded-[24px] border border-mist/60 shadow-sm p-4 shrink-0">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white border border-mist/60 rounded-2xl px-3 py-3.5 flex items-center gap-3 shadow-sm min-h-[84px]">
                  <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center shrink-0">
                    <Tag className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-navy/50 uppercase tracking-wide leading-none">Kategori</p>
                    <p className="text-[13px] font-bold text-navy truncate mt-1">
                      {(selected as any).category || 'DUDI Mitra'}
                    </p>
                  </div>
                </div>
                <div className="bg-white border border-mist/60 rounded-2xl px-3 py-3.5 flex items-center gap-3 shadow-sm min-h-[84px]">
                  <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-navy/50 uppercase tracking-wide leading-none">Siswa PKL</p>
                    <p className="text-[13px] font-bold text-navy mt-1">{internsCount} orang</p>
                  </div>
                </div>
                <div className="bg-white border border-mist/60 rounded-2xl px-3 py-3.5 flex items-center gap-3 shadow-sm min-h-[84px]">
                  <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-navy/50 uppercase tracking-wide leading-none">Radius</p>
                    <p className="text-[13px] font-bold text-navy mt-1 tabular-nums">
                      {selected.radiusMeters ?? 500}m
                    </p>
                  </div>
                </div>
                <div className="bg-white border border-mist/60 rounded-2xl px-3 py-3.5 flex items-center gap-3 shadow-sm min-h-[84px]">
                  <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center shrink-0">
                    <Navigation className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-navy/50 uppercase tracking-wide leading-none">Status</p>
                    <p className="text-[13px] font-bold text-navy mt-1">Aktif</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Card putih: PEMBIMBING — flex-1, item meregang rata menutup space ── */}
          <div className="bg-white rounded-[24px] border border-mist/60 shadow-sm p-4 lg:flex-1 flex flex-col lg:min-h-0">
            {selected ? (
              <>
                <div className="flex items-center justify-between mb-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-navy flex items-center justify-center">
                      <Users className="w-3.5 h-3.5 text-white" />
                    </div>
                    <p className="text-[13px] font-bold text-navy">Pembimbing</p>
                  </div>
                  <span className="text-[11px] font-bold text-navy/40 tabular-nums">2 orang</span>
                </div>

                <div className="lg:flex-1 flex flex-col gap-2.5 lg:min-h-0">
                  <div className="flex-1 flex items-center p-3.5 rounded-[24px] border border-mist/60 bg-mist/30 min-h-[88px]">
                    <div className="flex items-center gap-3 w-full">
                      <div className="w-11 h-11 rounded-[10px] bg-navy text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-md shadow-navy/20">
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

                  <div className="flex-1 flex items-center p-3.5 rounded-[24px] border border-mist/60 bg-mist/30 min-h-[88px]">
                    <div className="flex items-center gap-3 w-full">
                      <div className="w-11 h-11 rounded-[10px] bg-steel text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-md shadow-steel/25">
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