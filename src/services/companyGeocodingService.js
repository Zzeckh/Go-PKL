import { isValidCompanyLocation } from '../utils/companyImport.js';

const MIN_REQUEST_INTERVAL_MS = 1100;
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 1000;
const MAX_RETRIES = 1;
const CIMAHI_BOUNDS = {
  minLatitude: -7.02,
  maxLatitude: -6.78,
  minLongitude: 107.45,
  maxLongitude: 107.67,
};

const cache = new Map();
const inFlight = new Map();
let requestQueue = Promise.resolve();
let lastRequestAt = 0;

const normalizeAddress = (address) =>
  String(address ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

const readCachedResult = (key) => {
  const cached = cache.get(key);
  if (!cached) return undefined;

  if (cached.expiresAt <= Date.now()) {
    cache.delete(key);
    return undefined;
  }

  return cached.result;
};

const storeResult = (key, result) => {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) cache.delete(oldestKey);
  }

  cache.set(key, {
    result,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
};

const delay = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const deriveCityContext = ({ address, city }) => {
  if (city?.trim()) return city.trim();
  if (/cimahi|cimindi/i.test(address)) return 'Kota Cimahi';
  return '';
};

const simplifyAddress = (address) =>
  String(address ?? '')
    .replace(/\b(?:no\.?|nomor)\s*[\w./-]+/gi, '')
    .replace(/\b(?:rt|rw)\s*[\d./-]+/gi, '')
    .replace(/\s*,\s*/g, ', ')
    .replace(/,\s*,/g, ',')
    .replace(/\s+/g, ' ')
    .replace(/^[\s,.-]+|[\s,.-]+$/g, '')
    .trim();

export const buildCompanyGeocodingQueries = ({
  address,
  companyName,
  city,
  province,
  country,
} = {}) => {
  const fullAddress = String(address ?? '').trim();
  const name = String(companyName ?? '').trim();
  const cityContext = deriveCityContext({ address: fullAddress, city });
  const provinceContext =
    String(province ?? '').trim() ||
    (/jawa\s*barat|cimahi|cimindi/i.test(fullAddress)
      ? 'Jawa Barat'
      : '');
  const countryContext = String(country ?? '').trim() || 'Indonesia';
  const locationContext = [
    cityContext,
    provinceContext,
    countryContext,
  ]
    .filter(Boolean)
    .join(', ');
  const queries = [
    [fullAddress, locationContext].filter(Boolean).join(', '),
    [fullAddress, name, locationContext].filter(Boolean).join(', '),
    [name, cityContext || provinceContext, countryContext]
      .filter(Boolean)
      .join(', '),
  ];

  const generalAddress = simplifyAddress(fullAddress);
  if (generalAddress && generalAddress !== fullAddress) {
    queries.push(
      [generalAddress, locationContext].filter(Boolean).join(', ')
    );
  }

  return [...new Set(queries.map((query) => query.trim()).filter(Boolean))];
};

const responseIsRelevant = (result, expectedCity) => {
  if (!expectedCity) return true;

  const expected = expectedCity.toLowerCase();
  const displayName = String(result.display_name || '').toLowerCase();
  const address = result.address || {};
  const addressText = Object.values(address)
    .map((value) => String(value).toLowerCase())
    .join(' ');
  const placeText = `${displayName} ${addressText}`;

  if (expected.includes('cimahi') || expected.includes('cimindi')) {
    if (/cimahi|cimindi/.test(placeText)) return true;
    const latitude = Number(result.lat);
    const longitude = Number(result.lon);
    return (
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      latitude >= CIMAHI_BOUNDS.minLatitude &&
      latitude <= CIMAHI_BOUNDS.maxLatitude &&
      longitude >= CIMAHI_BOUNDS.minLongitude &&
      longitude <= CIMAHI_BOUNDS.maxLongitude
    );
  }

  return placeText.includes(expected);
};

const retryDelay = (response, attempt) => {
  const retryAfter = response.headers?.get?.('retry-after');
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) {
      return Math.max(MIN_REQUEST_INTERVAL_MS, seconds * 1000);
    }

    const dateDelay = Date.parse(retryAfter) - Date.now();
    if (Number.isFinite(dateDelay) && dateDelay > 0) {
      return Math.max(MIN_REQUEST_INTERVAL_MS, dateDelay);
    }
  }

  return MIN_REQUEST_INTERVAL_MS * (attempt + 1);
};

const fetchNominatim = async (query) => {
  const baseUrl =
    process.env.NOMINATIM_BASE_URL ||
    'https://nominatim.openstreetmap.org/search';
  const url = new URL(baseUrl);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('limit', '3');
  url.searchParams.set('countrycodes', 'id');
  url.searchParams.set('q', query);

  let lastError;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const waitTime =
      MIN_REQUEST_INTERVAL_MS - (Date.now() - lastRequestAt);
    if (lastRequestAt > 0 && waitTime > 0) {
      await delay(waitTime);
    }

    lastRequestAt = Date.now();

    let response;
    try {
      response = await fetch(url, {
        headers: {
          'Accept-Language': 'id',
          'User-Agent':
            process.env.NOMINATIM_USER_AGENT ||
            'Go-PKL/1.0 (company address lookup; configure NOMINATIM_USER_AGENT with contact)',
        },
        signal: AbortSignal.timeout(10000),
      });
    } catch (error) {
      const timedOut =
        error?.name === 'TimeoutError' ||
        error?.name === 'AbortError';
      lastError = Object.assign(
        new Error(
          timedOut
            ? 'Waktu permintaan ke Nominatim habis.'
            : `Koneksi ke Nominatim gagal: ${error.message}`
        ),
        { status: timedOut ? 504 : 502 }
      );
      if (attempt < MAX_RETRIES) {
        await delay(MIN_REQUEST_INTERVAL_MS * (attempt + 1));
        continue;
      }
      throw lastError;
    }

    if (response.ok) {
      let data;
      try {
        data = await response.json();
      } catch {
        throw Object.assign(
          new Error('Respons Nominatim bukan JSON yang valid.'),
          { status: 502 }
        );
      }

      if (!Array.isArray(data)) {
        throw Object.assign(
          new Error('Format respons Nominatim tidak sesuai.'),
          { status: 502 }
        );
      }
      return data;
    }

    const canRetry =
      (response.status === 429 || response.status >= 500) &&
      attempt < MAX_RETRIES;
    lastError = Object.assign(
      new Error(
        response.status === 429
          ? 'Nominatim membatasi permintaan (HTTP 429).'
          : `Nominatim gagal merespons (HTTP ${response.status}).`
      ),
      { status: response.status === 429 ? 503 : 502 }
    );
    if (!canRetry) throw lastError;

    await delay(retryDelay(response, attempt));
  }

  throw lastError || new Error('Pencarian Nominatim gagal.');
};

const enqueueNominatimRequest = (query) => {
  const cacheKey = normalizeAddress(query);
  const cachedResult = readCachedResult(cacheKey);
  if (cachedResult !== undefined) {
    return Promise.resolve(cachedResult);
  }

  if (inFlight.has(cacheKey)) return inFlight.get(cacheKey);

  const operation = requestQueue.then(async () => {
    const cached = readCachedResult(cacheKey);
    if (cached !== undefined) return cached;

    const results = await fetchNominatim(query);
    const normalizedResults = results
      .map((item) => {
        const latitude = Number(item?.lat);
        const longitude = Number(item?.lon);
        if (!isValidCompanyLocation(latitude, longitude)) return null;

        return {
          latitude,
          longitude,
          label: String(item.display_name || ''),
          address: item.address || {},
        };
      })
      .filter(Boolean);

    storeResult(cacheKey, normalizedResults);
    return normalizedResults;
  });

  requestQueue = operation.then(
    () => undefined,
    () => undefined
  );
  inFlight.set(cacheKey, operation);
  operation.then(
    () => inFlight.delete(cacheKey),
    () => inFlight.delete(cacheKey)
  );
  return operation;
};

export const geocodeCompanyAddress = async (input) => {
  const options =
    typeof input === 'string'
      ? { address: input }
      : input || {};
  const requestKey = `geocode:${normalizeAddress(JSON.stringify(options))}`;
  const cachedResponse = readCachedResult(requestKey);
  if (cachedResponse !== undefined) return cachedResponse;

  const queries = buildCompanyGeocodingQueries(options);
  if (queries.length === 0) {
    throw Object.assign(new Error('Alamat wajib diisi.'), {
      status: 400,
    });
  }

  const cityContext = deriveCityContext(options);
  const attempts = [];

  for (const query of queries) {
    try {
      const results = await enqueueNominatimRequest(query);
      const relevant = results.find((result) =>
        responseIsRelevant(result, cityContext)
      );
      attempts.push({
        query,
        status: relevant ? 'found' : results.length ? 'irrelevant' : 'empty',
      });

      if (relevant) {
        const response = {
          result: relevant,
          attempts,
        };
        storeResult(requestKey, response);
        return response;
      }
    } catch (error) {
      attempts.push({
        query,
        status: 'failed',
        error: error.message,
      });
      if (error.status === 400) throw error;
      throw Object.assign(
        new Error(
          `Geocoding gagal saat mencari "${query}": ${error.message}`
        ),
        { status: error.status || 502, attempts }
      );
    }
  }

  const response = {
    result: null,
    attempts,
    error:
      'Nominatim tidak menemukan alamat yang relevan. Silakan pilih titik secara manual melalui peta.',
  };
  storeResult(requestKey, response);
  return response;
};
