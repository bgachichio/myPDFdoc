/**
 * pdfUtils.js — all pdf-lib operations, run entirely client-side
 */
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib'

// ── helpers ──────────────────────────────────────────────────────────────────

/** Fetch a Blob/File/URL as ArrayBuffer */
export async function toArrayBuffer(source) {
  if (source instanceof ArrayBuffer) return source
  if (source instanceof Uint8Array) return source.buffer
  if (source instanceof Blob) return source.arrayBuffer()
  if (typeof source === 'string') {
    const res = await fetch(source)
    return res.arrayBuffer()
  }
  throw new Error('Unsupported source type')
}

/** Return a fresh Object-URL from a Uint8Array (PDF bytes) */
export function bytesToUrl(bytes) {
  const blob = new Blob([bytes], { type: 'application/pdf' })
  return URL.createObjectURL(blob)
}

/** Trigger a browser download */
export function downloadBlob(bytes, filename, mimeType = 'application/pdf') {
  const blob = new Blob([bytes], { type: mimeType })
  const url  = URL.createObjectURL(blob)
  const a    = Object.assign(document.createElement('a'), { href: url, download: filename })
  document.body.appendChild(a)
  a.click()
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url) }, 500)
}

// ── text ─────────────────────────────────────────────────────────────────────

/**
 * Add a text annotation to a specific page.
 * @param {string} sourceUrl  - object URL of the current PDF
 * @param {object} opts
 *   pageIndex   {number}   0-based page index
 *   text        {string}
 *   x           {number}   distance from left edge (pt)
 *   y           {number}   distance from bottom edge (pt)
 *   size        {number}   font size
 *   color       {string}   hex colour e.g. '#000000'
 *   bold        {boolean}
 */
export async function addText(sourceUrl, opts) {
  const { pageIndex = 0, text, x, y, size = 14, color = '#000000', bold = false } = opts
  const pdfDoc = await PDFDocument.load(await toArrayBuffer(sourceUrl))
  const font   = await pdfDoc.embedFont(bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica)
  const page   = pdfDoc.getPages()[pageIndex]
  const [r, g, b] = hexToRgb(color)
  page.drawText(text, { x, y, size, font, color: rgb(r, g, b) })
  return pdfDoc.save()
}

// ── image ─────────────────────────────────────────────────────────────────────

/**
 * Embed an image onto a page.
 * @param {string} sourceUrl
 * @param {object} opts
 *   pageIndex  {number}
 *   imgFile    {File}   PNG or JPEG
 *   x, y       {number}  position (pt from bottom-left)
 *   width, height {number} size in pt
 */
export async function addImage(sourceUrl, opts) {
  const { pageIndex = 0, imgFile, x = 50, y = 50, width = 200, height = 150 } = opts
  const pdfDoc  = await PDFDocument.load(await toArrayBuffer(sourceUrl))
  const imgBytes = await imgFile.arrayBuffer()
  const mime     = imgFile.type
  let embedded
  if (mime === 'image/png') embedded = await pdfDoc.embedPng(imgBytes)
  else                      embedded = await pdfDoc.embedJpg(imgBytes)
  pdfDoc.getPages()[pageIndex].drawImage(embedded, { x, y, width, height })
  return pdfDoc.save()
}

// ── draw (freehand) ───────────────────────────────────────────────────────────

/**
 * Flatten canvas strokes onto a page.
 * @param {string} sourceUrl
 * @param {object} opts
 *   pageIndex {number}
 *   pngDataUrl {string}  data URL from canvas
 *   pageWidth, pageHeight {number}  display dimensions
 */
export async function addDrawing(sourceUrl, opts) {
  const { pageIndex = 0, pngDataUrl, pageWidth, pageHeight } = opts
  const pdfDoc   = await PDFDocument.load(await toArrayBuffer(sourceUrl))
  const page     = pdfDoc.getPages()[pageIndex]
  const { width: pw, height: ph } = page.getSize()

  // Convert data URL → Uint8Array
  const base64  = pngDataUrl.split(',')[1]
  const binary  = atob(base64)
  const bytes   = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)

  const img = await pdfDoc.embedPng(bytes.buffer)
  page.drawImage(img, { x: 0, y: 0, width: pw, height: ph })
  return pdfDoc.save()
}

// ── compress ─────────────────────────────────────────────────────────────────

/** Re-save the PDF (removes redundant objects, re-serialises). */
export async function compressPdf(sourceUrl) {
  const pdfDoc = await PDFDocument.load(await toArrayBuffer(sourceUrl), { ignoreEncryption: true })
  return pdfDoc.save({ useObjectStreams: true })
}

// ── rotate ────────────────────────────────────────────────────────────────────

/**
 * Rotate specific pages.
 * @param {string} sourceUrl
 * @param {number[]} pageIndices  0-based; empty = all
 * @param {number}   angle        90 | 180 | 270
 */
export async function rotatePdf(sourceUrl, pageIndices, angle) {
  const pdfDoc = await PDFDocument.load(await toArrayBuffer(sourceUrl))
  const pages  = pdfDoc.getPages()
  const targets = pageIndices.length ? pageIndices : pages.map((_, i) => i)
  targets.forEach(i => {
    const page   = pages[i]
    const current = page.getRotation().angle
    page.setRotation(degrees((current + angle) % 360))
  })
  return pdfDoc.save()
}

// ── merge ─────────────────────────────────────────────────────────────────────

/**
 * Merge an ordered array of File objects into one PDF.
 * @param {File[]} files
 */
export async function mergePdfs(files) {
  const merged = await PDFDocument.create()
  for (const file of files) {
    const donor = await PDFDocument.load(await toArrayBuffer(file))
    const pages = await merged.copyPages(donor, donor.getPageIndices())
    pages.forEach(p => merged.addPage(p))
  }
  return merged.save()
}

// ── split ─────────────────────────────────────────────────────────────────────

/**
 * Split a PDF into ranges.
 * @param {string} sourceUrl
 * @param {Array<{start:number, end:number}>} ranges  1-based, inclusive
 * @returns {Promise<Array<{bytes:Uint8Array, name:string}>>}
 */
export async function splitPdf(sourceUrl, ranges) {
  const pdfDoc = await PDFDocument.load(await toArrayBuffer(sourceUrl))
  const total  = pdfDoc.getPageCount()
  const results = []
  for (const range of ranges) {
    const from  = Math.max(1, range.start) - 1
    const to    = Math.min(total, range.end) - 1
    const chunk = await PDFDocument.create()
    const copied = await chunk.copyPages(pdfDoc, Array.from({ length: to - from + 1 }, (_, i) => from + i))
    copied.forEach(p => chunk.addPage(p))
    results.push({ bytes: await chunk.save(), name: `split-pages-${range.start}-${range.end}.pdf` })
  }
  return results
}

// ── convert to image ──────────────────────────────────────────────────────────

/**
 * Render PDF pages to images via pdf.js.
 * @param {string} sourceUrl
 * @param {'jpeg'|'png'} format
 * @param {number} scale       1 = 72dpi, 2 = 144dpi, 3 = 216dpi
 * @param {number[]|null} pageIndices  null = all pages
 * @returns {Promise<Array<{dataUrl:string, pageNum:number}>>}
 */
export async function convertToImages(sourceUrl, format = 'jpeg', scale = 2, pageIndices = null) {
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist')
  GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url
  ).href

  const loadingTask = getDocument(sourceUrl)
  const pdf    = await loadingTask.promise
  const total  = pdf.numPages
  const targets = pageIndices?.length ? pageIndices : Array.from({ length: total }, (_, i) => i + 1)

  const results = []
  for (const pageNum of targets) {
    const page      = await pdf.getPage(pageNum)
    const viewport  = page.getViewport({ scale })
    const canvas    = document.createElement('canvas')
    canvas.width    = viewport.width
    canvas.height   = viewport.height
    const ctx       = canvas.getContext('2d')
    await page.render({ canvasContext: ctx, viewport }).promise
    const mimeType  = format === 'png' ? 'image/png' : 'image/jpeg'
    const quality   = format === 'jpeg' ? 0.92 : undefined
    results.push({ dataUrl: canvas.toDataURL(mimeType, quality), pageNum })
  }
  return results
}

// ── helpers ───────────────────────────────────────────────────────────────────

function hexToRgb(hex) {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16) / 255
  const g = parseInt(clean.slice(2, 4), 16) / 255
  const b = parseInt(clean.slice(4, 6), 16) / 255
  return [r, g, b]
}

// ── signature ─────────────────────────────────────────────────────────────────

/**
 * Embed a signature (PNG data URL or File) onto a page, preserving transparency.
 * @param {string} sourceUrl
 * @param {object} opts
 *   pageIndex  {number}
 *   pngDataUrl {string}   data URL (from canvas or typed sig render)
 *   imgFile    {File}     alternative: a File object (PNG preferred for transparency)
 *   x, y       {number}   position in PDF points (y from bottom)
 *   width, height {number}
 */
export async function addSignature(sourceUrl, opts) {
  const { pageIndex = 0, pngDataUrl, imgFile, x = 50, y = 50, width = 200, height = 80 } = opts
  const pdfDoc = await PDFDocument.load(await toArrayBuffer(sourceUrl))

  let pngBytes
  if (pngDataUrl) {
    // Convert data URL → Uint8Array
    const base64 = pngDataUrl.split(',')[1]
    const bin    = atob(base64)
    pngBytes     = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) pngBytes[i] = bin.charCodeAt(i)
  } else if (imgFile) {
    pngBytes = new Uint8Array(await imgFile.arrayBuffer())
  } else {
    throw new Error('addSignature: provide pngDataUrl or imgFile')
  }

  const embedded = await pdfDoc.embedPng(pngBytes.buffer ?? pngBytes)
  pdfDoc.getPages()[pageIndex].drawImage(embedded, { x, y, width, height })
  return pdfDoc.save()
}
