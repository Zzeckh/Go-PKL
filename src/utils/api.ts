/**
 * Base URL API.
 *
 * - Web production (Vercel): TANPA env → same-origin fallback '' (kosong).
 *   Path di caller sudah menyertakan '/api', jadi hasilnya '/api/auth/login'
 *   → di-rewrite vercel.json ke function api/index.js.
 * - Web dev lokal (vite dev): sama, fallback '' → '/api/auth/login' diproxy
 *   vite.config ke localhost:3000.
 * - Kalau benar-benar butuh absolute URL (mis. cross-origin): set env
 *   VITE_API_URL = 'https://other-domain.com' (tanpa trailing /api).
 * - Mobile (gopkl-student): repo terpisah, punya api.ts & secret sendiri;
 *   tidak terpengaruh perubahan ini.
 */
const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';

/**
 * Ubah path aset backend jadi URL yang bisa dipakai langsung di <img src>.
 * @param path path relatif ('/uploads/xxx.jpg') atau URL absolut
 * @returns URL absolut sesuai API_BASE_URL; '' bila path kosong.
 */
export const assetUrl = (path: string) => {
  if (!path) return '';
  if (/^https?:\/\//.test(path)) return path;
  return `${API_BASE_URL}${path}`;
};

/**
 * Error standar dari pemanggilan API.
 * @remarks `status` adalah HTTP status asli; 500 dipakai sebagai penanda
 *          gangguan jaringan (bukan berarti server benar-benar error 500).
 * `data` berisi body response untuk ditampilkan/di-debug lebih lanjut.
 */
class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const api = {
  /**
   * Kirim request JSON dengan header auth (token dari localStorage 'pkl_token').
   * @param path path yang SUDAH menyertakan prefix '/api' (mis. '/api/auth/login')
   * @param options opsi fetch; body string otomatis dikirim sebagai JSON
   * @throws ApiError berisi status + pesan `error` dari backend,
   *         atau status 500 'Network error' kalau fetch gagal total.
   */
  async fetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('pkl_token');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers,
      });

      let data;
      try {
        data = await response.json();
      } catch {
        data = { error: 'Invalid JSON response' };
      }

      if (!response.ok) {
        throw new ApiError(response.status, data.error || 'Request failed', data);
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Network error');
    }
  },

  get<T>(path: string) {
    return this.fetch<T>(path);
  },

  post<T>(path: string, body?: any) {
    return this.fetch<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  put<T>(path: string, body?: any) {
    return this.fetch<T>(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  patch<T>(path: string, body?: any) {
    return this.fetch<T>(path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  delete<T>(path: string) {
    return this.fetch<T>(path, { method: 'DELETE' });
  },

  /**
   * Upload multipart (file/lampiran).
   * @remarks Content-Type TIDAK diisi manual agar browser menentukan
   *          boundary FormData sendiri; kalau dipaksa, upload gagal.
   */
  async upload<T>(path: string, formData: FormData): Promise<T> {
    const token = localStorage.getItem('pkl_token');
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    try {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers,
        body: formData,
      });

      let data;
      try {
        data = await response.json();
      } catch {
        data = { error: 'Invalid JSON response' };
      }

      if (!response.ok) {
        throw new ApiError(response.status, data.error || 'Upload failed', data);
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Network error');
    }
  },

  /**
   * Unduh file lalu picu dialog simpan di browser (laporan PDF, dll).
   * @param path endpoint yang mengembalikan file, bukan JSON
   * @param fallbackFilename nama berkas bila header Content-Disposition tidak ada
   * @returns promise kosong; objek URL sementara selalu dibersihkan (revoke)
   *          setelah tombol unduh diklik.
   */
  async download(path: string, fallbackFilename: string): Promise<void> {
    const token = localStorage.getItem('pkl_token');
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}${path}`, { headers });
    } catch {
      throw new ApiError(500, 'Network error');
    }

    if (!response.ok) {
      let data: any = {};
      try {
        data = await response.json();
      } catch {
        data = {};
      }
      throw new ApiError(response.status, data.error || 'Gagal mengunduh file', data);
    }

    const disposition = response.headers.get('Content-Disposition') || '';
    const match = disposition.match(/filename="?([^"]+)"?/);
    const filename = match?.[1] || fallbackFilename;

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};

/**
 * Daftarkan callback logout otomatis (mis. saat token 401).
 * @remarks Saat ini NO-OP: callback sengaja tidak disimpan, logout sepenuhnya
 *          ditangani oleh AppContext. Dipertahankan agar impor di AppContext
 *          tidak perlu diubah.
 */
export const setLogoutCallback = (_cb: () => void) => {};1