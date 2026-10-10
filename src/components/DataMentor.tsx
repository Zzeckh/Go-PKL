import { useEffect, useState } from 'react';

interface MentoredCompany {
  id: number;
  name: string;
}

interface TeacherCompany {
  id: number;
  name: string;
  address?: string;
  city?: string | null;
  country?: string | null;
  mentorId?: number | null;
  mentor?: {
    id: number;
    name: string;
    email?: string;
    whatsapp?: string | null;
  } | null;
}

interface Mentor {
  id: number;
  name: string;
  email: string;
  whatsapp?: string | null;
  mentoredCompanies?: MentoredCompany[];
}

export function DataMentor() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [companies, setCompanies] = useState<TeacherCompany[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    whatsapp: '',
    companyId: '',
  });

  // ============================================================
  // FETCH MENTOR
  // ============================================================

  const fetchMentors = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('pkl_token');

      if (!token) {
        throw new Error('Token tidak ditemukan');
      }

      const response = await fetch(
        'http://localhost:5000/api/users?role=mentor',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error || 'Gagal mengambil data mentor'
        );
      }

      setMentors(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error('Gagal mengambil data mentor:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Data mentor gagal dimuat.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // FETCH PERUSAHAAN YANG DIPEGANG GURU
  // ============================================================

  const fetchCompanies = async () => {
    try {
      setLoadingCompanies(true);

      const token = localStorage.getItem('pkl_token');

      if (!token) {
        throw new Error('Token tidak ditemukan');
      }

      const response = await fetch(
        'http://localhost:5000/api/users/teacher-companies',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            'Gagal mengambil perusahaan bimbingan guru'
        );
      }

      setCompanies(Array.isArray(result) ? result : []);

      console.log('PERUSAHAAN GURU:', result);
    } catch (err) {
      console.error('Gagal mengambil perusahaan guru:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Data perusahaan gagal dimuat.'
      );
    } finally {
      setLoadingCompanies(false);
    }
  };

  // ============================================================
  // LOAD DATA
  // ============================================================

  useEffect(() => {
    fetchMentors();
    fetchCompanies();
  }, []);

  // ============================================================
  // CREATE MENTOR
  // ============================================================

  const handleCreateMentor = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const token = localStorage.getItem('pkl_token');

      if (!token) {
        throw new Error('Token tidak ditemukan');
      }

      if (!form.name.trim()) {
        throw new Error('Nama mentor wajib diisi');
      }

      if (!form.email.trim()) {
        throw new Error('Email mentor wajib diisi');
      }

      if (!form.password) {
        throw new Error('Password mentor wajib diisi');
      }

      if (!form.companyId) {
        throw new Error('Perusahaan wajib dipilih');
      }

      const companyId = Number(form.companyId);

      if (!Number.isInteger(companyId) || companyId <= 0) {
        throw new Error('Perusahaan tidak valid');
      }

      const response = await fetch(
        'http://localhost:5000/api/users/mentor',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: form.name.trim(),
            email: form.email.trim(),
            password: form.password,
            whatsapp: form.whatsapp.trim() || null,
            companyId: companyId,
          }),
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            'Gagal membuat akun mentor'
        );
      }

      console.log('MENTOR BERHASIL DIBUAT:', result);

      setSuccess(
        `Akun mentor berhasil dibuat dan ditugaskan ke ${result?.data?.companyName || 'perusahaan'}.`
      );

      setForm({
        name: '',
        email: '',
        password: '',
        whatsapp: '',
        companyId: '',
      });

      setShowForm(false);

      await fetchMentors();
      await fetchCompanies();
    } catch (err) {
      console.error('Gagal membuat mentor:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Gagal membuat akun mentor.'
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Data Mentor
          </h1>

          <p className="mt-1 text-gray-500">
            Daftar akun mentor yang terdaftar di sistem.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            const next = !showForm;

            setShowForm(next);
            setError('');
            setSuccess('');

            if (next) {
              fetchCompanies();
            }
          }}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          {showForm ? 'Tutup Form' : '+ Tambah Mentor'}
        </button>
      </div>

      {/* SUCCESS */}
      {success && (
        <div className="mb-4 rounded-lg bg-green-50 p-4 text-green-600">
          {success}
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-600">
          {error}
        </div>
      )}

      {/* FORM TAMBAH MENTOR */}
      {showForm && (
        <form
          onSubmit={handleCreateMentor}
          className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <h2 className="mb-4 text-lg font-semibold">
            Tambah Akun Mentor
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* NAMA */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Nama Mentor
              </label>

              <input
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
                placeholder="Contoh: Budi Santoso"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-slate-500"
              />
            </div>

            {/* EMAIL */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Email
              </label>

              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    email: e.target.value,
                  })
                }
                placeholder="mentor@email.com"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-slate-500"
              />
            </div>

            {/* PASSWORD */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Password
              </label>

              <input
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm({
                    ...form,
                    password: e.target.value,
                  })
                }
                placeholder="Masukkan password"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-slate-500"
              />
            </div>

            {/* WHATSAPP */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                WhatsApp
              </label>

              <input
                type="text"
                value={form.whatsapp}
                onChange={(e) =>
                  setForm({
                    ...form,
                    whatsapp: e.target.value,
                  })
                }
                placeholder="08xxxxxxxxxx"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-slate-500"
              />
            </div>

            {/* PERUSAHAAN */}
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Perusahaan
              </label>

              <select
                value={form.companyId}
                onChange={(e) =>
                  setForm({
                    ...form,
                    companyId: e.target.value,
                  })
                }
                disabled={loadingCompanies}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-slate-500 disabled:bg-gray-100"
              >
                <option value="">
                  {loadingCompanies
                    ? 'Memuat perusahaan...'
                    : 'Pilih perusahaan'}
                </option>

                {companies.map((company) => {
                  const alreadyHasMentor =
                    company.mentorId !== null &&
                    company.mentorId !== undefined;

                  return (
                    <option
                      key={company.id}
                      value={company.id}
                      disabled={alreadyHasMentor}
                    >
                      {company.name}
                      {alreadyHasMentor
                        ? ` — sudah ada mentor${company.mentor?.name ? `: ${company.mentor.name}` : ''}`
                        : ''}
                    </option>
                  );
                })}
              </select>

              {!loadingCompanies &&
                companies.length === 0 && (
                  <p className="mt-1 text-sm text-red-500">
                    Belum ada perusahaan yang dipegang
                    oleh guru ini.
                  </p>
                )}

              {!loadingCompanies &&
                companies.length > 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    Pilih satu perusahaan. Satu perusahaan
                    hanya boleh memiliki satu mentor.
                  </p>
                )}
            </div>
          </div>

          {/* BUTTON */}
          <div className="mt-5 flex justify-end">
            <button
              type="submit"
              disabled={
                saving ||
                loadingCompanies ||
                !form.companyId
              }
              className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? 'Menyimpan...'
                : 'Simpan Mentor'}
            </button>
          </div>
        </form>
      )}

      {/* LOADING */}
      {loading && (
        <p className="text-gray-500">
          Memuat data mentor...
        </p>
      )}

      {/* TABLE */}
      {!loading && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  No
                </th>

                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Nama Mentor
                </th>

                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Email
                </th>

                <th className="px-4 py-3 text-left text-sm font-semibold">
                  WhatsApp
                </th>

                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Perusahaan
                </th>
              </tr>
            </thead>

            <tbody>
              {mentors.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    Belum ada data mentor.
                  </td>
                </tr>
              ) : (
                mentors.map((mentor, index) => (
                  <tr
                    key={mentor.id}
                    className="border-t border-gray-100"
                  >
                    <td className="px-4 py-3 text-sm">
                      {index + 1}
                    </td>

                    <td className="px-4 py-3 text-sm font-medium">
                      {mentor.name}
                    </td>

                    <td className="px-4 py-3 text-sm">
                      {mentor.email}
                    </td>

                    <td className="px-4 py-3 text-sm">
                      {mentor.whatsapp || '-'}
                    </td>

                    <td className="px-4 py-3 text-sm">
                      {mentor.mentoredCompanies &&
                      mentor.mentoredCompanies.length > 0 ? (
                        <div className="space-y-1">
                          {mentor.mentoredCompanies.map(
                            (company) => (
                              <div
                                key={company.id}
                                className="rounded-md bg-slate-50 px-2 py-1"
                              >
                                {company.name}
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}