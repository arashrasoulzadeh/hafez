import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { once, softTexture } from './textures'

// incense smoke curling up from the burner
export default function Smoke({ position }: { position: [number, number, number] }) {
  const tex = useMemo(() => once('smoke', () => softTexture('200,212,240')), [])
  const refs = useRef<(THREE.Sprite | null)[]>([])
  const seeds = useMemo(() => Array.from({ length: 10 }, (_, i) => ({ ph: i / 10, a: Math.random() * 6.28, sp: 0.8 + Math.random() * 0.6 })), [])
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
