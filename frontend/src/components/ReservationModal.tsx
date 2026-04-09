import { useEffect, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { reservationApi } from '../api/reservations'
import { shopApi, type StaffUser } from '../api/shops'
import type { Course } from '../api/courses'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

type Props = {
  shopId: number
  course: Course
  date: string
  startTime: string
  onClose: () => void
  onComplete: () => void
}

type FormData = {
  name: string
  email: string
  phone: string
  note: string
  staffId: number | null
}

// ステップ1: フォーム入力
function ReservationForm({
  shopId, course, date, startTime,
  onClose, onNext,
}: Props & { onNext: (form: FormData, clientSecret: string) => void }) {
  const [name, setName]   = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [note, setNote]   = useState('')
  const [staffList, setStaffList]     = useState<StaffUser[]>([])
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null)
  const [submitting, setSubmitting]   = useState(false)
  const [error, setError]             = useState<string | null>(null)

  const endMinutes = timeToMinutes(startTime) + course.duration
  const endTime = minutesToTime(endMinutes)

  useEffect(() => {
    shopApi.getPublicStaff(shopId, date, startTime, endTime)
      .then((res) => setStaffList(res.data))
      .catch(() => {})
  }, [shopId, date, startTime])

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await reservationApi.createPaymentIntent(shopId, course.id)
      onNext({ name, email, phone, note, staffId: selectedStaffId }, res.data.client_secret)
    } catch {
      setError('エラーが発生しました。もう一度お試しください。')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={modalStyle}>
      <h2 style={titleStyle}>予約内容の確認</h2>

      <div style={infoBoxStyle}>
        <InfoRow label="コース"   value={course.name} />
        <InfoRow label="日時"     value={`${date}　${startTime} 〜 ${endTime}`} />
        <InfoRow label="所要時間" value={`${course.duration}分`} />
        <InfoRow label="料金"     value={`¥${course.price.toLocaleString()}`} />
      </div>

      {/* 担当者選択 */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 10 }}>担当者を選択してください</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <button type="button" onClick={() => setSelectedStaffId(null)} style={staffCardStyle(selectedStaffId === null)}>
            <div style={avatarStyle(selectedStaffId === null)}>－</div>
            <span style={{ fontSize: 12, color: '#374151' }}>指名なし</span>
          </button>
          {staffList.map((staff) => (
            <button key={staff.id} type="button" onClick={() => setSelectedStaffId(staff.id)} style={staffCardStyle(selectedStaffId === staff.id)}>
              {staff.profile_image_url ? (
                <img src={staff.profile_image_url} alt={staff.name} style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', marginBottom: 4 }} />
              ) : (
                <div style={avatarStyle(selectedStaffId === staff.id)}>{staff.name.charAt(0)}</div>
              )}
              <span style={{ fontSize: 12, color: '#374151' }}>{staff.name}</span>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleNext}>
        {error && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{error}</p>}
        <Field label="お名前" required>
          <input value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} placeholder="山田 太郎" />
        </Field>
        <Field label="メールアドレス" required>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} placeholder="example@email.com" />
        </Field>
        <Field label="電話番号">
          <input value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} placeholder="090-0000-0000" />
        </Field>
        <Field label="ご要望・備考">
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
        </Field>
        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <button type="submit" disabled={submitting} style={confirmBtnStyle}>
            {submitting ? '処理中...' : '決済に進む →'}
          </button>
          <button type="button" onClick={onClose} style={cancelBtnStyle}>キャンセル</button>
        </div>
      </form>
    </div>
  )
}

// ステップ2: Stripe決済フォーム
function PaymentForm({
  shopId, course, date, startTime,
  formData, onClose, onComplete,
}: {
  shopId: number; course: Course; date: string; startTime: string
  formData: FormData; onClose: () => void; onComplete: () => void
}) {
  const stripe   = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState<string | null>(null)

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setError(null)
    setSubmitting(true)

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    })

    if (confirmError) {
      setError(confirmError.message ?? '決済に失敗しました。')
      setSubmitting(false)
      return
    }

    if (paymentIntent?.status !== 'succeeded') {
      setError('決済が完了しませんでした。')
      setSubmitting(false)
      return
    }

    try {
      const endMinutes = timeToMinutes(startTime) + course.duration
      await reservationApi.create(shopId, {
        course_id:               course.id,
        staff_user_id:           formData.staffId,
        date,
        start_time:              startTime,
        end_time:                minutesToTime(endMinutes),
        guest_name:              formData.name,
        guest_email:             formData.email,
        guest_phone:             formData.phone || undefined,
        note:                    formData.note || undefined,
        stripe_payment_intent_id: paymentIntent.id,
      })
      onComplete()
    } catch {
      setError('予約の保存に失敗しました。決済は完了しています。サポートにお問い合わせください。')
      setSubmitting(false)
    }
  }

  return (
    <div style={modalStyle}>
      <h2 style={titleStyle}>お支払い情報の入力</h2>
      <div style={{ ...infoBoxStyle, marginBottom: 24 }}>
        <InfoRow label="料金" value={`¥${course.price.toLocaleString()}`} />
      </div>
      <form onSubmit={handlePay}>
        <PaymentElement />
        {error && <p style={{ color: '#ef4444', fontSize: 13, marginTop: 12 }}>{error}</p>}
        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <button type="submit" disabled={!stripe || submitting} style={confirmBtnStyle}>
            {submitting ? '処理中...' : `¥${course.price.toLocaleString()} を支払って予約する`}
          </button>
          <button type="button" onClick={onClose} style={cancelBtnStyle}>キャンセル</button>
        </div>
      </form>
    </div>
  )
}

export default function ReservationModal(props: Props) {
  const [step, setStep]             = useState<'form' | 'payment'>('form')
  const [formData, setFormData]     = useState<FormData | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)

  const handleNext = (form: FormData, secret: string) => {
    setFormData(form)
    setClientSecret(secret)
    setStep('payment')
  }

  return (
    <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && props.onClose()}>
      {step === 'form' ? (
        <ReservationForm {...props} onNext={handleNext} />
      ) : (
        clientSecret && formData && (
          <Elements stripe={stripePromise} options={{ clientSecret, locale: 'ja' }}>
            <PaymentForm
              shopId={props.shopId}
              course={props.course}
              date={props.date}
              startTime={props.startTime}
              formData={formData}
              onClose={props.onClose}
              onComplete={props.onComplete}
            />
          </Elements>
        )
      )}
    </div>
  )
}

// ユーティリティ
function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
function minutesToTime(mins: number): string {
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={infoRowStyle}>
      <span style={infoLabelStyle}>{label}</span>
      <span>{value}</span>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label}{required && <span style={{ color: '#ef4444' }}> *</span>}</label>
      {children}
    </div>
  )
}

// スタイル
const overlayStyle: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }
const modalStyle: React.CSSProperties = { background: '#fff', borderRadius: 12, padding: 32, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }
const titleStyle: React.CSSProperties = { margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: '#1e293b' }
const infoBoxStyle: React.CSSProperties = { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, marginBottom: 24 }
const infoRowStyle: React.CSSProperties = { display: 'flex', gap: 16, fontSize: 14, color: '#1e293b', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }
const infoLabelStyle: React.CSSProperties = { color: '#64748b', fontWeight: 600, minWidth: 80 }
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4 }
const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, color: '#1e293b', boxSizing: 'border-box' }
const confirmBtnStyle: React.CSSProperties = { flex: 1, padding: '11px 0', background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer' }
const cancelBtnStyle: React.CSSProperties = { padding: '11px 24px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, cursor: 'pointer' }

function staffCardStyle(selected: boolean): React.CSSProperties {
  return { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 12px', borderRadius: 10, border: `2px solid ${selected ? '#10b981' : '#e2e8f0'}`, background: selected ? '#f0fdf4' : '#fff', cursor: 'pointer', minWidth: 72 }
}
function avatarStyle(selected: boolean): React.CSSProperties {
  return { width: 56, height: 56, borderRadius: '50%', marginBottom: 4, background: selected ? '#10b981' : '#e2e8f0', color: selected ? '#fff' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700 }
}
