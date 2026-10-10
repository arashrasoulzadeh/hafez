import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { cleanTafsir, TAFSIR_NOTE, type Ghazal } from './types'
import Props from './Props'
import Candle from './Candle'

const W = 2.0, D = 2.8, PIVOT_Y = 0.45
const clamp = (x: number) => Math.min(1, Math.max(0, x))
const ease = (x: number) => x * x * (3 - 2 * x)

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
function coverTexture() {
  const c = document.createElement('canvas'); c.width = CW; c.height = CH
  const g = c.getContext('2d')!
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
function grainTexture() { // leather grain used as bump map
  const c = document.createElement('canvas'); c.width = c.height = 256
  const g = c.getContext('2d')!
  g.fillStyle = '#808080'; g.fillRect(0, 0, 256, 256)
  for (let i = 0; i < 9000; i++) { const v = 90 + Math.random() * 90; g.fillStyle = `rgb(${v},${v},${v})`; g.beginPath(); g.arc(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 2, 0, 7); g.fill() }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 5)
  return t
}
function endpaperTexture() { // marbled endpaper, visible on the inside of the open cover
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
const PW = 1024, PH = 1432, INK = '#2a1c10', ACCENT = '#854F0B'
function paper(k = 1) {
  const c = document.createElement('canvas'); c.width = PW * k; c.height = PH * k
  const x = c.getContext('2d')!
  x.scale(k, k)
  x.fillStyle = PAPER; x.fillRect(0, 0, PW, PH)
  for (let i = 0; i < 2500; i++) { x.fillStyle = `rgba(120,90,40,${Math.random() * 0.05})`; x.fillRect(Math.random() * PW, Math.random() * PH, 3, 3) }
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
function poemPage(g: Ghazal | null, rotate = false, k = 1) {
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
function plainPage() { // the flyleaf: nothing on it
  const c = document.createElement('canvas'); c.width = 512; c.height = 716
  const x = c.getContext('2d')!
  x.fillStyle = '#f3e9cc'; x.fillRect(0, 0, 512, 716)
  for (let i = 0; i < 1200; i++) { x.fillStyle = `rgba(120,90,40,${Math.random() * 0.04})`; x.fillRect(Math.random() * 512, Math.random() * 716, 2, 2) }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t
}
function tafsirPage(g: Ghazal | null) {
  const { c, x } = paper()
  if (g) {
    x.textAlign = 'right'
    const blocks: { t: string; label?: boolean }[] = []
    if (g.summary) blocks.push({ t: cleanTafsir(g.summary) })
    g.couplets.forEach((cp, i) => { if (cp.s) { blocks.push({ t: `بیت ${i + 1}`, label: true }); blocks.push({ t: cleanTafsir(cp.s) }) } })
    const layout = (fs: number) => {
      x.font = `${fs}px Vazirmatn, sans-serif`
      const out: { t: string; label?: boolean }[] = []
      for (const b of blocks) {
        if (b.label) { out.push(b); continue }
        let line = ''
        for (const w of b.t.split(' ')) { const tr = line ? `${line} ${w}` : w; if (x.measureText(tr).width > 840 && line) { out.push({ t: line }); line = w } else line = tr }
        if (line) out.push({ t: line })
      }
      return out
    }
    let fs = 36, rows = layout(fs)
    while (rows.length * fs * 1.75 > 1060 && fs > 22) { fs -= 2; rows = layout(fs) }
    const maxRows = Math.floor(1060 / (fs * 1.75))
    if (rows.length > maxRows) { rows = rows.slice(0, maxRows); rows[maxRows - 1] = { t: rows[maxRows - 1].t + ' …' } }
    x.textAlign = 'center'; shamse(x, PW / 2, 100, 30); x.fillStyle = ACCENT; x.font = '36px Vazirmatn, sans-serif'; x.fillText('تفسیر', PW / 2, 175)
    x.textAlign = 'right'; let y = 260
    for (const r of rows) {
      x.fillStyle = r.label ? ACCENT : INK; x.font = `${r.label ? fs - 4 : fs}px Vazirmatn, sans-serif`
      x.fillText(r.t, PW - 90, y); y += fs * 1.75
    }
  }
  if (g) { x.textAlign = 'center'; x.fillStyle = ACCENT; x.globalAlpha = 0.8; x.font = '24px Vazirmatn, sans-serif'; x.fillText(TAFSIR_NOTE, PW / 2, PH - 84, 860); x.globalAlpha = 1 }
  return finish(c, false)
}

function woodTexture() {
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
function edgeTexture() { // stacked page edges
  const c = document.createElement('canvas'); c.width = 64; c.height = 256
  const x = c.getContext('2d')!
  for (let y = 0; y < 256; y += 2) { x.fillStyle = y % 4 ? '#eadcb4' : '#cdb98a'; x.fillRect(0, y, 64, 2) }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace
  return t
}

function softTexture(rgb: string) {
  const c = document.createElement('canvas'); c.width = c.height = 128
  const x = c.getContext('2d')!, g = x.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, `rgba(${rgb},1)`); g.addColorStop(0.45, `rgba(${rgb},0.35)`); g.addColorStop(1, `rgba(${rgb},0)`)
  x.fillStyle = g; x.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(c)
}

// incense smoke curling up from the burner
function Smoke({ position }: { position: [number, number, number] }) {
  const tex = useMemo(() => softTexture('200,212,240'), [])
  const refs = useRef<(THREE.Sprite | null)[]>([])
  const seeds = useMemo(() => Array.from({ length: 16 }, (_, i) => ({ ph: i / 16, a: Math.random() * 6.28, sp: 0.8 + Math.random() * 0.6 })), [])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    seeds.forEach((sd, i) => {
      const sp = refs.current[i]; if (!sp) return
      const life = (t * 0.07 * sd.sp + sd.ph) % 1
      sp.position.set(Math.sin(life * 9 + sd.a) * 0.18 * life * 3, 0.15 + life * 3, Math.cos(life * 7 + sd.a) * 0.12 * life * 3)
      const sc = 0.25 + life * 1.3; sp.scale.set(sc, sc, 1)
      ;(sp.material as THREE.SpriteMaterial).opacity = Math.sin(Math.PI * life) * 0.2
    })
  })
  return (
    <group position={position}>
      <mesh position-y={0.05}><cylinderGeometry args={[0.16, 0.1, 0.1, 20]} /><meshStandardMaterial color="#b08d3a" metalness={0.7} roughness={0.35} /></mesh>
      <mesh position-y={0.16}><sphereGeometry args={[0.018, 8, 8]} /><meshBasicMaterial color="#ff6a3a" /></mesh>
      {seeds.map((_, i) => <sprite key={i} ref={el => { refs.current[i] = el }}><spriteMaterial map={tex} transparent depthWrite={false} opacity={0} color="#c8d4f0" /></sprite>)}
    </group>
  )
}

// A page that can curl: N segments along its width, rebuilt every frame from the hinge angle plus a lagging-tip bend.
const SEG = 16, LW = W - 0.06, LD = D - 0.08, TH = 0.0015, DY = 0.004
function makeLeafGeometry() {
  const g = new THREE.BufferGeometry(), n = (SEG + 1) * 2
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 2 * 3), 3))
  const uv = new Float32Array(n * 2 * 2), idx: number[] = []
  for (let k = 0; k <= SEG; k++) for (let j = 0; j < 2; j++) {
    const v = j === 0 ? 1 : 0, i = k * 2 + j, s = k / SEG
    uv.set([1 - s, v], i * 2); uv.set([s, v], (n + i) * 2)
  }
  for (let k = 0; k < SEG; k++) { const a = k * 2, b = a + 1, c = a + 2, d = a + 3; idx.push(a, b, c, b, d, c) }
  const nTop = idx.length
  for (let k = 0; k < SEG; k++) { const a = n + k * 2, b = a + 1, c = a + 2, d = a + 3; idx.push(a, c, b, b, c, d) }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx)
  g.addGroup(0, nTop, 0); g.addGroup(nTop, idx.length - nTop, 1)
  return g
}
function bendLeaf(g: THREE.BufferGeometry, hingeAngle: number, p: number, y0: number, xOff: number) {
  const pos = g.attributes.position as THREE.BufferAttribute, n = (SEG + 1) * 2
  const bend = 1.15 * Math.sin(Math.PI * p) // tip lags behind the hinge while the page travels
  // rigid rotation of the page's resting offset about the hinge
  let x = -y0 * Math.sin(hingeAngle) + xOff * 0, y = y0 * Math.cos(hingeAngle)
  const ds = LW / SEG
  for (let k = 0; k <= SEG; k++) {
    const s = k / SEG, a = hingeAngle + bend * Math.pow(s, 1.4)
    const tx = -Math.cos(a), ty = -Math.sin(a), nx = ty, ny = -tx
    for (let j = 0; j < 2; j++) {
      const z = (j === 0 ? -1 : 1) * LD / 2, i = k * 2 + j
      pos.setXYZ(i, x + nx * TH, y + ny * TH, z); pos.setXYZ(n + i, x - nx * TH, y - ny * TH, z)
    }
    x += tx * ds; y += ty * ds
  }
  pos.needsUpdate = true; g.computeVertexNormals(); g.computeBoundingSphere()
}

const MAXL = 20 // the book has between 8 and 20 leaves before the fal; unused ones are hidden
type Props = { pages: number; zoomOut: boolean; openRef: { current: number }; seed: number; page: 'poem' | 'tafsir'; ghazal: Ghazal | null; data: Ghazal[]; onFlip: () => void }

function Scene({ pages, zoomOut, openRef, seed, page, ghazal, data, onFlip }: Props) {
  const { camera, size } = useThree()
  const root = useRef<THREE.Group>(null)
  const parts = useRef<THREE.Group[]>([])
  const rightBlock = useRef<THREE.Mesh>(null)
  const rightBack = useRef<THREE.Mesh>(null)
  const rightGrp = useRef<THREE.Group>(null)
  const lamp = useRef<THREE.SpotLight>(null)
  const dust = useRef<THREE.Points>(null)
  const cover = useMemo(() => coverTexture(), [])
  const grain = useMemo(() => grainTexture(), [])
  const endpaper = useMemo(() => endpaperTexture(), [])
  useEffect(() => { document.fonts?.ready.then(() => { cover.image = coverTexture().image; cover.needsUpdate = true }) }, [cover])

  const [fontsOk, setFontsOk] = useState(false)
  useEffect(() => { Promise.all([document.fonts.load('27px "Noto Nastaliq Urdu"', 'حافظ'), document.fonts.load('20px Vazirmatn', 'حافظ')]).then(() => setFontsOk(true)).catch(() => setFontsOk(true)) }, [])
  const pool = useMemo(() => {
    const pick = () => (data.length ? data[Math.floor(Math.random() * data.length)] : null)
    return Array.from({ length: 10 }, () => poemPage(pick(), false, 0.4)) // low-res pages shared by the flipping leaves
  }, [data, fontsOk, seed])
  const poolMats = useMemo(() => pool.map(t => new THREE.MeshStandardMaterial({ map: t, roughness: 0.95, side: THREE.DoubleSide })), [pool])
  const leafPick = useMemo(() => Array.from({ length: MAXL }, () => [Math.floor(Math.random() * 10), Math.floor(Math.random() * 10)]), [seed])
  const plain = useMemo(() => plainPage(), [])
  const blank = useMemo(() => poemPage(null), [])
  const lastFront = useMemo(() => poemPage(data.length ? data[Math.floor(Math.random() * data.length)] : null), [data, fontsOk, seed])
  const finalPoem = useMemo(() => poemPage(ghazal), [ghazal, fontsOk])
  const finalTafsir = useMemo(() => tafsirPage(ghazal), [ghazal, fontsOk])
  useEffect(() => () => { pool.forEach(t => t.dispose()) }, [pool])
  useEffect(() => () => { poolMats.forEach(m => m.dispose()) }, [poolMats])
  useEffect(() => () => { lastFront.dispose() }, [lastFront])
  useEffect(() => () => { finalPoem.dispose() }, [finalPoem])
  useEffect(() => () => { finalTafsir.dispose() }, [finalTafsir])
  const prevP = useRef<number[]>([])
  const pagesRef = useRef(pages)
  pagesRef.current = pages
  const halo = useMemo(() => softTexture('217,164,65'), [])
  const leafGeo = useMemo(() => Array.from({ length: MAXL }, () => makeLeafGeometry()), [])
  const gl = useThree(st => st.gl), scene = useThree(st => st.scene)
  useEffect(() => {
    const pm = new THREE.PMREMGenerator(gl), env = pm.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = env; scene.environmentIntensity = 0.3
    return () => { scene.environment = null; env.dispose(); pm.dispose() }
  }, [gl, scene])
  const wood = useMemo(() => woodTexture(), [])
  const edge = useMemo(() => edgeTexture(), [])
  const spine = useRef<THREE.Group>(null)
  const sheets = useMemo(() => {
    const tex = Array.from({ length: 8 }, () => poemPage(data.length ? data[Math.floor(Math.random() * data.length)] : null, false, 0.5))
    return Array.from({ length: 26 }, (_, i) => ({ tex: tex[i % 8], x: (Math.random() - 0.5) * 12, z: -1.9 - Math.random() * 2.9, r: (Math.random() - 0.5) * 1.3, s: 0.85 + Math.random() * 0.35 }))
  }, [data, fontsOk])

  const dustGeo = useMemo(() => {
    const n = 120, a = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) { a[i * 3] = (Math.random() - .5) * 8; a[i * 3 + 1] = Math.random() * 4; a[i * 3 + 2] = (Math.random() - .5) * 6 }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(a, 3)); return g
  }, [])

  const cur = useRef({ x: 0, y: 3.2, z: 3.8, lx: 0, zf: 1 })
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime
    const open = openRef.current
    // flip: cover first, then the active leaves (the lowest `n` of the stack), staggered across the opening
    const n = pagesRef.current, FD = 0.12, ST = (0.97 - 0.18 - FD) / Math.max(1, n - 1)
    const p = [clamp(open / 0.2), ...Array.from({ length: MAXL }, (_, i) => { const j = i - (MAXL - n); return j < 0 ? 0 : clamp((open - 0.18 - j * ST) / FD) })]
    parts.current.forEach((g, i) => {
      if (!g) return
      const ang = -Math.PI * ease(p[i]) * (i ? 0.998 : 1)
      if (i === 0) g.rotation.z = ang
      else if (p[i] !== prevP.current[i] || prevP.current[i] === undefined) bendLeaf(leafGeo[i - 1], ang, ease(p[i]), 0.025 + (MAXL - i) * DY, 0)
      const pr = prevP.current[i] ?? 0
      if ((pr < 0.04 && p[i] >= 0.04) || (pr > 0.96 && p[i] <= 0.96)) onFlip()
      prevP.current[i] = p[i]
    })
    const o = ease(open)
    if (root.current) root.current.position.x = (1 - o) * W / 2
    if (rightBlock.current) {
      const top = PIVOT_Y - (0.025 + n * DY + 0.03 + 0.02) - 0.005, h = top - 0.04
      rightBlock.current.scale.y = Math.max(0.001, h * o); rightBlock.current.position.y = 0.04 + (h * o) / 2
    }
    if (rightGrp.current) { const a0 = parts.current[0]?.rotation.z ?? 0; rightGrp.current.scale.x = a0 < -Math.PI / 2 ? Math.max(0.0001, -Math.cos(a0)) : 0.0001 }
    if (spine.current) spine.current.scale.y = 1 - 0.82 * o
    // candle flicker + dust drift
    const fl = 1 + 0.14 * Math.sin(t * 11.3) + 0.09 * Math.sin(t * 27.1 + 1.3) + 0.06 * Math.sin(t * 47.9 + 0.4) + (Math.random() - 0.5) * 0.06
    if (lamp.current) lamp.current.intensity = 95 * (0.94 + 0.06 * fl)
    if (dust.current) { dust.current.rotation.y = t * 0.02; dust.current.position.y = Math.sin(t * 0.3) * 0.15 }
    // responsive camera, blended continuously from the closed three-quarter view to the open top-down view
    const c0 = cur.current
    const aspect = size.width / size.height, portrait = aspect < 0.9
    const dc = Math.max(5.2, 4.2 / aspect)
    const dO = portrait ? Math.max(4.2, 3.3 / aspect) : Math.max(5.2, 8.4 / aspect)
    const m = ease(clamp(open / 0.35))
    const lx = portrait && open > 0.5 && !zoomOut ? (page === 'poem' ? W / 2 : -W / 2) : 0
    const zf = zoomOut ? 2.7 : 1
    const ty = (dc * 0.62 * (1 - m) + dO * 0.93 * m) * c0.zf, tz = (dc * 0.78 * (1 - m) + dO * 0.37 * m) * c0.zf, tx = zoomOut ? 0 : lx
    const k = 1 - Math.exp(-dt * 2.5), c = cur.current
    c.zf += (zf - c.zf) * k
    c.x += (tx - c.x) * k; c.y += (ty - c.y) * k; c.z += (tz - c.z) * k; c.lx += (lx - c.lx) * k
    camera.position.set(c.x + Math.sin(t * 0.2) * 0.12, c.y, c.z)
    camera.lookAt(c.lx, 0.3, 0)
  })

  const leafMat = <meshStandardMaterial color="#efe3c2" roughness={0.9} />
  const pageBlockMat = <meshStandardMaterial color="#e6d6ae" roughness={1} />
  return (
    <>
      <color attach="background" args={['#071326']} />
      <fog attach="fog" args={['#071326', 20, 48]} />
      <hemisphereLight args={['#6f86c8', '#3a2418', 0.5]} />
      <directionalLight position={[-5, 4, -4]} intensity={0.45} color="#7f95e0" />
      <directionalLight position={[3, 5, 7]} intensity={0.18} color="#ffd9b0" />
      <spotLight ref={lamp} position={[0.8, 5.6, 2.4]} angle={0.75} penumbra={1} color="#ffd2a0" intensity={95} distance={22} decay={2} castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0003} shadow-radius={6} />
      <Candle position={[3.6, 0.05, -2.3]} />
      <Candle position={[-3.4, 0.05, -3.3]} phase={2.1} height={0.45} />

      <mesh rotation-x={-Math.PI / 2} receiveShadow><planeGeometry args={[40, 40]} /><meshStandardMaterial map={wood} roughness={0.75} /></mesh>
      {sheets.map((sh, i) => (
        <mesh key={i} position={[sh.x, 0.004 + i * 0.0016, sh.z]} rotation={[-Math.PI / 2, 0, sh.r]} scale={sh.s} receiveShadow>
          <planeGeometry args={[1.25, 1.75]} /><meshStandardMaterial map={sh.tex} roughness={0.95} />
        </mesh>
      ))}

      <mesh rotation-x={-Math.PI / 2} position-y={0.05}><planeGeometry args={[11, 11]} /><meshBasicMaterial map={halo} transparent opacity={0.28} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
      <Props labels={zoomOut} />
      <Smoke position={[-3.5, 0.05, -2.0]} />

      <group ref={root}>
        <mesh position={[-W / 2, 0.02, 0]} castShadow><boxGeometry args={[W, 0.04, D]} /><meshStandardMaterial color="#1a2f5c" roughness={0.6} /></mesh>
        <mesh position={[-W / 2, 0.255, 0]} castShadow><boxGeometry args={[W - 0.06, 0.43, D - 0.08]} />
          {[0, 3].map(k => <meshStandardMaterial key={k} attach={`material-${k}`} color="#e6d6ae" roughness={1} />)}
          {[1, 4, 5].map(k => <meshStandardMaterial key={k} attach={`material-${k}`} map={edge} roughness={1} />)}
          <meshStandardMaterial attach="material-2" map={ghazal ? finalTafsir : blank} roughness={1} />
        </mesh>
        <group ref={spine}>
          <mesh position={[0.02, 0.255, 0]}><boxGeometry args={[0.06, 0.5, D]} /><meshStandardMaterial color="#1a2f5c" roughness={0.5} /></mesh>
          {[-1.15, -0.58, 0, 0.58, 1.15].map(z => <mesh key={z} position={[0.05, 0.255, z]}><boxGeometry args={[0.025, 0.52, 0.06]} /><meshStandardMaterial color="#d9a441" metalness={0.75} roughness={0.3} /></mesh>)}
        </group>
        <mesh position={[-0.2, 0.455, D / 2 + 0.05]}><boxGeometry args={[0.07, 0.004, 0.55]} /><meshStandardMaterial color="#8b1d2c" roughness={0.7} /></mesh>

        <group ref={rightGrp} scale-x={0.0001}>
        <mesh ref={rightBack} position={[W / 2, 0.02, 0]}><boxGeometry args={[W, 0.04, D]} /><meshStandardMaterial color="#1a2f5c" roughness={0.6} /></mesh>
        <mesh ref={rightBlock} position={[W / 2, 0.04, 0]} scale-y={0.001}><boxGeometry args={[W - 0.06, 1, D - 0.08]} />{pageBlockMat}</mesh>
        </group>

        {Array.from({ length: MAXL + 1 }, (_, i) => i).map(i => (
          <group key={i} ref={el => { if (el) parts.current[i] = el }} position={[0, PIVOT_Y, 0]} visible={i === 0 || i > MAXL - pages}>
            {i === 0 ? (
              <mesh position={[-W / 2, 0.025 + pages * DY + 0.03, 0]} castShadow>
                <boxGeometry args={[W, 0.04, D]} />
                {[0, 1].map(k => <meshStandardMaterial key={k} attach={`material-${k}`} color="#1a2f5c" roughness={0.6} />)}
                <meshStandardMaterial attach="material-2" map={cover} bumpMap={grain} bumpScale={0.9} roughness={0.42} metalness={0.3} />
                <meshStandardMaterial attach="material-3" map={endpaper} roughness={0.9} />
                {[4, 5].map(k => <meshStandardMaterial key={k} attach={`material-${k}`} color="#1a2f5c" />)}
              </mesh>
            ) : (
              <mesh geometry={leafGeo[i - 1]} position-x={-0.01} frustumCulled={false}>
                {i === MAXL ? (
                  <>
                    <meshStandardMaterial attach="material-0" map={lastFront} roughness={0.95} side={THREE.DoubleSide} />
                    <meshStandardMaterial attach="material-1" map={finalPoem} roughness={0.95} side={THREE.DoubleSide} />
                  </>
                ) : i === MAXL - pages + 1 ? (
                  <>
                    <meshStandardMaterial attach="material-0" map={plain} roughness={0.95} side={THREE.DoubleSide} />
                    <meshStandardMaterial attach="material-1" map={plain} roughness={0.95} side={THREE.DoubleSide} />
                  </>
                ) : (
                  <>
                    <primitive object={poolMats[leafPick[i - 1][0]]} attach="material-0" />
                    <primitive object={poolMats[leafPick[i - 1][1]]} attach="material-1" />
                  </>
                )}
              </mesh>
            )}
          </group>
        ))}

      </group>

      <points ref={dust} geometry={dustGeo}><pointsMaterial color="#d9a441" size={0.025} transparent opacity={0.55} depthWrite={false} /></points>
    </>
  )
}

export default function Book3D(props: Props) {
  return (
    <Canvas shadows dpr={[1, 1.5]} camera={{ fov: 40, near: 0.1, far: 60, position: [0, 3.2, 3.8] }} onCreated={({ gl }) => { gl.toneMappingExposure = 1.05 }} style={{ position: 'fixed', inset: 0, direction: 'ltr' }}>
      <Scene {...props} />
    </Canvas>
  )
}
