import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, Bloom, DepthOfField, SMAA, ToneMapping, wrapEffect } from '@react-three/postprocessing'
import { Effect, EffectAttribute, ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'

// Loaded lazily (own chunk) so the first paint doesn't wait for the post-processing library.
// Bloom on the candle flames and brass glints, plus a focal plane that rests on the book (and on the page while reading).
// The composer renders to a linear target, so tone mapping moves from the renderer into the chain; SMAA replaces MSAA (a multisampled
// half-float target at retina size is the single biggest memory cost in the scene).
// Contrast-adaptive-style sharpening, run last on the tone-mapped image: it undoes the softness that resampling a texture at a slant
// (and the anti-aliasing pass) adds to thin letter strokes.
const SHARPEN = `uniform float amount;
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec3 c = inputColor.rgb;
  vec3 b = (texture2D(inputBuffer, uv + vec2(texelSize.x, 0.0)).rgb + texture2D(inputBuffer, uv - vec2(texelSize.x, 0.0)).rgb
          + texture2D(inputBuffer, uv + vec2(0.0, texelSize.y)).rgb + texture2D(inputBuffer, uv - vec2(0.0, texelSize.y)).rgb) * 0.25;
  outputColor = vec4(clamp(c + (c - b) * amount, 0.0, 1.0), inputColor.a);
}`
class SharpenEffect extends Effect {
  constructor({ amount = 0.5 }: { amount?: number } = {}) { super('SharpenEffect', SHARPEN, { attributes: EffectAttribute.CONVOLUTION, uniforms: new Map([['amount', new THREE.Uniform(amount)]]) }) }
}
const Sharpen = wrapEffect(SharpenEffect)

const TOUCH = window.matchMedia('(pointer: coarse)').matches
const FOCUS = new THREE.Vector3(0, 0.35, 0)

export default function Effects({ zoomOut, reading }: { zoomOut: boolean; reading: boolean }) {
  const gl = useThree(st => st.gl)
  const dof = useRef<any>(null)
  const bloom = useRef<any>(null)
  const sharpen = useRef<any>(null)
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
    if (sharpen.current) { const u = sharpen.current.uniforms.get('amount'); u.value += ((reading ? 0.85 : 0.45) - u.value) * k } // strongest while reading
    if (bloom.current) bloom.current.intensity += ((reading ? 0.22 : 0.6) - bloom.current.intensity) * k // no haze over the page while reading
  })
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <DepthOfField ref={dof} bokehScale={2.4} height={TOUCH ? 320 : 540} />
      <Bloom ref={bloom} mipmapBlur luminanceThreshold={1.05} luminanceSmoothing={0.15} intensity={0.6} radius={0.7} />
      <SMAA />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Sharpen ref={sharpen} />
    </EffectComposer>
  )
}
