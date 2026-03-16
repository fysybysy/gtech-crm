export const STAGES = [
  'Prospekt',
  '1 Wizyta',
  '2 Wizyta',
  '3 Wizyta',
  'Spotkanie produktowe',
  '1 Zamówienie',
  'Klient',
]

export const STAGE_STYLES = {
  'Prospekt':             { bg: 'rgba(180,180,180,0.12)', color: '#a0a0b0' },
  '1 Wizyta':             { bg: 'rgba(92,170,255,0.12)',  color: '#7ec8ff' },
  '2 Wizyta':             { bg: 'rgba(120,92,255,0.15)',  color: '#b09aff' },
  '3 Wizyta':             { bg: 'rgba(255,184,92,0.15)',  color: '#ffb85c' },
  'Spotkanie produktowe': { bg: 'rgba(255,120,92,0.15)',  color: '#ff9a7c' },
  '1 Zamówienie':         { bg: 'rgba(92,255,180,0.15)',  color: '#5cffb8' },
  'Klient':               { bg: 'rgba(212,255,92,0.15)',  color: '#d4ff5c' },
}

export const STAGE_STYLES_LIGHT = {
  'Prospekt':             { bg: '#e2e4e8', color: '#4a5060' },
  '1 Wizyta':             { bg: '#c8dff7', color: '#1a5a9a' },
  '2 Wizyta':             { bg: '#d8ccf5', color: '#4a2a9a' },
  '3 Wizyta':             { bg: '#fde9c4', color: '#8a5200' },
  'Spotkanie produktowe': { bg: '#fdd5c8', color: '#8a2a10' },
  '1 Zamówienie':         { bg: '#b8f0d8', color: '#0a6640' },
  'Klient':               { bg: '#d8f0a0', color: '#3a5a00' },
}

export function formatDate(d) {
  if (!d) return null
  const dt = new Date(d)
  if (isNaN(dt)) return null
  return dt.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function todayISO() {
  return new Date().toISOString().split('T')[0]
}

// ── Normalizacja tekstu — ignoruje polskie znaki ──────────
// "Łódź" === "lodz", "żółw" === "zolw" itd.
export function normalize(str) {
  if (!str) return ''
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/ł/g, 'l')   // ł → l (NFD nie rozkłada ł)
    .replace(/[̀-ͯ]/g, '') // usuwa diakrytyki po NFD
    .replace(/Ł/g, 'l')   // Ł → l
}

// Sprawdza czy haystack zawiera needle (oba znormalizowane)
export function matchSearch(haystack, needle) {
  return normalize(haystack).includes(normalize(needle))
}
