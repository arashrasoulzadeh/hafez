import * as THREE from 'three'
import { SEG, LW, LD, TH } from './constants'

const K = 600 // stiffness between neighbouring segments
const C_AIR = 2.0 // air drag on each segment (makes the free edge lag behind the hinge)
const C_REL = 8 // internal damping, so waves die out
const G = 25 // pull towards the surface the page rests on
const PI = Math.PI

// A page made of SEG stiff segments joined by springs. The hinge angle is driven by the animation; the rest follows physically,
// so the free edge trails the hinge, overshoots and settles when the page lands.
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

// Advance the page by dt seconds. `lift` (0..1) is a gentle breeze on a resting page. Returns false when nothing moved (skip the upload).
export function stepLeaf(l: Leaf, hinge: number, y0: number, dt: number, t: number, lift = 0): boolean {
  const { a, v } = l
  let energy = 0
  for (let k = 1; k < SEG; k++) energy += Math.abs(v[k])
  if (l.ready && lift === 0 && Math.abs(hinge - l.hinge) < 1e-6 && energy < 2e-3) return false
  if (!l.ready) { a.fill(hinge); v.fill(0) }
  const h = Math.min(dt, 1 / 30) / 2
  for (let sub = 0; sub < 2; sub++) {
    a[0] = hinge
    for (let k = 1; k < SEG; k++) {
      const s = k / SEG, rest = a[k] < -PI / 2 ? -PI : 0
      let acc = K * (a[k - 1] - a[k]) - C_AIR * v[k] - C_REL * (v[k] - v[k - 1]) + G * (rest - a[k]) * s
      if (k < SEG - 1) acc += K * (a[k + 1] - a[k]) - C_REL * (v[k] - v[k + 1])
      if (lift) acc += lift * 3.2 * s * s * (0.55 + 0.45 * Math.sin(t * 1.1 + k * 0.4))
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
