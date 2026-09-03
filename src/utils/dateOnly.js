export const parseDateOnly = (value) => {
  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  const text = String(value || '').trim();
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;

  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
};

export const sameDateRange = (value) => {
  const date = parseDateOnly(value);
  if (!date || Number.isNaN(date.getTime())) return null;

  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  return { gte: start, lt: end };
};
