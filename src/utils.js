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
  'Nieudane/Na później':  { bg: 'rgba(220,50,50,0.15)',   color: '#ff6b6b' },
  'Prospekt':             { bg: 'rgba(160,160,170,0.12)', color: '#a8a8b8' },
  'Nowy':                 { bg: 'rgba(255,160,50,0.15)',  color: '#ffaa44' },
  'Spotkanie produktowe': { bg: 'rgba(255,120,92,0.15)',  color: '#ff9a7c' },
  '1 Zamówienie':         { bg: 'rgba(50,180,100,0.15)',  color: '#4ec87a' },
  'Klient':               { bg: 'rgba(50,180,100,0.15)',  color: '#4ec87a' },
}

export const STAGE_STYLES_LIGHT = {
  'Nieudane/Na później':  { bg: '#fde8e8', color: '#c0392b' },
  'Prospekt':             { bg: '#e8e8ec', color: '#666676' },
  'Nowy':                 { bg: '#fff0d8', color: '#b86a00' },
  'Spotkanie produktowe': { bg: '#fdd5c8', color: '#8a2a10' },
  '1 Zamówienie':         { bg: '#d4f0e0', color: '#1a6b3a' },
  'Klient':               { bg: '#d4f0e0', color: '#1a6b3a' },
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
