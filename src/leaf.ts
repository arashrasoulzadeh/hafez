import * as THREE from 'three'
import { SEG, LW, LD, TH } from './constants'

// A page that can curl: N segments along its width, rebuilt every frame from the hinge angle plus a lagging-tip bend.
export function makeLeafGeometry() {
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
export function bendLeaf(g: THREE.BufferGeometry, hingeAngle: number, p: number, y0: number, xOff: number) {
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
