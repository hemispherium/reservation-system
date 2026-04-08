import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { userApi, type AdminUser } from '../../api/users'
import { useAuth } from '../../contexts/AuthContext'

export default function UserList() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { user: me } = useAuth()

  useEffect(() => {
    userApi.list()
      .then((res) => setUsers(Array.isArray(res.data) ? res.data : []))
      .catch((err) => setError(err.message ?? 'APIエラーが発生しました'))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id: number) => {
    if (!confirm('このユーザーを削除しますか？')) return
    await userApi.delete(id)
    setUsers((prev) => prev.filter((u) => u.id !== id))
  }

  if (loading) return <p>読み込み中...</p>
  if (error) return <p style={{ color: 'red' }}>エラー: {error}</p>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>ユーザー管理</h1>
        <button onClick={() => navigate('/admin/users/new')}>+ 新規作成</button>
      </div>

      {users.length === 0 ? (
        <p>ユーザーが登録されていません。</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
              <th style={th}>名前</th>
              <th style={th}>メールアドレス</th>
              <th style={th}>ロール</th>
              <th style={th}>操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={td}>{u.name}</td>
                <td style={td}>{u.email}</td>
                <td style={td}>
                  <span style={roleBadge(u.role)}>{u.role ?? '未設定'}</span>
                </td>
                <td style={td}>
                  <button
                    onClick={() => navigate(`/admin/users/${u.id}/edit`)}
                    style={{ marginRight: 12, background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6' }}
                  >
                    編集
                  </button>
                  {me?.id !== u.id && (
                    <button
                      onClick={() => handleDelete(u.id)}
                      style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      削除
                    </button>
                  )}
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

const roleBadge = (role: string | null): React.CSSProperties => ({
  display: 'inline-block',
  padding: '2px 10px',
  borderRadius: 9999,
  fontSize: 12,
  fontWeight: 600,
  background: role === 'admin' ? '#dbeafe' : '#f1f5f9',
  color: role === 'admin' ? '#1d4ed8' : '#475569',
})
