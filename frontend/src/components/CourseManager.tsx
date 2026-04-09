import { useState } from 'react'
import { courseApi, type Course } from '../api/courses'

type Props = {
  shopId: number
  courses: Course[]
  onChange: (courses: Course[]) => void
}

type FormState = {
  name: string
  description: string
  duration: number
  price: number
  is_active: boolean
}

const defaultForm = (): FormState => ({
  name: '',
  description: '',
  duration: 60,
  price: 0,
  is_active: true,
})

export default function CourseManager({ shopId, courses, onChange }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState<FormState>(defaultForm())
  const [saving, setSaving] = useState(false)

  const updateForm = (field: keyof FormState, value: string | number | boolean) => {
    setForm((p) => ({ ...p, [field]: value }))
  }

  const handleAdd = async () => {
    setSaving(true)
    try {
      const res = await courseApi.create(shopId, form)
      onChange([...courses, res.data])
      setForm(defaultForm())
      setShowAdd(false)
    } finally {
      setSaving(false)
    }
  }

  const handleEditStart = (course: Course) => {
    setEditingId(course.id)
    setForm({
      name: course.name,
      description: course.description ?? '',
      duration: course.duration,
      price: course.price,
      is_active: course.is_active,
    })
  }

  const handleEditSave = async (courseId: number) => {
    setSaving(true)
    try {
      const res = await courseApi.update(shopId, courseId, form)
      onChange(courses.map((c) => (c.id === courseId ? res.data : c)))
      setEditingId(null)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (courseId: number) => {
    if (!confirm('このコースを削除しますか？')) return
    await courseApi.delete(shopId, courseId)
    onChange(courses.filter((c) => c.id !== courseId))
  }

  return (
    <div>
      {courses.length === 0 && !showAdd && (
        <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 12 }}>コースが登録されていません。</p>
      )}

      {courses.map((course) => (
        <div key={course.id} style={courseRowStyle}>
          {editingId === course.id ? (
            <CourseForm
              form={form}
              onChange={updateForm}
              onSave={() => handleEditSave(course.id)}
              onCancel={() => setEditingId(null)}
              saving={saving}
            />
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>{course.name}</span>
                  {!course.is_active && (
                    <span style={inactiveBadge}>非公開</span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: '#64748b', display: 'flex', gap: 16 }}>
                  <span>{course.duration}分</span>
                  <span>¥{course.price.toLocaleString()}</span>
                  {course.description && <span>{course.description}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => handleEditStart(course)} style={editBtnStyle}>編集</button>
                <button onClick={() => handleDelete(course.id)} style={deleteBtnStyle}>削除</button>
              </div>
            </div>
          )}
        </div>
      ))}

      {showAdd ? (
        <div style={addFormWrapStyle}>
          <CourseForm
            form={form}
            onChange={updateForm}
            onSave={handleAdd}
            onCancel={() => { setShowAdd(false); setForm(defaultForm()) }}
            saving={saving}
          />
        </div>
      ) : (
        <button onClick={() => setShowAdd(true)} style={addBtnStyle}>+ コースを追加</button>
      )}
    </div>
  )
}

function CourseForm({
  form, onChange, onSave, onCancel, saving,
}: {
  form: FormState
  onChange: (field: keyof FormState, value: string | number | boolean) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={rowStyle}>
        <div style={fieldStyle}>
          <label style={labelStyle}>コース名</label>
          <input value={form.name} onChange={(e) => onChange('name', e.target.value)} required style={inputStyle} />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>所要時間（分）</label>
          <input type="number" min={10} step={10} value={form.duration} onChange={(e) => onChange('duration', Number(e.target.value))} style={inputStyle} />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>料金（円）</label>
          <input type="number" min={0} value={form.price} onChange={(e) => onChange('price', Number(e.target.value))} style={inputStyle} />
        </div>
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>説明</label>
        <input value={form.description} onChange={(e) => onChange('description', e.target.value)} style={inputStyle} />
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#475569' }}>
        <input type="checkbox" checked={form.is_active} onChange={(e) => onChange('is_active', e.target.checked)} />
        公開する
      </label>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onSave} disabled={saving || !form.name} style={saveBtnStyle}>
          {saving ? '保存中...' : '保存'}
        </button>
        <button onClick={onCancel} style={cancelBtnStyle}>キャンセル</button>
      </div>
    </div>
  )
}

const courseRowStyle: React.CSSProperties = {
  padding: 16,
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  background: '#fff',
  marginBottom: 8,
}
const addFormWrapStyle: React.CSSProperties = {
  padding: 16,
  border: '1px dashed #93c5fd',
  borderRadius: 8,
  background: '#f0f9ff',
  marginBottom: 8,
}
const inactiveBadge: React.CSSProperties = {
  fontSize: 11, padding: '1px 8px', borderRadius: 9999,
  background: '#f1f5f9', color: '#94a3b8', fontWeight: 600,
}
const rowStyle: React.CSSProperties = { display: 'flex', gap: 12, flexWrap: 'wrap' }
const fieldStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 120 }
const labelStyle: React.CSSProperties = { fontSize: 12, color: '#64748b', fontWeight: 600 }
const inputStyle: React.CSSProperties = { padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, color: '#1e293b' }
const editBtnStyle: React.CSSProperties = { padding: '4px 14px', background: 'none', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 13, color: '#3b82f6', cursor: 'pointer' }
const deleteBtnStyle: React.CSSProperties = { padding: '4px 14px', background: 'none', border: '1px solid #fca5a5', borderRadius: 4, fontSize: 13, color: '#ef4444', cursor: 'pointer' }
const saveBtnStyle: React.CSSProperties = { padding: '7px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }
const cancelBtnStyle: React.CSSProperties = { padding: '7px 20px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13, cursor: 'pointer' }
const addBtnStyle: React.CSSProperties = { padding: '8px 16px', background: '#f8fafc', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }
