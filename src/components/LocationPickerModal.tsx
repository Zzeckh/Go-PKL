import React, { useState, useEffect, useRef } from 'react';
import {
  Map as MapIcon, Search, X, MapPin, Navigation, Loader2, AlertCircle, Check,
  SearchX, MousePointer2, Keyboard, Lightbulb,
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useApp } from '../context/AppContext';
import {
  STREET_TILE,
  createPickerIcon,
  searchAddress,
  GeoResult,
} from '../utils/leafletHelpers';

/* ── Validasi koordinat ketat ── */
const isValidCoord = (lat: any, lng: any): boolean => {
  if (lat == null || lng == null || lat === '' || lng === '') return false;
  const la = Number(lat);
  const ln = Number(lng);
  return Number.isFinite(la) && Number.isFinite(ln) &&
    la >= -90 && la <= 90 && ln >= -180 && ln <= 180;
};

interface LocationPickerModalProps {
  companyId: number;
  companyName: string;
  initialLat?: number | null;
  initialLng?: number | null;
  initialRadius?: number;
  onClose: () => void;
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  companyId,
  companyName,
  initialLat,
  initialLng,
  initialRadius = 500,
  onClose,
}) => {
  const { updateCompanyLocation } = useApp();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const latInputRef = useRef<HTMLInputElement>(null);

  const [lat, setLat] = useState<number | null>(initialLat ?? null);
  const [lng, setLng] = useState<number | null>(initialLng ?? null);
  const [radius, setRadius] = useState<number>(initialRadius);

  const [latInput, setLatInput] = useState<string>(initialLat?.toString() || '');
  const [lngInput, setLngInput] = useState<string>(initialLng?.toString() || '');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeoResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [noResults, setNoResults] = useState(false);

  // ── Mode manual: aktif saat pencarian gagal, memandu input koordinat ──
  const [manualMode, setManualMode] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  /* ── Debounced search (bias Indonesia + area map) ── */
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 3) {
      setSearchResults([]);
      setNoResults(false);
      setShowDropdown(false);
      return;
    }
    const timeout = setTimeout(async () => {
      setIsSearching(true);
      try {
        const center = mapRef.current?.getCenter();
        const near = center ? { lat: center.lat, lng: center.lng } : undefined;

        const results = await searchAddress(searchQuery, 5, near);
        setSearchResults(results);
        setNoResults(results.length === 0);
        setShowDropdown(true);
      } catch (err) {
        setSearchResults([]);
        setNoResults(true);
        setShowDropdown(true);
      } finally {
        setIsSearching(false);
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  /* ── Masuk mode manual + fokus ke input latitude ── */
  const enterManualMode = (focusInput: boolean) => {
    setShowDropdown(false);
    setNoResults(false);
    setManualMode(true);
    if (focusInput) {
      setTimeout(() => latInputRef.current?.focus(), 150);
    }
  };

  /* ── Sync marker + circle ── */
  const syncMarkerToCoords = (la: number, ln: number) => {
    const map = mapRef.current;
    if (!map) return;

    const latlng: L.LatLngExpression = [la, ln];

    if (!markerRef.current) {
      const marker = L.marker(latlng, { icon: createPickerIcon(), draggable: true }).addTo(map);
      marker.on('dragend', (e) => {
        const pos = (e.target as L.Marker).getLatLng();
        setLat(pos.lat);
        setLng(pos.lng);
        setLatInput(pos.lat.toFixed(6));
        setLngInput(pos.lng.toFixed(6));
        if (circleRef.current) circleRef.current.setLatLng([pos.lat, pos.lng]);
      });
      markerRef.current = marker;
    } else {
      markerRef.current.setLatLng(latlng);
    }

    if (!circleRef.current) {
      circleRef.current = L.circle(latlng, {
        radius,
        color: '#4478AE',
        weight: 2,
        fillColor: '#4478AE',
        fillOpacity: 0.1,
        dashArray: '4 4',
      }).addTo(map);
    } else {
      circleRef.current.setLatLng(latlng);
    }
  };

  /* ── Init map ── */
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const hasInitial = isValidCoord(lat, lng);
    const center: [number, number] = hasInitial
      ? [lat as number, lng as number]
      : [-6.2088, 106.8456];

    const map = L.map(mapContainerRef.current, {
      center,
      zoom: hasInitial ? 16 : 12,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer(STREET_TILE.url, {
      attribution: STREET_TILE.attribution,
      maxZoom: STREET_TILE.maxZoom,
    }).addTo(map);

    if (hasInitial) syncMarkerToCoords(lat as number, lng as number);

    map.on('click', (e) => {
      const la = e.latlng.lat;
      const ln = e.latlng.lng;
      setLat(la);
      setLng(ln);
      setLatInput(la.toFixed(6));
      setLngInput(ln.toFixed(6));
      syncMarkerToCoords(la, ln);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      circleRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Radius live update ── */
  useEffect(() => {
    if (circleRef.current) circleRef.current.setRadius(radius);
  }, [radius]);

  const handleSelectResult = (result: GeoResult) => {
    setLat(result.lat);
    setLng(result.lng);
    setLatInput(result.lat.toFixed(6));
    setLngInput(result.lng.toFixed(6));
    setSearchQuery('');
    setShowDropdown(false);
    setNoResults(false);
    setManualMode(false);
    const map = mapRef.current;
    if (map) map.flyTo([result.lat, result.lng], 16, { duration: 0.8 });
    syncMarkerToCoords(result.lat, result.lng);
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLat(latitude);
        setLng(longitude);
        setLatInput(latitude.toFixed(6));
        setLngInput(longitude.toFixed(6));
        const map = mapRef.current;
        if (map) map.flyTo([latitude, longitude], 16, { duration: 0.8 });
        syncMarkerToCoords(latitude, longitude);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleManualInputCommit = () => {
    const la = Number(latInput);
    const ln = Number(lngInput);
    if (isValidCoord(la, ln)) {
      setLat(la);
      setLng(ln);
      const map = mapRef.current;
      if (map) map.flyTo([la, ln], 16, { duration: 0.6 });
      syncMarkerToCoords(la, ln);
    }
  };

  const handleSave = async () => {
    if (!isValidCoord(lat, lng)) {
      setSaveError('Koordinat tidak valid. Pilih lokasi di peta atau cari alamat dulu.');
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    try {
      await updateCompanyLocation(companyId, lat as number, lng as number, radius);
      setSaveSuccess(true);
      setTimeout(() => onClose(), 800);
    } catch (err: any) {
      setSaveError(err?.message || 'Gagal menyimpan lokasi. Coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  const hasValidCoord = isValidCoord(lat, lng);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6 bg-navy/60 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* ══ CARD MODAL ══ */}
      <div className="bg-white rounded-[24px] max-w-3xl w-full max-h-[92vh] shadow-2xl flex flex-col overflow-hidden border border-white/40">
        
        {/* Header navy */}
        <div className="bg-navy p-4 md:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-[24px] bg-white/15 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base md:text-lg font-bold text-white truncate">
                Atur Lokasi Geofence
              </h3>
              <p className="text-[12px] font-semibold text-white/60 truncate mt-0.5">
                {companyName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="w-9 h-9 rounded-[24px] bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors shrink-0 disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-5 space-y-4">

          {/* Search bar */}
          <div className="relative">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/40 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => (searchResults.length > 0 || noResults) && setShowDropdown(true)}
                  placeholder="Cari alamat / sekolah / tempat..."
                  className="w-full bg-shell border border-mist rounded-[24px] pl-10 pr-10 py-2.5 text-sm font-medium text-navy outline-none focus:border-steel focus:bg-white transition-all placeholder:text-navy/40"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-steel animate-spin" />
                )}
                {!isSearching && searchQuery && (
                  <button
                    onClick={() => { setSearchQuery(''); setSearchResults([]); setShowDropdown(false); setNoResults(false); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-navy/10 hover:bg-navy/20 flex items-center justify-center"
                  >
                    <X className="w-3 h-3 text-navy/60" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={handleLocateMe}
                title="Gunakan lokasi saya"
                className="w-10 h-10 rounded-[24px] bg-steel/10 hover:bg-steel/20 text-steel flex items-center justify-center transition-colors shrink-0"
              >
                <Navigation className="w-4 h-4" />
              </button>
            </div>

            {/* Dropdown hasil / tidak ditemukan */}
            {showDropdown && (searchResults.length > 0 || noResults) && (
              <div className="absolute left-0 right-0 mt-2 bg-white border border-mist rounded-[24px] overflow-hidden z-[2000] animate-in fade-in slide-in-from-top-1 duration-150 shadow-[0_10px_40px_rgba(21,42,66,0.25)] border-t-2 border-t-steel">
                {searchResults.length > 0 ? (
                  <div className="max-h-60 overflow-y-auto custom-scrollbar">
                    {searchResults.map((r, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelectResult(r)}
                        className="w-full text-left px-3.5 py-2.5 hover:bg-shell transition-colors border-b border-mist/50 last:border-b-0"
                      >
                        <p className="text-sm font-semibold text-navy line-clamp-2 leading-snug">{r.label}</p>
                        <p className="text-[10px] font-bold text-navy/40 tabular-nums mt-1">
                          {r.lat.toFixed(4)}, {r.lng.toFixed(4)}
                        </p>
                      </button>
                    ))}
                  </div>
                ) : (
                  /* ── PEMBERITAHUAN: tempat tidak ada di OSM → alur manual ── */
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <SearchX className="w-5 h-5 text-steel" />
                      <p className="text-sm font-bold text-navy">Lokasi tidak ditemukan di pencarian</p>
                    </div>
                    <p className="text-[11px] font-medium text-navy/60 leading-relaxed mb-3">
                      Pencarian memakai data OpenStreetMap, sehingga tempat yang belum terpetakan
                      (atau penulisannya berbeda, contoh "SMKN 11" vs "SMK Negeri 11") bisa tidak muncul.
                      Coba variasi nama, atau gunakan <span className="font-bold text-navy">input manual lewat titik koordinat</span> di bawah ini.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={() => enterManualMode(true)}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-steel text-white text-xs font-bold py-2.5 rounded-[24px] hover:bg-steel/90 transition-colors"
                      >
                        <Keyboard className="w-3.5 h-3.5" /> Input Manual via Koordinat
                      </button>
                      <button
                        type="button"
                        onClick={() => enterManualMode(false)}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-shell border border-mist text-navy text-xs font-bold py-2.5 rounded-[24px] hover:bg-mist transition-colors"
                      >
                        <MousePointer2 className="w-3.5 h-3.5" /> Klik Langsung di Peta
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── BANNER MODE MANUAL: panduan ambil koordinat ── */}
          {manualMode && (
            <div className="bg-steel/10 border border-steel/30 rounded-[24px] p-3.5 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-[24px] bg-steel text-white flex items-center justify-center shrink-0">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-navy mb-1">
                    Mode Manual Aktif — cari titik koordinat sendiri
                  </p>
                  <ol className="text-[11px] font-medium text-navy/70 leading-relaxed list-decimal pl-4 space-y-0.5">
                    <li>
                      Buka <span className="font-bold">Google Maps</span> di tab lain, cari tempatnya
                      (misal "SMKN 11 Bandung"), lalu <span className="font-bold">klik kanan</span> pada
                      titik lokasi dan pilih/salin angka koordinat yang muncul
                      (contoh: <span className="font-mono font-bold">-6.914744, 107.609628</span>).
                    </li>
                    <li>
                      Tempel angka pertama ke kolom <span className="font-bold">Latitude</span> dan
                      angka kedua ke <span className="font-bold">Longitude</span> di bawah, tekan Enter —
                      peta langsung terbang ke titik itu.
                    </li>
                    <li>
                      Alternatifnya, <span className="font-bold">klik langsung di peta</span> atau geser
                      pin, atur radius, lalu Simpan Lokasi.
                    </li>
                  </ol>
                </div>
                <button
                  type="button"
                  onClick={() => setManualMode(false)}
                  className="w-7 h-7 rounded-lg hover:bg-steel/20 flex items-center justify-center text-navy/50 transition-colors shrink-0"
                  title="Tutup panduan"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Map */}
          <div className="relative rounded-3xl overflow-hidden border border-mist/60 shadow-sm">
            <div ref={mapContainerRef} className="w-full h-[360px] md:h-[420px]" />
            {!hasValidCoord && (
              <div className="absolute inset-0 flex items-center justify-center bg-navy/5 backdrop-blur-[1px] pointer-events-none">
                <div className="bg-white/95 backdrop-blur-sm px-4 py-3 rounded-[24px] shadow-lg border border-mist text-center max-w-xs">
                  <MapIcon className="w-6 h-6 text-steel mx-auto mb-2" />
                  <p className="text-xs font-bold text-navy leading-tight">
                    Klik peta atau cari alamat untuk mulai
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Lat/Lng inputs */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-navy/50 uppercase tracking-wide block mb-1.5">
                Latitude
              </label>
              <input
                ref={latInputRef}
                type="text"
                value={latInput}
                onChange={(e) => setLatInput(e.target.value)}
                onBlur={handleManualInputCommit}
                onKeyDown={(e) => { if (e.key === 'Enter') handleManualInputCommit(); }}
                placeholder="-6.914744"
                className={`w-full border rounded-[24px] px-3.5 py-2.5 text-sm font-mono font-bold text-navy outline-none transition-all placeholder:text-navy/30 tabular-nums ${
                  manualMode
                    ? 'bg-white border-steel ring-2 ring-steel/20'
                    : 'bg-shell border-mist focus:border-steel focus:bg-white'
                }`}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-navy/50 uppercase tracking-wide block mb-1.5">
                Longitude
              </label>
              <input
                type="text"
                value={lngInput}
                onChange={(e) => setLngInput(e.target.value)}
                onBlur={handleManualInputCommit}
                onKeyDown={(e) => { if (e.key === 'Enter') handleManualInputCommit(); }}
                placeholder="107.609628"
                className={`w-full border rounded-[24px] px-3.5 py-2.5 text-sm font-mono font-bold text-navy outline-none transition-all placeholder:text-navy/30 tabular-nums ${
                  manualMode
                    ? 'bg-white border-steel ring-2 ring-steel/20'
                    : 'bg-shell border-mist focus:border-steel focus:bg-white'
                }`}
              />
            </div>
          </div>

          {/* Radius card */}
          <div className="bg-shell border border-mist rounded-[24px] p-3.5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold text-navy/70 uppercase tracking-wide">
                Radius Geofence
              </label>
              <div className="flex items-center gap-1 bg-white border border-mist px-2.5 py-1 rounded-full">
                <MapPin className="w-3 h-3 text-steel" />
                <span className="text-xs font-bold text-steel tabular-nums">{radius}m</span>
              </div>
            </div>
            <input
              type="range"
              min={50}
              max={2000}
              step={50}
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full accent-steel cursor-pointer"
            />
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-navy/40 tabular-nums">50m</span>
              <span className="text-[10px] text-navy/40 tabular-nums">2000m</span>
            </div>
          </div>

          {/* Pesan error/sukses */}
          {saveError && (
            <div className="p-3 bg-navy/5 border border-navy/15 rounded-[24px] flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-navy/60 shrink-0 mt-0.5" />
              <p className="text-[12px] font-semibold text-navy leading-snug">{saveError}</p>
            </div>
          )}
          {saveSuccess && (
            <div className="p-3 bg-steel/10 border border-steel/30 rounded-[24px] flex items-start gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-steel shrink-0 mt-0.5" />
              <p className="text-[12px] font-semibold text-steel leading-snug">Lokasi berhasil disimpan!</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 md:p-5 pt-3 border-t border-mist/60 flex gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 bg-mist/60 text-navy/70 font-bold text-sm py-3 rounded-[24px] hover:bg-mist transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasValidCoord || isSaving}
            className={`flex-1 font-bold text-sm py-3 rounded-[24px] transition-all flex items-center justify-center gap-1.5 ${
              !hasValidCoord || isSaving
                ? 'bg-mist text-navy/40 cursor-not-allowed'
                : 'bg-steel text-white hover:bg-steel/90 hover:-translate-y-0.5 shadow-lg shadow-steel/25'
            }`}
          >
            {isSaving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
            ) : (
              <><MapPin className="w-4 h-4" /> Simpan Lokasi</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};