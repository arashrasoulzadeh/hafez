import { useMemo } from 'react'
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

export default function Props() {
  return (
    <group>
      <group position={[-3.5, 0, 1.7]} rotation-y={0.4}><Inkwell /></group>
      <group position={[3.2, 0, 1.9]} rotation-y={-0.3}><FlaskAndCup /></group>
      <group position={[3.3, 0, 0.1]} rotation-y={0.3}><Rose /></group>
      <group position={[-3.7, 0, -0.4]}><Tasbih /></group>
      <group position={[-1.6, 0, -2.0]}><Scroll /></group>
      <group position={[2.0, 0, -2.3]}><Astrolabe /></group>
      <group position={[0.4, 0, 2.55]}><Ney /></group>
    </group>
  )
}
