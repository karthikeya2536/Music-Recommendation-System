import { auth } from './firebase';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export const apiUrl = (path: string): string => {
  if (path.startsWith('/')) {
    return `${API_BASE}${path}`;
  }
  return `${API_BASE}/${path}`;
};

export const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const user = auth.currentUser;
  if (!user) {
    return {};
  }

  try {
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}` };
  } catch (error) {
    console.warn('Failed to fetch auth token', error);
    return {};
  }
};

export const fetchWithAuth = async (path: string, init: RequestInit = {}): Promise<Response> => {
  const authHeaders = await getAuthHeaders();
  const headers = {
    ...(init.headers || {}),
    ...authHeaders,
  };

  return fetch(apiUrl(path), {
    ...init,
    headers,
  });
};
