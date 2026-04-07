import { Link, Outlet } from 'react-router-dom'

export default function AdminLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <nav style={{ width: 220, background: '#1e293b', color: '#fff', padding: '24px 16px' }}>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 32 }}>管理画面</div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <li>
            <Link to="/admin/shops" style={{ color: '#cbd5e1', textDecoration: 'none' }}>
              店舗管理
            </Link>
          </li>
        </ul>
      </nav>
      <main style={{ flex: 1, padding: 32, background: '#f8fafc' }}>
        <Outlet />
      </main>
    </div>
  )
}
