import React, { useState } from 'react'
import { Scissors, Plus, Trash2, CheckCircle2, Download } from 'lucide-react'
import { splitPdf, downloadBlob } from '../utils/pdfUtils'

export default function SplitPanel({ fileUrl, fileName, numPages, onUpdate }) {
  const [mode,    setMode]    = useState('ranges')   // 'ranges' | 'every' | 'extract'
  const [ranges,  setRanges]  = useState([{ id: 1, start: 1, end: numPages || 1 }])
  const [every,   setEvery]   = useState(1)
  const [extract, setExtract] = useState('')         // comma-separated page numbers
  const [status,  setStatus]  = useState(null)
  const [msg,     setMsg]     = useState('')
  const [results, setResults] = useState([])

  const addRange = () =>
    setRanges(prev => [...prev, { id: Date.now(), start: 1, end: numPages || 1 }])
  const removeRange = (id) => setRanges(prev => prev.filter(r => r.id !== id))
  const updateRange = (id, field, val) =>
    setRanges(prev => prev.map(r => r.id === id ? { ...r, [field]: Number(val) } : r))

  const buildRanges = () => {
    if (mode === 'ranges') return ranges.map(r => ({ start: r.start, end: r.end }))
    if (mode === 'every') {
      const n = Math.max(1, Number(every))
      const out = []
      for (let s = 1; s <= numPages; s += n) out.push({ start: s, end: Math.min(s + n - 1, numPages) })
      return out
    }
    if (mode === 'extract') {
      return extract.split(',').map(s => s.trim()).filter(Boolean).map(s => {
        const [a, b] = s.split('-').map(Number)
        return { start: a, end: b || a }
      })
    }
    return []
  }

  const apply = async () => {
    const builtRanges = buildRanges()
    if (!builtRanges.length) { setMsg('Define at least one range.'); setStatus('error'); return }
    setStatus('working'); setMsg(''); setResults([])
    try {
      const parts = await splitPdf(fileUrl, builtRanges)
      setResults(parts)
      setStatus('done')
      setMsg(`Split into ${parts.length} file${parts.length > 1 ? 's' : ''}.`)
    } catch (e) {
      setStatus('error'); setMsg('Split failed: ' + e.message)
    }
  }

  const downloadAll = () => {
    results.forEach(({ bytes, name }) => downloadBlob(bytes, name))
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500 leading-relaxed">
        Split your PDF into separate files. This PDF has <strong>{numPages}</strong> page{numPages !== 1 ? 's' : ''}.
      </p>

      {/* Mode selector */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {[['ranges','Custom ranges'], ['every','Every N pages'], ['extract','Pages']].map(([val, label]) => (
          <button key={val} onClick={() => setMode(val)}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all
              ${mode === val ? 'bg-white text-brand shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {mode === 'ranges' && (
        <div className="space-y-2">
          {ranges.map((r, i) => (
            <div key={r.id} className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-4 shrink-0">{i+1}</span>
              <input type="number" min={1} max={numPages} value={r.start}
                onChange={e => updateRange(r.id, 'start', e.target.value)}
                className="flex-1 px-2 py-1.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand" />
              <span className="text-xs text-gray-400">–</span>
              <input type="number" min={1} max={numPages} value={r.end}
                onChange={e => updateRange(r.id, 'end', e.target.value)}
                className="flex-1 px-2 py-1.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand" />
              <button onClick={() => removeRange(r.id)} disabled={ranges.length <= 1}
                className="text-gray-300 hover:text-red-400 disabled:opacity-30">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          <button onClick={addRange} className="btn-ghost w-full text-xs py-1.5 border border-dashed border-gray-200 rounded-xl">
            <Plus size={12} /> Add range
          </button>
        </div>
      )}

      {mode === 'every' && (
        <label className="block">
          <span className="text-xs font-semibold text-gray-700 mb-1 block">Pages per file</span>
          <input type="number" min={1} max={numPages} value={every}
            onChange={e => setEvery(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
          <p className="text-xs text-gray-400 mt-1">
            Creates {Math.ceil(numPages / Math.max(1, Number(every)))} files
          </p>
        </label>
      )}

      {mode === 'extract' && (
        <label className="block">
          <span className="text-xs font-semibold text-gray-700 mb-1 block">Page numbers (e.g. 1, 3-5, 7)</span>
          <input value={extract} onChange={e => setExtract(e.target.value)}
            placeholder="1, 3-5, 7"
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
          <p className="text-xs text-gray-400 mt-1">Comma-separated pages or ranges</p>
        </label>
      )}

      {msg && (
        <p className={`text-xs font-medium flex items-center gap-1.5 ${status === 'error' ? 'text-red-500' : 'text-brand'}`}>
          {status === 'done' && <CheckCircle2 size={12} />}{msg}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <button onClick={apply} disabled={status === 'working'} className="btn-primary w-full">
          <Scissors size={14} />
          {status === 'working' ? 'Splitting…' : 'Split PDF'}
        </button>
        {results.length > 0 && (
          <>
            {results.length > 1 && (
              <button onClick={downloadAll} className="btn-outline w-full">
                <Download size={14} /> Download All ({results.length} files)
              </button>
            )}
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {results.map(({ bytes, name }, i) => (
                <button key={i} onClick={() => downloadBlob(bytes, name)}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-50 hover:bg-brand-100 transition-colors text-xs font-medium text-brand">
                  <Download size={11} /> {name}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
