import client from './client'

export interface Course {
  id: number
  shop_id: number
  name: string
  description: string | null
  duration: number
  price: number
  is_active: boolean
  sort_order: number
}

export interface CourseInput {
  name: string
  description: string
  duration: number
  price: number
  is_active: boolean
  sort_order?: number
}

export const courseApi = {
  listPublic: (shopId: number) =>
    client.get<Course[]>(`/shops/${shopId}/courses`),

  list: (shopId: number) =>
    client.get<Course[]>(`/admin/shops/${shopId}/courses`),

  create: (shopId: number, data: CourseInput) =>
    client.post<Course>(`/admin/shops/${shopId}/courses`, data),

  update: (shopId: number, courseId: number, data: Partial<CourseInput>) =>
    client.put<Course>(`/admin/shops/${shopId}/courses/${courseId}`, data),

  delete: (shopId: number, courseId: number) =>
    client.delete(`/admin/shops/${shopId}/courses/${courseId}`),
}
