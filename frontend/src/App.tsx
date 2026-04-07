import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from './components/AdminLayout'
import ShopForm from './pages/admin/ShopForm'
import ShopList from './pages/admin/ShopList'
import Top from './pages/Top'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Top />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="shops" replace />} />
          <Route path="shops" element={<ShopList />} />
          <Route path="shops/new" element={<ShopForm />} />
          <Route path="shops/:id/edit" element={<ShopForm />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
