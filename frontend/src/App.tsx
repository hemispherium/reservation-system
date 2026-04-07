import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom'
import AdminLayout from './components/AdminLayout'
import ShopForm from './pages/admin/ShopForm'
import ShopList from './pages/admin/ShopList'
import Top from './pages/Top'

const router = createBrowserRouter([
  { path: '/', element: <Top /> },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <Navigate to="shops" replace /> },
      { path: 'shops', element: <ShopList /> },
      { path: 'shops/new', element: <ShopForm /> },
      { path: 'shops/:id/edit', element: <ShopForm /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
