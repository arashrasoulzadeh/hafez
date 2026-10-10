import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import Book3D from './Book3D'
import { cleanTafsir, TAFSIR_NOTE, type Ghazal, type Stage } from './types'
import { world } from './constants'

// On slow devices keep real-time pacing instead of letting gsap stretch the animation frame by frame
gsap.ticker.lagSmoothing(0)
world.lit = 0.2 // the room starts nearly dark; the candles come up when the visitor begins

function pick(n: number, niyat: string) {
  let h = 2166136261 ^ Date.now()
  for (const ch of niyat) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  h ^= Math.floor(Math.random() * 1e9)
  return Math.abs(h) % n
}

// Real page-turn recording (public/audio/flip.mp3), decoded once and replayed with a little pitch variation
async function loadFlip(ctx: AudioContext) {
  const buf = await ctx.decodeAudioData(await (await fetch(`${import.meta.env.BASE_URL}audio/flip.mp3`)).arrayBuffer())
  return (rate = 1, gain = 0.9) => {
    const src = ctx.createBufferSource(); src.buffer = buf; src.playbackRate.value = rate * (0.94 + Math.random() * 0.12)
    const g = ctx.createGain(); g.gain.value = gain
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
  const [pages, setPages] = useState(12)
  const [showTafsir, setShowTafsir] = useState(false)
  const [portrait, setPortrait] = useState(innerWidth / innerHeight < 0.9)
  const audio = useRef<HTMLAudioElement | null>(null)
  const prog = useRef({ v: 0 })
  const flipRef = useRef<(rate?: number, gain?: number) => void>(() => {})

  useEffect(() => { if (import.meta.env.DEV) (window as unknown as { __openRef: typeof openRef }).__openRef = openRef }, []) // dev only: lets me scrub the opening animation
  useEffect(() => { fetch(`${import.meta.env.BASE_URL}ghazals.json`).then(r => r.json()).then(setData) }, [])
  // Back button: the open book and every overlay push a history entry, so the browser / Android back button peels them off one by one
  const layers = useRef<{ id: string; close: () => void }[]>([])
  const resultDepth = useRef(0)
  const topId = () => layers.current[layers.current.length - 1]?.id
  const openLayer = (id: string, close: () => void) => { layers.current.push({ id, close }); history.pushState({ d: layers.current.length }, '') }
  const unwind = (to = layers.current.length - 1) => { const n = layers.current.length - Math.max(0, to); if (n > 0) history.go(-n) }
  useEffect(() => {
    history.replaceState({ d: 0 }, '')
    const pop = (e: PopStateEvent) => { const d = e.state?.d ?? 0; while (layers.current.length > d) layers.current.pop()?.close() }
    addEventListener('popstate', pop)
    return () => removeEventListener('popstate', pop)
  }, [])
  const openTafsir = () => { if (topId() === 'read') return; openLayer('read', () => setShowTafsir(false)); setShowTafsir(true) }
  const toggleZoom = () => {
    if (!zoomOut) { openLayer('zoom', () => setZoomOut(false)); setZoomOut(true) }
    else if (topId() === 'zoom') unwind()
    else setZoomOut(false)
  }
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === 'Escape' && topId() === 'read') unwind() }; addEventListener('keydown', k); return () => removeEventListener('keydown', k) }, [])
  useEffect(() => { const f = () => setPortrait(innerWidth / innerHeight < 0.9); addEventListener('resize', f); return () => removeEventListener('resize', f) }, [])
  useEffect(() => { const el = audio.current; if (!el) return; if (music) el.play().catch(() => {}); else el.pause() }, [music])

  const start = () => {
    if (!audio.current) { audio.current = new Audio(`${import.meta.env.BASE_URL}audio/sample.wav`); audio.current.loop = true; audio.current.volume = 0.5 }
    const Ctx = window.AudioContext || (window as any).webkitAudioContext
    const ctx = new Ctx(); ctx.resume().catch(() => {}); loadFlip(ctx).then(f => { flipRef.current = f }).catch(() => {})
    gsap.to(world, { lit: 1, duration: 3.2, ease: 'power2.out' })
    setStage('niyat')
  }
  const takeFal = () => {
    if (!data.length) return
    const n = 8 + Math.floor(Math.random() * 13) // 8–20 pages before the fal
    setPages(n); setGhazal(data[pick(data.length, niyat)]); setPage('poem'); setStage('opening')
    gsap.to(prog.current, { v: 1, duration: 3.5 + n * 0.28, ease: 'power1.inOut', onUpdate: () => { openRef.current = prog.current.v }, onComplete: () => { setStage('result'); openLayer('result', again); resultDepth.current = layers.current.length } })
  }
  const again = () => {
    setStage('opening')
    gsap.to(prog.current, { v: 0, duration: 4.5, ease: 'power1.inOut', onUpdate: () => { openRef.current = prog.current.v }, onComplete: () => { setGhazal(null); setNiyat(''); setSeed(n => n + 1); setStage('niyat') } })
  }

  return (
    <>
      <Book3D pages={pages} zoomOut={zoomOut} openRef={openRef} seed={seed} page={page} ghazal={ghazal} data={data} onFlip={(r, g) => flipRef.current(r, g)} />
      {stage === 'result' && !showTafsir && !zoomOut && <div className="read-hit" onClick={openTafsir} aria-hidden />}
      <div className="vignette" />
      <div className="title">فال حافظ</div>
      {showTafsir && ghazal && (
        <div className="modal" onClick={() => unwind()}>
          <div className="sheet" onClick={e => e.stopPropagation()} role="dialog" aria-label="تفسیر کامل">
            <button className="btn small close" onClick={() => unwind()}>بستن</button>
            <h2>{ghazal.title}</h2>
            {ghazal.summary && <p className="sum">{cleanTafsir(ghazal.summary)}</p>}
            {ghazal.couplets.map((c, i) => (
              <section key={i}>
                <div className="verse">{c.v.map((l, j) => <span key={j}>{l}</span>)}</div>
                {c.s && <p>{cleanTafsir(c.s)}</p>}
              </section>
            ))}
            <small>{TAFSIR_NOTE} منبع: <a href="https://ganjoor.net/hafez" target="_blank" rel="noreferrer">گنجور</a></small>
          </div>
        </div>
      )}
      <footer className="credits">
        <span>ساخته‌شده توسط <a href="https://github.com/arashrasoulzadeh" target="_blank" rel="noreferrer">آرش رسول‌زاده</a></span>
        <span>با کمک <a href="https://claude.com/claude-code" target="_blank" rel="noreferrer">Claude</a></span>
        <span>متن غزل‌ها و تفسیر: <a href="https://ganjoor.net/hafez" target="_blank" rel="noreferrer">گنجور</a></span>
      </footer>
      {stage !== 'intro' && <button className="btn small mute" onClick={() => setMusic(m => !m)}>{music ? 'موسیقی: روشن' : 'موسیقی: خاموش'}</button>}
      {stage !== 'intro' && (
        <button className="btn small zoom" onClick={toggleZoom} aria-label={zoomOut ? 'نزدیک‌تر' : 'نمای کلی میز'} title={zoomOut ? 'نزدیک‌تر' : 'نمای کلی میز'}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="10.5" cy="10.5" r="6.5" /><path d="M20 20l-4.8-4.8M7.5 10.5h6" />{!zoomOut && null}{zoomOut && <path d="M10.5 7.5v6" />}</svg>
        </button>
      )}
      <div className="ui">
        {stage === 'intro' && (<><p className="hint">به نام خداوند جان و خرد</p><button className="btn" onClick={start}>آغاز</button></>)}
        {stage === 'niyat' && (<>
          <p className="hint">نیت کن، سپس فال بگیر</p>
          <textarea className="niyat" aria-label="نیت" rows={2} placeholder="نیت خود را بنویس (اختیاری)…" value={niyat} onChange={e => setNiyat(e.target.value)} />
          <button className="btn" onClick={takeFal} disabled={!data.length}>فال بگیر</button>
        </>)}
        {stage === 'result' && (
          <div className="row pagebtns">
            {portrait && <button className="btn small" onClick={() => setPage(p => p === 'poem' ? 'tafsir' : 'poem')}>{page === 'poem' ? 'تفسیر ←' : '→ شعر'}</button>}
            <button className="btn small" onClick={openTafsir}>تفسیر کامل</button>
            <button className="btn small" onClick={() => unwind(resultDepth.current - 1)}>فال دوباره</button>
          </div>
        )}
      </div>
    </>
  )
}
