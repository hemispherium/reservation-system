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
}
