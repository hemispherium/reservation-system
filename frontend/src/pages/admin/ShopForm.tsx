import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { shopApi, type Shop, type ShopImage, type StaffUser, type StaffSchedule } from '../../api/shops'
import { courseApi, type Course } from '../../api/courses'
import StaffScheduleEditor from '../../components/StaffScheduleEditor'
import CourseManager from '../../components/CourseManager'

type FormValues = {
  name: string
  description: string
  address: string
  phone: string
}

export default function ShopForm() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [values, setValues] = useState<FormValues>({ name: '', description: '', address: '', phone: '' })
  const [images, setImages] = useState<ShopImage[]>([])
  const [allStaff, setAllStaff] = useState<StaffUser[]>([])
  const [assignedIds, setAssignedIds] = useState<Set<number>>(new Set())
  const [staffSchedules, setStaffSchedules] = useState<StaffSchedule[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [staffSaving, setStaffSaving] = useState(false)

  const scheduleFrom = new Date().toISOString().slice(0, 10)
  const scheduleTo = new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().slice(0, 10)

  useEffect(() => {
    shopApi.listStaffUsers().then((res) => setAllStaff(res.data))

    if (!isEdit) return
    Promise.all([
      shopApi.get(Number(id)),
      shopApi.getShopStaff(Number(id)),
      shopApi.getSchedules(Number(id), scheduleFrom, scheduleTo),
      courseApi.list(Number(id)),
    ]).then(([shopRes, staffRes, scheduleRes, courseRes]) => {
      const shop: Shop = shopRes.data
      setValues({ name: shop.name, description: shop.description ?? '', address: shop.address, phone: shop.phone })
      setImages(shop.images)
      setAssignedIds(new Set(staffRes.data.map((u) => u.id)))
      setStaffSchedules(scheduleRes.data)
      setCourses(courseRes.data)
      setLoading(false)
    })
  }, [id, isEdit])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (isEdit) {
        await shopApi.update(Number(id), values)
      } else {
        await shopApi.create(values)
      }
      navigate('/admin/shops')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStaff = (userId: number) => {
    setAssignedIds((prev) => {
      const next = new Set(prev)
      next.has(userId) ? next.delete(userId) : next.add(userId)
      return next
    })
  }

  const handleSaveStaff = async () => {
    setStaffSaving(true)
    try {
      await shopApi.syncShopStaff(Number(id), Array.from(assignedIds))
      const scheduleRes = await shopApi.getSchedules(Number(id), scheduleFrom, scheduleTo)
      setStaffSchedules(scheduleRes.data)
    } finally {
      setStaffSaving(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length || !isEdit) return
    const res = await shopApi.uploadImages(Number(id), files)
    setImages((prev) => [...prev, ...res.data])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDeleteImage = async (imageId: number) => {
    await shopApi.deleteImage(Number(id), imageId)
    setImages((prev) => prev.filter((img) => img.id !== imageId))
  }

  if (loading) return <p>読み込み中...</p>

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 style={{ marginTop: 0 }}>{isEdit ? '店舗を編集' : '店舗を新規作成'}</h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <label style={labelStyle}>
          店舗名
          <input name="name" value={values.name} onChange={handleChange} required style={inputStyle} />
        </label>
        <label style={labelStyle}>
          説明
          <textarea name="description" value={values.description} onChange={handleChange} rows={4} style={inputStyle} />
        </label>
        <label style={labelStyle}>
          住所
          <input name="address" value={values.address} onChange={handleChange} required style={inputStyle} />
        </label>
        <label style={labelStyle}>
          電話番号
          <input name="phone" value={values.phone} onChange={handleChange} required style={inputStyle} />
        </label>

        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button type="submit" disabled={saving}>
            {saving ? '保存中...' : '保存'}
          </button>
          <button type="button" onClick={() => navigate('/admin/shops')}>
            キャンセル
          </button>
        </div>
      </form>

      {isEdit && (
        <>
          {/* スタッフ割り当て */}
          <div style={sectionStyle}>
            <h2 style={sectionTitleStyle}>担当スタッフ</h2>
            {allStaff.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: 14 }}>スタッフが登録されていません。</p>
            ) : (
              <>
                <div style={staffGridStyle}>
                  {allStaff.map((u) => (
                    <label key={u.id} style={staffLabelStyle(assignedIds.has(u.id))}>
                      <input
                        type="checkbox"
                        checked={assignedIds.has(u.id)}
                        onChange={() => handleToggleStaff(u.id)}
                        style={{ marginRight: 8 }}
                      />
                      <span style={{ fontWeight: 600 }}>{u.name}</span>
                      <span style={{ fontSize: 12, color: '#64748b', marginLeft: 4 }}>{u.email}</span>
                    </label>
                  ))}
                </div>
                <button onClick={handleSaveStaff} disabled={staffSaving} style={saveStaffBtnStyle}>
                  {staffSaving ? '保存中...' : 'スタッフを保存'}
                </button>
              </>
            )}
          </div>

          {/* コース管理 */}
          <div style={sectionStyle}>
            <h2 style={sectionTitleStyle}>コース</h2>
            <CourseManager shopId={Number(id)} courses={courses} onChange={setCourses} />
          </div>

          {/* 勤務時間 */}
          <div style={sectionStyle}>
            <h2 style={sectionTitleStyle}>勤務時間</h2>
            <StaffScheduleEditor shopId={Number(id)} staffSchedules={staffSchedules} from={scheduleFrom} to={scheduleTo} />
          </div>

          {/* 画像 */}
          <div style={sectionStyle}>
            <h2 style={sectionTitleStyle}>画像</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
              {images.map((img) => (
                <div key={img.id} style={{ position: 'relative' }}>
                  <img src={img.url} alt="" style={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 4 }} />
                  <button
                    onClick={() => handleDeleteImage(img.id)}
                    style={{
                      position: 'absolute', top: 4, right: 4,
                      background: 'rgba(0,0,0,0.6)', color: '#fff',
                      border: 'none', borderRadius: '50%', width: 22, height: 22,
                      cursor: 'pointer', fontSize: 12, lineHeight: '22px', padding: 0,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} />
          </div>
        </>
      )}
    </div>
  )
}

const labelStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4, fontWeight: 500 }
const inputStyle: React.CSSProperties = { padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 14 }
const sectionStyle: React.CSSProperties = { marginTop: 40 }
const sectionTitleStyle: React.CSSProperties = { marginTop: 0, marginBottom: 16 }
const staffGridStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }
const staffLabelStyle = (checked: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  padding: '10px 14px',
  border: `1px solid ${checked ? '#3b82f6' : '#e2e8f0'}`,
  borderRadius: 6,
  background: checked ? '#eff6ff' : '#fff',
  cursor: 'pointer',
  fontSize: 14,
  color: '#1e293b',
})
const saveStaffBtnStyle: React.CSSProperties = {
  padding: '8px 20px',
  background: '#3b82f6',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
}
