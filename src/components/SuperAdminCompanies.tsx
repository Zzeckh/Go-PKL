import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Building2, Search, Plus, Trash2, MapPin, X, Loader2, Pencil,
  Navigation, MapPinned, SearchX, MousePointer2, Keyboard, Lightbulb,
  AlertCircle, Check,
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useApp } from '../context/AppContext';
import { LocationPickerModal } from './LocationPickerModal';
import {
  STREET_TILE,
  createPickerIcon,
  searchAddress,
  isValidCoord,
  GeoResult,
} from '../utils/leafletHelpers';

/* ══════════════════════════════════════════════════════
   KELOLA PERUSAHAAN (SUPER ADMIN)
   ══════════════════════════════════════════════════════ */
export const SuperCompanies: React.FC = () => {
  const { perusahaanList, loadCompanies, addCompany, updateCompany, deleteCompany, isAuthenticated } = useApp();

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [pickerCompany, setPickerCompany] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    loadCompanies().finally(() => setLoading(false));
  }, [isAuthenticated, loadCompanies]);

  const filtered = useMemo(
    () => perusahaanList.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.address || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.category || '').toLowerCase().includes(search.toLowerCase())
    ),
    [perusahaanList, search]
  );

  const handleDelete = async (c: any) => {
    if (!confirm(`Hapus perusahaan "${c.name}" permanen? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      await deleteCompany(c.id);
    } catch (err: any) {
      alert(err?.data?.error || err?.message || 'Gagal menghapus perusahaan.');
    }
  };

  return (
    <div className="h-full w-full flex flex-col gap-3 md:gap-4 overflow-hidden">
      <div className="flex items-center justify-between shrink-0 bg-white rounded-[24px] p-4 md:p-5 border border-mist/60 shadow-sm">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <div className="w-11 h-11 md:w-12 md:h-12 bg-navy rounded-[10px] flex items-center justify-center text-white shadow-md shadow-navy/20 shrink-0">
            <Building2 className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-lg md:text-xl text-navy leading-tight">Kelola Perusahaan</h2>
            <p className="text-[13px] text-navy/60 font-semibold mt-0.5 truncate">
              {perusahaanList.length} perusahaan mitra terdaftar
            </p>
          </div>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-1.5 bg-steel text-white text-xs font-bold px-4 py-2 rounded-[24px] shadow-md shadow-steel/25 hover:bg-steel/90 hover:-translate-y-0.5 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> Tambah Perusahaan
        </button>
      </div>

      <div className="shrink-0 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/40" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari nama perusahaan, alamat, kategori..."
          className="w-full bg-white border border-mist/60 rounded-[24px] pl-10 pr-10 py-2.5 text-sm font-medium text-navy outline-none focus:border-steel transition-all"
        />
      </div>

      <div className="flex-1 bg-white rounded-[24px] border border-mist/60 shadow-sm overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-5">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="flex items-center gap-2 text-navy/60">
                <Loader2 className="w-5 h-5 animate-spin text-steel" />
                <span className="text-sm font-semibold">Memuat data...</span>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-14 h-14 rounded-[10px] bg-shell flex items-center justify-center mb-3 mx-auto">
                <Building2 className="w-6 h-6 text-navy/30" />
              </div>
              <p className="text-sm font-bold text-navy mb-1">{search ? 'Tidak ada hasil' : 'Belum ada perusahaan'}</p>
              <p className="text-xs text-navy/50">Klik "Tambah Perusahaan" untuk menambah data baru.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered.map(c => {
                const hasCoords = c.latitude != null && c.longitude != null;
                return (
                  <div key={c.id} className="p-4 rounded-[24px] border border-mist/60 bg-white hover:border-steel/30 transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-11 h-11 rounded-[10px] bg-steel/10 flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5 text-steel" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => { setEditing(c); setShowForm(true); }}
                          className="w-8 h-8 rounded-lg bg-shell text-navy/70 hover:bg-mist flex items-center justify-center transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(c)}
                          className="w-8 h-8 rounded-lg bg-navy/5 text-navy/60 hover:bg-navy/10 flex items-center justify-center transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <h3 className="font-bold text-sm text-navy truncate">{c.name}</h3>
                    <p className="text-[11px] text-navy/50 truncate mt-0.5">{c.address}</p>

                    <div className="space-y-1.5 mt-3">
                      <div className="flex justify-between items-center bg-shell border border-mist rounded-lg px-2.5 py-1.5">
                        <span className="text-[11px] font-bold text-navy/60">Kuota</span>
                        <span className="text-[11px] font-bold text-navy tabular-nums">{c.filled}/${c.quota}</span>
                      </div>
                      <div className="flex justify-between items-center bg-shell border border-mist rounded-lg px-2.5 py-1.5">
                        <span className="text-[11px] font-bold text-navy/60">Kategori</span>
                        <span className="text-[11px] font-bold text-navy truncate ml-2">{c.category || '-'}</span>
                      </div>
                      <div className={`flex justify-between items-center rounded-lg px-2.5 py-1.5 border ${
                        hasCoords ? 'bg-steel/10 border-steel/30' : 'bg-steel/10 border-steel/20'
                      }`}>
                        <div className="flex items-center gap-1.5">
                          <MapPinned className={`w-3.5 h-3.5 ${hasCoords ? 'text-steel' : 'text-steel'}`} />
                          <span className={`text-[11px] font-bold ${hasCoords ? 'text-steel' : 'text-steel'}`}>
                            {hasCoords ? 'Koordinat Aktif' : 'Belum Diatur'}
                          </span>
                        </div>
                        <button
                          onClick={() => setPickerCompany(c)}
                          className={`text-[10px] font-bold px-2 py-1 rounded-md transition-colors ${
                            hasCoords ? 'bg-white text-navy hover:bg-mist' : 'bg-steel text-white hover:bg-steel/90'
                          }`}
                        >
                          {hasCoords ? 'Edit' : 'Atur Lokasi'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <CompanyFormModal
          company={editing}
          onClose={() => setShowForm(false)}
          onCreate={addCompany}
          onUpdate={updateCompany}
        />
      )}

      {pickerCompany && (
        <LocationPickerModal
          companyId={pickerCompany.id}
          companyName={pickerCompany.name}
          initialLat={pickerCompany.latitude}
          initialLng={pickerCompany.longitude}
          initialRadius={pickerCompany.radiusMeters || 500}
          onClose={() => setPickerCompany(null)}
        />
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   FORM TAMBAH / EDIT PERUSAHAAN (dengan peta leaflet)
   ══════════════════════════════════════════════════════ */
const CompanyFormModal: React.FC<{
  company: any;
  onClose: () => void;
  onCreate: (data: any) => Promise<any>;
  onUpdate: (id: number, data: any) => Promise<any>;
}> = ({ company, onClose, onCreate, onUpdate }) => {
  const isEdit = !!company;

  const [form, setForm] = useState({
    name: company?.name || '',
    address: company?.address || '',
    category: company?.category || '',
    quota: company?.quota || 5,
  });

  const [lat, setLat] = useState<number | null>(company?.latitude ?? null);
  const [lng, setLng] = useState<number | null>(company?.longitude ?? null);
  const [radius, setRadius] = useState<number>(company?.radiusMeters || 500);
  const [latInput, setLatInput] = useState<string>(company?.latitude?.toString() || '');
  const [lngInput, setLngInput] = useState<string>(company?.longitude?.toString() || '');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeoResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [manualMode, setManualMode] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const latInputRef = useRef<HTMLInputElement>(null);

  const hasValidCoord = isValidCoord(lat as number, lng as number);

  /* ── Debounced search (Nominatim/OSM) ── */
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 3) {
      setSearchResults([]); setNoResults(false); setShowDropdown(false);
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
      } catch {
        setSearchResults([]); setNoResults(true); setShowDropdown(true);
      } finally {
        setIsSearching(false);
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const syncMarkerToCoords = (la: number, ln: number) => {
    const map = mapRef.current;
    if (!map) return;
    const latlng: L.LatLngExpression = [la, ln];
    if (!markerRef.current) {
      const marker = L.marker(latlng, { icon: createPickerIcon(), draggable: true }).addTo(map);
      marker.on('dragend', (e) => {
        const pos = (e.target as L.Marker).getLatLng();
        setLat(pos.lat); setLng(pos.lng);
        setLatInput(pos.lat.toFixed(6)); setLngInput(pos.lng.toFixed(6));
        if (circleRef.current) circleRef.current.setLatLng([pos.lat, pos.lng]);
      });
      markerRef.current = marker;
    } else {
      markerRef.current.setLatLng(latlng);
    }
    if (!circleRef.current) {
      circleRef.current = L.circle(latlng, {
        radius, color: '#4478AE', weight: 2, fillColor: '#4478AE', fillOpacity: 0.1, dashArray: '4 4',
      }).addTo(map);
    } else {
      circleRef.current.setLatLng(latlng);
    }
  };

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const hasInitial = isValidCoord(lat as number, lng as number);
    const center: [number, number] = hasInitial ? [lat as number, lng as number] : [-6.2088, 106.8456];
    const map = L.map(mapContainerRef.current, { center, zoom: hasInitial ? 16 : 12, zoomControl: true });
    L.tileLayer(STREET_TILE.url, { attribution: STREET_TILE.attribution, maxZoom: STREET_TILE.maxZoom }).addTo(map);
    if (hasInitial) syncMarkerToCoords(lat as number, lng as number);
    map.on('click', (e) => {
      const la = e.latlng.lat, ln = e.latlng.lng;
      setLat(la); setLng(ln);
      setLatInput(la.toFixed(6)); setLngInput(ln.toFixed(6));
      syncMarkerToCoords(la, ln);
    });
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; markerRef.current = null; circleRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (circleRef.current) circleRef.current.setRadius(radius);
  }, [radius]);

  const enterManualMode = (focusInput: boolean) => {
    setShowDropdown(false); setNoResults(false); setManualMode(true);
    if (focusInput) setTimeout(() => latInputRef.current?.focus(), 150);
  };

  const handleSelectResult = (r: GeoResult) => {
    setLat(r.lat); setLng(r.lng);
    setLatInput(r.lat.toFixed(6)); setLngInput(r.lng.toFixed(6));
    setSearchQuery(''); setShowDropdown(false); setNoResults(false); setManualMode(false);
    mapRef.current?.flyTo([r.lat, r.lng], 16, { duration: 0.8 });
    syncMarkerToCoords(r.lat, r.lng);
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLat(latitude); setLng(longitude);
        setLatInput(latitude.toFixed(6)); setLngInput(longitude.toFixed(6));
        mapRef.current?.flyTo([latitude, longitude], 16, { duration: 0.8 });
        syncMarkerToCoords(latitude, longitude);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleManualInputCommit = () => {
    const la = Number(latInput), ln = Number(lngInput);
    if (isValidCoord(la, ln)) {
      setLat(la); setLng(ln);
      mapRef.current?.flyTo([la, ln], 16, { duration: 0.6 });
      syncMarkerToCoords(la, ln);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.address) {
      setError('Nama dan alamat perusahaan wajib diisi.');
      return;
    }
    if (!hasValidCoord) {
      setError('Koordinat (latitude/longitude) wajib diisi. Cari alamat di peta atau isi manual.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name,
        address: form.address,
        category: form.category || undefined,
        quota: Number(form.quota) || 0,
        latitude: lat as number,
        longitude: lng as number,
        radiusMeters: radius,
      };
      if (isEdit) {
        await onUpdate(company.id, payload);
      } else {
        await onCreate(payload);
      }
      onClose();
    } catch (err: any) {
      setError(err?.data?.error || err?.message || 'Gagal menyimpan perusahaan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6 bg-navy/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-[24px] max-w-3xl w-full max-h-[94vh] shadow-2xl flex flex-col overflow-hidden border border-white/40">
        <div className="p-5 border-b border-mist/60 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-navy flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-navy">{isEdit ? 'Edit Perusahaan' : 'Tambah Perusahaan'}</h3>
              <p className="text-[12px] font-semibold text-navy/60 mt-0.5">Lengkapi data & geofence lokasi</p>
            </div>
          </div>
          <button onClick={onClose} disabled={saving} className="w-9 h-9 rounded-[10px] bg-mist/60 hover:bg-mist flex items-center justify-center text-navy/60 transition-colors shrink-0 disabled:opacity-50">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-navy/70 uppercase tracking-wide block mb-1.5">Nama Perusahaan *</label>
              <input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Contoh: UPTD Tikomdik"
                className="w-full bg-shell border border-mist rounded-[24px] px-3.5 py-2.5 text-sm font-semibold text-navy outline-none focus:border-steel focus:bg-white transition-all placeholder:text-navy/40"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-navy/70 uppercase tracking-wide block mb-1.5">Alamat *</label>
              <input
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                placeholder="Alamat lengkap"
                className="w-full bg-shell border border-mist rounded-[24px] px-3.5 py-2.5 text-sm font-semibold text-navy outline-none focus:border-steel focus:bg-white transition-all placeholder:text-navy/40"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-navy/70 uppercase tracking-wide block mb-1.5">Kategori</label>
              <input
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                placeholder="Contoh: IT"
                className="w-full bg-shell border border-mist rounded-[24px] px-3.5 py-2.5 text-sm font-semibold text-navy outline-none focus:border-steel focus:bg-white transition-all placeholder:text-navy/40"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-navy/70 uppercase tracking-wide block mb-1.5">Kuota Siswa</label>
              <input
                type="number"
                value={form.quota}
                min={0}
                onChange={e => setForm({ ...form, quota: Number(e.target.value) || 0 })}
                className="w-full bg-shell border border-mist rounded-[24px] px-3.5 py-2.5 text-sm font-semibold text-navy outline-none focus:border-steel focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* ── LOCATION PICKER (leaflet) ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold text-navy/70 uppercase tracking-wide">Lokasi / Geofence *</label>
              {hasValidCoord && (
                <span className="text-[11px] font-bold bg-steel/15 text-steel px-2.5 py-1 rounded-full tabular-nums">
                  {lat?.toFixed(4)}, {lng?.toFixed(4)}
                </span>
              )}
            </div>

            <div className="rounded-3xl border border-mist/60 overflow-hidden shadow-sm">
              <div className="p-3 border-b border-mist/60 bg-white">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/40 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onFocus={() => (searchResults.length > 0 || noResults) && setShowDropdown(true)}
                      placeholder="Cari alamat / sekolah / tempat..."
                      className="w-full bg-shell border border-mist rounded-[24px] pl-10 pr-10 py-2.5 text-sm font-medium text-navy outline-none focus:border-steel focus:bg-white transition-all placeholder:text-navy/40"
                    />
                    {isSearching && <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-steel animate-spin" />}
                    {!isSearching && searchQuery && (
                      <button type="button" onClick={() => { setSearchQuery(''); setSearchResults([]); setShowDropdown(false); setNoResults(false); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-navy/10 hover:bg-navy/20 flex items-center justify-center">
                        <X className="w-3 h-3 text-navy/60" />
                      </button>
                    )}
                  </div>
                  <button type="button" onClick={handleLocateMe} title="Gunakan lokasi saya"
                    className="w-10 h-10 rounded-[10px] bg-steel/10 hover:bg-steel/20 text-steel flex items-center justify-center transition-colors shrink-0">
                    <Navigation className="w-4 h-4" />
                  </button>
                </div>

                {showDropdown && (searchResults.length > 0 || noResults) && (
                  <div className="absolute left-3 right-3 mt-2 bg-white border border-mist rounded-[24px] overflow-hidden z-[2000] animate-in fade-in slide-in-from-top-1 duration-150 shadow-[0_10px_40px_rgba(21,42,66,0.25)] border-t-2 border-t-steel">
                    {searchResults.length > 0 ? (
                      <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        {searchResults.map((r, i) => (
                          <button key={i} type="button" onClick={() => handleSelectResult(r)}
                            className="w-full text-left px-3.5 py-2.5 hover:bg-shell transition-colors border-b border-mist/50 last:border-b-0">
                            <p className="text-sm font-semibold text-navy line-clamp-2 leading-snug">{r.label}</p>
                            <p className="text-[10px] font-bold text-navy/40 tabular-nums mt-1">{r.lat.toFixed(4)}, {r.lng.toFixed(4)}</p>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <SearchX className="w-5 h-5 text-steel" />
                          <p className="text-sm font-bold text-navy">Lokasi tidak ditemukan di pencarian</p>
                        </div>
                        <p className="text-[11px] font-medium text-navy/60 leading-relaxed mb-3">
                          Pencarian memakai data OpenStreetMap, sehingga tempat yang belum terpetakan bisa tidak muncul.
                          Coba variasi nama, atau gunakan <span className="font-bold text-navy">input manual lewat titik koordinat</span> di bawah ini.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button type="button" onClick={() => enterManualMode(true)}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-steel text-white text-xs font-bold py-2.5 rounded-[24px] hover:bg-steel/90 transition-colors">
                            <Keyboard className="w-3.5 h-3.5" /> Input Manual via Koordinat
                          </button>
                          <button type="button" onClick={() => enterManualMode(false)}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-shell border border-mist text-navy text-xs font-bold py-2.5 rounded-[24px] hover:bg-mist transition-colors">
                            <MousePointer2 className="w-3.5 h-3.5" /> Klik Langsung di Peta
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {manualMode && (
                <div className="bg-steel/10 border-b border-steel/30 px-3.5 py-3">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-[10px] bg-steel text-white flex items-center justify-center shrink-0"><Lightbulb className="w-4 h-4" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold text-navy mb-1">Mode Manual Aktif — cari titik koordinat sendiri</p>
                      <ol className="text-[11px] font-medium text-navy/70 leading-relaxed list-decimal pl-4 space-y-0.5">
                        <li>Buka <span className="font-bold">Google Maps</span> di tab lain, cari tempatnya, lalu <span className="font-bold">klik kanan</span> pada titik dan salin angka koordinat (contoh: <span className="font-mono font-bold">-6.914744, 107.609628</span>).</li>
                        <li>Tempel angka ke kolom Latitude & Longitude di bawah, tekan Enter — peta langsung terbang ke titik itu.</li>
                        <li>Alternatifnya, klik langsung di peta atau geser pin, atur radius, lalu simpan.</li>
                      </ol>
                    </div>
                    <button type="button" onClick={() => setManualMode(false)} className="w-7 h-7 rounded-lg hover:bg-steel/20 flex items-center justify-center text-navy/50 transition-colors shrink-0"><X className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              )}

              <div className="relative">
                <div ref={mapContainerRef} className="w-full h-[320px] md:h-[340px]" />
                {!hasValidCoord && (
                  <div className="absolute inset-0 flex items-center justify-center bg-navy/5 backdrop-blur-[1px] pointer-events-none">
                    <div className="bg-white/95 backdrop-blur-sm px-4 py-3 rounded-[24px] shadow-lg border border-mist text-center max-w-xs">
                      <MapPin className="w-6 h-6 text-steel mx-auto mb-2" />
                      <p className="text-xs font-bold text-navy leading-tight">Cari alamat, input koordinat, atau klik peta</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 bg-white">
                <div>
                  <label className="text-[10px] font-bold text-navy/50 uppercase tracking-wide block mb-1.5">Latitude</label>
                  <input
                    ref={latInputRef} type="text" value={latInput}
                    onChange={e => setLatInput(e.target.value)}
                    onBlur={handleManualInputCommit}
                    onKeyDown={e => { if (e.key === 'Enter') handleManualInputCommit(); }}
                    placeholder="-6.914744"
                    className={`w-full border rounded-[24px] px-3 py-2 text-sm font-mono font-bold text-navy outline-none transition-all placeholder:text-navy/30 tabular-nums ${
                      manualMode ? 'bg-white border-steel ring-2 ring-steel/20' : 'bg-shell border-mist focus:border-steel focus:bg-white'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-navy/50 uppercase tracking-wide block mb-1.5">Longitude</label>
                  <input
                    type="text" value={lngInput}
                    onChange={e => setLngInput(e.target.value)}
                    onBlur={handleManualInputCommit}
                    onKeyDown={e => { if (e.key === 'Enter') handleManualInputCommit(); }}
                    placeholder="107.609628"
                    className={`w-full border rounded-[24px] px-3 py-2 text-sm font-mono font-bold text-navy outline-none transition-all placeholder:text-navy/30 tabular-nums ${
                      manualMode ? 'bg-white border-steel ring-2 ring-steel/20' : 'bg-shell border-mist focus:border-steel focus:bg-white'
                    }`}
                  />
                </div>
              </div>

              <div className="px-3 py-2.5 bg-white border-t border-mist/60">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-navy/70 uppercase tracking-wide">Radius Geofence</label>
                  <span className="text-xs font-bold text-steel tabular-nums px-2.5 py-1 bg-white border border-mist rounded-full">
                    <MapPin className="w-3 h-3 inline mr-1" />{radius}m
                  </span>
                </div>
                <input type="range" min={50} max={2000} step={50} value={radius}
                  onChange={e => setRadius(Number(e.target.value))} className="w-full accent-steel cursor-pointer" />
                <div className="flex justify-between mt-0.5">
                  <span className="text-[10px] text-navy/40 tabular-nums">50m</span>
                  <span className="text-[10px] text-navy/40 tabular-nums">2000m</span>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-navy/5 border border-navy/15 rounded-[24px] flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-navy/60 shrink-0 mt-0.5" />
              <p className="text-[12px] font-semibold text-navy leading-snug">{error}</p>
            </div>
          )}
        </form>

        <div className="p-4 md:p-5 pt-3 border-t border-mist/60 flex gap-2 shrink-0">
          <button type="button" onClick={onClose} disabled={saving}
            className="flex-1 bg-mist/60 text-navy/70 font-bold text-sm py-3 rounded-[24px] hover:bg-mist transition-colors disabled:opacity-50">
            Batal
          </button>
          <button type="button" onClick={handleSubmit} disabled={saving}
            className={`flex-1 font-bold text-sm py-3 rounded-[24px] transition-all flex items-center justify-center gap-1.5 ${
              saving ? 'bg-mist text-navy/40 cursor-not-allowed' : 'bg-steel text-white hover:bg-steel/90 hover:-translate-y-0.5 shadow-lg shadow-steel/25'
            }`}>
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : <><Check className="w-4 h-4" /> {isEdit ? 'Simpan Perubahan' : 'Simpan Perusahaan'}</>}
          </button>
        </div>
      </div>
    </div>
  );
};