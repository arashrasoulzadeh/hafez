export const W = 2.0 // page width
export const D = 2.8 // page depth
export const PIVOT_Y = 0.45 // hinge height above the table
export const MAXL = 20 // the book has between 8 and 20 leaves before the fal; unused ones are hidden
export const DY = 0.004 // vertical gap between stacked leaves
export const SEG = 16 // segments along a leaf, so it can curl
export const LW = W - 0.06
export const LD = D - 0.08
export const TH = 0.0015 // half thickness of a leaf
export const clamp = (x: number) => Math.min(1, Math.max(0, x))
export const ease = (x: number) => x * x * (3 - 2 * x)

// Shared, mutable scene state written by the UI layer and read inside the render loop (no React re-renders)
export const world = { lit: 1 } // 0 = candles barely lit, 1 = full light
