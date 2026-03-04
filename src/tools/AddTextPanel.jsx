import React, { useState } from 'react'
import { Plus } from 'lucide-react'

const FONT_SIZES = [10, 14, 18, 24, 36]
const FONT_FAMILIES = [
  { label: 'Sans',  value: 'Helvetica, Arial, sans-serif',    pdfFont: 'Helvetica'  },
  { label: 'Serif', value: 'Georgia, Times New Roman, serif',  pdfFont: 'TimesRoman' },
  { label: 'Mono',  value: 'Courier New, monospace',           pdfFont: 'Courier'    },
]
const PRESET_COLORS = ['#000000','#e53e3e','#237352','#2563eb','#d97706','#7c3aed','#ffffff']

export default function AddTextPanel({ onAddOverlay }) {
  const [text,       setText]       = useState('')
  const [fontSize,   setFontSize]   = useState(14)
  const [fontFamily, setFontFamily] = useState(FONT_FAMILIES[0])
  const [color,      setColor]      = useState('#000000')
  const [bold,       setBold]       = useState(false)
  const [italic,     setItalic]     = useState(false)
  const [msg,        setMsg]        = useState('')

  const addBox = () => {
    if (!text.trim()) { setMsg('Type some text first.'); return }
    setMsg('')
    onAddOverlay?.({
      type:       'text',
      text:       text.trim(),
      fontSize,
      fontFamily: fontFamily.value,
      pdfFont:    fontFamily.pdfFont,
      color,
      bold,
      italic,
      x: 60,
      y: 60,
      w: Math.max(160, text.length * fontSize * 0.6),
      h: fontSize * 2.4,
    })
    // Keep settings; clear text so user can add another box easily
    setText('')
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500 leading-relaxed">
        Style your text, then click <strong>Add to page</strong>. Drag and resize the box on the PDF. Add as many as you like, then hit <strong>Apply &amp; Save</strong> in the toolbar.
      </p>

      {/* Text input */}
      <label className="block">
        <span className="text-xs font-semibold text-gray-700 mb-1.5 block">Text</span>
        <textarea
          value={text}
          onChange={e => { setText(e.target.value); setMsg('') }}
          rows={3}
          placeholder="Type your text here…"
          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand resize-none"
        />
      </label>

      {/* Font */}
      <div>
        <span className="text-xs font-semibold text-gray-700 mb-1.5 block">Font</span>
        <div className="flex gap-1.5">
          {FONT_FAMILIES.map(f => (
            <button key={f.label} onClick={() => setFontFamily(f)}
              className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-all
                ${fontFamily.value === f.value
                  ? 'bg-brand text-white border-brand'
                  : 'border-gray-200 text-gray-600 hover:border-brand hover:text-brand'}`}
              style={{ fontFamily: f.value }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Size */}
      <div>
        <span className="text-xs font-semibold text-gray-700 mb-1.5 block">Size</span>
        <div className="flex gap-1.5">
          {FONT_SIZES.map(s => (
            <button key={s} onClick={() => setFontSize(s)}
              className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition-all
                ${fontSize === s
                  ? 'bg-brand text-white border-brand'
                  : 'border-gray-200 text-gray-600 hover:border-brand hover:text-brand'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Style */}
      <div className="flex gap-2">
        <button onClick={() => setBold(v => !v)}
          className={`flex-1 py-1.5 rounded-lg border text-sm font-bold transition-all
            ${bold ? 'bg-brand text-white border-brand' : 'border-gray-200 text-gray-600 hover:border-brand'}`}>
          B
        </button>
        <button onClick={() => setItalic(v => !v)}
          className={`flex-1 py-1.5 rounded-lg border text-sm italic transition-all
            ${italic ? 'bg-brand text-white border-brand' : 'border-gray-200 text-gray-600 hover:border-brand'}`}>
          I
        </button>
      </div>

      {/* Colour */}
      <div>
        <span className="text-xs font-semibold text-gray-700 mb-1.5 block">Colour</span>
        <div className="flex items-center gap-2 flex-wrap">
          {PRESET_COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)}
              className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110
                ${color === c ? 'border-brand scale-110' : 'border-gray-200'}`}
              style={{ background: c }} />
          ))}
          <input type="color" value={color} onChange={e => setColor(e.target.value)}
            className="w-6 h-6 rounded-full cursor-pointer border border-gray-200" />
        </div>
      </div>

      {/* Live preview */}
      {text ? (
        <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 min-h-[36px] overflow-hidden">
          <span style={{
            fontFamily: fontFamily.value,
            fontSize:   Math.min(fontSize, 22),
            fontWeight: bold   ? 'bold'   : 'normal',
            fontStyle:  italic ? 'italic' : 'normal',
            color,
          }}>
            {text}
          </span>
        </div>
      ) : null}

      {msg && <p className="text-xs text-red-500 font-medium">{msg}</p>}

      <button onClick={addBox} className="btn-primary w-full">
        <Plus size={14} /> Add to page
      </button>
    </div>
  )
}
