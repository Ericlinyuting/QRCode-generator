import { useState, useEffect } from 'react'
import CreateForm from './components/CreateForm'
import QRCard from './components/QRCard'
import { getQRInfo } from './api'

const STORAGE_KEY = 'qr-code-list'

function getStatus(qr) {
  if (qr.is_deleted) return 'deleted'
  if (qr.expires_at && new Date(qr.expires_at) < new Date()) return 'expired'
  return 'active'
}

export default function App() {
  const [qrList, setQrList] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') }
    catch { return [] }
  })

  // On mount: validate every stored token against the API; drop ones that no longer exist in DB
  useEffect(() => {
    if (qrList.length === 0) return
    Promise.allSettled(qrList.map(qr => getQRInfo(qr.token))).then(results => {
      const valid = qrList.filter((_, i) => results[i].status === 'fulfilled')
      if (valid.length !== qrList.length) setQrList(valid)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Persist to localStorage on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(qrList))
  }, [qrList])

  const latestStatus = qrList.length > 0 ? getStatus(qrList[0]) : null

  function handleCreated(qr)          { setQrList(prev => [qr, ...prev]) }
  function handleDeleted(token)        { setQrList(prev => prev.filter(q => q.token !== token)) }
  function handleUpdated(token, data)  { setQrList(prev => prev.map(q => q.token === token ? { ...q, ...data } : q)) }

  return (
    <div className="app">
      <header>
        <div className="header-left">
          <h1>QR Code Generator</h1>
          <p>動態 QR Code — 建立後可隨時更換目標網址</p>
        </div>
        {latestStatus && (
          <div className={`status-badge ${latestStatus}`}>
            <span className="dot" />
            {latestStatus.toUpperCase()}
          </div>
        )}
      </header>

      <CreateForm onCreated={handleCreated} />

      {qrList.length > 0 ? (
        <div className="qr-list">
          {qrList.map(qr => (
            <QRCard key={qr.token} qr={qr}
              onDeleted={handleDeleted}
              onUpdated={handleUpdated} />
          ))}
        </div>
      ) : (
        <div className="empty-state">尚無 QR Code，從上方建立第一個吧！</div>
      )}
    </div>
  )
}
