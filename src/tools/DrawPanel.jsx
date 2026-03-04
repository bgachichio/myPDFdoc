import React, { useState, useEffect } from 'react'
import { Trash2, Pen } from 'lucide-react'

const PRESET_COLORS = ['#e53e3e','#000000','#237352','#2563eb','#d97706','#7c3aed']
const BRUSH_SIZES   = [2, 4, 8, 14]
const BRUSH_LABELS  = ['Fine','Medium','Thick','Bold']

export default function DrawPanel({ onAddOverlay, onClearOverlays, drawConfig }) {
  const [color,   setColor]   = useState('#e53e3e')
  const [brushSz, setBrushSz] = useState(4)
  const [mode,    setMode]    = useState('pen')

  // active = whether we have a live draw session (driven by parent drawConfig)
  const active = !!drawConfig?.active

  // Push config updates to parent whenever pen/eraser settings change while active
  useEffect(() => {
    if (!active) return
    onAddOverlay?.({ type: 'draw', color, brushSz, mode })
  }, [color, brushSz, mode]) // deliberately not including `active` — only fire on setting changes

  const startDrawing = () => {
    onAddOverlay?.({ type: 'draw', color, brushSz, mode })
  }

  const clear = () => {
    onClearOverlays?.()
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500 leading-relaxed">
        Pick a colour and brush, then click <strong>Start drawing</strong>. Draw directly on the PDF. Switch pen ↔ eraser at any time while drawing.
      </p>

      {/* Colour */}
      <div>
        <span className="text-xs font-semibold text-gray-700 mb-1.5 block">Colour</span>
        <div className="flex items-center gap-2 flex-wrap">
          {PRESET_COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)}
              className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110
                ${color === c ? 'border-brand scale-110 shadow-sm' : 'border-gray-200'}`}
              style={{ background: c }} />
          ))}
          <input type="color" value={color} onChange={e => setColor(e.target.value)}
            className="w-7 h-7 rounded-full cursor-pointer border border-gray-200"
            title="Custom colour" />
        </div>
      </div>

      {/* Brush size */}
      <div>
        <span className="text-xs font-semibold text-gray-700 mb-1.5 block">Brush size</span>
        <div className="flex gap-1.5">
          {BRUSH_SIZES.map((s, i) => (
            <button key={s} onClick={() => setBrushSz(s)}
              className={`flex-1 py-2 rounded-lg border flex items-center justify-center transition-all
                ${brushSz === s ? 'bg-brand border-brand' : 'border-gray-200 hover:border-brand'}`}>
              <span className="rounded-full inline-block"
                style={{
                  width:      Math.min(s * 1.8, 16),
                  height:     Math.min(s * 1.8, 16),
                  background: brushSz === s ? 'white' : '#374151',
                }} />
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 mt-1">
          {BRUSH_LABELS.map(l => (
            <span key={l} className="flex-1 text-center text-[10px] text-gray-400">{l}</span>
          ))}
        </div>
      </div>

      {/* Pen / Eraser toggle — always visible so user can switch while drawing */}
      <div>
        <span className="text-xs font-semibold text-gray-700 mb-1.5 block">Tool</span>
        <div className="flex gap-2">
          <button onClick={() => setMode('pen')}
            className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-all
              ${mode === 'pen' ? 'bg-brand text-white border-brand shadow-sm' : 'border-gray-200 text-gray-600 hover:border-brand hover:text-brand'}`}>
            ✏️ Pen
          </button>
          <button onClick={() => setMode('eraser')}
            className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-all
              ${mode === 'eraser' ? 'bg-orange-500 text-white border-orange-500 shadow-sm' : 'border-gray-200 text-gray-600 hover:border-orange-400 hover:text-orange-500'}`}>
            🧹 Eraser
          </button>
        </div>
      </div>

      {/* Active status */}
      {active && (
        <div className={`flex items-center gap-2 text-xs rounded-xl px-3 py-2.5 border
          ${mode === 'eraser'
            ? 'bg-orange-50 border-orange-100 text-orange-700'
            : 'bg-brand-50 border-brand-100 text-brand'}`}>
          <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse shrink-0" />
          {mode === 'eraser' ? 'Eraser active — draw over strokes to remove them' : 'Pen active — draw on the PDF'}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-2 pt-1">
        {!active ? (
          <button onClick={startDrawing} className="btn-primary w-full">
            <Pen size={14} /> Start drawing
          </button>
        ) : (
          <button onClick={clear}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl
                       border border-dashed border-gray-300 text-gray-500 text-sm
                       hover:border-red-300 hover:text-red-500 transition-colors">
            <Trash2 size={14} /> Clear &amp; restart
          </button>
        )}
      </div>

      <p className="text-xs text-gray-400 leading-relaxed">
        When done, click <strong className="text-gray-600">Apply &amp; Save</strong> in the toolbar to bake your drawing into the PDF.
      </p>
    </div>
  )
}
