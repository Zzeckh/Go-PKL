export const normalizeCompanyCategory = (value) => {
  const category = String(value ?? '').trim().toLowerCase();
  if (category === 'internal') return 'Internal';
  if (category === 'eksternal' || category === 'external') {
    return 'Eksternal';
  }
  return null;
};

export const isValidCompanyLocation = (latitude, longitude) =>
  Number.isFinite(latitude) &&
  Number.isFinite(longitude) &&
  latitude >= -90 &&
  latitude <= 90 &&
  longitude >= -180 &&
  longitude <= 180 &&
  !(latitude === 0 && longitude === 0);
