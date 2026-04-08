import client from './client'

export interface AdminUser {
  id: number
  name: string
  email: string
  role: string | null
  profile_image_url: string | null
}

export interface UserFormData {
  name: string
  email: string
  password?: string
  role: string
}

export const userApi = {
  list: () => client.get<AdminUser[]>('/admin/users'),
  create: (data: UserFormData) => client.post<AdminUser>('/admin/users', data),
  update: (id: number, data: Partial<UserFormData>) => client.put<AdminUser>(`/admin/users/${id}`, data),
  delete: (id: number) => client.delete(`/admin/users/${id}`),
  roles: () => client.get<string[]>('/admin/roles'),

  uploadImage: (id: number, file: File) => {
    const formData = new FormData()
    formData.append('image', file)
    return client.post<{ profile_image_url: string }>(`/admin/users/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  deleteImage: (id: number) => client.delete(`/admin/users/${id}/image`),
}
