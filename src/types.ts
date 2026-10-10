export type Couplet = { v: string[]; s: string | null }
export type Ghazal = { n: number; title: string; summary: string | null; couplets: Couplet[] }
export type Stage = 'intro' | 'niyat' | 'opening' | 'result'

// Ganjoor's generated interpretations begin with an "AI:" label; strip it and say so once in the UI instead
export const cleanTafsir = (s: string) => s.replace(/\s+/g, ' ').replace(/^\s*هوش مصنوعی\s*:\s*/, '').trim()
export const TAFSIR_NOTE = 'تفسیرها را هوش مصنوعی در گنجور تولید کرده و ممکن است خطا داشته باشند.'
