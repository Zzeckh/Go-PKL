export const DEFAULT_ACADEMIC_YEAR = '2025/2026';
export const ACADEMIC_YEAR_OPTIONS = ['2025/2026', '2026/2027', '2027/2028'];

export const normalizeAcademicYear = (value: unknown): string | undefined => {
  if (value === undefined || value === null) return undefined;
  const next = String(value).trim();
  if (!/^\d{4}\/\d{4}$/.test(next)) return undefined;
  return next;
};