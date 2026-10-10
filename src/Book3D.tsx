import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { Ghazal } from './types'
import Props from './Props'

const W = 2.0, D = 2.8, PIVOT_Y = 0.45
const clamp = (x: number) => Math.min(1, Math.max(0, x))
const ease = (x: number) => x * x * (3 - 2 * x)

function coverTexture() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 716
  const g = c.getContext('2d')!
  g.fillStyle = '#1f3a6e'; g.fillRect(0, 0, 512, 716)
  g.strokeStyle = '#d9a441'; g.lineWidth = 6; g.strokeRect(24, 24, 464, 668)
  g.lineWidth = 2; g.strokeRect(40, 40, 432, 636)
  g.beginPath(); g.ellipse(256, 358, 150, 210, 0, 0, Math.PI * 2); g.lineWidth = 4; g.stroke()
  g.beginPath(); g.ellipse(256, 358, 128, 186, 0, 0, Math.PI * 2); g.lineWidth = 2; g.stroke()
  g.save(); g.translate(256, 358); g.strokeStyle = 'rgba(217,164,65,0.4)'; g.lineWidth = 2
  for (let r = 0; r < 2; r++) { g.rotate(Math.PI / 8 * r); g.beginPath(); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 - Math.PI / 2; g.lineTo(Math.cos(a) * 125, Math.sin(a) * 175); const b2 = a + Math.PI / 8; g.lineTo(Math.cos(b2) * 62, Math.sin(b2) * 88) } g.closePath(); g.stroke() }
  g.restore()
  for (let i = 0; i < 16; i++) { // ornament petals around the medallion
    const a = (i / 16) * Math.PI * 2
    g.beginPath(); g.arc(256 + Math.cos(a) * 170, 358 + Math.sin(a) * 230, 7, 0, Math.PI * 2); g.fillStyle = '#d9a441'; g.fill()
  }
  for (const [cx, cy, sx, sy] of [[40, 40, 1, 1], [472, 40, -1, 1], [40, 676, 1, -1], [472, 676, -1, -1]]) {
    g.beginPath(); g.arc(cx, cy, 70, 0, Math.PI / 2); g.save(); g.translate(cx, cy); g.scale(sx, sy); g.restore()
    g.save(); g.translate(cx, cy); g.scale(sx, sy); g.beginPath(); g.arc(0, 0, 76, 0, Math.PI / 2); g.lineWidth = 3; g.stroke(); g.beginPath(); g.arc(0, 0, 52, 0, Math.PI / 2); g.lineWidth = 2; g.stroke(); g.restore()
  }
  g.fillStyle = '#d9a441'; g.textAlign = 'center'
  g.font = '64px "Noto Nastaliq Urdu", serif'; g.fillText('حافظ', 256, 350)
  g.font = '26px Vazirmatn, sans-serif'; g.fillText('دیوان لسان‌الغیب', 256, 430)
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8
  return t
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
    const COL = 390, base = 100
    x.font = `${base}px "Noto Nastaliq Urdu", serif`
    const widest = Math.max(1, ...rows.flatMap(cp => cp.v.map(l => x.measureText(l).width)))
    const fs = Math.min(50, (COL / widest) * base)
    const lh = Math.min(fs * 2.4, 1000 / Math.max(rows.length, 1))
    x.fillStyle = INK; x.font = `${Math.round(fs)}px "Noto Nastaliq Urdu", serif`
    const right = PW - 100 - COL / 2, left = 100 + COL / 2
    rows.forEach((cp, i) => {
      const y = 280 + i * lh
      x.fillText(cp.v[0], right, y, COL)
      if (cp.v[1]) x.fillText(cp.v[1], left, y, COL)
      x.fillStyle = ACCENT; x.beginPath(); x.arc(PW / 2, y - fs * 0.3, 3, 0, Math.PI * 2); x.fill(); x.fillStyle = INK
    })
  }
  return finish(c, rotate)
}
function tafsirPage(g: Ghazal | null) {
  const { c, x } = paper()
  if (g) {
    x.textAlign = 'right'
    const blocks: { t: string; label?: boolean }[] = []
    if (g.summary) blocks.push({ t: g.summary })
    g.couplets.forEach((cp, i) => { if (cp.s) { blocks.push({ t: `بیت ${i + 1}`, label: true }); blocks.push({ t: cp.s.replace(/\s+/g, ' ') }) } })
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
const SEG = 16, LW = W - 0.06, LD = D - 0.08, TH = 0.003
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

const LEAVES = 6
type Props = { zoomOut: boolean; openRef: { current: number }; seed: number; page: 'poem' | 'tafsir'; ghazal: Ghazal | null; data: Ghazal[]; onFlip: () => void }

function Scene({ zoomOut, openRef, seed, page, ghazal, data, onFlip }: Props) {
  const { camera, size } = useThree()
  const root = useRef<THREE.Group>(null)
  const parts = useRef<THREE.Group[]>([])
  const rightBlock = useRef<THREE.Mesh>(null)
  const rightBack = useRef<THREE.Mesh>(null)
  const rightGrp = useRef<THREE.Group>(null)
  const flame = useRef<THREE.PointLight>(null)
  const lamp = useRef<THREE.PointLight>(null)
  const dust = useRef<THREE.Points>(null)
  const cover = useMemo(() => coverTexture(), [])
  useEffect(() => { document.fonts?.ready.then(() => { cover.image = coverTexture().image; cover.needsUpdate = true }) }, [cover])

  const [fontsOk, setFontsOk] = useState(false)
  useEffect(() => { Promise.all([document.fonts.load('27px "Noto Nastaliq Urdu"', 'حافظ'), document.fonts.load('20px Vazirmatn', 'حافظ')]).then(() => setFontsOk(true)).catch(() => setFontsOk(true)) }, [])
  const leafTex = useMemo(() => {
    const pick = () => (data.length ? data[Math.floor(Math.random() * data.length)] : null)
    return Array.from({ length: LEAVES - 1 }, () => ({ front: poemPage(pick()), back: poemPage(pick()) }))
  }, [data, fontsOk, seed])
  const blank = useMemo(() => poemPage(null), [])
  const lastFront = useMemo(() => poemPage(data.length ? data[Math.floor(Math.random() * data.length)] : null), [data, fontsOk, seed])
  const finalPoem = useMemo(() => poemPage(ghazal), [ghazal, fontsOk])
  const finalTafsir = useMemo(() => tafsirPage(ghazal), [ghazal, fontsOk])
  const prevP = useRef<number[]>([])
  const halo = useMemo(() => softTexture('217,164,65'), [])
  const leafGeo = useMemo(() => Array.from({ length: LEAVES }, () => makeLeafGeometry()), [])
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
    // flip: cover first, then LEAVES pages, staggered across the opening
    const p = [clamp(open / 0.26), ...Array.from({ length: LEAVES }, (_, i) => clamp((open - 0.2 - i * 0.105) / 0.26))]
    parts.current.forEach((g, i) => {
      if (!g) return
      const ang = -Math.PI * ease(p[i]) * (i ? 0.998 : 1)
      if (i === 0) g.rotation.z = ang
      else bendLeaf(leafGeo[i - 1], ang, ease(p[i]), 0.025 + (LEAVES - i) * 0.012, 0)
      const pr = prevP.current[i] ?? 0
      if ((pr < 0.04 && p[i] >= 0.04) || (pr > 0.96 && p[i] <= 0.96)) onFlip()
      prevP.current[i] = p[i]
    })
    const o = ease(open)
    if (root.current) root.current.position.x = (1 - o) * W / 2
    if (rightBlock.current) { rightBlock.current.scale.y = Math.max(0.001, o); rightBlock.current.position.y = 0.04 + 0.13 * o }
    if (rightGrp.current) { const a0 = parts.current[0]?.rotation.z ?? 0; rightGrp.current.scale.x = a0 < -Math.PI / 2 ? Math.max(0.0001, -Math.cos(a0)) : 0.0001 }
    if (spine.current) spine.current.scale.y = 1 - 0.82 * o
    // candle flicker + dust drift
    const fl = 1 + 0.14 * Math.sin(t * 11.3) + 0.09 * Math.sin(t * 27.1 + 1.3) + 0.06 * Math.sin(t * 47.9 + 0.4) + (Math.random() - 0.5) * 0.06
    if (flame.current) flame.current.intensity = 6.5 * fl
    if (lamp.current) lamp.current.intensity = 10 * (0.9 + 0.1 * fl)
    if (dust.current) { dust.current.rotation.y = t * 0.02; dust.current.position.y = Math.sin(t * 0.3) * 0.15 }
    // responsive camera, blended continuously from the closed three-quarter view to the open top-down view
    const c0 = cur.current
    const aspect = size.width / size.height, portrait = aspect < 0.9
    const dc = Math.max(5.2, 4.2 / aspect)
    const dO = portrait ? Math.max(5.2, 4.4 / aspect) : Math.max(5.2, 8.4 / aspect)
    const m = ease(clamp(open / 0.35))
    const lx = portrait && open > 0.5 ? (page === 'poem' ? W / 2 : -W / 2) : 0
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
      <ambientLight intensity={0.6} color="#8aa0d8" />
      <pointLight ref={lamp} position={[0.4, 3.2, 0.8]} color="#ffb45a" intensity={10} distance={14} decay={1.6} castShadow />
      <group position={[3.6, 0, -2.3]}>
        <mesh position-y={0.03}><cylinderGeometry args={[0.2, 0.24, 0.06, 24]} /><meshStandardMaterial color="#b08d3a" metalness={0.7} roughness={0.35} /></mesh>
        <mesh position-y={0.36}><cylinderGeometry args={[0.07, 0.075, 0.6, 20]} /><meshStandardMaterial color="#e8dcc0" roughness={0.8} /></mesh>
        <mesh position-y={0.74} scale={[1, 1.9, 1]}><sphereGeometry args={[0.05, 14, 14]} /><meshBasicMaterial color="#ffd27a" /></mesh>
        <pointLight ref={flame} position-y={0.8} color="#ff9d3c" intensity={5.5} distance={7} decay={1.8} />
      </group>

      <mesh rotation-x={-Math.PI / 2} receiveShadow><planeGeometry args={[40, 40]} /><meshStandardMaterial map={wood} roughness={0.75} /></mesh>
      {sheets.map((sh, i) => (
        <mesh key={i} position={[sh.x, 0.004 + i * 0.0016, sh.z]} rotation={[-Math.PI / 2, 0, sh.r]} scale={sh.s} receiveShadow>
          <planeGeometry args={[1.25, 1.75]} /><meshStandardMaterial map={sh.tex} roughness={0.95} />
        </mesh>
      ))}

      <mesh rotation-x={-Math.PI / 2} position-y={0.05}><planeGeometry args={[11, 11]} /><meshBasicMaterial map={halo} transparent opacity={0.28} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
      <Props labels={zoomOut} />
      <Smoke position={[-3.5, 0, -2.0]} />

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
        <mesh ref={rightBlock} position={[W / 2, 0.04, 0]} scale-y={0.001}><boxGeometry args={[W - 0.06, 0.26, D - 0.08]} />{pageBlockMat}</mesh>
        </group>

        {Array.from({ length: LEAVES + 1 }, (_, i) => i).map(i => (
          <group key={i} ref={el => { if (el) parts.current[i] = el }} position={[0, PIVOT_Y, 0]}>
            {i === 0 ? (
              <mesh position={[-W / 2, 0.025 + LEAVES * 0.012 + 0.03, 0]} castShadow>
                <boxGeometry args={[W, 0.04, D]} />
                {[0, 1].map(k => <meshStandardMaterial key={k} attach={`material-${k}`} color="#1a2f5c" roughness={0.6} />)}
                <meshStandardMaterial attach="material-2" map={cover} roughness={0.5} metalness={0.2} />
                <meshStandardMaterial attach="material-3" color="#e6d6ae" />
                {[4, 5].map(k => <meshStandardMaterial key={k} attach={`material-${k}`} color="#1a2f5c" />)}
              </mesh>
            ) : (
              <mesh geometry={leafGeo[i - 1]} position-x={-0.01} frustumCulled={false}>
                <meshStandardMaterial attach="material-0" map={i === LEAVES ? lastFront : leafTex[i - 1].front} roughness={0.95} side={THREE.DoubleSide} />
                <meshStandardMaterial attach="material-1" map={i === LEAVES ? finalPoem : leafTex[i - 1].back} roughness={0.95} side={THREE.DoubleSide} />
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
    <Canvas shadows dpr={[1, 1.75]} camera={{ fov: 40, near: 0.1, far: 60, position: [0, 3.2, 3.8] }} style={{ position: 'fixed', inset: 0, direction: 'ltr' }}>
      <Scene {...props} />
    </Canvas>
  )
}
