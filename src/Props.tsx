import { useEffect, useMemo, useRef, useState } from 'react'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

// Things a 14th-century Shirazi poet would have around him: ink and quill, a wine flask and cup,
// rose and pomegranates, prayer beads, a manuscript scroll, an astrolabe and a ney.
const brass = { color: '#b08d3a', metalness: 0.75, roughness: 0.35 }
const lathe = (pts: [number, number][]) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 28)

function Inkwell() {
  return (
    <group>
      <mesh position-y={0.07}><cylinderGeometry args={[0.13, 0.15, 0.14, 24]} /><meshStandardMaterial {...brass} /></mesh>
      <mesh position-y={0.141}><cylinderGeometry args={[0.095, 0.095, 0.004, 24]} /><meshStandardMaterial color="#05070c" roughness={0.15} metalness={0.3} /></mesh>
      <mesh position={[0.32, 0.03, 0.12]} rotation={[0, -0.5, 0.06]}><cylinderGeometry args={[0.012, 0.016, 0.95, 8]} /><meshStandardMaterial color="#8a5a2a" roughness={0.7} /></mesh>
      <group position={[-0.1, 0.012, 0.42]} rotation={[0, 0.55, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.006, 0.01, 1.0, 6]} /><meshStandardMaterial color="#e8dcc0" /></mesh>
        <mesh position={[-0.12, 0.004, 0]} scale={[1.7, 0.05, 0.28]}><sphereGeometry args={[0.2, 14, 8]} /><meshStandardMaterial color="#f2ead2" roughness={0.95} /></mesh>
      </group>
    </group>
  )
}

function FlaskAndCup() {
  const flask = useMemo(() => lathe([[0, 0], [0.13, 0.0], [0.17, 0.08], [0.16, 0.2], [0.09, 0.34], [0.045, 0.46], [0.05, 0.62], [0.085, 0.66], [0.04, 0.66]]), [])
  const cup = useMemo(() => lathe([[0, 0], [0.06, 0], [0.065, 0.03], [0.12, 0.13], [0.125, 0.15], [0.115, 0.15]]), [])
  return (
    <group>
      <mesh geometry={flask}><meshStandardMaterial color="#1f6f8b" roughness={0.25} metalness={0.2} side={THREE.DoubleSide} /></mesh>
      <mesh geometry={cup} position={[0.42, 0, 0.18]}><meshStandardMaterial color="#d9a441" roughness={0.3} metalness={0.7} side={THREE.DoubleSide} /></mesh>
    </group>
  )
}

function Rose() {
  const petals = useMemo(() => Array.from({ length: 6 }, (_, i) => ({ x: (Math.random() - 0.3) * 1.0, z: (Math.random() - 0.2) * 0.8, r: Math.random() * 6 })), [])
  return (
    <group>
      <group position={[0, 0.018, 0]} rotation={[0, 0, Math.PI / 2 - 0.05]}>
        <mesh><cylinderGeometry args={[0.012, 0.014, 0.85, 8]} /><meshStandardMaterial color="#2f5a2a" /></mesh>
      </group>
      <mesh position={[-0.44, 0.06, 0]}><sphereGeometry args={[0.07, 14, 12]} /><meshStandardMaterial color="#b3122b" roughness={0.6} /></mesh>
      <mesh position={[-0.42, 0.1, 0]} scale={[1, 0.6, 1]}><sphereGeometry args={[0.055, 12, 10]} /><meshStandardMaterial color="#d3203a" roughness={0.6} /></mesh>
      {petals.map((p, i) => <mesh key={i} position={[p.x, 0.006, p.z]} rotation={[0, p.r, 0]} scale={[1, 0.15, 0.6]}><sphereGeometry args={[0.04, 8, 6]} /><meshStandardMaterial color="#b3122b" roughness={0.7} /></mesh>)}
      {[[0.35, 0.3], [0.55, 0.1], [0.45, -0.15]].map(([x, z], i) => (
        <group key={i} position={[x, 0.08, z]}>
          <mesh><sphereGeometry args={[0.09, 16, 14]} /><meshStandardMaterial color="#a3182a" roughness={0.55} /></mesh>
          <mesh position-y={0.085}><cylinderGeometry args={[0.025, 0.035, 0.03, 6]} /><meshStandardMaterial color="#7a1c22" /></mesh>
        </group>
      ))}
    </group>
  )
}

function Tasbih() {
  const beads = useMemo(() => Array.from({ length: 33 }, (_, i) => { const a = (i / 33) * Math.PI * 2; return [Math.cos(a) * 0.3, Math.sin(a) * 0.2 * (1 + 0.15 * Math.sin(a * 2))] as [number, number] }), [])
  return (
    <group>
      {beads.map(([x, z], i) => <mesh key={i} position={[x, 0.028, z]}><sphereGeometry args={[0.028, 10, 8]} /><meshStandardMaterial color="#3b2a1a" roughness={0.4} /></mesh>)}
      <mesh position={[0.3, 0.03, 0.2]}><sphereGeometry args={[0.04, 10, 8]} /><meshStandardMaterial {...brass} /></mesh>
    </group>
  )
}

function Scroll() {
  return (
    <group rotation={[0, 0.5, 0]}>
      <mesh position-y={0.075} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.075, 0.075, 0.95, 20]} /><meshStandardMaterial color="#e9dcb4" roughness={0.9} /></mesh>
      {[-0.47, 0.47].map(x => <mesh key={x} position={[x, 0.075, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.032, 0.032, 0.04, 12]} /><meshStandardMaterial {...brass} /></mesh>)}
      <mesh position={[0, 0.003, 0.2]} scale={[1.2, 0.05, 0.9]}><boxGeometry args={[0.8, 0.02, 0.4]} /><meshStandardMaterial color="#e9dcb4" roughness={0.95} /></mesh>
    </group>
  )
}

function Astrolabe() {
  return (
    <group>
      <mesh position-y={0.014}><cylinderGeometry args={[0.24, 0.24, 0.028, 40]} /><meshStandardMaterial {...brass} /></mesh>
      <mesh position-y={0.03} rotation-x={Math.PI / 2}><torusGeometry args={[0.2, 0.012, 8, 40]} /><meshStandardMaterial {...brass} /></mesh>
      <mesh position-y={0.034} rotation-x={Math.PI / 2}><torusGeometry args={[0.1, 0.008, 8, 32]} /><meshStandardMaterial {...brass} /></mesh>
      <mesh position={[0, 0.04, -0.27]} rotation-x={Math.PI / 2}><torusGeometry args={[0.04, 0.012, 8, 20]} /><meshStandardMaterial {...brass} /></mesh>
    </group>
  )
}

function Ney() {
  return (
    <group rotation={[0, -0.25, 0]}>
      <mesh position-y={0.03} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.022, 0.022, 1.5, 12]} /><meshStandardMaterial color="#8a5a2a" roughness={0.6} /></mesh>
      {[-0.5, -0.1, 0.3, 0.6].map(x => <mesh key={x} position={[x, 0.03, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.026, 0.026, 0.025, 12]} /><meshStandardMaterial {...brass} /></mesh>)}
    </group>
  )
}

const gold = { color: '#d9a441', metalness: 0.8, roughness: 0.3 }
const wood = { color: '#6b4426', roughness: 0.7 }

function Quran() { // he was called "Hafez" for knowing the Quran by heart
  return (
    <group rotation-y={0.5}>
      <mesh position={[0, 0.17, 0]} rotation={[0, 0, 0.5]}><boxGeometry args={[0.46, 0.025, 0.42]} /><meshStandardMaterial {...wood} /></mesh>
      <mesh position={[0, 0.2, 0]} rotation={[0, 0, 0.5]}><boxGeometry args={[0.4, 0.07, 0.3]} /><meshStandardMaterial color="#1c5a3c" roughness={0.6} /></mesh>
      <mesh position={[0.005, 0.238, 0]} rotation={[0, 0, 0.5]}><boxGeometry args={[0.3, 0.006, 0.2]} /><meshStandardMaterial {...gold} /></mesh>
      <mesh position={[-0.12, 0.07, 0]}><boxGeometry args={[0.025, 0.14, 0.38]} /><meshStandardMaterial {...wood} /></mesh>
      <mesh position={[0.14, 0.04, 0]}><boxGeometry args={[0.025, 0.08, 0.38]} /><meshStandardMaterial {...wood} /></mesh>
    </group>
  )
}

function Tomb() { // the Hafezieh pavilion in Shiraz; he died in 792 AH (1390 CE)
  const dome = useMemo(() => new THREE.SphereGeometry(0.3, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), [])
  return (
    <group>
      <mesh position-y={0.02}><cylinderGeometry args={[0.42, 0.44, 0.04, 24]} /><meshStandardMaterial color="#cdbf9d" roughness={0.9} /></mesh>
      <mesh position-y={0.07}><cylinderGeometry args={[0.36, 0.38, 0.06, 24]} /><meshStandardMaterial color="#cdbf9d" roughness={0.9} /></mesh>
      {Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * Math.PI * 2; return <mesh key={i} position={[Math.cos(a) * 0.27, 0.34, Math.sin(a) * 0.27]}><cylinderGeometry args={[0.018, 0.022, 0.5, 10]} /><meshStandardMaterial color="#e8dcc0" roughness={0.6} /></mesh> })}
      <mesh position-y={0.6}><cylinderGeometry args={[0.32, 0.32, 0.03, 24]} /><meshStandardMaterial {...gold} /></mesh>
      <mesh geometry={dome} position-y={0.615}><meshStandardMaterial color="#1f8fa0" roughness={0.4} metalness={0.2} /></mesh>
      <mesh position-y={0.95}><sphereGeometry args={[0.025, 10, 8]} /><meshStandardMaterial {...gold} /></mesh>
      <mesh position-y={0.12}><boxGeometry args={[0.3, 0.07, 0.14]} /><meshStandardMaterial color="#2a2a30" roughness={0.3} /></mesh>
    </group>
  )
}

function Hourglass() { // passing time, and death
  return (
    <group>
      {[0.02, 0.46].map(y => <mesh key={y} position-y={y}><cylinderGeometry args={[0.12, 0.12, 0.03, 20]} /><meshStandardMaterial {...wood} /></mesh>)}
      {[0, 2.1, 4.2].map(a => <mesh key={a} position={[Math.cos(a) * 0.1, 0.24, Math.sin(a) * 0.1]}><cylinderGeometry args={[0.008, 0.008, 0.44, 6]} /><meshStandardMaterial {...gold} /></mesh>)}
      <mesh position-y={0.14} rotation-x={Math.PI}><coneGeometry args={[0.085, 0.2, 18]} /><meshStandardMaterial color="#cfe8f0" transparent opacity={0.35} roughness={0.05} /></mesh>
      <mesh position-y={0.34}><coneGeometry args={[0.085, 0.2, 18]} /><meshStandardMaterial color="#cfe8f0" transparent opacity={0.35} roughness={0.05} /></mesh>
      <mesh position-y={0.075}><coneGeometry args={[0.06, 0.1, 14]} /><meshStandardMaterial color="#d9b878" roughness={0.9} /></mesh>
    </group>
  )
}

function PrayerRug() { // "به می سجاده رنگین کن" — the first ghazal
  const tex = useMemo(() => {
    const c = document.createElement('canvas'); c.width = 256; c.height = 384
    const x = c.getContext('2d')!
    x.fillStyle = '#6a1f2b'; x.fillRect(0, 0, 256, 384)
    x.strokeStyle = '#d9a441'; x.lineWidth = 8; x.strokeRect(14, 14, 228, 356); x.lineWidth = 3; x.strokeRect(30, 30, 196, 324)
    x.fillStyle = '#1f3a6e'; x.beginPath(); x.moveTo(60, 340); x.lineTo(60, 170); x.quadraticCurveTo(128, 20, 196, 170); x.lineTo(196, 340); x.closePath(); x.fill(); x.stroke()
    x.fillStyle = '#d9a441'; x.beginPath(); x.arc(128, 150, 14, 0, 7); x.fill()
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t
  }, [])
  return <mesh rotation-x={-Math.PI / 2} position-y={0.012}><planeGeometry args={[0.9, 1.35]} /><meshStandardMaterial map={tex} roughness={1} /></mesh>
}

function Nightingale() { // the bulbul of the Shiraz gardens
  return (
    <group>
      <mesh position-y={0.06} scale={[1.4, 1, 1]}><sphereGeometry args={[0.05, 14, 10]} /><meshStandardMaterial color="#6b4a2c" roughness={0.9} /></mesh>
      <mesh position={[0.08, 0.1, 0]}><sphereGeometry args={[0.032, 12, 10]} /><meshStandardMaterial color="#7a5733" roughness={0.9} /></mesh>
      <mesh position={[0.115, 0.1, 0]} rotation={[0, 0, -Math.PI / 2]}><coneGeometry args={[0.01, 0.04, 6]} /><meshStandardMaterial color="#d9a441" /></mesh>
      <mesh position={[-0.1, 0.07, 0]} rotation={[0, 0, Math.PI / 2 + 0.3]}><coneGeometry args={[0.025, 0.1, 6]} /><meshStandardMaterial color="#5a3d22" roughness={0.9} /></mesh>
    </group>
  )
}

function Cypress() { // the cypress of Shiraz, the beloved's stature
  return (
    <group>
      <mesh position-y={0.06}><cylinderGeometry args={[0.1, 0.07, 0.12, 16]} /><meshStandardMaterial color="#9a5a36" roughness={0.9} /></mesh>
      {[0.3, 0.55, 0.78].map((y, i) => <mesh key={i} position-y={y}><coneGeometry args={[0.13 - i * 0.03, 0.42 - i * 0.06, 14]} /><meshStandardMaterial color="#1f4a2a" roughness={0.9} /></mesh>)}
    </group>
  )
}

function JamJam() { // the world-revealing cup
  return (
    <group>
      <mesh position-y={0.04}><cylinderGeometry args={[0.14, 0.16, 0.08, 24]} /><meshStandardMaterial {...gold} /></mesh>
      <mesh position-y={0.24}><sphereGeometry args={[0.17, 28, 20]} /><meshStandardMaterial color="#9fd8ff" transparent opacity={0.3} roughness={0.03} metalness={0.1} /></mesh>
      <mesh position-y={0.24}><sphereGeometry args={[0.03, 12, 10]} /><meshBasicMaterial color="#ffd27a" /></mesh>
    </group>
  )
}

function Oud() { // music of the court and the Sufi gathering
  return (
    <group rotation-y={0.9}>
      <mesh position-y={0.07} scale={[1, 0.45, 1.35]}><sphereGeometry args={[0.2, 24, 16]} /><meshStandardMaterial color="#8a4e22" roughness={0.5} /></mesh>
      <mesh position={[0, 0.1, 0.08]} rotation-x={-Math.PI / 2}><circleGeometry args={[0.05, 16]} /><meshStandardMaterial color="#1a0f08" /></mesh>
      <mesh position={[0, 0.1, -0.45]}><boxGeometry args={[0.07, 0.03, 0.5]} /><meshStandardMaterial color="#3a2414" roughness={0.6} /></mesh>
      <mesh position={[0, 0.1, -0.74]} rotation-x={0.4}><boxGeometry args={[0.09, 0.03, 0.14]} /><meshStandardMaterial color="#3a2414" /></mesh>
    </group>
  )
}

function Crown() { // his royal patrons: Shah Shuja and the Muzaffarids
  return (
    <group>
      <mesh position-y={0.04}><boxGeometry args={[0.4, 0.08, 0.4]} /><meshStandardMaterial color="#7a1c2a" roughness={0.9} /></mesh>
      <mesh position-y={0.13}><cylinderGeometry args={[0.1, 0.09, 0.09, 20, 1, true]} /><meshStandardMaterial {...gold} side={THREE.DoubleSide} /></mesh>
      {Array.from({ length: 6 }, (_, i) => { const a = (i / 6) * Math.PI * 2; return <mesh key={i} position={[Math.cos(a) * 0.095, 0.2, Math.sin(a) * 0.095]}><coneGeometry args={[0.02, 0.06, 6]} /><meshStandardMaterial {...gold} /></mesh> })}
    </group>
  )
}

function QuranGate() { // Darvaze-ye Quran, the gate of Shiraz where he was born (~1315 CE)
  return (
    <group>
      {[-0.3, 0.3].map(x => <mesh key={x} position={[x, 0.25, 0]}><boxGeometry args={[0.1, 0.5, 0.14]} /><meshStandardMaterial color="#c9a46a" roughness={0.95} /></mesh>)}
      <mesh position-y={0.5}><torusGeometry args={[0.3, 0.05, 8, 24, Math.PI]} /><meshStandardMaterial color="#c9a46a" roughness={0.95} /></mesh>
      <mesh position={[0, 0.58, 0]}><boxGeometry args={[0.76, 0.06, 0.16]} /><meshStandardMaterial color="#b88f55" roughness={0.95} /></mesh>
    </group>
  )
}

// The poet's other works, stacked behind the Divan
const OTHER_BOOKS: { title: string; color: string }[] = [
  { title: 'قصاید', color: '#1f5a46' },
  { title: 'قطعات', color: '#7a2433' },
  { title: 'رباعیات', color: '#1d6a78' },
  { title: 'ساقی‌نامه', color: '#6a4a22' },
]
function SmallBook({ title, color }: { title: string; color: string }) {
  const tex = useMemo(() => {
    const c = document.createElement('canvas'); c.width = 400; c.height = 560
    const g = c.getContext('2d')!
    g.fillStyle = color; g.fillRect(0, 0, 400, 560)
    for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(0,0,0,${Math.random() * 0.08})`; g.fillRect(Math.random() * 400, Math.random() * 560, 2, 2) }
    g.strokeStyle = '#d9a441'; g.lineWidth = 5; g.strokeRect(22, 22, 356, 516); g.lineWidth = 2; g.strokeRect(34, 34, 332, 492)
    g.beginPath(); g.ellipse(200, 280, 110, 150, 0, 0, Math.PI * 2); g.lineWidth = 3; g.stroke()
    g.fillStyle = '#d9a441'; g.textAlign = 'center'; g.direction = 'rtl'
    g.font = '58px "Noto Nastaliq Urdu", serif'; g.fillText(title, 200, 290, 200)
    g.font = '24px Vazirmatn, sans-serif'; g.fillText('حافظ', 200, 80)
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t
  }, [title, color])
  return (
    <group>
      <mesh position-y={0.05} castShadow receiveShadow>
        <boxGeometry args={[0.85, 0.1, 1.2]} />
        {[0, 1, 3, 4, 5].map(k => <meshStandardMaterial key={k} attach={`material-${k}`} color={color} roughness={0.6} />)}
        <meshStandardMaterial attach="material-2" map={tex} roughness={0.5} metalness={0.25} />
      </mesh>
      <mesh position={[0.02, 0.05, 0]}><boxGeometry args={[0.8, 0.075, 1.16]} /><meshStandardMaterial color="#e6d6ae" roughness={1} /></mesh>
    </group>
  )
}
function OtherBooks() {
  return (
    <group>
      <group position={[-1.0, 0.045, -2.75]} rotation-y={0.18}><SmallBook {...OTHER_BOOKS[0]} /><group position={[0.03, 0.1, 0.02]} rotation-y={-0.22}><SmallBook {...OTHER_BOOKS[1]} /></group></group>
      <group position={[1.0, 0.045, -2.85]} rotation-y={-0.15}><SmallBook {...OTHER_BOOKS[2]} /><group position={[-0.02, 0.1, 0.03]} rotation-y={0.25}><SmallBook {...OTHER_BOOKS[3]} /></group></group>
    </group>
  )
}

type Item = { pos: [number, number]; rot?: number; tag: string; y: number; node: JSX.Element }
const ITEMS: Item[] = [
  { pos: [-5.8, -1.0], tag: 'دروازه قرآن · زادگاه: شیراز، حدود ۷۱۷ ه.ق', y: 0.9, node: <QuranGate /> },
  { pos: [-5.3, 0.6], tag: 'قرآن · از حفظ بودنش تخلص «حافظ» آمد', y: 0.6, node: <Quran /> },
  { pos: [-3.7, -0.4], tag: 'تسبیح · زهد ریایی که حافظ نقدش می‌کند', y: 0.4, node: <Tasbih /> },
  { pos: [-5.2, 2.6], tag: 'سجاده · «به می سجاده رنگین کن» (غزل ۱)', y: 0.4, node: <PrayerRug /> },
  { pos: [-4.3, 3.0], tag: 'سرو · سرو شیراز، قامت یار', y: 1.1, node: <Cypress /> },
  { pos: [-3.5, 1.7], rot: 0.4, tag: 'دوات و قلم · کتابت و دیوان (گردآوری پس از مرگ او)', y: 0.5, node: <Inkwell /> },
  { pos: [-2.6, 2.4], tag: 'ساعت شنی · گذر زمان و مرگ', y: 0.8, node: <Hourglass /> },
  { pos: [-1.6, -2.0], tag: 'طومار · فرمان‌ها و ستایش‌های درباری', y: 0.5, node: <Scroll /> },
  { pos: [0.4, 2.55], tag: 'نی · ناله‌ی جدایی و سماع', y: 0.4, node: <Ney /> },
  { pos: [2.0, -2.3], tag: 'اسطرلاب · قضا و قدر و ستاره‌شناسی زمانه', y: 0.5, node: <Astrolabe /> },
  { pos: [2.4, 2.7], tag: 'جام جم · جام جهان‌بین دل عارف', y: 0.7, node: <JamJam /> },
  { pos: [3.2, 1.9], rot: -0.3, tag: 'صراحی و جام · می و خرابات، رندی عارفانه', y: 0.9, node: <FlaskAndCup /> },
  { pos: [3.3, 0.1], rot: 0.3, tag: 'گل سرخ و انار · باغ‌های شیراز', y: 0.4, node: <Rose /> },
  { pos: [4.05, 0.7], tag: 'بلبل · عاشق گل، آواز غزل', y: 0.5, node: <Nightingale /> },
  { pos: [5.0, 1.5], tag: 'تاج · شاه‌شجاع و امیر مبارزالدین، حامیان او', y: 0.6, node: <Crown /> },
  { pos: [5.3, 2.8], tag: 'عود · موسیقی بزم و خانقاه', y: 0.4, node: <Oud /> },
  { pos: [5.7, -0.9], tag: 'حافظیه · آرامگاه او در شیراز، ۷۹۲ ه.ق', y: 1.2, node: <Tomb /> },
]

export default function Props({ labels }: { labels: boolean }) {
  const root = useRef<THREE.Group>(null)
  const [fontsOk, setFontsOk] = useState(false)
  useEffect(() => { Promise.all([document.fonts.load('58px "Noto Nastaliq Urdu"', 'حافظ'), document.fonts.load('24px Vazirmatn', 'حافظ')]).then(() => setFontsOk(true)).catch(() => setFontsOk(true)) }, [])
  useEffect(() => { root.current?.traverse(o => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true } }) }, [])
  return (
    <group ref={root}>
      <OtherBooks key={String(fontsOk)} />
      {ITEMS.map((it, i) => (
        <group key={i} position={[it.pos[0], 0, it.pos[1]]} rotation-y={it.rot ?? 0}>
          {it.node}
          {labels && <Html position={[0, 0.02, 0.2]} center zIndexRange={[10, 0]}><div className="tag"><b>{it.tag.split(' · ')[0]}</b><span>{it.tag.split(' · ')[1]}</span></div></Html>}
        </group>
      ))}
    </group>
  )
}
