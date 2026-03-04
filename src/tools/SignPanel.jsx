/**
 * SignPanel.jsx
 *
 * Three signature methods:
 *   draw   — freehand signature pad (smooth, ink-like, transparent bg)
 *   type   — pick a script font, type your name
 *   upload — upload a PNG/JPEG signature image
 *
 * The result becomes a draggable/resizable overlay on the PDF via the
 * existing AnnotationLayer system. Apply & Save embeds it permanently.
 */
import React, { useRef, useState, useEffect, useCallback } from 'react'
import { PenLine, Type, Upload, Trash2, RotateCcw, CheckCircle2, Image } from 'lucide-react'

// ── Typed signature fonts — Google Fonts (loaded in index.html) ───────────────
const SIG_FONTS = [
  {
    label:      'Elegant',
    family:     'Dancing Script',
    value:      "'Dancing Script', cursive",
    weight:     700,
    sizeScale:  1.0,
  },
  {
    label:      'Classic',
    family:     'Playfair Display',
    value:      "'Playfair Display', serif",
    weight:     400,
    style:      'italic',
    sizeScale:  0.9,
  },
  {
    label:      'Modern',
    family:     'Raleway',
    value:      "'Raleway', sans-serif",
    weight:     300,
    sizeScale:  0.85,
  },
  {
    label:      'Script',
    family:     'Pacifico',
    value:      "'Pacifico', cursive",
    weight:     400,
    sizeScale:  0.8,
  },
]
const SIG_COLORS = ['#000000', '#1a237e', '#1b5e20', '#b71c1c']

// ── SignPanel ─────────────────────────────────────────────────────────────────
export default function SignPanel({ onAddOverlay }) {
  const [mode, setMode] = useState('draw') // 'draw' | 'type' | 'upload'

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500 leading-relaxed">
        Create your signature, place it on the page, then hit <strong>Apply &amp; Save</strong>.
      </p>

      {/* Mode tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {[
          { id: 'draw',   icon: PenLine, label: 'Draw'   },
          { id: 'type',   icon: Type,    label: 'Type'   },
          { id: 'upload', icon: Upload,  label: 'Upload' },
        ].map(m => (
          <button key={m.id} onClick={() => setMode(m.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all
              ${mode === m.id ? 'bg-white text-brand shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <m.icon size={12} strokeWidth={2.5} />
            {m.label}
          </button>
        ))}
      </div>

      {/* Mode content */}
      {mode === 'draw'   && <DrawSignature   onPlace={onAddOverlay} />}
      {mode === 'type'   && <TypeSignature   onPlace={onAddOverlay} />}
      {mode === 'upload' && <UploadSignature onPlace={onAddOverlay} />}
    </div>
  )
}

// ── Draw Signature ────────────────────────────────────────────────────────────
function DrawSignature({ onPlace }) {
  const canvasRef  = useRef(null)
  const isDrawing  = useRef(false)
  const lastPos    = useRef(null)
  const [hasInk,   setHasInk]   = useState(false)
  const [color,    setColor]    = useState('#000000')
  const [thickness,setThickness]= useState(2.5)
  const [placed,   setPlaced]   = useState(false)

  // Keep color/thickness accessible in event handlers via refs
  const colorRef     = useRef(color)
  const thicknessRef = useRef(thickness)
  useEffect(() => { colorRef.current     = color     }, [color])
  useEffect(() => { thicknessRef.current = thickness }, [thickness])

  const getPos = (e) => {
    const canvas = canvasRef.current
    const rect   = canvas.getBoundingClientRect()
    const src    = e.touches?.[0] || e
    return {
      x: (src.clientX - rect.left) * (canvas.width  / rect.width),
      y: (src.clientY - rect.top)  * (canvas.height / rect.height),
    }
  }

  const onDown = useCallback((e) => {
    e.preventDefault()
    isDrawing.current = true
    lastPos.current   = getPos(e)
    // Draw a dot on single tap
    const ctx = canvasRef.current.getContext('2d')
    const pos = lastPos.current
    ctx.beginPath()
    ctx.arc(pos.x, pos.y, thicknessRef.current / 2, 0, Math.PI * 2)
    ctx.fillStyle = colorRef.current
    ctx.fill()
    setHasInk(true)
    setPlaced(false)
  }, [])

  const onMove = useCallback((e) => {
    if (!isDrawing.current) return
    e.preventDefault()
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    const pos    = getPos(e)

    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = colorRef.current
    ctx.lineWidth   = thicknessRef.current
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'
    ctx.stroke()

    lastPos.current = pos
    setHasInk(true)
    setPlaced(false)
  }, [])

  const onUp = useCallback(() => { isDrawing.current = false }, [])

  const clear = () => {
    const canvas = canvasRef.current
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    setHasInk(false)
    setPlaced(false)
  }

  const place = () => {
    if (!hasInk) return
    const canvas     = canvasRef.current
    // Crop to tightest bounding box of actual ink pixels
    const cropped    = cropCanvas(canvas)
    const dataUrl    = cropped.toDataURL('image/png')
    const aspect     = cropped.width / cropped.height
    const W          = Math.min(220, Math.max(120, cropped.width * 0.5))
    const H          = W / aspect

    onPlace?.({
      type:    'signature',
      sigDataUrl: dataUrl,
      x: 60, y: 60,
      w: Math.round(W),
      h: Math.round(H),
    })
    setPlaced(true)
  }

  // Attach touch events imperatively (non-passive) so preventDefault works on iOS Safari
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.addEventListener('touchstart',  onDown, { passive: false })
    canvas.addEventListener('touchmove',   onMove, { passive: false })
    canvas.addEventListener('touchend',    onUp)
    return () => {
      canvas.removeEventListener('touchstart',  onDown)
      canvas.removeEventListener('touchmove',   onMove)
      canvas.removeEventListener('touchend',    onUp)
    }
  }, [onDown, onMove, onUp])

  return (
    <div className="space-y-3">
      {/* Controls row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          {SIG_COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)}
              className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110
                ${color === c ? 'border-brand scale-110' : 'border-gray-200'}`}
              style={{ background: c }} />
          ))}
          <input type="color" value={color} onChange={e => setColor(e.target.value)}
            className="w-6 h-6 rounded-full cursor-pointer border border-gray-200" />
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          {[1.5, 2.5, 4].map(t => (
            <button key={t} onClick={() => setThickness(t)}
              className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all
                ${thickness === t ? 'border-brand bg-brand-50' : 'border-gray-200 hover:border-brand'}`}>
              <span className="rounded-full bg-gray-700 inline-block"
                style={{ width: t * 2.5, height: t * 2.5 }} />
            </button>
          ))}
        </div>
      </div>

      {/* Signature pad */}
      <div className="relative rounded-xl border-2 border-dashed border-gray-200 bg-white overflow-hidden"
           style={{ height: 130 }}>
        <canvas
          ref={canvasRef}
          width={480}
          height={200}
          className="absolute inset-0 w-full h-full"
          style={{ touchAction: 'none', cursor: 'crosshair' }}
          onMouseDown={onDown} onMouseMove={onMove}
          onMouseUp={onUp}     onMouseLeave={onUp}
        />
        {/* Baseline */}
        <div className="absolute bottom-8 inset-x-4 border-b border-gray-200 pointer-events-none" />
        {!hasInk && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-gray-300 text-sm select-none" style={{ fontFamily: '"Brush Script MT", cursive', fontSize: 22 }}>
              Sign here…
            </span>
          </div>
        )}
      </div>

      {placed && (
        <div className="flex items-center gap-2 text-xs text-brand bg-brand-50 rounded-xl px-3 py-2">
          <CheckCircle2 size={12} /> Placed — drag &amp; resize on the PDF
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={clear} disabled={!hasInk}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-gray-200
                     text-xs font-semibold text-gray-500 hover:border-red-300 hover:text-red-500
                     disabled:opacity-40 transition-colors">
          <RotateCcw size={12} /> Clear
        </button>
        <button onClick={place} disabled={!hasInk}
          className="flex-1 btn-primary text-xs py-2 disabled:opacity-40">
          Place on page
        </button>
      </div>
    </div>
  )
}

// ── Type Signature ────────────────────────────────────────────────────────────
function TypeSignature({ onPlace }) {
  const previewRef = useRef(null)
  const [name,   setName]   = useState('')
  const [font,   setFont]   = useState(SIG_FONTS[0])
  const [color,  setColor]  = useState('#000000')
  const [placed, setPlaced] = useState(false)
  const [fontsReady, setFontsReady] = useState(false)

  // Wait for Google Fonts to load before drawing — fixes blank/wrong-font canvas
  useEffect(() => {
    document.fonts.ready.then(() => setFontsReady(true))
  }, [])

  // Build the full CSS font string for canvas ctx.font
  const buildFontStr = useCallback((f, size) => {
    const style  = f.style === 'italic' ? 'italic ' : ''
    const weight = f.weight || 400
    return `${style}${weight} ${size}px ${f.value}`
  }, [])

  // Render typed name to an offscreen canvas, return it (transparent bg)
  const renderToCanvas = useCallback(() => {
    const text = name.trim()
    if (!text || !fontsReady) return null

    const fontSize = Math.round(52 * (font.sizeScale || 1))
    const fontStr  = buildFontStr(font, fontSize)

    // Measure on a temp canvas first — DON'T resize the canvas before measuring
    const measure  = document.createElement('canvas')
    measure.width  = 800
    measure.height = 120
    const mctx     = measure.getContext('2d')
    mctx.font      = fontStr
    const metrics  = mctx.measureText(text)

    const padX  = 16
    const padY  = 12
    const w     = Math.ceil(metrics.width) + padX * 2
    const h     = fontSize + padY * 2

    // Now draw on a properly-sized canvas
    const canvas  = document.createElement('canvas')
    canvas.width  = w
    canvas.height = h
    const ctx     = canvas.getContext('2d')
    // Font must be set AFTER canvas is sized
    ctx.font         = fontStr
    ctx.fillStyle    = color
    ctx.textBaseline = 'middle'
    ctx.fillText(text, padX, h / 2)

    return canvas
  }, [name, font, color, fontsReady, buildFontStr])

  // Update preview canvas whenever anything changes
  useEffect(() => {
    const el = previewRef.current
    if (!el) return
    const src = renderToCanvas()
    if (!src) {
      // Clear preview
      el.width  = 1
      el.height = 1
      return
    }
    el.width  = src.width
    el.height = src.height
    el.getContext('2d').drawImage(src, 0, 0)
  }, [renderToCanvas])

  const place = () => {
    const canvas = renderToCanvas()
    if (!canvas) return
    const dataUrl = canvas.toDataURL('image/png')
    const aspect  = canvas.width / canvas.height
    const W       = Math.min(240, Math.max(120, canvas.width * 0.5))
    onPlace?.({
      type:        'signature',
      sigDataUrl:   dataUrl,
      x: 60, y: 60,
      w: Math.round(W),
      h: Math.round(W / aspect),
    })
    setPlaced(true)
  }

  return (
    <div className="space-y-3">
      <input
        value={name}
        onChange={e => { setName(e.target.value); setPlaced(false) }}
        placeholder="Type your full name…"
        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
      />

      {/* Font picker — each button rendered in its own Google Font */}
      <div className="grid grid-cols-2 gap-1.5">
        {SIG_FONTS.map(f => (
          <button
            key={f.label}
            onClick={() => { setFont(f); setPlaced(false) }}
            className={`py-2.5 px-2 rounded-xl border text-left truncate transition-all
              ${font.value === f.value
                ? 'border-brand bg-brand-50 text-brand'
                : 'border-gray-200 text-gray-700 hover:border-brand'}`}
            style={{
              fontFamily:  f.value,
              fontWeight:  f.weight || 400,
              fontStyle:   f.style  || 'normal',
              fontSize:    17,
              lineHeight:  1.3,
            }}
          >
            {name.trim() || f.label}
          </button>
        ))}
      </div>

      {/* Colour */}
      <div className="flex items-center gap-2">
        {SIG_COLORS.map(c => (
          <button key={c} onClick={() => { setColor(c); setPlaced(false) }}
            className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110
              ${color === c ? 'border-brand scale-110' : 'border-gray-200'}`}
            style={{ background: c }} />
        ))}
        <input type="color" value={color} onChange={e => { setColor(e.target.value); setPlaced(false) }}
          className="w-6 h-6 rounded-full cursor-pointer border border-gray-200" />
      </div>

      {/* Live canvas preview */}
      <div className="rounded-xl border border-gray-100 bg-white flex items-center justify-center overflow-hidden"
           style={{ height: 72 }}>
        {name.trim() ? (
          <canvas
            ref={previewRef}
            style={{ maxWidth: '100%', maxHeight: 60, display: 'block', margin: '0 auto' }}
          />
        ) : (
          <span className="text-xs text-gray-300">Preview appears here</span>
        )}
      </div>

      {placed && (
        <div className="flex items-center gap-2 text-xs text-brand bg-brand-50 rounded-xl px-3 py-2">
          <CheckCircle2 size={12} /> Placed — drag &amp; resize on the PDF
        </div>
      )}

      <button onClick={place} disabled={!name.trim() || !fontsReady}
        className="btn-primary w-full text-xs disabled:opacity-40">
        {fontsReady ? 'Place on page' : 'Loading fonts…'}
      </button>
    </div>
  )
}

// ── Upload Signature ──────────────────────────────────────────────────────────
function UploadSignature({ onPlace }) {
  const inputRef = useRef(null)
  const [preview, setPreview] = useState(null)
  const [imgFile, setImgFile] = useState(null)
  const [msg,     setMsg]     = useState('')
  const [placed,  setPlaced]  = useState(false)

  const onFile = (file) => {
    if (!file) return
    if (!['image/png','image/jpeg','image/jpg'].includes(file.type)) {
      setMsg('Please upload a PNG or JPEG image.'); return
    }
    setImgFile(file)
    setPreview(URL.createObjectURL(file))
    setMsg('')
    setPlaced(false)
  }

  const place = () => {
    if (!imgFile) return
    // Convert to PNG data URL for consistent transparent handling
    const img = new window.Image()
    img.onload = () => {
      const canvas   = document.createElement('canvas')
      canvas.width   = img.naturalWidth
      canvas.height  = img.naturalHeight
      canvas.getContext('2d').drawImage(img, 0, 0)
      const dataUrl  = canvas.toDataURL('image/png')
      const aspect   = img.naturalWidth / img.naturalHeight
      const W        = Math.min(220, Math.max(100, img.naturalWidth * 0.4))
      onPlace?.({
        type:       'signature',
        sigDataUrl:  dataUrl,
        x: 60, y: 60,
        w: Math.round(W),
        h: Math.round(W / aspect),
      })
      setPlaced(true)
    }
    img.src = preview
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400 leading-relaxed">
        Upload a PNG with a transparent background for best results. JPEG also works.
      </p>

      {!preview ? (
        <div
          className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-brand hover:bg-brand-50 transition-all"
          onClick={() => inputRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); onFile(e.dataTransfer.files?.[0]) }}
        >
          <input ref={inputRef} type="file" accept="image/png,image/jpeg" className="hidden"
            onChange={e => onFile(e.target.files?.[0])} />
          <Image size={24} className="mx-auto mb-2 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">Click or drag to upload</p>
          <p className="text-xs text-gray-400 mt-0.5">PNG (transparent) or JPEG</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 relative">
          <img src={preview} alt="Signature preview"
            className="max-h-24 mx-auto block object-contain" />
          <button onClick={() => { setPreview(null); setImgFile(null); setPlaced(false) }}
            className="absolute top-2 right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 text-xs">
            ×
          </button>
        </div>
      )}

      {msg && <p className="text-xs text-red-500">{msg}</p>}

      {placed && (
        <div className="flex items-center gap-2 text-xs text-brand bg-brand-50 rounded-xl px-3 py-2">
          <CheckCircle2 size={12} /> Placed — drag &amp; resize on the PDF
        </div>
      )}

      <button onClick={place} disabled={!imgFile}
        className="btn-primary w-full text-xs disabled:opacity-40">
        Place on page
      </button>
    </div>
  )
}

// ── Canvas crop helper ────────────────────────────────────────────────────────
// Returns a new canvas tightly cropped around non-transparent pixels
function cropCanvas(src) {
  const ctx  = src.getContext('2d')
  const data = ctx.getImageData(0, 0, src.width, src.height)
  const px   = data.data

  let minX = src.width, maxX = 0, minY = src.height, maxY = 0
  for (let y = 0; y < src.height; y++) {
    for (let x = 0; x < src.width; x++) {
      const alpha = px[(y * src.width + x) * 4 + 3]
      if (alpha > 10) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }

  // Fallback: nothing drawn
  if (maxX < minX) return src

  const pad    = 8
  const x      = Math.max(0, minX - pad)
  const y      = Math.max(0, minY - pad)
  const w      = Math.min(src.width,  maxX + pad) - x
  const h      = Math.min(src.height, maxY + pad) - y

  const out    = document.createElement('canvas')
  out.width    = w
  out.height   = h
  out.getContext('2d').drawImage(src, x, y, w, h, 0, 0, w, h)
  return out
}
