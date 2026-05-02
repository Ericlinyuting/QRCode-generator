const BASE = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options)
  const data = await res.json()
  if (!res.ok) throw data
  return data
}

export function createQR(url, expiresAt = null) {
  return request('/qr/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, expires_at: expiresAt }),
  })
}

export function getQRInfo(token) {
  return request(`/qr/${token}`)
}

// url/expiresAt: pass `undefined` to skip that field, `null` to explicitly clear expiresAt
export function updateQR(token, { url, expiresAt } = {}) {
  const body = {}
  if (url !== undefined) body.url = url
  if (expiresAt !== undefined) body.expires_at = expiresAt  // null → clears expiry in backend
  return request(`/qr/${token}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function deleteQR(token) {
  return request(`/qr/${token}`, { method: 'DELETE' })
}

export function getAnalytics(token) {
  return request(`/qr/${token}/analytics`)
}

export function getQRImageUrl(token) {
  return `${BASE}/qr/${token}/image`
}
