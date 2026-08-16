const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

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

let logoutCallback: (() => void) | null = null;

export const setLogoutCallback = (cb: () => void) => {
  logoutCallback = cb;
};

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

      // Auto-logout saat token invalid
      if (response.status === 401 && logoutCallback) {
        logoutCallback();
        throw new ApiError(401, 'Session expired');
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
};