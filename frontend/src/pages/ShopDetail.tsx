import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { shopApi, type Shop, type StaffUser } from '../api/shops'

type Tab = 'info' | 'staff'

export default function ShopDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [shop, setShop] = useState<Shop | null>(null)
  const [staff, setStaff] = useState<StaffUser[]>([])
  const [loading, setLoading] = useState(true)
  const [staffLoading, setStaffLoading] = useState(false)
  const [currentImage, setCurrentImage] = useState(0)
  const [tab, setTab] = useState<Tab>('info')

  useEffect(() => {
    shopApi.getPublic(Number(id))
      .then((res) => setShop(res.data))
      .catch(() => navigate('/'))
      .finally(() => setLoading(false))
  }, [id, navigate])

  useEffect(() => {
    if (tab !== 'staff') return
    setStaffLoading(true)
    shopApi.getPublicStaff(Number(id))
      .then((res) => setStaff(res.data))
      .finally(() => setStaffLoading(false))
  }, [tab, id])

  if (loading) return <p style={{ padding: 32 }}>読み込み中...</p>
  if (!shop) return null

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <button onClick={() => navigate('/')} style={backBtnStyle}>← 店舗一覧</button>
      </header>

      <main style={mainStyle}>
        {/* 画像エリア */}
        {shop.images.length > 0 && (
          <div style={imageAreaStyle}>
            <img
              src={shop.images[currentImage].url}
              alt={shop.name}
              style={mainImageStyle}
            />
            {shop.images.length > 1 && (
              <div style={thumbnailRowStyle}>
                {shop.images.map((img, i) => (
                  <img
                    key={img.id}
                    src={img.url}
                    alt=""
                    onClick={() => setCurrentImage(i)}
                    style={{
                      ...thumbnailStyle,
                      outline: i === currentImage ? '2px solid #3b82f6' : 'none',
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 店舗名 */}
        <h1 style={{ margin: '0 0 24px', fontSize: 28, fontWeight: 700, color: '#1e293b' }}>
          {shop.name}
        </h1>

        {/* タブ */}
        <div style={tabBarStyle}>
          <button style={tabBtnStyle(tab === 'info')} onClick={() => setTab('info')}>店舗情報</button>
          <button style={tabBtnStyle(tab === 'staff')} onClick={() => setTab('staff')}>スタッフ</button>
        </div>

        {/* タブコンテンツ */}
        <div style={tabContentStyle}>
          {tab === 'info' && (
            <>
              {shop.description && (
                <p style={{ color: '#475569', lineHeight: 1.7, marginBottom: 24 }}>
                  {shop.description}
                </p>
              )}
              <table style={tableStyle}>
                <tbody>
                  <tr>
                    <th style={labelCellStyle}>住所</th>
                    <td style={valueCellStyle}>{shop.address}</td>
                  </tr>
                  <tr>
                    <th style={labelCellStyle}>電話番号</th>
                    <td style={valueCellStyle}>{shop.phone}</td>
                  </tr>
                </tbody>
              </table>
            </>
          )}

          {tab === 'staff' && (
            staffLoading ? (
              <p style={{ color: '#64748b' }}>読み込み中...</p>
            ) : staff.length === 0 ? (
              <p style={{ color: '#64748b' }}>担当スタッフはいません。</p>
            ) : (
              <div style={staffGridStyle}>
                {staff.map((u) => (
                  <div key={u.id} style={staffCardStyle}>
                    {u.profile_image_url ? (
                      <img src={u.profile_image_url} alt={u.name} style={avatarImgStyle} />
                    ) : (
                      <div style={noImageStyle}>NO IMAGE</div>
                    )}
                    <span style={{ fontSize: 15, fontWeight: 600, color: '#1e293b' }}>{u.name}</span>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </main>
    </div>
  )
}

const pageStyle: React.CSSProperties = { minHeight: '100vh', background: '#f8fafc' }
const headerStyle: React.CSSProperties = {
  background: '#fff',
  borderBottom: '1px solid #e2e8f0',
  padding: '12px 32px',
}
const backBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: 14,
  color: '#3b82f6',
  padding: 0,
}
const mainStyle: React.CSSProperties = {
  maxWidth: 800,
  margin: '0 auto',
  padding: '32px 24px',
}
const imageAreaStyle: React.CSSProperties = {
  marginBottom: 24,
  borderRadius: 8,
  overflow: 'hidden',
  background: '#fff',
  border: '1px solid #e2e8f0',
}
const mainImageStyle: React.CSSProperties = { width: '100%', height: 'auto', display: 'block' }
const thumbnailRowStyle: React.CSSProperties = { display: 'flex', gap: 8, padding: 12, overflowX: 'auto' }
const thumbnailStyle: React.CSSProperties = {
  width: 72, height: 72, objectFit: 'cover', borderRadius: 4, cursor: 'pointer', flexShrink: 0,
}
const tabBarStyle: React.CSSProperties = {
  display: 'flex',
  borderBottom: '2px solid #e2e8f0',
  marginBottom: 24,
}
const tabBtnStyle = (active: boolean): React.CSSProperties => ({
  padding: '10px 24px',
  background: 'none',
  border: 'none',
  borderBottom: active ? '2px solid #3b82f6' : '2px solid transparent',
  marginBottom: -2,
  color: active ? '#3b82f6' : '#64748b',
  fontWeight: active ? 700 : 400,
  fontSize: 15,
  cursor: 'pointer',
})
const tabContentStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  padding: 24,
}
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse' }
const labelCellStyle: React.CSSProperties = {
  width: 100,
  padding: '10px 16px 10px 0',
  fontSize: 14,
  fontWeight: 600,
  color: '#64748b',
  textAlign: 'left',
  verticalAlign: 'top',
  borderTop: '1px solid #f1f5f9',
}
const valueCellStyle: React.CSSProperties = {
  padding: '10px 0',
  fontSize: 14,
  color: '#1e293b',
  borderTop: '1px solid #f1f5f9',
}
const staffGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
  gap: 16,
}
const staffCardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 12,
  padding: 16,
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  background: '#f8fafc',
}
const avatarImgStyle: React.CSSProperties = {
  width: '100%',
  aspectRatio: '1',
  objectFit: 'cover',
  borderRadius: 8,
  display: 'block',
}
const noImageStyle: React.CSSProperties = {
  width: '100%',
  aspectRatio: '1',
  borderRadius: 8,
  background: '#e2e8f0',
  color: '#94a3b8',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: '0.05em',
}
