import { useState } from 'react'
import { updateQR, deleteQR, getAnalytics, getQRImageUrl } from '../api'

function fmt(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('zh-TW', {
    month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

function toDatetimeInput(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

function normalizeUrl(value) {
  const s = value.trim()
  if (!s) return s
  if (/^https?:\/\//i.test(s)) return s
  return `https://${s}`
}

function getStatus(qr) {
  if (qr.is_deleted) return 'deleted'
  if (qr.expires_at && new Date(qr.expires_at) < new Date()) return 'expired'
  return 'active'
}

export default function QRCard({ qr, onDeleted, onUpdated }) {
  const [newUrl, setNewUrl]         = useState('')
  const [expireOn, setExpireOn]     = useState(!!qr.expires_at)
  const [expireInput, setExpireInput] = useState(toDatetimeInput(qr.expires_at))
  const [analytics, setAnalytics]   = useState(null)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState(null)

  const status   = getStatus(qr)
  const imageUrl = getQRImageUrl(qr.token)
  const shortUrl = `${window.location.origin}/r/${qr.token}`

  async function handlePatch() {
    setLoading(true); setError(null)
    try {
      const url = newUrl.trim() ? normalizeUrl(newUrl) : undefined
      // toggle OFF  → send null to explicitly clear expires_at
      // toggle ON with date → send the ISO string
      // toggle ON without date → don't touch expires_at (undefined)
      const expiresAt = !expireOn
        ? null
        : expireInput ? new Date(expireInput).toISOString() : undefined

      onUpdated(qr.token, await updateQR(qr.token, { url, expiresAt }))
      setNewUrl('')
    } catch (err) {
      setError(err.detail ?? '更新失敗')
    } finally { setLoading(false) }
  }

  function handleToggle(e) {
    const on = e.target.checked
    setExpireOn(on)
    if (!on) setExpireInput('')  // clear date when switching off
  }

  async function handleDelete() {
    if (!confirm(`確定刪除 ${qr.token}？`)) return
    try { await deleteQR(qr.token); onDeleted(qr.token) }
    catch (err) { setError(err.detail ?? '刪除失敗') }
  }

  async function handleAnalytics() {
    if (analytics) { setAnalytics(null); return }
    try { setAnalytics(await getAnalytics(qr.token)) }
    catch (err) { setError(err.detail ?? '無法取得統計') }
  }

  return (
    <div className={`qr-card status-${status}`}>

      {/* image + meta */}
      <div className="qr-card-body">
        <img src={imageUrl} alt={qr.token} className="qr-image" />
        <div className="qr-meta">
          <div className="meta-row">
            <span className="lbl">TOKEN</span>
            <span className="val token-val">{qr.token}</span>
            <span className={`pill ${status}`}>{status.toUpperCase()}</span>
          </div>
          <div className="meta-row">
            <span className="lbl">SHORT</span>
            <a href={shortUrl} target="_blank" rel="noreferrer"
               className="val link" title={shortUrl}>{shortUrl}</a>
          </div>
          <div className="meta-row">
            <span className="lbl">TARGET</span>
            <span className="val muted" title={qr.original_url}>{qr.original_url}</span>
          </div>
          <div className="meta-row" style={{ marginTop: '0.3rem' }}>
            <span className="lbl">CREATED</span>
            <span className="val fixed">{fmt(qr.created_at)}</span>
            <span className="lbl">UPDATED</span>
            <span className="val fixed">{fmt(qr.updated_at)}</span>
          </div>
        </div>
      </div>

      {/* new url + expire toggle + PATCH — all one row */}
      <div className="qr-edit">
        <span className="edit-prefix">new url:</span>
        <input
          className="edit-input"
          type="text"
          value={newUrl}
          onChange={e => setNewUrl(e.target.value)}
          onBlur={() => setNewUrl(prev => normalizeUrl(prev))}
          placeholder="example.com"
        />
        <div className="expire-inline">
          <span className="expire-lbl">EXPIRES</span>
          <label className="toggle">
            <input type="checkbox" checked={expireOn} onChange={handleToggle} />
            <span className="toggle-slider" />
          </label>
          {expireOn && (
            <input
              className="expire-date-input"
              type="datetime-local"
              value={expireInput}
              onChange={e => setExpireInput(e.target.value)}
            />
          )}
        </div>
        <button className="btn-patch" onClick={handlePatch} disabled={loading}>
          {loading ? '...' : 'PATCH'}
        </button>
      </div>

      {/* actions */}
      <div className="qr-actions">
        <button className={`btn-action${analytics ? ' is-active' : ''}`} onClick={handleAnalytics}>
          analytics
        </button>
        <button className="btn-action" onClick={() => window.open(`/r/${qr.token}`, '_blank')}>
          test redirect
        </button>
        <button className="btn-action danger" onClick={handleDelete}>
          delete
        </button>
      </div>

      {error && <div className="error-row">{error}</div>}

      {analytics && (
        <div className="analytics-row">
          <span>total_scans</span>
          <span className="hi">{analytics.total_scans}</span>
          {analytics.scans_by_day.map(r => (
            <span key={r.date}>{r.date} <span className="hi">{r.count}</span></span>
          ))}
        </div>
      )}
    </div>
  )
}
