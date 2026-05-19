const CLIENT_ID = '749221872428-4lrqp3h98f0b06f0laokmr75qerm0fq5.apps.googleusercontent.com'
const CALENDAR_ID = 'l1bajerowski@gmail.com'
const SCOPES = 'https://www.googleapis.com/auth/calendar.events'
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'
const TOKEN_KEY = 'gtech_gtoken'

let tokenClient = null
let initPromise = null
let refreshTimer = null

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
    const s = document.createElement('script')
    s.src = src; s.onload = resolve; s.onerror = reject
    document.head.appendChild(s)
  })
}

function saveToken(token) {
  if (!token?.access_token) return
  localStorage.setItem(TOKEN_KEY, JSON.stringify({ ...token, saved_at: Date.now() }))
}

function loadSavedToken() {
  try {
    const raw = localStorage.getItem(TOKEN_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    // Keep for up to 55 min (token lasts 60min)
    if (Date.now() - data.saved_at < 55 * 60 * 1000) return data
    return null
  } catch { return null }
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export async function initGoogleCalendar() {
  if (initPromise) return initPromise
  initPromise = (async () => {
    await loadScript('https://apis.google.com/js/api.js')
    await loadScript('https://accounts.google.com/gsi/client')
    await new Promise(r => window.gapi.load('client', r))
    await window.gapi.client.init({ discoveryDocs: [DISCOVERY_DOC] })

    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: () => {},
      // No popup — use existing Google session in browser
      prompt: '',
    })

    // Restore saved token immediately
    const saved = loadSavedToken()
    if (saved) {
      window.gapi.client.setToken(saved)
      scheduleRefresh()
    }
  })()
  return initPromise
}

export function isSignedIn() {
  const token = window.gapi?.client?.getToken()
  return !!(token?.access_token)
}

// Full sign in — shows Google account picker once
export async function signIn() {
  return new Promise((resolve, reject) => {
    tokenClient.callback = (resp) => {
      if (resp.error) { reject(new Error(resp.error)); return }
      const token = window.gapi.client.getToken()
      saveToken(token)
      scheduleRefresh()
      resolve(token)
    }
    tokenClient.requestAccessToken({ prompt: 'select_account' })
  })
}

// Silent refresh — no popup, uses existing browser Google session
async function silentRefresh() {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), 5000) // 5s timeout
    tokenClient.callback = (resp) => {
      clearTimeout(timer)
      if (resp.error) { resolve(false); return }
      const token = window.gapi.client.getToken()
      saveToken(token)
      resolve(true)
    }
    // prompt: '' means no UI shown — uses existing Google session
    tokenClient.requestAccessToken({ prompt: '' })
  })
}

// Schedule auto-refresh every 45 minutes
function scheduleRefresh() {
  if (refreshTimer) clearInterval(refreshTimer)
  refreshTimer = setInterval(async () => {
    if (isSignedIn()) {
      await silentRefresh()
    }
  }, 45 * 60 * 1000)
}

// Called before any API call — ensures valid token
export async function ensureSignedIn() {
  if (isSignedIn()) return true
  // Try to restore from localStorage
  const saved = loadSavedToken()
  if (saved) {
    window.gapi.client.setToken(saved)
    scheduleRefresh()
    return true
  }
  // Try silent refresh (no popup)
  const ok = await silentRefresh()
  if (ok) { scheduleRefresh(); return true }
  return false
}

export function signOut() {
  if (refreshTimer) clearInterval(refreshTimer)
  const token = window.gapi?.client?.getToken()
  if (token?.access_token) {
    window.google.accounts.oauth2.revoke(token.access_token, () => {})
  }
  window.gapi?.client?.setToken(null)
  clearToken()
}

export async function addCalendarEvent({ title, address, date, hour, description }) {
  const ok = await ensureSignedIn()
  if (!ok) throw new Error('not_signed_in')

  const [year, month, day] = date.split('-').map(Number)
  const start = new Date(year, month - 1, day, hour, 0, 0)
  const end = new Date(year, month - 1, day, hour + 1, 0, 0)

  const response = await window.gapi.client.calendar.events.insert({
    calendarId: CALENDAR_ID,
    resource: {
      summary: title,
      location: address || '',
      description: description || '',
      start: { dateTime: start.toISOString(), timeZone: 'Europe/Warsaw' },
      end: { dateTime: end.toISOString(), timeZone: 'Europe/Warsaw' },
    },
  })
  return response.result
}

export async function getUpcomingEvents(days = 30) {
  const ok = await ensureSignedIn()
  if (!ok) return []
  try {
    const now = new Date()
    const end = new Date(); end.setDate(end.getDate() + days)
    const response = await window.gapi.client.calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin: now.toISOString(),
      timeMax: end.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 50,
    })
    return response.result.items || []
  } catch { return [] }
}
