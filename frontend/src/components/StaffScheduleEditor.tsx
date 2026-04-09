import { useState } from 'react'
import { shopApi, type ScheduleEntry, type StaffSchedule } from '../api/shops'

type Props = {
  shopId: number
  staffSchedules: StaffSchedule[]
  from: string
  to: string
}

type NewRow = { date: string; start_time: string; end_time: string; is_day_off: boolean }

const defaultNew = (): NewRow => ({
  date: new Date().toISOString().slice(0, 10),
  start_time: '09:00',
  end_time: '18:00',
  is_day_off: false,
})

const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土']

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const dow = DAY_NAMES[d.getDay()]
  return `${dateStr}（${dow}）`
}

export default function StaffScheduleEditor({ shopId, staffSchedules: initial, from, to }: Props) {
  const [staffSchedules, setStaffSchedules] = useState<StaffSchedule[]>(initial)
  const [newRows, setNewRows] = useState<Record<number, NewRow>>({})
  const [adding, setAdding] = useState<Record<number, boolean>>({})
  const [saving, setSaving] = useState<Record<number, boolean>>({})
  const [deleting, setDeleting] = useState<Record<string, boolean>>({})

  const getNew = (userId: number): NewRow => newRows[userId] ?? defaultNew()

  const updateNew = (userId: number, field: keyof NewRow, value: string | boolean) => {
    setNewRows((p) => ({ ...p, [userId]: { ...getNew(userId), [field]: value } }))
  }

  const handleAdd = async (userId: number) => {
    const row = getNew(userId)
    setSaving((p) => ({ ...p, [userId]: true }))
    try {
      const res = await shopApi.upsertSchedule(shopId, userId, {
        date: row.date,
        is_day_off: row.is_day_off,
        start_time: row.is_day_off ? null : row.start_time,
        end_time: row.is_day_off ? null : row.end_time,
      })
      const entry: ScheduleEntry = res.data
      setStaffSchedules((prev) =>
        prev.map((s) => {
          if (s.user_id !== userId) return s
          const filtered = s.schedules.filter((e) => e.date !== entry.date)
          const updated = [...filtered, entry].sort((a, b) => a.date.localeCompare(b.date))
          return { ...s, schedules: updated }
        })
      )
      setAdding((p) => ({ ...p, [userId]: false }))
      setNewRows((p) => ({ ...p, [userId]: defaultNew() }))
    } finally {
      setSaving((p) => ({ ...p, [userId]: false }))
    }
  }

  const handleDelete = async (userId: number, date: string) => {
    const key = `${userId}-${date}`
    setDeleting((p) => ({ ...p, [key]: true }))
    try {
      await shopApi.deleteSchedule(shopId, userId, date)
      setStaffSchedules((prev) =>
        prev.map((s) =>
          s.user_id === userId
            ? { ...s, schedules: s.schedules.filter((e) => e.date !== date) }
            : s
        )
      )
    } finally {
      setDeleting((p) => ({ ...p, [key]: false }))
    }
  }

  if (staffSchedules.length === 0) {
    return <p style={{ color: '#64748b', fontSize: 14 }}>担当スタッフを先に割り当ててください。</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>表示期間: {from} 〜 {to}</p>

      {staffSchedules.map((staff) => {
        const row = getNew(staff.user_id)
        const isAdding = adding[staff.user_id]

        return (
          <div key={staff.user_id} style={staffBlockStyle}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b', marginBottom: 12 }}>
              {staff.name}
            </div>

            {/* 登録済み一覧 */}
            {staff.schedules.length === 0 ? (
              <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>スケジュールはまだありません。</p>
            ) : (
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>日付</th>
                    <th style={thStyle}>開始</th>
                    <th style={thStyle}>終了</th>
                    <th style={thStyle}>休み</th>
                    <th style={thStyle}></th>
                  </tr>
                </thead>
                <tbody>
                  {staff.schedules.map((entry) => {
                    const key = `${staff.user_id}-${entry.date}`
                    return (
                      <tr key={entry.date} style={{ background: entry.is_day_off ? '#fef9f9' : '#fff' }}>
                        <td style={tdStyle}>{formatDate(entry.date)}</td>
                        <td style={tdStyle}>{entry.is_day_off ? '—' : (entry.start_time?.slice(0, 5) ?? '—')}</td>
                        <td style={tdStyle}>{entry.is_day_off ? '—' : (entry.end_time?.slice(0, 5) ?? '—')}</td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          {entry.is_day_off ? <span style={dayOffBadge}>休</span> : ''}
                        </td>
                        <td style={tdStyle}>
                          <button
                            onClick={() => handleDelete(staff.user_id, entry.date)}
                            disabled={deleting[key]}
                            style={deleteBtnStyle}
                          >
                            削除
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}

            {/* 追加フォーム */}
            {isAdding ? (
              <div style={addFormStyle}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
                  <div>
                    <label style={formLabelStyle}>日付</label>
                    <input
                      type="date"
                      value={row.date}
                      onChange={(e) => updateNew(staff.user_id, 'date', e.target.value)}
                      style={formInputStyle}
                    />
                  </div>
                  <div>
                    <label style={formLabelStyle}>開始</label>
                    <input
                      type="time"
                      value={row.start_time}
                      disabled={row.is_day_off}
                      onChange={(e) => updateNew(staff.user_id, 'start_time', e.target.value)}
                      style={{ ...formInputStyle, opacity: row.is_day_off ? 0.4 : 1 }}
                    />
                  </div>
                  <div>
                    <label style={formLabelStyle}>終了</label>
                    <input
                      type="time"
                      value={row.end_time}
                      disabled={row.is_day_off}
                      onChange={(e) => updateNew(staff.user_id, 'end_time', e.target.value)}
                      style={{ ...formInputStyle, opacity: row.is_day_off ? 0.4 : 1 }}
                    />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#475569', paddingBottom: 2 }}>
                    <input
                      type="checkbox"
                      checked={row.is_day_off}
                      onChange={(e) => updateNew(staff.user_id, 'is_day_off', e.target.checked)}
                    />
                    休み
                  </label>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button onClick={() => handleAdd(staff.user_id)} disabled={saving[staff.user_id]} style={saveBtnStyle}>
                    {saving[staff.user_id] ? '保存中...' : '保存'}
                  </button>
                  <button onClick={() => setAdding((p) => ({ ...p, [staff.user_id]: false }))} style={cancelBtnStyle}>
                    キャンセル
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAdding((p) => ({ ...p, [staff.user_id]: true }))}
                style={addBtnStyle}
              >
                + 日程を追加
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

const staffBlockStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  padding: 16,
}
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: 14, marginBottom: 12 }
const thStyle: React.CSSProperties = {
  padding: '8px 12px', textAlign: 'left', color: '#64748b',
  fontWeight: 600, borderBottom: '1px solid #e2e8f0', fontSize: 13,
}
const tdStyle: React.CSSProperties = { padding: '8px 12px', borderBottom: '1px solid #f1f5f9', color: '#1e293b' }
const dayOffBadge: React.CSSProperties = {
  display: 'inline-block', padding: '1px 8px', borderRadius: 9999,
  background: '#fee2e2', color: '#dc2626', fontSize: 11, fontWeight: 700,
}
const deleteBtnStyle: React.CSSProperties = {
  padding: '3px 10px', background: '#fff', color: '#ef4444',
  border: '1px solid #fca5a5', borderRadius: 4, fontSize: 12, cursor: 'pointer',
}
const addFormStyle: React.CSSProperties = {
  marginTop: 12, padding: 16, background: '#f8fafc',
  border: '1px solid #e2e8f0', borderRadius: 6,
}
const formLabelStyle: React.CSSProperties = { display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }
const formInputStyle: React.CSSProperties = {
  padding: '6px 10px', border: '1px solid #d1d5db',
  borderRadius: 4, fontSize: 13, color: '#1e293b',
}
const saveBtnStyle: React.CSSProperties = {
  padding: '7px 20px', background: '#3b82f6', color: '#fff',
  border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer',
}
const cancelBtnStyle: React.CSSProperties = {
  padding: '7px 20px', background: '#f1f5f9', color: '#475569',
  border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13, cursor: 'pointer',
}
const addBtnStyle: React.CSSProperties = {
  marginTop: 8, padding: '7px 16px', background: '#f8fafc', color: '#3b82f6',
  border: '1px solid #bfdbfe', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer',
}
