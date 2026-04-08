export const STAGES = [
  'Nieudane/Na później',
  'Prospekt',
  'Nowy',
  'Spotkanie produktowe',
  '1 Zamówienie',
  'Klient',
]

// Etapy które były "wizytami" — migracja
export const VISIT_STAGES = ['1 Wizyta', '2 Wizyta', '3 Wizyta']

export const STAGE_STYLES = {
  'Nieudane/Na później':  { bg: 'rgba(120,120,130,0.15)', color: '#888896' },
  'Prospekt':             { bg: 'rgba(180,180,180,0.12)', color: '#a0a0b0' },
  'Nowy':                 { bg: 'rgba(92,170,255,0.12)',  color: '#7ec8ff' },
  'Spotkanie produktowe': { bg: 'rgba(255,120,92,0.15)',  color: '#ff9a7c' },
  '1 Zamówienie':         { bg: 'rgba(92,255,180,0.15)',  color: '#5cffb8' },
  'Klient':               { bg: 'rgba(212,255,92,0.15)',  color: '#d4ff5c' },
}

export const STAGE_STYLES_LIGHT = {
  'Nieudane/Na później':  { bg: '#e8e8ec', color: '#555560' },
  'Prospekt':             { bg: '#e2e4e8', color: '#4a5060' },
  'Nowy':                 { bg: '#c8dff7', color: '#1a5a9a' },
  'Spotkanie produktowe': { bg: '#fdd5c8', color: '#8a2a10' },
  '1 Zamówienie':         { bg: '#1a6b3a', color: '#ffffff' },
  'Klient':               { bg: '#155c2e', color: '#ffffff' },
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

// Normalizacja tekstu — ignoruje polskie znaki
export function normalize(str) {
  if (!str) return ''
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/\u0142/g, 'l')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0141/g, 'l')
}

export function matchSearch(haystack, needle) {
  return normalize(haystack).includes(normalize(needle))
}

// Migracja etapu: 1/2/3 Wizyta → Nowy
export function migrateStage(stage) {
  if (VISIT_STAGES.includes(stage)) return 'Nowy'
  return stage
}
