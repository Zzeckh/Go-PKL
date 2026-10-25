/**
 * NIS adalah prefix email siswa (`NIS@gopkl.id`).
 * Untuk email non-Go-PKL, tampilkan email apa adanya.
 */
export function formatStudentUsername(user) {
  const email = String(user?.email ?? '').trim();

  if (!email) return '-';

  const atIndex = email.lastIndexOf('@');

  if (atIndex > 0) {
    const domain = email.slice(atIndex + 1).toLowerCase();

    if (domain === 'gopkl.id') {
      return email.slice(0, atIndex);
    }
  }

  return email;
}
