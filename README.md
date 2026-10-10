# فال حافظ — Hafez Fal

A responsive 3D Hafez divination: set an intention, a book opens and its pages turn until they settle on your ghazal, with its interpretation.

- Built by [Arash Rasoulzadeh](https://github.com/arashrasoulzadeh), with help from [Claude](https://claude.com/claude-code).
- Poems and interpretations are from [Ganjoor](https://ganjoor.net/hafez) (fetched with `scripts/fetch.py`, stored in `data/hafez.db`).
- Stack: Vite, React, TypeScript, react-three-fiber, GSAP.

```
npm install
npm run dev
```

## Code layout

- `src/App.tsx` — flow (intro → intention → book opens → fal), audio, full-interpretation dialog.
- `src/Book3D.tsx` — the 3D scene: book, lights, camera, table.
- `src/leaf.ts` — bendable page geometry (page curl).
- `src/textures.ts` — every procedural texture (cover, pages, wood, tiles…), built once and shared.
- `src/materials.ts` — shared brass/gold/wood/cloth materials.
- `src/Props.tsx`, `Candle.tsx`, `Smoke.tsx` — the objects on the table.
- `data/` and `scripts/` — the Ganjoor corpus and the scripts that fetch it.

Interpretations come from Ganjoor and are AI-generated there; the app says so on the interpretation page.
