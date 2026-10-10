export type Couplet = { v: string[]; s: string | null }
export type Ghazal = { n: number; title: string; summary: string | null; couplets: Couplet[] }
export type Stage = 'intro' | 'niyat' | 'opening' | 'result'
