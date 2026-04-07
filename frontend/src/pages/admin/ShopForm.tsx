import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { shopApi, type Shop, type ShopImage } from '../../api/shops'

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
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isEdit) return
    shopApi.get(Number(id)).then((res) => {
      const shop: Shop = res.data
      setValues({ name: shop.name, description: shop.description ?? '', address: shop.address, phone: shop.phone })
      setImages(shop.images)
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
        <div style={{ marginTop: 40 }}>
          <h2>画像</h2>
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
      )}
    </div>
  )
}

const labelStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4, fontWeight: 500 }
const inputStyle: React.CSSProperties = { padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 14 }
