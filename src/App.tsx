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

// Real page-turn recording (public/audio/flip.mp3), decoded once and replayed with a little pitch variation
async function loadFlip(ctx: AudioContext) {
  const buf = await ctx.decodeAudioData(await (await fetch(`${import.meta.env.BASE_URL}audio/flip.mp3`)).arrayBuffer())
  return () => {
    const src = ctx.createBufferSource(); src.buffer = buf; src.playbackRate.value = 0.92 + Math.random() * 0.16
    const g = ctx.createGain(); g.gain.value = 0.9
    src.connect(g).connect(ctx.destination); src.start()
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
  const [zoomOut, setZoomOut] = useState(false)
  const [portrait, setPortrait] = useState(innerWidth / innerHeight < 0.9)
  const audio = useRef<HTMLAudioElement | null>(null)
  const prog = useRef({ v: 0 })
  const flipRef = useRef<() => void>(() => {})

  useEffect(() => { fetch(`${import.meta.env.BASE_URL}ghazals.json`).then(r => r.json()).then(setData) }, [])
  useEffect(() => { const f = () => setPortrait(innerWidth / innerHeight < 0.9); addEventListener('resize', f); return () => removeEventListener('resize', f) }, [])
  useEffect(() => { const el = audio.current; if (!el) return; if (music) el.play().catch(() => {}); else el.pause() }, [music])

  const start = () => {
    if (!audio.current) { audio.current = new Audio(`${import.meta.env.BASE_URL}audio/sample.wav`); audio.current.loop = true; audio.current.volume = 0.5 }
    const Ctx = window.AudioContext || (window as any).webkitAudioContext
    const ctx = new Ctx(); loadFlip(ctx).then(f => { flipRef.current = f }).catch(() => {})
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
      <Book3D zoomOut={zoomOut} openRef={openRef} seed={seed} page={page} ghazal={ghazal} data={data} onFlip={() => flipRef.current()} />
      <div className="title">فال حافظ</div>
      <footer className="credits">
        <span>ساخته‌شده توسط <a href="https://github.com/arashrasoulzadeh" target="_blank" rel="noreferrer">آرش رسول‌زاده</a></span>
        <span>با کمک <a href="https://claude.com/claude-code" target="_blank" rel="noreferrer">Claude</a></span>
        <span>متن غزل‌ها و تفسیر: <a href="https://ganjoor.net/hafez" target="_blank" rel="noreferrer">گنجور</a></span>
      </footer>
      {stage !== 'intro' && <button className="btn small mute" onClick={() => setMusic(m => !m)}>{music ? 'موسیقی: روشن' : 'موسیقی: خاموش'}</button>}
      {stage !== 'intro' && (
        <button className="btn small zoom" onClick={() => setZoomOut(z => !z)} aria-label={zoomOut ? 'نزدیک‌تر' : 'نمای کلی میز'} title={zoomOut ? 'نزدیک‌تر' : 'نمای کلی میز'}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="10.5" cy="10.5" r="6.5" /><path d="M20 20l-4.8-4.8M7.5 10.5h6" />{!zoomOut && null}{zoomOut && <path d="M10.5 7.5v6" />}</svg>
        </button>
      )}
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
