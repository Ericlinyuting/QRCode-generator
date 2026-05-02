import { useState } from 'react'
import { createQR } from '../api'

function normalizeUrl(value) {
  const s = value.trim()
  if (!s) return s
  if (/^https?:\/\//i.test(s)) return s
  return `https://${s}`
}

export default function CreateForm({ onCreated }) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function handleBlur() {
    setUrl(prev => normalizeUrl(prev))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const normalized = normalizeUrl(url)
    setUrl(normalized)
    setError(null)
    setLoading(true)
    try {
      onCreated(await createQR(normalized))
      setUrl('')
    } catch (err) {
      setError(err.detail ?? '建立失敗')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="create-wrap">
      <form className="create-form" onSubmit={handleSubmit}>
        <span className="url-prefix">url:</span>
        <input
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          onBlur={handleBlur}
          placeholder="example.com"
          required
          autoFocus
        />
        <button type="submit" className="btn-generate" disabled={loading}>
          {loading ? '建立中...' : '↵ generate'}
        </button>
      </form>
      {error && <p className="form-error">{error}</p>}
    </div>
  )
}
