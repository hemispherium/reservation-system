import client from './client'

export interface AuthUser {
  id: number
  name: string
  email: string
  role: string | null
}

export const authApi = {
  register: (name: string, email: string, password: string) =>
    client.post<{ token: string; user: AuthUser }>('/auth/register', { name, email, password }),

  login: (email: string, password: string) =>
    client.post<{ token: string; user: AuthUser }>('/auth/login', { email, password }),

  logout: () =>
    client.post('/auth/logout'),

  me: () =>
    client.get<AuthUser>('/auth/me'),
}
