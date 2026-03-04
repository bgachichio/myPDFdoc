import React, { useState, useRef } from 'react'
import { Image, X } from 'lucide-react'

export default function AddImagePanel({ onAddOverlay }) {
  const inputRef  = useRef(null)
  const [imgFile, setImgFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [msg,     setMsg]     = useState('')

  const onFile = (file) => {
    if (!file) return
    if (!['image/jpeg','image/jpg','image/png'].includes(file.type)) {
      setMsg('Only JPEG and PNG images are supported.')
      return
    }
    setImgFile(file)
    setPreview(URL.createObjectURL(file))
    setMsg('')
  }

  const place = () => {
    if (!imgFile) { setMsg('Select an image first.'); return }
    onAddOverlay?.({
      type:    'image',
      src:     preview,
      imgFile,
      x: 50, y: 50,
      w: 220, h: 160,
    })
    // Clear after placing so user can place another if they want
    setImgFile(null)
    setPreview(null)
    setMsg('Image placed on page — drag to reposition.')
  }

  const clearFile = () => {
    setImgFile(null); setPreview(null); setMsg('')
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500 leading-relaxed">
        Upload an image and click <strong>Place on page</strong>. Drag and resize it on the PDF, then hit <strong>Apply &amp; Save</strong> in the toolbar.
      </p>

      {/* Dropzone / preview */}
      {!preview ? (
        <div
          className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-brand hover:bg-brand-50 transition-all"
          onClick={() => inputRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); onFile(e.dataTransfer.files?.[0]) }}
        >
          <input ref={inputRef} type="file" accept="image/png,image/jpeg" className="hidden"
            onChange={e => onFile(e.target.files?.[0])} />
          <Image size={28} className="mx-auto mb-2 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">Click or drag to upload</p>
          <p className="text-xs text-gray-400 mt-0.5">PNG or JPEG</p>
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
          <img src={preview} alt="preview"
            className="max-h-36 mx-auto block object-contain p-2" />
          <button onClick={clearFile}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 shadow">
            <X size={11} strokeWidth={3} />
          </button>
          <p className="text-xs text-center text-gray-400 pb-2">{imgFile?.name}</p>
        </div>
      )}

      {msg && (
        <p className={`text-xs font-medium ${msg.startsWith('Image placed') ? 'text-brand' : 'text-red-500'}`}>
          {msg}
        </p>
      )}

      <button onClick={place} disabled={!imgFile} className="btn-primary w-full disabled:opacity-50">
        <Image size={14} /> Place on page
      </button>

      <p className="text-xs text-gray-400 leading-relaxed">
        You can place multiple images. When done, hit <strong className="text-gray-600">Apply &amp; Save</strong> in the toolbar.
      </p>
    </div>
  )
}
