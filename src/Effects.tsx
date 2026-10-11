import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, Bloom, DepthOfField, SMAA, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'

// Loaded lazily (own chunk) so the first paint doesn't wait for the post-processing library.
// Bloom on the candle flames and brass glints, plus a focal plane that rests on the book (and on the page while reading).
// The composer renders to a linear target, so tone mapping moves from the renderer into the chain; SMAA replaces MSAA (a multisampled
// half-float target at retina size is the single biggest memory cost in the scene).
const TOUCH = window.matchMedia('(pointer: coarse)').matches
const FOCUS = new THREE.Vector3(0, 0.35, 0)

export default function Effects({ zoomOut, reading }: { zoomOut: boolean; reading: boolean }) {
  const gl = useThree(st => st.gl)
  const dof = useRef<any>(null)
  const st = useRef({ range: 1.7, bokeh: 2.2, y: 0.35 })
  useEffect(() => {
    const prev = gl.toneMapping
    gl.toneMapping = THREE.NoToneMapping
    return () => { gl.toneMapping = prev }
  }, [gl])
  useFrame(({ camera }, dt) => {
    const e = dof.current; if (!e) return
    const s = st.current, k = 1 - Math.exp(-dt * 2.5)
    // the camera looks at the open book at a slant, so the page spans ~1 unit of view depth: the sharp zone must cover the whole page
    s.range += ((reading ? 1.35 : 1.7) - s.range) * k
    s.bokeh += ((zoomOut ? 0 : reading ? 2.8 : 2.2) - s.bokeh) * k
    s.y += ((reading ? 0.45 : 0.35) - s.y) * k
    FOCUS.y = s.y
    e.circleOfConfusionMaterial.worldFocusDistance = camera.position.distanceTo(FOCUS)
    e.circleOfConfusionMaterial.worldFocusRange = s.range
    e.bokehScale = s.bokeh
  })
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <DepthOfField ref={dof} bokehScale={2.4} height={TOUCH ? 300 : 440} />
      <Bloom mipmapBlur luminanceThreshold={0.8} luminanceSmoothing={0.25} intensity={0.55} radius={0.7} />
      <SMAA />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  )
}
