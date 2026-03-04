import React, { useState } from 'react'
import { RotateCw, CheckCircle2, Download } from 'lucide-react'
import { rotatePdf, bytesToUrl } from '../utils/pdfUtils'

export default function RotatePanel({ fileUrl, fileName, numPages, onUpdate }) {
  const [angle,     setAngle]     = useState(90)
  const [scope,     setScope]     = useState('all') // 'all' | 'range'
  const [from,      setFrom]      = useState(1)
  const [to,        setTo]        = useState(1)
  const [status,    setStatus]    = useState(null)
  const [msg,       setMsg]       = useState('')
  const [resultUrl, setResultUrl] = useState(null)
  const [resultName,setResultName]= useState('')

  const apply = async () => {
    setStatus('working'); setMsg('')
    try {
      let indices = []
      if (scope === 'range') {
        const f = Math.max(1, from) - 1
        const t = Math.min(numPages, to) - 1
        indices = Array.from({ length: t - f + 1 }, (_, i) => f + i)
      }
      const bytes = await rotatePdf(fileUrl, indices, Number(angle))
      const url   = bytesToUrl(bytes)
      const name  = fileName.replace(/\.pdf$/i, '') + '-rotated.pdf'
      setResultUrl(url); setResultName(name)
      setStatus('done'); setMsg('Pages rotated!')
      onUpdate?.(url, name)
    } catch (e) {
      setStatus('error'); setMsg('Rotation failed: ' + e.message)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500 leading-relaxed">
        Rotate all pages or a specific range by 90°, 180°, or 270°.
      </p>

      <label className="block">
        <span className="text-xs font-semibold text-gray-700 mb-1 block">Rotation angle</span>
        <div className="flex gap-2">
          {[90, 180, 270].map(a => (
            <button key={a} onClick={() => setAngle(a)}
              className={`flex-1 py-2 rounded-xl border text-sm font-semibold transition-all
                ${angle === a ? 'bg-brand text-white border-brand' : 'border-gray-200 text-gray-600 hover:border-brand hover:text-brand'}`}>
              {a}°
            </button>
          ))}
        </div>
      </label>

      {numPages > 1 && (
        <fieldset className="space-y-2">
          <legend className="text-xs font-semibold text-gray-700">Which pages?</legend>
          {['all', 'range'].map(opt => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="scope" value={opt} checked={scope === opt}
                onChange={() => setScope(opt)} className="accent-brand" />
              <span className="text-sm text-gray-700">{opt === 'all' ? 'All pages' : 'Page range'}</span>
            </label>
          ))}
          {scope === 'range' && (
            <div className="flex items-center gap-2 mt-1">
              <input type="number" min={1} max={numPages} value={from}
                onChange={e => setFrom(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
              <span className="text-xs text-gray-400">to</span>
              <input type="number" min={1} max={numPages} value={to}
                onChange={e => setTo(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
            </div>
          )}
        </fieldset>
      )}

      {msg && (
        <p className={`text-xs font-medium flex items-center gap-1.5 ${status === 'error' ? 'text-red-500' : 'text-brand'}`}>
          {status === 'done' && <CheckCircle2 size={12} />}{msg}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <button onClick={apply} disabled={status === 'working'} className="btn-primary w-full">
          <RotateCw size={14} />
          {status === 'working' ? 'Rotating…' : 'Rotate Pages'}
        </button>
        {status === 'done' && (
          <button onClick={() => {
            const a = Object.assign(document.createElement('a'), { href: resultUrl, download: resultName })
            a.click()
          }} className="btn-outline w-full">
            <Download size={14} /> Download PDF
          </button>
        )}
      </div>
    </div>
  )
}
