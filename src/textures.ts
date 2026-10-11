import * as THREE from 'three'
import { cleanTafsir, TAFSIR_NOTE, type Ghazal } from './types'

export const QUALITY = 1 // full-size page and cover canvases on every device: phones need the sharpness most
const TOUCH = window.matchMedia('(pointer: coarse)').matches
const TAFSIR_Q = TOUCH ? 1 : 1.5 // small type on a big desktop page: 1536 px wide so it stays crisp at retina size
export const POEM_Q = TOUCH ? 1 : 1.25

// Textures shared by many objects are built once
const cache = new Map<string, THREE.Texture>()
export const clearTextureCache = () => cache.clear() // after a lost WebGL context the released canvases must be redrawn
export const once = (key: string, make: () => THREE.Texture) => {
  let t = cache.get(key)
  if (!t) { t = make(); cache.set(key, t) }
  return t
}

// Grey noise used as a bump map on paper, brass, wood and cloth
export function noiseTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128
  const g = c.getContext('2d')!
  g.fillStyle = '#808080'; g.fillRect(0, 0, 128, 128)
  for (let i = 0; i < 3500; i++) { const v = 100 + Math.random() * 60; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(Math.random() * 128, Math.random() * 128, 1 + Math.random() * 2, 1 + Math.random() * 2) }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3)
  return t
}

// Turquoise glazed tile with a gold star-and-lattice pattern, for the dome of the Hafezieh
export function kashiTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256
  const g = c.getContext('2d')!
  g.fillStyle = '#17808f'; g.fillRect(0, 0, 256, 256)
  g.strokeStyle = '#e9d9a0'; g.lineWidth = 3
  for (let i = 0; i < 2; i++) { g.save(); g.translate(128, 128); g.rotate(i * Math.PI / 4); g.strokeRect(-64, -64, 128, 128); g.restore() }
  g.beginPath(); g.arc(128, 128, 30, 0, 7); g.stroke()
  g.strokeStyle = '#0d4c6b'; g.lineWidth = 6; g.strokeRect(0, 0, 256, 256)
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(8, 3); t.anisotropy = 8
  return t
}

// Sun-baked brick / limestone for the gate and the tomb steps
export function stoneTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128
  const g = c.getContext('2d')!
  g.fillStyle = '#c9a46a'; g.fillRect(0, 0, 128, 128)
  for (let i = 0; i < 1800; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '90,60,30' : '255,235,190'},${Math.random() * 0.12})`; g.fillRect(Math.random() * 128, Math.random() * 128, 2, 2) }
  g.strokeStyle = 'rgba(80,50,25,0.45)'; g.lineWidth = 2
  for (let y = 0; y < 128; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(128, y); g.stroke(); for (let x = (y / 32) % 2 ? 0 : 32; x < 128; x += 64) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 32); g.stroke() } }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping
  return t
}

const CW = 1024, CH = 1432
function goldFill(g: CanvasRenderingContext2D, y0 = 0, y1 = CH) {
  const gr = g.createLinearGradient(0, y0, 0, y1)
  gr.addColorStop(0, '#f3d98a'); gr.addColorStop(0.5, '#c9962f'); gr.addColorStop(1, '#8f651a')
  return gr
}
function lobed(g: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, lobes: number, depth: number) {
  g.beginPath()
  for (let i = 0; i <= 180; i++) {
    const t = (i / 180) * Math.PI * 2, k = 1 + depth * Math.cos(lobes * t)
    const x = cx + Math.cos(t) * rx * k, y = cy + Math.sin(t) * ry * k
    i ? g.lineTo(x, y) : g.moveTo(x, y)
  }
  g.closePath()
}
function lens(g: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number, up: boolean) {
  const d = up ? -1 : 1
  g.beginPath(); g.moveTo(cx - w, cy); g.quadraticCurveTo(cx - w * 0.3, cy + d * h * 0.5, cx, cy + d * h)
  g.quadraticCurveTo(cx + w * 0.3, cy + d * h * 0.5, cx + w, cy); g.closePath()
}
export function coverTexture() {
  const c = document.createElement('canvas'); c.width = CW * QUALITY; c.height = CH * QUALITY
  const g = c.getContext('2d')!
  g.scale(QUALITY, QUALITY)
  const bg = g.createRadialGradient(CW / 2, CH / 2, 100, CW / 2, CH / 2, CH * 0.75)
  bg.addColorStop(0, '#1d4a80'); bg.addColorStop(1, '#0c2147')
  g.fillStyle = bg; g.fillRect(0, 0, CW, CH)
  for (let i = 0; i < 14000; i++) { g.fillStyle = Math.random() < 0.5 ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.035)'; g.fillRect(Math.random() * CW, Math.random() * CH, 2 + Math.random() * 3, 2) }
  const gold = goldFill(g)
  g.strokeStyle = gold; g.fillStyle = gold
  // triple frame
  g.lineWidth = 12; g.strokeRect(46, 46, CW - 92, CH - 92)
  g.lineWidth = 4; g.strokeRect(74, 74, CW - 148, CH - 148)
  g.lineWidth = 3; g.strokeRect(96, 96, CW - 192, CH - 192)
  for (let x = 120; x < CW - 120; x += 26) { g.fillRect(x, 85 - 2, 4, 4); g.fillRect(x, CH - 85 - 2, 4, 4) }
  for (let y = 120; y < CH - 120; y += 26) { g.fillRect(85 - 2, y, 4, 4); g.fillRect(CW - 85 - 2, y, 4, 4) }
  // quarter medallions in the corners
  for (const [cx, cy] of [[96, 96], [CW - 96, 96], [96, CH - 96], [CW - 96, CH - 96]]) {
    g.save(); g.beginPath(); g.rect(cx < CW / 2 ? 96 : CW - 96 - 220, cy < CH / 2 ? 96 : CH - 96 - 220, 220, 220); g.clip()
    lobed(g, cx, cy, 190, 190, 12, 0.05); g.fillStyle = 'rgba(217,164,65,0.12)'; g.fill(); g.lineWidth = 5; g.stroke()
    lobed(g, cx, cy, 150, 150, 12, 0.05); g.lineWidth = 2.5; g.stroke(); g.restore()
  }
  // central medallion (tarang) with pendants
  const cx = CW / 2, cy = CH / 2
  for (const up of [true, false]) { lens(g, cx, cy + (up ? -300 : 300), 70, 190, up); g.fillStyle = 'rgba(217,164,65,0.18)'; g.fill(); g.lineWidth = 5; g.stroke() }
  lobed(g, cx, cy, 300, 400, 16, 0.045); g.fillStyle = '#0f3158'; g.fill(); g.lineWidth = 9; g.stroke()
  lobed(g, cx, cy, 262, 360, 16, 0.04); g.lineWidth = 3; g.stroke()
  g.save(); g.translate(cx, cy); g.lineWidth = 2.5
  for (let r = 0; r < 2; r++) { g.rotate(Math.PI / 8); g.beginPath(); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 - Math.PI / 2; g.lineTo(Math.cos(a) * 245, Math.sin(a) * 340); const b2 = a + Math.PI / 8; g.lineTo(Math.cos(b2) * 120, Math.sin(b2) * 166) } g.closePath(); g.globalAlpha = 0.55; g.stroke(); g.globalAlpha = 1 }
  for (let i = 0; i < 12; i++) { g.rotate(Math.PI / 6); g.beginPath(); g.ellipse(0, -150, 26, 62, 0, 0, Math.PI * 2); g.globalAlpha = 0.5; g.stroke(); g.globalAlpha = 1 }
  g.restore()
  g.fillStyle = gold
  for (let i = 0; i < 28; i++) { const t = (i / 28) * Math.PI * 2; g.beginPath(); g.arc(cx + Math.cos(t) * 340, cy + Math.sin(t) * 445, 6, 0, 7); g.fill() }
  g.textAlign = 'center'; g.direction = 'rtl'
  g.font = '190px "Noto Nastaliq Urdu", serif'
  g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillText('حافظ', cx + 5, cy + 30 + 6); g.fillStyle = gold; g.fillText('حافظ', cx, cy + 30)
  g.font = '50px Vazirmatn, sans-serif'; g.fillStyle = gold; g.fillText('دیوان لسان‌الغیب', cx, cy + 150)
  g.font = '34px Vazirmatn, sans-serif'; g.globalAlpha = 0.85; g.fillText('خواجه شمس‌الدین محمد شیرازی', cx, cy + 215); g.globalAlpha = 1
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8
  return t
}
export function grainTexture() { // leather grain used as bump map
  const c = document.createElement('canvas'); c.width = c.height = 256
  const g = c.getContext('2d')!
  g.fillStyle = '#808080'; g.fillRect(0, 0, 256, 256)
  for (let i = 0; i < 9000; i++) { const v = 90 + Math.random() * 90; g.fillStyle = `rgb(${v},${v},${v})`; g.beginPath(); g.arc(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 2, 0, 7); g.fill() }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 5)
  return t
}
export function endpaperTexture() { // marbled endpaper, visible on the inside of the open cover
  const c = document.createElement('canvas'); c.width = 512; c.height = 716
  const g = c.getContext('2d')!
  g.fillStyle = '#e9dcb8'; g.fillRect(0, 0, 512, 716)
  const cols = ['#1f3a6e', '#8b2b3a', '#c9962f', '#2a7a7a']
  for (let i = 0; i < 70; i++) {
    g.strokeStyle = cols[i % 4]; g.globalAlpha = 0.28; g.lineWidth = 2 + Math.random() * 4
    g.beginPath(); const y = Math.random() * 716; g.moveTo(-10, y)
    for (let x = 0; x <= 530; x += 40) g.lineTo(x, y + Math.sin(x / 60 + i) * 26 + Math.cos(x / 23 + i * 2) * 8)
    g.stroke()
  }
  g.globalAlpha = 1; g.strokeStyle = '#c9962f'; g.lineWidth = 4; g.strokeRect(20, 20, 472, 676)
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t
}

const PAPER = '#efe3c2'
const PW = 1024, PH = 1432, INK = '#1d130a', ACCENT = '#7a4709'
let paperBase: HTMLCanvasElement | null = null // paper colour + fibres, drawn once at half size and reused by every page
function basePaper() {
  if (paperBase) return paperBase
  const c = document.createElement('canvas'); c.width = PW / 2; c.height = PH / 2
  const x = c.getContext('2d')!
  x.fillStyle = PAPER; x.fillRect(0, 0, c.width, c.height)
  for (let i = 0; i < 1400; i++) { x.fillStyle = `rgba(120,90,40,${Math.random() * 0.05})`; x.fillRect(Math.random() * c.width, Math.random() * c.height, 2, 2) }
  return (paperBase = c)
}
function paper(k = 1) {
  const c = document.createElement('canvas'); c.width = PW * k; c.height = PH * k
  const x = c.getContext('2d')!
  x.scale(k, k)
  x.drawImage(basePaper(), 0, 0, PW, PH)
  x.strokeStyle = 'rgba(133,79,11,0.55)'; x.lineWidth = 3; x.strokeRect(46, 46, PW - 92, PH - 92)
  x.lineWidth = 1.5; x.strokeRect(58, 58, PW - 116, PH - 116)
  x.direction = 'rtl'; x.textAlign = 'center'
  return { c, x }
}
function shamse(x: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  x.save(); x.translate(cx, cy); x.strokeStyle = ACCENT; x.fillStyle = ACCENT; x.lineWidth = 2
  for (let i = 0; i < 8; i++) { x.rotate(Math.PI / 4); x.beginPath(); x.ellipse(0, -r * 0.62, r * 0.2, r * 0.38, 0, 0, Math.PI * 2); x.stroke() }
  x.beginPath(); x.arc(0, 0, r * 0.2, 0, Math.PI * 2); x.fill(); x.restore()
}
function finish(c: HTMLCanvasElement, rotate: boolean) {
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8
  if (rotate) { t.center.set(0.5, 0.5); t.rotation = Math.PI } // back faces are seen upside down once flipped
  return t
}
export function poemPage(g: Ghazal | null, rotate = false, k = POEM_Q) {
  const { c, x } = paper(k)
  if (g) {
    const rows = g.couplets.slice(0, 16)
    shamse(x, PW / 2, 100, 30)
    x.fillStyle = ACCENT; x.font = '36px Vazirmatn, sans-serif'; x.fillText(g.title, PW / 2, 175)
    // hemistich beside hemistich: first on the right, second on the left; font fitted to the column width
    const COL = 420, base = 100
    x.font = `${base}px "Noto Nastaliq Urdu", serif`
    const widest = Math.max(1, ...rows.flatMap(cp => cp.v.map(l => x.measureText(l).width)))
    const fs = Math.min(56, (COL / widest) * base)
    const lh = Math.min(fs * 3.3, 1000 / Math.max(rows.length, 1)), top = 255 + (1000 - rows.length * lh) / 2 + lh * 0.4
    x.fillStyle = INK; x.font = `${Math.round(fs)}px "Noto Nastaliq Urdu", serif`
    const right = PW - 72 - COL / 2, left = 72 + COL / 2
    rows.forEach((cp, i) => {
      const y = top + i * lh
      x.fillText(cp.v[0], right, y, COL)
      if (cp.v[1]) x.fillText(cp.v[1], left, y, COL)
      x.fillStyle = ACCENT; x.beginPath(); x.arc(PW / 2, y - fs * 0.3, 3, 0, Math.PI * 2); x.fill(); x.fillStyle = INK
    })
  }
  return finish(c, rotate)
}
export function plainPage() { // the flyleaf: nothing on it
  const c = document.createElement('canvas'); c.width = 512; c.height = 716
  const x = c.getContext('2d')!
  x.fillStyle = '#f3e9cc'; x.fillRect(0, 0, 512, 716)
  for (let i = 0; i < 1200; i++) { x.fillStyle = `rgba(120,90,40,${Math.random() * 0.04})`; x.fillRect(Math.random() * 512, Math.random() * 716, 2, 2) }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t
}
export function tafsirPage(g: Ghazal | null) {
  const { c, x } = paper(TAFSIR_Q)
  if (g) {
    x.textAlign = 'right'
    const wrap = (t: string, fs: number) => {
      x.font = `500 ${fs}px Vazirmatn, sans-serif`
      const out: string[] = []; let line = ''
      for (const w of t.split(' ')) { const tr = line ? `${line} ${w}` : w; if (x.measureText(tr).width > 850 && line) { out.push(line); line = w } else line = tr }
      if (line) out.push(line)
      return out
    }
    // The page carries the overall interpretation at the largest size that fits, then as many bayt notes as there is room for;
    // the full bayt-by-bayt text is in the reading sheet. Big type matters more here than completeness.
    const summary = g.summary ? cleanTafsir(g.summary) : ''
    let fs = 40
    for (const f of [42, 38, 35, 32, 30]) { fs = f; if (!summary || wrap(summary, f).length * f * 1.7 <= 840) break }
    const lh = fs * 1.7, top = 255, bottom = PH - 140
    let y = top
    const draw = (t: string, color: string, size = fs) => { x.fillStyle = color; x.font = `500 ${size}px Vazirmatn, sans-serif`; x.fillText(t, PW - 85, y); y += lh * (size / fs) }
    if (summary) for (const l of wrap(summary, fs)) { if (y > bottom) break; draw(l, INK) }
    let cut = false
    for (let i = 0; i < g.couplets.length && !cut; i++) {
      const s2 = g.couplets[i].s; if (!s2) continue
      const rows = wrap(cleanTafsir(s2), fs)
      if (y + lh * 0.6 + rows.length * lh > bottom) { cut = true; break }
      y += lh * 0.25; draw(`بیت ${i + 1}`, ACCENT, fs - 6)
      for (const l of rows) draw(l, INK)
    }
    if (cut || y > bottom) { x.textAlign = 'center'; x.fillStyle = ACCENT; x.font = `500 ${fs - 6}px Vazirmatn, sans-serif`; x.fillText('ادامه و تفسیر هر بیت: دکمه «خواندن»', PW / 2, PH - 150) }
    x.textAlign = 'center'; shamse(x, PW / 2, 100, 30); x.fillStyle = ACCENT; x.font = '500 38px Vazirmatn, sans-serif'; x.fillText('تفسیر', PW / 2, 175)
  }
  if (g) { x.textAlign = 'center'; x.fillStyle = ACCENT; x.globalAlpha = 0.8; x.font = '24px Vazirmatn, sans-serif'; x.fillText(TAFSIR_NOTE, PW / 2, PH - 84, 860); x.globalAlpha = 1 }
  return finish(c, false)
}

export function woodTexture() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 1024
  const x = c.getContext('2d')!
  x.fillStyle = '#3a2315'; x.fillRect(0, 0, 1024, 1024)
  for (let i = 0; i < 260; i++) {
    const y = Math.random() * 1024, a = Math.random() * 0.25
    x.strokeStyle = Math.random() < 0.5 ? `rgba(15,8,4,${a})` : `rgba(120,76,40,${a * 0.7})`; x.lineWidth = 1 + Math.random() * 3
    x.beginPath(); x.moveTo(0, y)
    for (let px = 0; px <= 1024; px += 64) x.lineTo(px, y + Math.sin(px / 150 + i) * 6)
    x.stroke()
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 6); t.anisotropy = 8
  return t
}
export function edgeTexture() { // stacked page edges
  const c = document.createElement('canvas'); c.width = 64; c.height = 256
  const x = c.getContext('2d')!
  for (let y = 0; y < 256; y += 2) { x.fillStyle = y % 4 ? '#eadcb4' : '#cdb98a'; x.fillRect(0, y, 64, 2) }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace
  return t
}

export function softTexture(rgb: string) {
  const c = document.createElement('canvas'); c.width = c.height = 128
  const x = c.getContext('2d')!, g = x.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, `rgba(${rgb},1)`); g.addColorStop(0.45, `rgba(${rgb},0.35)`); g.addColorStop(1, `rgba(${rgb},0)`)
  x.fillStyle = g; x.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(c)
}
