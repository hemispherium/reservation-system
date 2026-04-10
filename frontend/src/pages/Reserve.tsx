import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { shopApi, type Shop } from '../api/shops'
import { courseApi, type Course } from '../api/courses'
import { reservationApi } from '../api/reservations'
import ReservationModal from '../components/ReservationModal'
import { useAuth } from '../contexts/AuthContext'

const START_HOUR = 9
const END_HOUR = 21
const SLOT_MINUTES = 10

// date → slot → 出勤スタッフ数
type CountMap = Record<string, Record<string, number>>

function addDays(base: Date, days: number): Date {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return d
}

function toLocalDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function generateDates(base: Date, count: number): string[] {
  return Array.from({ length: count }, (_, i) =>
    toLocalDateString(addDays(base, i))
  )
}

function generateSlots(): string[] {
  const slots: string[] = []
  for (let h = START_HOUR; h < END_HOUR; h++) {
    for (let m = 0; m < 60; m += SLOT_MINUTES) {
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  return slots
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

// スロットに空きスタッフがいるか（出勤数 > 予約数）
function isAvailable(staffMap: CountMap, bookedMap: CountMap, date: string, slot: string): boolean {
  const staff = staffMap[date]?.[slot] ?? 0
  const booked = bookedMap[date]?.[slot] ?? 0
  return staff > booked
}

// 指定スロットから duration 分の連続空きがあるか
function hasConsecutiveSlots(staffMap: CountMap, bookedMap: CountMap, date: string, startSlot: string, durationMinutes: number, allSlots: string[]): boolean {
  const needed = Math.ceil(durationMinutes / SLOT_MINUTES)
  const startIdx = allSlots.indexOf(startSlot)
  if (startIdx === -1) return false
  for (let i = 0; i < needed; i++) {
    const slot = allSlots[startIdx + i]
    if (!slot || !isAvailable(staffMap, bookedMap, date, slot)) return false
  }
  return true
}

const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土']

function formatHeader(dateStr: string) {
  const d = new Date(dateStr)
  const dow = DAY_NAMES[d.getDay()]
  return {
    md: `${d.getMonth() + 1}/${d.getDate()}`,
    dow,
    isWeekend: d.getDay() === 0 || d.getDay() === 6,
    isSunday: d.getDay() === 0,
  }
}

const slots = generateSlots()

export default function Reserve() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { replace: true })
    }
  }, [user, authLoading])
  const [shop, setShop] = useState<Shop | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [staffMap, setStaffMap] = useState<CountMap>({})
  const [bookedMap, setBookedMap] = useState<CountMap>({})
  const [loading, setLoading] = useState(true)
  const [schedLoading, setSchedLoading] = useState(false)
  const [weekOffset, setWeekOffset] = useState(0)
  const [booking, setBooking] = useState<{ date: string; startTime: string } | null>(null)
  const [completed, setCompleted] = useState(false)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const baseDate = addDays(today, weekOffset * 7)
  const dates = generateDates(baseDate, 14)
  const from = dates[0]
  const to = dates[dates.length - 1]

  useEffect(() => {
    Promise.all([
      shopApi.getPublic(Number(id)),
      courseApi.listPublic(Number(id)),
    ])
      .then(([shopRes, courseRes]) => {
        setShop(shopRes.data)
        setCourses(courseRes.data)
      })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!id || !selectedCourse) return
    setSchedLoading(true)
    Promise.all([
      shopApi.getPublicSchedules(Number(id), from, to),
      shopApi.getBookedSlots(Number(id), from, to),
      reservationApi.myBookedSlots(from, to),
    ])
      .then(([schedRes, bookedRes, myRes]) => {
        const sMap: CountMap = {}
        const bMap: CountMap = {}
        // date → slot → 自分の予約があるか
        const myMap: Record<string, Record<string, boolean>> = {}
        for (const date of dates) { sMap[date] = {}; bMap[date] = {}; myMap[date] = {} }

        // スタッフ1人ぶんの出勤スロットをカウントアップ
        for (const sched of schedRes.data) {
          const dateMap = sMap[sched.date]
          if (!dateMap) continue
          const startMin = timeToMinutes(sched.start_time.slice(0, 5))
          const endMin = timeToMinutes(sched.end_time.slice(0, 5))
          for (const slot of slots) {
            const slotMin = timeToMinutes(slot)
            if (slotMin >= startMin && slotMin < endMin)
              dateMap[slot] = (dateMap[slot] ?? 0) + 1
          }
        }

        // 店舗の予約1件ぶんのスロットをカウントアップ
        for (const booked of bookedRes.data) {
          const dateMap = bMap[booked.date]
          if (!dateMap) continue
          const startMin = timeToMinutes(booked.start_time.slice(0, 5))
          const endMin = timeToMinutes(booked.end_time.slice(0, 5))
          for (const slot of slots) {
            const slotMin = timeToMinutes(slot)
            if (slotMin >= startMin && slotMin < endMin)
              dateMap[slot] = (dateMap[slot] ?? 0) + 1
          }
        }

        // 自分の予約スロットを完全にブロック
        for (const my of myRes.data) {
          if (my.status !== 'confirmed') continue
          const dateMap = myMap[my.date]
          if (!dateMap) continue
          const startMin = timeToMinutes(my.start_time.slice(0, 5))
          const endMin = timeToMinutes(my.end_time.slice(0, 5))
          for (const slot of slots) {
            const slotMin = timeToMinutes(slot)
            if (slotMin >= startMin && slotMin < endMin)
              dateMap[slot] = true
          }
        }

        // 自分の予約がある場合は staffMap を 0 にして確実に ✖ にする
        for (const date of dates) {
          for (const slot of slots) {
            if (myMap[date]?.[slot]) sMap[date][slot] = 0
          }
        }

        setStaffMap(sMap)
        setBookedMap(bMap)
      })
      .finally(() => setSchedLoading(false))
  }, [id, weekOffset, selectedCourse])

  if (loading) return <p style={{ padding: 32 }}>読み込み中...</p>
  if (!shop) return null

  // 予約完了
  if (completed) {
    return (
      <div style={pageStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: 24 }}>
          <div style={{ fontSize: 64 }}>✅</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1e293b', margin: 0 }}>予約が完了しました</h2>
          <p style={{ color: '#64748b', fontSize: 14 }}>確認メールをお送りしました。</p>
          <button onClick={() => navigate('/mypage')} style={confirmBtnStyle}>予約一覧を確認する</button>
        </div>
      </div>
    )
  }

  // コース選択前
  if (!selectedCourse) {
    return (
      <div style={pageStyle}>
        <header style={headerStyle}>
          <button onClick={() => navigate(`/shops/${id}`)} style={backBtnStyle}>← 店舗詳細</button>
        </header>
        <div style={mainStyle}>
          <h1 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 700, color: '#1e293b' }}>
            {shop.name}
          </h1>
          <p style={{ margin: '0 0 32px', color: '#64748b', fontSize: 14 }}>コースを選択してください</p>

          {courses.length === 0 ? (
            <p style={{ color: '#94a3b8' }}>現在予約可能なコースがありません。</p>
          ) : (
            <div style={courseGridStyle}>
              {courses.map((course) => (
                <button
                  key={course.id}
                  onClick={() => setSelectedCourse(course)}
                  style={courseCardStyle}
                >
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#1e293b', marginBottom: 8 }}>
                    {course.name}
                  </div>
                  {course.description && (
                    <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 12px', textAlign: 'left' }}>
                      {course.description}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: 16, fontSize: 14 }}>
                    <span style={metaStyle}>⏱ {course.duration}分</span>
                    <span style={metaStyle}>¥{course.price.toLocaleString()}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // 空席テーブル
  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <button onClick={() => setSelectedCourse(null)} style={backBtnStyle}>← コース選択</button>
      </header>

      <div style={mainStyle}>
        <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: '#1e293b' }}>
          {shop.name}　空席確認・予約
        </h1>
        <div style={selectedCourseBarStyle}>
          <span style={{ fontWeight: 700 }}>{selectedCourse.name}</span>
          <span style={{ color: '#64748b' }}>⏱ {selectedCourse.duration}分</span>
          <span style={{ color: '#64748b' }}>¥{selectedCourse.price.toLocaleString()}</span>
          <button onClick={() => setSelectedCourse(null)} style={changeBtnStyle}>変更</button>
        </div>

        <div style={navStyle}>
          <button onClick={() => setWeekOffset((w) => w - 1)} style={navBtnStyle}>&lt; 前の1週間</button>
          <span style={{ fontSize: 14, color: '#475569', fontWeight: 600 }}>{from} 〜 {to}</span>
          <button onClick={() => setWeekOffset((w) => w + 1)} style={navBtnStyle}>次の1週間 &gt;</button>
        </div>

        <div style={tableWrapStyle}>
          {schedLoading && (
            <div style={loadingOverlayStyle}>読み込み中...</div>
          )}
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={timeThStyle}>時間</th>
                {dates.map((date) => {
                  const { md, dow, isWeekend, isSunday } = formatHeader(date)
                  return (
                    <th key={date} style={dateThStyle(isWeekend, isSunday)}>
                      <div>{md}</div>
                      <div style={{ fontSize: 11, fontWeight: 400 }}>{dow}</div>
                    </th>
                  )
                })}
                <th style={{ position: 'sticky', top: 0, zIndex: 2, background: '#f8fafc', borderBottom: '2px solid #e2e8f0', borderLeft: '1px solid #e2e8f0' }} />
              </tr>
            </thead>
            <tbody>
              {slots.map((slot) => (
                <tr key={slot}>
                  <td style={timeTdStyle}>{slot}</td>
                  {dates.map((date) => {
                    const available = hasConsecutiveSlots(staffMap, bookedMap, date, slot, selectedCourse.duration, slots)
                    return (
                      <td
                        key={date}
                        style={cellStyle(available)}
                        onClick={() => available && setBooking({ date, startTime: slot })}
                      >
                        {available ? '◎' : '×'}
                      </td>
                    )
                  })}
                  <td style={{ borderBottom: '1px solid #f1f5f9', borderLeft: '1px solid #f1f5f9' }} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {booking && selectedCourse && (
        <ReservationModal
          shopId={Number(id)}
          course={selectedCourse}
          date={booking.date}
          startTime={booking.startTime}
          onClose={() => setBooking(null)}
          onComplete={() => { setBooking(null); setCompleted(true) }}
        />
      )}
    </div>
  )
}

const confirmBtnStyle: React.CSSProperties = { padding: '12px 32px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer' }
const pageStyle: React.CSSProperties = { minHeight: '100vh', background: '#f8fafc' }
const headerStyle: React.CSSProperties = { background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '12px 32px' }
const backBtnStyle: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#3b82f6', padding: 0 }
const mainStyle: React.CSSProperties = { padding: '32px 24px', maxWidth: 1100, margin: '0 auto' }
const courseGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }
const courseCardStyle: React.CSSProperties = {
  background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
  padding: 24, textAlign: 'left', cursor: 'pointer',
  transition: 'box-shadow 0.15s',
}
const metaStyle: React.CSSProperties = { color: '#3b82f6', fontWeight: 600 }
const selectedCourseBarStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 16,
  background: '#eff6ff', border: '1px solid #bfdbfe',
  borderRadius: 8, padding: '10px 16px', marginBottom: 20, fontSize: 14,
}
const changeBtnStyle: React.CSSProperties = {
  marginLeft: 'auto', padding: '4px 14px', background: '#fff',
  border: '1px solid #bfdbfe', borderRadius: 6, fontSize: 13,
  color: '#3b82f6', cursor: 'pointer',
}
const navStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }
const navBtnStyle: React.CSSProperties = { padding: '8px 20px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 14, fontWeight: 600, color: '#3b82f6', cursor: 'pointer' }
const tableWrapStyle: React.CSSProperties = { position: 'relative', overflowX: 'auto', overflowY: 'auto', maxHeight: '72vh', border: '1px solid #e2e8f0', borderRadius: 8 }
const loadingOverlayStyle: React.CSSProperties = { position: 'absolute', inset: 0, background: 'rgba(248,250,252,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#64748b', zIndex: 10 }
const tableStyle: React.CSSProperties = { borderCollapse: 'collapse', fontSize: 13, background: '#fff', whiteSpace: 'nowrap', width: '100%' }
const timeThStyle: React.CSSProperties = { padding: '10px 12px', position: 'sticky', top: 0, left: 0, zIndex: 3, background: '#f8fafc', borderBottom: '2px solid #e2e8f0', borderRight: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600, minWidth: 60 }
const dateThStyle = (isWeekend: boolean, isSunday: boolean): React.CSSProperties => ({
  padding: '10px 0', minWidth: 56, textAlign: 'center', position: 'sticky', top: 0, zIndex: 2,
  background: '#f8fafc', borderBottom: '2px solid #e2e8f0', borderLeft: '1px solid #e2e8f0',
  color: isSunday ? '#dc2626' : isWeekend ? '#2563eb' : '#1e293b', fontWeight: 600,
})
const timeTdStyle: React.CSSProperties = { padding: '4px 12px', position: 'sticky', left: 0, zIndex: 1, background: '#f8fafc', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #f1f5f9', color: '#64748b', fontWeight: 500, fontSize: 12 }
const cellStyle = (available: boolean): React.CSSProperties => ({
  textAlign: 'center', padding: '4px 0', borderBottom: '1px solid #f1f5f9', borderLeft: '1px solid #f1f5f9',
  color: available ? '#059669' : '#cbd5e1', fontWeight: available ? 700 : 400,
  background: available ? '#f0fdf4' : '#fff',
})
