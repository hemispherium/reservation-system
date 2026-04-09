import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { reservationApi, type Reservation } from '../api/reservations'
import { useAuth } from '../contexts/AuthContext'

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  confirmed: { label: '予約確定', color: '#059669', bg: '#f0fdf4' },
  cancelled:  { label: 'キャンセル', color: '#dc2626', bg: '#fef2f2' },
}

const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土']

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${dateStr}（${DAY_NAMES[d.getDay()]}）`
}

export default function MyPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    reservationApi.myList()
      .then((res) => setReservations(res.data))
      .finally(() => setLoading(false))
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const today = new Date().toISOString().slice(0, 10)
  const upcoming = reservations.filter((r) => r.date >= today && r.status === 'confirmed')
  const past = reservations.filter((r) => r.date < today || r.status === 'cancelled')

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <button onClick={() => navigate('/')} style={backBtnStyle}>← 店舗一覧</button>
      </header>

      <div style={mainStyle}>
        {/* ユーザー情報 */}
        <div style={profileCardStyle}>
          <div style={avatarStyle}>{user?.name.charAt(0)}</div>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 18, color: '#1e293b' }}>{user?.name}</p>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>{user?.email}</p>
          </div>
          <button onClick={handleLogout} style={logoutBtnStyle}>ログアウト</button>
        </div>

        {loading ? (
          <p style={{ color: '#64748b' }}>読み込み中...</p>
        ) : (
          <>
            <section>
              <h2 style={sectionTitleStyle}>今後の予約</h2>
              {upcoming.length === 0 ? (
                <p style={emptyStyle}>予約はありません</p>
              ) : (
                <div style={listStyle}>
                  {upcoming.map((r) => <ReservationCard key={r.id} reservation={r} />)}
                </div>
              )}
            </section>

            <section style={{ marginTop: 40 }}>
              <h2 style={sectionTitleStyle}>過去の予約</h2>
              {past.length === 0 ? (
                <p style={emptyStyle}>過去の予約はありません</p>
              ) : (
                <div style={listStyle}>
                  {past.map((r) => <ReservationCard key={r.id} reservation={r} />)}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  )
}

function ReservationCard({ reservation: r }: { reservation: Reservation }) {
  const navigate = useNavigate()
  const status = STATUS_LABEL[r.status] ?? { label: r.status, color: '#64748b', bg: '#f8fafc' }

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: '#1e293b' }}>
            {r.shop?.name}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: '#475569' }}>
            {r.course?.name}
          </p>
        </div>
        <span style={{ ...badgeStyle, color: status.color, background: status.bg }}>
          {status.label}
        </span>
      </div>

      <div style={detailGridStyle}>
        <span style={detailLabelStyle}>日時</span>
        <span style={detailValueStyle}>{formatDate(r.date)}　{r.start_time.slice(0, 5)} 〜 {r.end_time.slice(0, 5)}</span>
        <span style={detailLabelStyle}>所要時間</span>
        <span style={detailValueStyle}>{r.course?.duration}分</span>
        <span style={detailLabelStyle}>料金</span>
        <span style={detailValueStyle}>¥{r.course?.price.toLocaleString()}</span>
        <span style={detailLabelStyle}>担当者</span>
        <span style={detailValueStyle}>{r.staff_user?.name ?? '指名なし'}</span>
      </div>

      <button onClick={() => navigate(`/shops/${r.shop_id}`)} style={shopLinkStyle}>
        店舗詳細を見る →
      </button>
    </div>
  )
}

const pageStyle: React.CSSProperties = { minHeight: '100vh', background: '#f8fafc' }
const headerStyle: React.CSSProperties = { background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '12px 32px' }
const backBtnStyle: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#3b82f6', padding: 0 }
const mainStyle: React.CSSProperties = { maxWidth: 680, margin: '0 auto', padding: '32px 24px' }
const profileCardStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 16,
  background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
  padding: 24, marginBottom: 40,
}
const avatarStyle: React.CSSProperties = {
  width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
  background: '#dbeafe', color: '#1d4ed8',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontWeight: 700, fontSize: 22,
}
const logoutBtnStyle: React.CSSProperties = {
  marginLeft: 'auto', padding: '7px 18px',
  background: '#f1f5f9', color: '#475569',
  border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13, cursor: 'pointer',
}
const sectionTitleStyle: React.CSSProperties = { margin: '0 0 16px', fontSize: 17, fontWeight: 700, color: '#1e293b' }
const emptyStyle: React.CSSProperties = { color: '#94a3b8', fontSize: 14 }
const listStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 12 }
const cardStyle: React.CSSProperties = {
  background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20,
}
const badgeStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 9999,
}
const detailGridStyle: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: '80px 1fr', gap: '6px 12px',
  fontSize: 13, marginBottom: 16,
}
const detailLabelStyle: React.CSSProperties = { color: '#64748b', fontWeight: 600 }
const detailValueStyle: React.CSSProperties = { color: '#1e293b' }
const shopLinkStyle: React.CSSProperties = {
  background: 'none', border: 'none', padding: 0,
  color: '#3b82f6', fontSize: 13, cursor: 'pointer', fontWeight: 600,
}
