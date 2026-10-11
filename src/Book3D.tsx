import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import type { Ghazal } from './types'
import { W, D, PIVOT_Y, MAXL, DY, clamp, ease, world, isBusy } from './constants'
import { makeLeaf, stepLeaf } from './leaf'
import { once, clearTextureCache, poemPage, plainPage, tafsirPage, coverTexture, grainTexture, endpaperTexture, woodTexture, edgeTexture, softTexture, noiseTexture } from './textures'
import Props from './Props'
import Candle from './Candle'
import Smoke from './Smoke'

type Props = { reading: boolean; low: boolean; pages: number; zoomOut: boolean; openRef: { current: number }; seed: number; page: 'poem' | 'tafsir'; ghazal: Ghazal | null; data: Ghazal[]; onFlip: (rate?: number, gain?: number) => void }

function Scene({ reading, low, pages, zoomOut, openRef, seed, page, ghazal, data, onFlip }: Props) {
  const { camera, size } = useThree()
  const root = useRef<THREE.Group>(null)
  const parts = useRef<THREE.Group[]>([])
  const rightBlock = useRef<THREE.Mesh>(null)
  const rightBack = useRef<THREE.Mesh>(null)
  const rightGrp = useRef<THREE.Group>(null)
  const lamp = useRef<THREE.SpotLight>(null)
  const hemi = useRef<THREE.HemisphereLight>(null)
  const bookBlob = useRef<THREE.Mesh>(null)
  const dust = useRef<THREE.Points>(null)
  const cover = useMemo(() => coverTexture(), [])
  const grain = useMemo(() => grainTexture(), [])
  const endpaper = useMemo(() => endpaperTexture(), [])
  useEffect(() => { document.fonts?.ready.then(() => { cover.image = coverTexture().image; cover.needsUpdate = true }) }, [cover])

  const [fontsOk, setFontsOk] = useState(false)
  useEffect(() => { Promise.all([document.fonts.load('27px "Noto Nastaliq Urdu"', 'حافظ'), document.fonts.load('20px Vazirmatn', 'حافظ')]).then(() => setFontsOk(true)).catch(() => setFontsOk(true)) }, [])
  const pool = useMemo(() => {
    const pick = () => (data.length ? data[Math.floor(Math.random() * data.length)] : null)
    return Array.from({ length: 8 }, () => poemPage(pick(), false, 0.4)) // low-res pages shared by the turning leaves and the loose sheets
  }, [data, fontsOk, seed])
  const bump = once('noise', noiseTexture)
  const poolMats = useMemo(() => pool.map(t => new THREE.MeshStandardMaterial({ map: t, bumpMap: bump, bumpScale: 0.35, roughness: 0.95, side: THREE.DoubleSide })), [pool, bump])
  const leafPick = useMemo(() => Array.from({ length: MAXL }, () => [Math.floor(Math.random() * 8), Math.floor(Math.random() * 8)]), [seed])
  const plain = useMemo(() => plainPage(), [])
  const lastFront = useMemo(() => poemPage(data.length ? data[Math.floor(Math.random() * data.length)] : null, false, 0.5), [data, fontsOk, seed]) // seen only for a moment, so half size
  const finalPoem = useMemo(() => poemPage(ghazal), [ghazal, fontsOk])
  const finalTafsir = useMemo(() => tafsirPage(ghazal), [ghazal, fontsOk])
  useEffect(() => () => { pool.forEach(t => t.dispose()) }, [pool])
  useEffect(() => () => { poolMats.forEach(m => m.dispose()) }, [poolMats])
  useEffect(() => () => { lastFront.dispose() }, [lastFront])
  useEffect(() => () => { finalPoem.dispose() }, [finalPoem])
  useEffect(() => () => { finalTafsir.dispose() }, [finalTafsir])
  const prevP = useRef<number[]>([])
  const leafDir = useRef<number[]>([]) // +1 while a leaf is opening, -1 while closing
  const pagesRef = useRef(pages)
  pagesRef.current = pages
  const halo = once('halo', () => softTexture('217,164,65'))
  const leaves = useMemo(() => Array.from({ length: MAXL }, () => makeLeaf()), [])
  const coverSpring = useRef({ a: 0, v: 0 }) // the front cover is a spring with a hard stop at each end
  const gl = useThree(st => st.gl), scene = useThree(st => st.scene)
  useEffect(() => {
    const pm = new THREE.PMREMGenerator(gl), env = pm.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = env; scene.environmentIntensity = 0.3
    return () => { scene.environment = null; env.dispose(); pm.dispose() }
  }, [gl, scene])
  const wood = once('wood', woodTexture)
  const edge = once('edge', edgeTexture)
  const spine = useRef<THREE.Group>(null)
  const sheets = useMemo(() => Array.from({ length: 22 }, (_, i) => ({ m: i % 8, x: (Math.random() - 0.5) * 12, z: -1.9 - Math.random() * 2.9, r: (Math.random() - 0.5) * 1.3, s: 0.85 + Math.random() * 0.35 })), [])

  const dustGeo = useMemo(() => {
    const n = 70, a = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) { a[i * 3] = (Math.random() - .5) * 8; a[i * 3 + 1] = Math.random() * 4; a[i * 3 + 2] = (Math.random() - .5) * 6 }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(a, 3)); return g
  }, [])

  const cur = useRef({ x: 0, y: 3.2, z: 3.8, lx: 0, zf: 1 })
  const pArr = useRef(new Float32Array(MAXL + 1)) // flip progress per leaf, reused every frame
  const shadowT = useRef(-9)
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime
    const open = openRef.current
    // the shadow map is redrawn only while something moves (and once in a while for the table props), not every frame
    if (isBusy() || t - shadowT.current > 1.5) { gl.shadowMap.needsUpdate = true; shadowT.current = t }
    // flip: cover first, then the active leaves (the lowest `n` of the stack), staggered across the opening
    const n = pagesRef.current, FD = 0.12, ST = (0.97 - 0.18 - FD) / Math.max(1, n - 1)
    const p = pArr.current
    p[0] = clamp(open / 0.2)
    for (let i = 0; i < MAXL; i++) { const j = i - (MAXL - n); p[i + 1] = j < 0 ? 0 : clamp((open - 0.18 - j * ST) / FD) }
    // the cover: a damped spring chasing the scripted angle, with a hard stop (and a small bounce + thud) at each end
    const cv = coverSpring.current, dtc = Math.min(dt, 0.1), steps = Math.max(2, Math.ceil(dtc / 0.0083)), hs = dtc / steps, target = -Math.PI * ease(p[0])
    for (let k = 0; k < steps; k++) {
      cv.v += (60 * (target - cv.a) - 10 * cv.v) * hs; cv.a += cv.v * hs
      if (cv.a > 0) { if (cv.v > 0.9) onFlip(0.55, Math.min(1, cv.v / 4)); cv.a = 0; cv.v *= -0.2 }
      else if (cv.a < -Math.PI) { if (cv.v < -0.9) onFlip(0.55, Math.min(1, -cv.v / 4)); cv.a = -Math.PI; cv.v *= -0.25 }
    }
    if (parts.current[0]) parts.current[0].rotation.z = cv.a
    for (let i = 1; i <= MAXL; i++) {
      const pi = p[i], pr = prevP.current[i] ?? 0
      if ((pr < 0.04 && pi >= 0.04) || (pr > 0.96 && pi <= 0.96)) onFlip(0.9 + Math.random() * 0.25)
      prevP.current[i] = pi
      if (i <= MAXL - n) continue // unused leaf
      const dp = pi - pr; if (Math.abs(dp) > 1e-5) leafDir.current[i] = dp > 0 ? 1 : -1
      stepLeaf(leaves[i - 1], -Math.PI * ease(pi) * 0.998, 0.025 + (MAXL - i) * DY, dt, t, ease(pi), leafDir.current[i] ?? 1, i === MAXL && open > 0.985 ? 1 : 0)
    }
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
    if (lamp.current) lamp.current.intensity = 95 * (0.94 + 0.06 * fl) * world.lit
    if (hemi.current) hemi.current.intensity = 0.5 * (0.3 + 0.7 * world.lit)
    if (bookBlob.current) { bookBlob.current.scale.set(W * (1 + o) + 0.5, D + 0.5, 1); bookBlob.current.position.z = 0 }
    if (dust.current) { dust.current.rotation.y = t * 0.02; dust.current.position.y = Math.sin(t * 0.3) * 0.15 }
    // responsive camera, blended continuously from the closed three-quarter view to the open top-down view
    const c0 = cur.current
    const aspect = size.width / size.height, portrait = aspect < 0.9
    const dc = Math.max(5.2, 4.2 / aspect)
    const dO = portrait ? Math.max(4.2, 3.3 / aspect) : Math.max(aspect > 1.8 ? 5.1 : 6.0, 8.4 / aspect)
    const m = ease(clamp(open / 0.35))
    const lx = portrait && open > 0.5 && !zoomOut ? (page === 'poem' ? W / 2 : -W / 2) : 0
    const zf = (zoomOut ? 2.7 : 1) * (1 + (1 - world.lit) * 0.4) // the camera glides in as the candles come up
    const ty = (dc * 0.62 * (1 - m) + dO * 0.93 * m) * c0.zf, tz = (dc * 0.78 * (1 - m) + dO * 0.37 * m) * c0.zf, tx = zoomOut ? 0 : lx
    const k = 1 - Math.exp(-dt * 2.5), c = cur.current
    c.zf += (zf - c.zf) * k
    c.x += (tx - c.x) * k; c.y += (ty - c.y) * k; c.z += (tz - c.z) * k; c.lx += (lx - c.lx) * k
    camera.position.set(c.x + Math.sin(t * 0.2) * 0.12, c.y, c.z)
    camera.up.set(0, 1, 0)
    camera.lookAt(c.lx, 0.3, aspect > 1.8 && !zoomOut ? 0.35 * m : 0) // short landscape: lift the book clear of the bottom buttons
    camera.rotateZ(Math.sin(Math.PI * clamp(open)) * 0.03 + Math.sin(t * 0.13) * 0.004) // a slight roll while the book opens
  })

  const leafMat = <meshStandardMaterial color="#efe3c2" roughness={0.9} />
  const pageBlockMat = <meshStandardMaterial color="#e6d6ae" roughness={1} />
  return (
    <>
      <color attach="background" args={['#071326']} />
      <fog attach="fog" args={['#071326', 20, 48]} />
      <hemisphereLight ref={hemi} args={['#6f86c8', '#3a2418', 0.5]} />
      <directionalLight position={[-5, 4, -4]} intensity={0.45} color="#7f95e0" />
      <directionalLight position={[3, 5, 7]} intensity={0.18} color="#ffd9b0" />
      <spotLight ref={lamp} position={[0.8, 5.6, 2.4]} angle={0.75} penumbra={1} color="#ffd2a0" intensity={95} distance={22} decay={2} castShadow={!low} shadow-mapSize={[1024, 1024]} shadow-camera-near={3} shadow-camera-far={13} shadow-bias={-0.0003} shadow-radius={6} />
      <mesh ref={bookBlob} rotation-x={-Math.PI / 2} position-y={0.006} renderOrder={1}><planeGeometry args={[1, 1]} /><meshBasicMaterial map={once('blob', () => softTexture('0,0,0'))} transparent opacity={0.6} depthWrite={false} toneMapped={false} /></mesh>
      <Candle position={[3.6, 0.05, -2.3]} moth />
      <Candle position={[-3.4, 0.05, -3.3]} phase={2.1} height={0.45} />

      <mesh rotation-x={-Math.PI / 2} receiveShadow><planeGeometry args={[40, 40]} /><meshStandardMaterial map={wood} bumpMap={wood} bumpScale={0.8} roughness={0.72} /></mesh>
      {sheets.map((sh, i) => (
        <mesh key={i} position={[sh.x, 0.004 + i * 0.0016, sh.z]} rotation={[-Math.PI / 2, 0, sh.r]} scale={sh.s} receiveShadow>
          <planeGeometry args={[1.25, 1.75]} /><primitive object={poolMats[sh.m]} attach="material" />
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
          <meshStandardMaterial attach="material-2" map={ghazal ? finalTafsir : plain} roughness={1} />
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
              <mesh geometry={leaves[i - 1].geo} position-x={-0.01} frustumCulled={false}>
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

const TOUCH = window.matchMedia('(pointer: coarse)').matches
const Effects = lazy(() => import('./Effects')) // own chunk

const MAX_DPR = Math.min(window.devicePixelRatio, TOUCH ? 2 : 1.75) // phones 2x keep text crisp; desktops 1.75x (retina is 2x) to spare fill rate and memory
const MIN_DPR = Math.min(window.devicePixelRatio, 1.25)
// Render only as often as needed: full rate while something moves, a calm rate while the scene just idles (candle flicker, smoke).
// A frame is never drawn in a hidden tab (rAF is paused there).
function Governor() {
  const advance = useThree(st => st.advance)
  useEffect(() => {
    let id = 0, last = 0
    const idle = 1000 / (TOUCH ? 24 : 30)
    const loop = (t: number) => {
      id = requestAnimationFrame(loop)
      if (t - last >= (isBusy() ? 15 : idle) - 2) { last = t; advance(t / 1000) }
    }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [advance])
  return null
}

export default function Book3D(props: Omit<Props, 'low'>) {
  const [dpr, setDpr] = useState(MAX_DPR) // drops (and the live shadow and post effects switch off) if the device can't keep up
  const [low, setLow] = useState(false)
  const [epoch, setEpoch] = useState(0) // bumped after a lost WebGL context: everything is rebuilt
  return (
    <Canvas
      frameloop="never" shadows dpr={dpr} camera={{ fov: 40, near: 0.1, far: 60, position: [0, 3.2, 3.8] }}
      gl={{ powerPreference: 'high-performance', antialias: false, stencil: false }}
      onCreated={({ gl }) => {
        gl.toneMappingExposure = 1.05
        gl.shadowMap.autoUpdate = false
        gl.domElement.addEventListener('webglcontextrestored', () => { clearTextureCache(); setEpoch(e => e + 1) })
      }}
      style={{ position: 'fixed', inset: 0, direction: 'ltr' }}
    >
      <Governor />
      <PerformanceMonitor onDecline={() => { setDpr(MIN_DPR); setLow(true) }} onIncline={() => { setDpr(MAX_DPR); setLow(false) }} />
      <Scene key={epoch} {...props} low={low} />
      {!low && <Suspense fallback={null}><Effects zoomOut={props.zoomOut} reading={props.reading} /></Suspense>}
    </Canvas>
  )
}
