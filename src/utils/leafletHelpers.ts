import L from 'leaflet';

/* ══════════════════════════════════════════════════════
   KONFIGURASI MAP GO-PKL
   - Tile: OpenStreetMap Standard (gratis, tanpa API key)
     → paling mirip Google Maps: ada icon POI (sekolah,
       restoran, bank, dll) mulai zoom ±15
   - Alternatif clean: CartoDB Voyager (lihat comment bawah)
   - Marker: custom divIcon warna brand (navy/steel)
   ══════════════════════════════════════════════════════ */

export const STREET_TILE = {
  // OSM Standard — full detail + icon POI ala Google Maps
  url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 19,
};

// ── ALTERNATIF: kalau OSM terasa ramai, ganti url di atas dengan Voyager:
//    'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
//    (lebih clean, tetap ada label tempat & warna area)

/* ── Warna brand (sinkron dengan design system) ── */
const NAVY = '#152A42';
const STEEL = '#4A7A8C';

/* ══════════════════════════════════════════════════════
   CUSTOM MARKER (divIcon — tanpa asset icon default)
   ══════════════════════════════════════════════════════ */

/** Pin perusahaan — steel saat dipilih, putih saat biasa */
export const createCompanyIcon = (isSelected = false) =>
  L.divIcon({
    className: 'gopkl-div-icon',
    html: `
      <div style="
        width: 34px; height: 34px; border-radius: 50% 50% 50% 4px;
        transform: rotate(-45deg);
        background: ${isSelected ? STEEL : '#FFFFFF'};
        border: 2px solid ${isSelected ? '#FFFFFF' : STEEL};
        box-shadow: 0 4px 12px rgba(21, 42, 66, 0.35);
        display: flex; align-items: center; justify-content: center;
        transition: all 0.2s ease;
      ">
        <div style="
          width: 10px; height: 10px; border-radius: 50%;
          background: ${isSelected ? '#FFFFFF' : STEEL};
        "></div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 32],
    popupAnchor: [0, -30],
  });

/** Titik lokasi siswa (live GPS) — dot navy dengan ring */
export const createUserIcon = () =>
  L.divIcon({
    className: 'gopkl-div-icon',
    html: `
      <div style="position: relative; width: 18px; height: 18px;">
        <div style="
          position: absolute; inset: -6px; border-radius: 50%;
          background: ${NAVY}; opacity: 0.15;
          animation: gopkl-pulse 1.6s ease-out infinite;
        "></div>
        <div style="
          width: 18px; height: 18px; border-radius: 50%;
          background: ${NAVY}; border: 3px solid #FFFFFF;
          box-shadow: 0 2px 8px rgba(21, 42, 66, 0.4);
        "></div>
      </div>
      <style>
        @keyframes gopkl-pulse {
          0%   { transform: scale(0.6); opacity: 0.35; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      </style>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

/** Marker draggable untuk picker (hubin) */
export const createPickerIcon = () =>
  L.divIcon({
    className: 'gopkl-div-icon',
    html: `
      <div style="
        width: 30px; height: 30px; border-radius: 50% 50% 50% 4px;
        transform: rotate(-45deg);
        background: ${NAVY};
        border: 2px solid #FFFFFF;
        box-shadow: 0 4px 14px rgba(21, 42, 66, 0.5);
        display: flex; align-items: center; justify-content: center;
      ">
        <div style="width: 8px; height: 8px; border-radius: 50%; background: #FFFFFF;"></div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 28],
  });

/* ══════════════════════════════════════════════════════
   NOMINATIM — geocoder gratis dari OpenStreetMap
   ══════════════════════════════════════════════════════ */

export interface GeoResult {
  label: string;
  lat: number;
  lng: number;
}

export const searchAddress = async (query: string, limit = 5): Promise<GeoResult[]> => {
  const url =
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=${limit}` +
    `&q=${encodeURIComponent(query)}`;

  const res = await fetch(url, {
    headers: { 'Accept-Language': 'id' },
  });
  if (!res.ok) throw new Error('Gagal mencari alamat. Coba lagi.');

  const data = await res.json();
  return data.map((d: any) => ({
    label: d.display_name,
    lat: parseFloat(d.lat),
    lng: parseFloat(d.lon),
  }));
};

/* ══════════════════════════════════════════════════════
   HAVERSINE — jarak dua koordinat (meter)
   ══════════════════════════════════════════════════════ */

export const haversineMeters = (
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number => {
  const R = 6371e3;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

/* ── Validasi koordinat ── */
export const isValidCoord = (lat: number, lng: number) =>
  Number.isFinite(lat) && Number.isFinite(lng) &&
  lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;