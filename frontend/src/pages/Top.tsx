import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { shopApi, type Shop } from '../api/shops'
import { useAuth } from '../contexts/AuthContext'

export default function Top() {
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  useEffect(() => {
    shopApi.listPublic()
      .then((res) => setShops(Array.isArray(res.data) ? res.data : []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p style={loadingStyle}>読み込み中...</p>

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>店舗一覧</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user ? (
            <>
              <span style={{ fontSize: 14, color: '#475569' }}>{user.name}</span>
              <button onClick={() => navigate('/admin')} style={headerBtnStyle}>管理画面</button>
              <button onClick={() => navigate('/mypage')} style={{ ...headerBtnStyle, background: '#6366f1' }}>マイページ</button>
              <button onClick={logout} style={{ ...headerBtnStyle, background: '#f1f5f9', color: '#475569' }}>
                ログアウト
              </button>
            </>
          ) : (
            <>
              <button onClick={() => navigate('/register')} style={{ ...headerBtnStyle, background: '#10b981' }}>新規登録</button>
              <button onClick={() => navigate('/login')} style={headerBtnStyle}>ログイン</button>
            </>
          )}
        </div>
      </header>

      <main style={mainStyle}>
        {shops.length === 0 ? (
          <p>現在登録されている店舗はありません。</p>
        ) : (
          <div style={gridStyle}>
            {shops.map((shop) => (
              <div
                key={shop.id}
                style={cardStyle}
                onClick={() => navigate(`/shops/${shop.id}`)}
              >
                {shop.images.length > 0 ? (
                  <img
                    src={shop.images[0].url}
                    alt={shop.name}
                    style={imageStyle}
                  />
                ) : (
                  <div style={noImageStyle}>画像なし</div>
                )}
                <div style={cardBodyStyle}>
                  <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>{shop.name}</h2>
                  <p style={{ color: '#64748b', fontSize: 14 }}>{shop.address}</p>
                  {shop.description && (
                    <p style={{ marginTop: 8, fontSize: 14, color: '#475569' }}>
                      {shop.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

const pageStyle: React.CSSProperties = { minHeight: '100vh', background: '#f8fafc' }
const headerStyle: React.CSSProperties = {
  background: '#fff',
  borderBottom: '1px solid #e2e8f0',
  padding: '16px 32px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}
const headerBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  background: '#3b82f6',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
}
const mainStyle: React.CSSProperties = { padding: '32px' }
const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: 24,
}
const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 8,
  overflow: 'hidden',
  border: '1px solid #e2e8f0',
  cursor: 'pointer',
  transition: 'box-shadow 0.2s',
}
const imageStyle: React.CSSProperties = {
  width: '100%',
  height: 'auto',
  display: 'block',
}
const noImageStyle: React.CSSProperties = {
  width: '100%',
  height: 180,
  background: '#e2e8f0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#94a3b8',
  fontSize: 14,
}
const cardBodyStyle: React.CSSProperties = { padding: 16 }
const loadingStyle: React.CSSProperties = { padding: 32 }
