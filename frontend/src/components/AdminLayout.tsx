import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <nav style={{ width: 220, background: '#1e293b', color: '#fff', padding: '24px 16px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 32 }}>管理画面</div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
          <li>
            <Link to="/admin/shops" style={{ color: '#cbd5e1', textDecoration: 'none' }}>
              店舗管理
            </Link>
          </li>
          {user?.role === 'admin' && (
            <li>
              <Link to="/admin/users" style={{ color: '#cbd5e1', textDecoration: 'none' }}>
                ユーザー管理
              </Link>
            </li>
          )}
        </ul>
        {user && (
          <div style={{ borderTop: '1px solid #334155', paddingTop: 16 }}>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>{user.name}</p>
            <button onClick={handleLogout} style={logoutBtnStyle}>ログアウト</button>
          </div>
        )}
      </nav>
      <main style={{ flex: 1, padding: 32, background: '#f8fafc' }}>
        <Outlet />
      </main>
    </div>
  )
}

const logoutBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 0',
  background: 'transparent',
  color: '#94a3b8',
  border: '1px solid #334155',
  borderRadius: 6,
  fontSize: 13,
  cursor: 'pointer',
}
