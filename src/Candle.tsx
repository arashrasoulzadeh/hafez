import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { M } from './materials'
import { once, softTexture } from './textures'

// A brass-based wax candle with a layered, flickering flame, a soft glow sprite and its own warm light.
export default function Candle({ position, phase = 0, height = 0.55 }: { position: [number, number, number]; phase?: number; height?: number }) {
  const flame = useRef<THREE.Group>(null), light = useRef<THREE.PointLight>(null), glow = useRef<THREE.Sprite>(null)
  const glowTex = once('flame-glow', () => softTexture('255,170,70'))
  const flameGeo = useMemo(() => new THREE.LatheGeometry([[0, 0], [0.026, 0.02], [0.038, 0.055], [0.03, 0.105], [0.015, 0.16], [0, 0.23]].map(([x, y]) => new THREE.Vector2(x, y)), 16), [])
  const saucer = useMemo(() => new THREE.LatheGeometry([[0, 0], [0.19, 0], [0.23, 0.035], [0.2, 0.04], [0.08, 0.025], [0, 0.03]].map(([x, y]) => new THREE.Vector2(x, y)), 28), [])
  const top = 0.045 + height
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + phase
    const fl = 1 + 0.12 * Math.sin(t * 11.3) + 0.08 * Math.sin(t * 27.1 + 1.3) + 0.05 * Math.sin(t * 47.9) + (Math.random() - 0.5) * 0.05
    if (flame.current) { flame.current.scale.set(1 + 0.07 * Math.sin(t * 17), 0.92 * fl, 1 + 0.07 * Math.cos(t * 13)); flame.current.rotation.z = Math.sin(t * 3.1) * 0.07; flame.current.rotation.x = Math.cos(t * 2.3) * 0.05 }
    if (light.current) light.current.intensity = 3.6 * fl
    if (glow.current) { const s = 0.7 * (0.94 + 0.1 * fl); glow.current.scale.set(s, s, 1); (glow.current.material as THREE.SpriteMaterial).opacity = 0.55 * fl }
  })
  return (
    <group position={position}>
      <mesh geometry={saucer}><primitive object={M.brass} attach="material" /></mesh>
      <mesh position-y={0.045 + height / 2}><cylinderGeometry args={[0.062, 0.068, height, 24]} /><meshStandardMaterial color="#efe3c4" roughness={0.65} /></mesh>
      <mesh position-y={top + 0.002}><cylinderGeometry args={[0.058, 0.062, 0.012, 24]} /><meshStandardMaterial color="#f6ecd2" roughness={0.5} emissive="#ff9a3c" emissiveIntensity={0.25} /></mesh>
      <mesh position={[0.05, top - 0.07, 0.03]} scale={[1, 2.5, 1]}><sphereGeometry args={[0.016, 8, 8]} /><meshStandardMaterial color="#efe3c4" roughness={0.6} /></mesh>
      <mesh position-y={top + 0.03}><cylinderGeometry args={[0.004, 0.004, 0.05, 6]} /><meshStandardMaterial color="#15110d" /></mesh>
      <group ref={flame} position-y={top + 0.045}>
        <mesh geometry={flameGeo}><meshBasicMaterial color="#ff8a1f" transparent opacity={0.8} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
        <mesh geometry={flameGeo} scale={[0.55, 0.62, 0.55]} position-y={0.004}><meshBasicMaterial color="#fff1b8" toneMapped={false} /></mesh>
        <mesh position-y={0.005} scale={[1, 0.6, 1]}><sphereGeometry args={[0.018, 10, 8]} /><meshBasicMaterial color="#5a7bff" transparent opacity={0.55} depthWrite={false} /></mesh>
        <sprite ref={glow} position-y={0.1}><spriteMaterial map={glowTex} transparent depthWrite={false} blending={THREE.AdditiveBlending} color="#ffb060" opacity={0.55} toneMapped={false} /></sprite>
      </group>
      <pointLight ref={light} position-y={top + 0.2} color="#ff9d3c" intensity={3.6} distance={8} decay={1.8} />
    </group>
  )
}
