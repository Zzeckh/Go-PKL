import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildCompanyGeocodingQueries,
  geocodeCompanyAddress,
} from './companyGeocodingService.js';
import { isValidCompanyLocation } from '../utils/companyImport.js';

test('geocoding caches repeated addresses and rate-limits new requests', async () => {
  const originalFetch = globalThis.fetch;
  const requestTimes = [];

  globalThis.fetch = async (url, options) => {
    requestTimes.push(Date.now());
    assert.equal(new URL(url).searchParams.get('countrycodes'), 'id');
    assert.match(options.headers['User-Agent'], /^Go-PKL/);
    return {
      ok: true,
      json: async () => [
        {
          lat: '-6.2',
          lon: '106.8',
          display_name: 'Contoh alamat',
        },
      ],
    };
  };

  try {
    const [first, second, third] = await Promise.all([
      geocodeCompanyAddress({ address: 'Lokasi tes service geocoding 2026' }),
      geocodeCompanyAddress({ address: '  Lokasi   tes service geocoding 2026  ' }),
      geocodeCompanyAddress({ address: 'Lokasi kedua tes service geocoding 2026' }),
    ]);

    assert.deepEqual(first.result, {
      latitude: -6.2,
      longitude: 106.8,
      label: 'Contoh alamat',
      address: {},
    });
    assert.deepEqual(second.result, first.result);
    assert.deepEqual(third.result, first.result);
    assert.equal(requestTimes.length, 2);
    assert.ok(requestTimes[1] - requestTimes[0] >= 1000);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('builds location-aware Cimahi fallback queries', () => {
  const queries = buildCompanyGeocodingQueries({
    address: 'Jl. Mahar Martanegara No. 138, Cimindi',
    companyName: 'Perusahaan Contoh',
  });

  assert.match(queries[0], /Kota Cimahi, Jawa Barat, Indonesia/);
  assert.match(queries[1], /Perusahaan Contoh/);
  assert.match(queries[2], /Perusahaan Contoh, Kota Cimahi/);
  assert.match(queries.at(-1), /Jl\. Mahar Martanegara/);
  assert.doesNotMatch(queries.at(-1), /No\. 138/);
});

test('rejects empty and (0, 0) company coordinates', () => {
  assert.equal(isValidCompanyLocation(0, 0), false);
  assert.equal(isValidCompanyLocation(-6.87, 107.54), true);
});

test('uses company and city fallback when the precise address is not indexed', async () => {
  const originalFetch = globalThis.fetch;
  const queries = [];

  globalThis.fetch = async (url) => {
    const query = new URL(url).searchParams.get('q');
    queries.push(query);

    return {
      ok: true,
      json: async () =>
        queries.length === 1
          ? []
          : [
              {
                lat: '-6.87',
                lon: '107.54',
                display_name:
                  'Contoh, Cimindi, Kota Cimahi, Jawa Barat, Indonesia',
                address: {
                  suburb: 'Cimindi',
                  city: 'Cimahi',
                  state: 'Jawa Barat',
                  country: 'Indonesia',
                },
              },
            ],
    };
  };

  try {
    const response = await geocodeCompanyAddress({
      address: 'Alamat fallback tes 2026 Cimindi',
      companyName: 'Perusahaan fallback tes 2026',
    });

    assert.equal(response.result.latitude, -6.87);
    assert.equal(response.result.longitude, 107.54);
    assert.equal(response.attempts[0].status, 'empty');
    assert.equal(response.attempts[1].status, 'found');
    assert.match(queries[1], /Perusahaan fallback tes 2026/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('retries one HTTP 429 response and exposes the successful result', async () => {
  const originalFetch = globalThis.fetch;
  const requestTimes = [];
  let callCount = 0;

  globalThis.fetch = async () => {
    callCount += 1;
    requestTimes.push(Date.now());
    if (callCount === 1) {
      return {
        ok: false,
        status: 429,
        headers: { get: () => null },
      };
    }

    return {
      ok: true,
      json: async () => [
        {
          lat: '-6.87',
          lon: '107.54',
          display_name: 'Cimahi, Indonesia',
          address: { city: 'Cimahi' },
        },
      ],
    };
  };

  try {
    const response = await geocodeCompanyAddress({
      address: 'Alamat retry tes 2026',
      city: 'Cimahi',
    });

    assert.equal(response.result.latitude, -6.87);
    assert.equal(callCount, 2);
    assert.ok(requestTimes[1] - requestTimes[0] >= 1000);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
