import { useEffect, useState } from 'react'
import { reservationApi } from '../api/reservations'
import { shopApi, type StaffUser } from '../api/shops'
import type { Course } from '../api/courses'

type Props = {
  shopId: number
  course: Course
  date: string
  startTime: string
  onClose: () => void
  onComplete: () => void
}

export default function ReservationModal({ shopId, course, date, startTime, onClose, onComplete }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [staffList, setStaffList] = useState<StaffUser[]>([])
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null)

  const endMinutes = timeToMinutes(startTime) + course.duration
  const endTime = minutesToTime(endMinutes)

  useEffect(() => {
    const endMinutes = timeToMinutes(startTime) + course.duration
    const endTime = minutesToTime(endMinutes)
    shopApi.getPublicStaff(shopId, date, startTime, endTime)
      .then((res) => setStaffList(res.data))
      .catch(() => {})
  }, [shopId, date, startTime])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await reservationApi.create(shopId, {
        course_id: course.id,
        staff_user_id: selectedStaffId ?? null,
        date,
        start_time: startTime,
        guest_name: name,
        guest_email: email,
        guest_phone: phone || undefined,
        note: note || undefined,
      })
      onComplete()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? '予約に失敗しました。もう一度お試しください。')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={modalStyle}>
        <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: '#1e293b' }}>予約内容の確認</h2>

        {/* 予約情報 */}
        <div style={infoBoxStyle}>
          <div style={infoRowStyle}>
            <span style={infoLabelStyle}>コース</span>
            <span>{course.name}</span>
          </div>
          <div style={infoRowStyle}>
            <span style={infoLabelStyle}>日時</span>
            <span>{date}　{startTime} 〜 {endTime}</span>
          </div>
          <div style={infoRowStyle}>
            <span style={infoLabelStyle}>所要時間</span>
            <span>{course.duration}分</span>
          </div>
          <div style={infoRowStyle}>
            <span style={infoLabelStyle}>料金</span>
            <span>¥{course.price.toLocaleString()}</span>
          </div>
        </div>

        {/* 担当者選択 */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 10 }}>
            担当者を選択してください
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {/* 指名なし */}
            <button
              type="button"
              onClick={() => setSelectedStaffId(null)}
              style={staffCardStyle(selectedStaffId === null)}
            >
              <div style={avatarStyle(selectedStaffId === null)}>－</div>
              <span style={{ fontSize: 12, color: '#374151' }}>指名なし</span>
            </button>

            {staffList.map((staff) => (
              <button
                key={staff.id}
                type="button"
                onClick={() => setSelectedStaffId(staff.id)}
                style={staffCardStyle(selectedStaffId === staff.id)}
              >
                {staff.profile_image_url ? (
                  <img
                    src={staff.profile_image_url}
                    alt={staff.name}
                    style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', marginBottom: 4 }}
                  />
                ) : (
                  <div style={avatarStyle(selectedStaffId === staff.id)}>
                    {staff.name.charAt(0)}
                  </div>
                )}
                <span style={{ fontSize: 12, color: '#374151' }}>{staff.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 予約者情報 */}
        <form onSubmit={handleSubmit}>
          {error && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{error}</p>}
          <div style={fieldStyle}>
            <label style={labelStyle}>お名前 <span style={{ color: '#ef4444' }}>*</span></label>
            <input value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} placeholder="山田 太郎" />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>メールアドレス <span style={{ color: '#ef4444' }}>*</span></label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} placeholder="example@email.com" />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>電話番号</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} placeholder="090-0000-0000" />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>ご要望・備考</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <button type="submit" disabled={submitting} style={confirmBtnStyle}>
              {submitting ? '送信中...' : '予約を確定する'}
            </button>
            <button type="button" onClick={onClose} style={cancelBtnStyle}>
              キャンセル
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(mins: number): string {
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16,
}
const modalStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 12, padding: 32,
  width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto',
}
const infoBoxStyle: React.CSSProperties = {
  background: '#f8fafc', border: '1px solid #e2e8f0',
  borderRadius: 8, padding: 16, marginBottom: 24,
}
const infoRowStyle: React.CSSProperties = {
  display: 'flex', gap: 16, fontSize: 14, color: '#1e293b',
  padding: '6px 0', borderBottom: '1px solid #f1f5f9',
}
const infoLabelStyle: React.CSSProperties = { color: '#64748b', fontWeight: 600, minWidth: 80 }
const fieldStyle: React.CSSProperties = { marginBottom: 14 }
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4 }
const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, color: '#1e293b', boxSizing: 'border-box' }
const confirmBtnStyle: React.CSSProperties = { flex: 1, padding: '11px 0', background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer' }
const cancelBtnStyle: React.CSSProperties = { padding: '11px 24px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, cursor: 'pointer' }

function staffCardStyle(selected: boolean): React.CSSProperties {
  return {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    padding: '8px 12px', borderRadius: 10, border: `2px solid ${selected ? '#10b981' : '#e2e8f0'}`,
    background: selected ? '#f0fdf4' : '#fff', cursor: 'pointer', minWidth: 72,
  }
}

function avatarStyle(selected: boolean): React.CSSProperties {
  return {
    width: 56, height: 56, borderRadius: '50%', marginBottom: 4,
    background: selected ? '#10b981' : '#e2e8f0',
    color: selected ? '#fff' : '#64748b',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 20, fontWeight: 700,
  }
}
