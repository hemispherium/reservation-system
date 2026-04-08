import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom'
import AdminLayout from './components/AdminLayout'
import ShopForm from './pages/admin/ShopForm'
import ShopList from './pages/admin/ShopList'
import UserList from './pages/admin/UserList'
import UserForm from './pages/admin/UserForm'
import Top from './pages/Top'
import ShopDetail from './pages/ShopDetail'
import Login from './pages/Login'
import Register from './pages/Register'
import { AuthProvider, useAuth } from './contexts/AuthContext'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <p style={{ padding: 32 }}>読み込み中...</p>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <p style={{ padding: 32 }}>読み込み中...</p>
  if (!user || user.role !== 'admin') return <Navigate to="/admin/shops" replace />
  return <>{children}</>
}

const router = createBrowserRouter([
  { path: '/', element: <Top /> },
  { path: '/shops/:id', element: <ShopDetail /> },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  {
    path: '/admin',
    element: (
      <RequireAuth>
        <AdminLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="shops" replace /> },
      { path: 'shops', element: <ShopList /> },
      { path: 'shops/new', element: <ShopForm /> },
      { path: 'shops/:id/edit', element: <ShopForm /> },
      { path: 'users', element: <RequireAdmin><UserList /></RequireAdmin> },
      { path: 'users/new', element: <RequireAdmin><UserForm /></RequireAdmin> },
      { path: 'users/:id/edit', element: <RequireAdmin><UserForm /></RequireAdmin> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}

export default App
