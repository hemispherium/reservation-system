import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { userApi, type AdminUser } from '../../api/users'

export default function UserForm() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('')
  const [roles, setRoles] = useState<string[]>([])
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    userApi.roles().then((res) => {
      setRoles(res.data)
      if (!isEdit && res.data.length > 0) setRole(res.data[0])
    })
    if (isEdit) {
      userApi.list().then((res) => {
        const u = (res.data as AdminUser[]).find((u) => u.id === Number(id))
        if (u) {
          setName(u.name)
          setEmail(u.email)
          setRole(u.role ?? '')
          setProfileImageUrl(u.profile_image_url)
        }
      }).finally(() => setLoading(false))
    }
  }, [id, isEdit])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      if (isEdit) {
        const data: Record<string, string> = { name, email, role }
        if (password) data.password = password
        await userApi.update(Number(id), data)
      } else {
        await userApi.create({ name, email, password, role })
      }
      navigate('/admin/users')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? '保存に失敗しました。')
    } finally {
      setSubmitting(false)
    }
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageUploading(true)
    try {
      const res = await userApi.uploadImage(Number(id), file)
      setProfileImageUrl(res.data.profile_image_url)
    } finally {
      setImageUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDeleteImage = async () => {
    if (!confirm('プロフィール画像を削除しますか？')) return
    await userApi.deleteImage(Number(id))
    setProfileImageUrl(null)
  }

  if (loading) return <p>読み込み中...</p>

  return (
    <div style={{ maxWidth: 480 }}>
      <h1 style={{ marginBottom: 24 }}>{isEdit ? 'ユーザー編集' : 'ユーザー新規作成'}</h1>
      {error && <p style={{ color: '#ef4444', marginBottom: 16 }}>{error}</p>}
      <form onSubmit={handleSubmit} style={{ background: '#fff', padding: 24, borderRadius: 8, border: '1px solid #e2e8f0' }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>名前</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>メールアドレス</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>{isEdit ? 'パスワード（変更する場合のみ）' : 'パスワード'}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required={!isEdit}
            style={inputStyle}
            placeholder={isEdit ? '変更しない場合は空欄' : ''}
          />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>ロール</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} required style={inputStyle}>
            {roles.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button type="submit" disabled={submitting} style={btnPrimary}>
            {submitting ? '保存中...' : '保存'}
          </button>
          <button type="button" onClick={() => navigate('/admin/users')} style={btnSecondary}>
            キャンセル
          </button>
        </div>
      </form>

      {isEdit && (
        <div style={{ marginTop: 32, background: '#fff', padding: 24, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <p style={labelStyle}>プロフィール画像</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {profileImageUrl ? (
              <img src={profileImageUrl} alt="" style={avatarImgStyle} />
            ) : (
              <div style={avatarPlaceholderStyle}>{name.charAt(0)}</div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={imageUploading}
                style={btnSecondary}
              >
                {imageUploading ? 'アップロード中...' : '画像を変更'}
              </button>
              {profileImageUrl && (
                <button type="button" onClick={handleDeleteImage} style={btnDanger}>
                  画像を削除
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const fieldStyle: React.CSSProperties = { marginBottom: 16 }
const labelStyle: React.CSSProperties = { display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 600, color: '#374151' }
const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, boxSizing: 'border-box', color: '#1e293b' }
const btnPrimary: React.CSSProperties = { padding: '9px 24px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer' }
const btnSecondary: React.CSSProperties = { padding: '9px 24px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 14, cursor: 'pointer' }
const btnDanger: React.CSSProperties = { padding: '9px 24px', background: '#fff', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: 6, fontSize: 14, cursor: 'pointer' }
const avatarImgStyle: React.CSSProperties = { width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '2px solid #e2e8f0' }
const avatarPlaceholderStyle: React.CSSProperties = {
  width: 80, height: 80, borderRadius: '50%',
  background: '#dbeafe', color: '#1d4ed8',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontWeight: 700, fontSize: 28, flexShrink: 0,
}
