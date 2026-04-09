import client from './client'

export type ShopImage = {
  id: number
  shop_id: number
  path: string
  url: string
  sort_order: number
}

export type Shop = {
  id: number
  name: string
  description: string | null
  address: string
  phone: string
  images: ShopImage[]
}

export type ShopInput = {
  name: string
  description: string
  address: string
  phone: string
}

export type StaffUser = {
  id: number
  name: string
  email: string
  profile_image_url?: string | null
}

export type ScheduleEntry = {
  id: number
  date: string
  start_time: string | null
  end_time: string | null
  is_day_off: boolean
}

export type StaffSchedule = {
  user_id: number
  name: string
  schedules: ScheduleEntry[]
}

export type ScheduleInput = {
  date: string
  is_day_off: boolean
  start_time: string | null
  end_time: string | null
}

export const shopApi = {
  listPublic: () => client.get<Shop[]>('/shops'),
  getPublic: (id: number) => client.get<Shop>(`/shops/${id}`),
  list: () => client.get<Shop[]>('/admin/shops'),
  get: (id: number) => client.get<Shop>(`/admin/shops/${id}`),
  create: (data: ShopInput) => client.post<Shop>('/admin/shops', data),
  update: (id: number, data: ShopInput) => client.put<Shop>(`/admin/shops/${id}`, data),
  delete: (id: number) => client.delete(`/admin/shops/${id}`),

  uploadImages: (shopId: number, files: File[]) => {
    const formData = new FormData()
    files.forEach((file) => formData.append('images[]', file))
    return client.post<ShopImage[]>(`/admin/shops/${shopId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  deleteImage: (shopId: number, imageId: number) =>
    client.delete(`/admin/shops/${shopId}/images/${imageId}`),

  reorderImages: (shopId: number, order: number[]) =>
    client.patch<ShopImage[]>(`/admin/shops/${shopId}/images/reorder`, { order }),

  getShopStaff: (shopId: number) =>
    client.get<StaffUser[]>(`/admin/shops/${shopId}/staff`),

  syncShopStaff: (shopId: number, userIds: number[]) =>
    client.put<StaffUser[]>(`/admin/shops/${shopId}/staff`, { user_ids: userIds }),

  listStaffUsers: () =>
    client.get<StaffUser[]>('/admin/staff-users'),

  getPublicStaff: (shopId: number, date?: string, startTime?: string, endTime?: string) =>
    client.get<StaffUser[]>(`/shops/${shopId}/staff`, {
      params: { ...(date && { date }), ...(startTime && { start_time: startTime }), ...(endTime && { end_time: endTime }) },
    }),

  getPublicSchedules: (shopId: number, from: string, to: string) =>
    client.get<{ user_id: number; date: string; start_time: string; end_time: string }[]>(
      `/shops/${shopId}/schedules`, { params: { from, to } }
    ),

  getBookedSlots: (shopId: number, from: string, to: string) =>
    client.get<{ date: string; start_time: string; end_time: string }[]>(
      `/shops/${shopId}/booked`, { params: { from, to } }
    ),

  getSchedules: (shopId: number, from?: string, to?: string) =>
    client.get<StaffSchedule[]>(`/admin/shops/${shopId}/schedules`, { params: { from, to } }),

  upsertSchedule: (shopId: number, userId: number, input: ScheduleInput) =>
    client.put<ScheduleEntry>(`/admin/shops/${shopId}/schedules/${userId}`, input),

  deleteSchedule: (shopId: number, userId: number, date: string) =>
    client.delete(`/admin/shops/${shopId}/schedules/${userId}/${date}`),
}
