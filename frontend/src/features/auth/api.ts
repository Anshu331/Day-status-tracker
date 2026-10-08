import { apiRequest, isApiError } from '@/lib/api-client';

export interface User {
  id: number;
  username: string;
  createdAt: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export const authApi = {
  async login(credentials: LoginCredentials): Promise<User> {
    const { data } = await apiRequest<{ data: User }>('/auth/login', {
      method: 'POST',
      json: credentials,
    });
    return data;
  },

  logout(): Promise<void> {
    return apiRequest<void>('/auth/logout', { method: 'POST' });
  },

  async me(): Promise<User | null> {
    try {
      const { data } = await apiRequest<{ data: User }>('/auth/me');
      return data;
    } catch (error) {
      if (isApiError(error, 401)) return null;
      throw error;
    }
  },
};
