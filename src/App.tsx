import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import Book3D from './Book3D'
import type { Ghazal, Stage } from './types'

function pick(n: number, niyat: string) {
  let h = 2166136261 ^ Date.now()
  for (const ch of niyat) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  h ^= Math.floor(Math.random() * 1e9)
  return Math.abs(h) % n
}

// Synthesised page turn: lift rustle -> swish through the air -> soft slap when the leaf lands
function makeFlip(ctx: AudioContext) {
  const noise = (secs: number, shape: (i: number, n: number) => number) => {
    const n = Math.floor(ctx.sampleRate * secs), buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0)
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * shape(i, n)
    return buf
  }
  const play = (buf: AudioBuffer, t0: number, type: BiquadFilterType, f0: number, f1: number, q: number, gain: number) => {
    const src = ctx.createBufferSource(); src.buffer = buf
    const f = ctx.createBiquadFilter(); f.type = type; f.Q.value = q
    f.frequency.setValueAtTime(f0, t0); f.frequency.exponentialRampToValueAtTime(f1, t0 + buf.duration)
    const g = ctx.createGain(); g.gain.value = gain
    src.connect(f).connect(g).connect(ctx.destination); src.start(t0)
  }
  const bell = (x: number, peak: number) => Math.exp(-Math.pow((x - peak) / 0.28, 2))
  return () => {
    const t = ctx.currentTime, v = 0.85 + Math.random() * 0.3
    // paper fibres rustling as the page lifts: sparse crackles
    play(noise(1.0, (i, n) => bell(i / n, 0.3) * (Math.random() < 0.06 ? 1 : 0.12)), t, 'highpass', 2200 * v, 3200 * v, 0.7, 0.8)
    // air swish as it sweeps over
    play(noise(0.9, (i, n) => bell(i / n, 0.45) * 0.7), t + 0.05, 'bandpass', 1400 * v, 3800 * v, 0.8, 0.55)
    // soft slap on landing
    play(noise(0.14, (i, n) => Math.pow(1 - i / n, 2.5)), t + 0.95, 'lowpass', 900, 300, 0.7, 0.9)
  }
}

export default function App() {
  const [stage, setStage] = useState<Stage>('intro')
  const [data, setData] = useState<Ghazal[]>([])
  const [ghazal, setGhazal] = useState<Ghazal | null>(null)
  const [niyat, setNiyat] = useState('')
  const openRef = useRef(0)
  const [seed, setSeed] = useState(0)
  const [page, setPage] = useState<'poem' | 'tafsir'>('poem')
  const [music, setMusic] = useState(false)
  const [portrait, setPortrait] = useState(innerWidth / innerHeight < 0.9)
  const audio = useRef<HTMLAudioElement | null>(null)
  const prog = useRef({ v: 0 })
  const flipRef = useRef<() => void>(() => {})

  useEffect(() => { fetch('/ghazals.json').then(r => r.json()).then(setData) }, [])
  useEffect(() => { const f = () => setPortrait(innerWidth / innerHeight < 0.9); addEventListener('resize', f); return () => removeEventListener('resize', f) }, [])
  useEffect(() => { const el = audio.current; if (!el) return; if (music) el.play().catch(() => {}); else el.pause() }, [music])

  const start = () => {
    if (!audio.current) { audio.current = new Audio('/audio/sample.wav'); audio.current.loop = true; audio.current.volume = 0.5 }
    const Ctx = window.AudioContext || (window as any).webkitAudioContext
    const ctx = new Ctx(); const f = makeFlip(ctx); flipRef.current = f
    setStage('niyat')
  }
  const takeFal = () => {
    if (!data.length) return
    setGhazal(data[pick(data.length, niyat)]); setPage('poem'); setStage('opening')
    gsap.to(prog.current, { v: 1, duration: 5.5, ease: 'power1.inOut', onUpdate: () => { openRef.current = prog.current.v }, onComplete: () => setStage('result') })
  }
  const again = () => {
    setStage('opening')
    gsap.to(prog.current, { v: 0, duration: 3, ease: 'power1.inOut', onUpdate: () => { openRef.current = prog.current.v }, onComplete: () => { setGhazal(null); setNiyat(''); setSeed(n => n + 1); setStage('niyat') } })
  }

  return (
    <>
      <Book3D openRef={openRef} seed={seed} page={page} ghazal={ghazal} data={data} onFlip={() => flipRef.current()} />
      <div className="title">فال حافظ</div>
      {stage !== 'intro' && <button className="btn small mute" onClick={() => setMusic(m => !m)}>{music ? 'موسیقی: روشن' : 'موسیقی: خاموش'}</button>}
      <div className="ui">
        {stage === 'intro' && (<><p className="hint">به نام خداوند جان و خرد</p><button className="btn" onClick={start}>آغاز</button></>)}
        {stage === 'niyat' && (<>
          <p className="hint">نیت کن، سپس فال بگیر</p>
          <textarea className="niyat" rows={2} placeholder="نیت خود را بنویس (اختیاری)…" value={niyat} onChange={e => setNiyat(e.target.value)} />
          <button className="btn" onClick={takeFal} disabled={!data.length}>فال بگیر</button>
        </>)}
        {stage === 'result' && (
          <div className="row pagebtns">
            {portrait && <button className="btn small" onClick={() => setPage(p => p === 'poem' ? 'tafsir' : 'poem')}>{page === 'poem' ? 'تفسیر ←' : '→ شعر'}</button>}
            <button className="btn small" onClick={again}>فال دوباره</button>
          </div>
        )}
      </div>
    </>
  )
}
