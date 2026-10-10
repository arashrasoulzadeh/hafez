import * as THREE from 'three'
import { SEG, LW, LD, TH } from './constants'

const K_TRACK = 900 // how hard each segment chases its target angle
const C_TRACK = 40 // damping of that chase (slightly under-damped: a little flutter on landing)
const K_LINK = 200 // stiffness between neighbouring segments (the paper resists sharp creases)
const C_LINK = 6
const LEAD = 0.9 // radians the free edge runs ahead of the hinge at mid-flip, like a page lifted by its edge
const PI = Math.PI

// A page made of SEG segments. Each chases a target angle (hinge + a lead that grows towards the free edge) through a damped spring,
// and neighbouring segments are linked, so the page arches in flight, lands free edge first and settles with a small flutter.
export type Leaf = { geo: THREE.BufferGeometry; a: Float32Array; v: Float32Array; hinge: number; ready: boolean }

export function makeLeaf(): Leaf {
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
  return { geo: g, a: new Float32Array(SEG), v: new Float32Array(SEG), hinge: 0, ready: false }
}

// Advance the page by dt seconds. `e` is the flip progress (0..1, eased), `dir` +1 while opening and -1 while closing,
// `lift` (0..1) is a gentle breeze on a resting page. Returns false when nothing moved (skip the upload).
export function stepLeaf(l: Leaf, hinge: number, y0: number, dt: number, t: number, e: number, dir: number, lift = 0): boolean {
  const { a, v } = l
  let energy = 0
  for (let k = 1; k < SEG; k++) energy += Math.abs(v[k])
  if (l.ready && lift === 0 && Math.abs(hinge - l.hinge) < 1e-6 && energy < 2e-3) return false
  if (!l.ready) { a.fill(hinge); v.fill(0) }
  // fixed-size physics steps (≈120 Hz) so a slow frame still advances in real time instead of lagging behind the animation
  const dtc = Math.min(dt, 0.1), steps = Math.max(2, Math.ceil(dtc / 0.0083)), h = dtc / steps, amp = LEAD * Math.sin(PI * e) * dir
  for (let sub = 0; sub < steps; sub++) {
    a[0] = hinge
    for (let k = 1; k < SEG; k++) {
      const s = k / SEG, up = k < SEG - 1
      let target = hinge - amp * Math.pow(s, 1.5)
      if (lift) target += lift * 0.12 * s * s * (0.55 + 0.45 * Math.sin(t * 1.1 + k * 0.4)) // the breeze lifts the free edge
      const acc = K_TRACK * (target - a[k]) - C_TRACK * v[k]
        + K_LINK * (a[k - 1] + (up ? a[k + 1] : a[k]) - 2 * a[k]) - C_LINK * (2 * v[k] - v[k - 1] - (up ? v[k + 1] : v[k]))
      v[k] += acc * h; a[k] += v[k] * h
      if (a[k] > 0.02) { a[k] = 0.02; v[k] *= -0.2 } else if (a[k] < -PI - 0.02) { a[k] = -PI - 0.02; v[k] *= -0.2 } // can't pass through the page below
    }
  }
  l.hinge = hinge; l.ready = true
  const pos = l.geo.attributes.position as THREE.BufferAttribute, n = (SEG + 1) * 2, ds = LW / SEG
  let x = -y0 * Math.sin(hinge), y = y0 * Math.cos(hinge) // the page's resting offset, rotated about the hinge
  for (let k = 0; k <= SEG; k++) {
    const ang = a[Math.min(k, SEG - 1)]
    const tx = -Math.cos(ang), ty = -Math.sin(ang), nx = ty, ny = -tx
    for (let j = 0; j < 2; j++) {
      const z = (j === 0 ? -1 : 1) * LD / 2, i = k * 2 + j
      pos.setXYZ(i, x + nx * TH, y + ny * TH, z); pos.setXYZ(n + i, x - nx * TH, y - ny * TH, z)
    }
    x += tx * ds; y += ty * ds
  }
  pos.needsUpdate = true; l.geo.computeVertexNormals(); l.geo.computeBoundingSphere()
  return true
}
