const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

export const assetUrl = (path: string) => {
  if (!path) return '';
  if (/^https?:\/\//.test(path)) return path;
  return `${API_BASE_URL}${path}`;
};

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

// ❌ HAPUS logoutCallback — logout sekarang hanya dari AppContext
export const api = {
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

      // ❌ HAPUS auto-logout di sini
      // Logout sekarang HANYA dari AppContext.loadSession()
      // karena hanya /api/auth/me yang authoritative
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

  // Untuk endpoint yang mengembalikan file (mis. export PDF), bukan JSON.
  // Melempar ApiError dengan pesan dari body JSON jika request gagal,
  // atau memicu unduhan file di browser jika berhasil.
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

// Hapus setLogoutCallback — tidak dipakai lagi
export const setLogoutCallback = (_cb: () => void) => {};