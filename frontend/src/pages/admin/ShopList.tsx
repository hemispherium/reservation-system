import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { shopApi, type Shop } from '../../api/shops'

export default function ShopList() {
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    shopApi.list()
      .then((res) => setShops(res.data))
      .catch((err) => setError(err.message ?? 'APIエラーが発生しました'))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id: number) => {
    if (!confirm('この店舗を削除しますか？')) return
    await shopApi.delete(id)
    setShops((prev) => prev.filter((s) => s.id !== id))
  }

  if (loading) return <p>読み込み中...</p>
  if (error) return <p style={{ color: 'red' }}>エラー: {error}</p>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>店舗一覧</h1>
        <button onClick={() => navigate('/admin/shops/new')}>+ 新規作成</button>
      </div>

      {shops.length === 0 ? (
        <p>店舗がまだ登録されていません。</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
              <th style={th}>店舗名</th>
              <th style={th}>住所</th>
              <th style={th}>電話番号</th>
              <th style={th}>画像数</th>
              <th style={th}>操作</th>
            </tr>
          </thead>
          <tbody>
            {shops.map((shop) => (
              <tr key={shop.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={td}>{shop.name}</td>
                <td style={td}>{shop.address}</td>
                <td style={td}>{shop.phone}</td>
                <td style={td}>{shop.images.length}枚</td>
                <td style={td}>
                  <Link to={`/admin/shops/${shop.id}/edit`} style={{ marginRight: 12 }}>
                    編集
                  </Link>
                  <button onClick={() => handleDelete(shop.id)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}>
                    削除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

const th: React.CSSProperties = { padding: '12px 16px', textAlign: 'left', color: '#1e293b' }
const td: React.CSSProperties = { padding: '12px 16px', color: '#1e293b' }
