const CLIENT_ID = '749221872428-4lrqp3h98f0b06f0laokmr75qerm0fq5.apps.googleusercontent.com'
const CALENDAR_ID = 'l1bajerowski@gmail.com'
const SCOPES = 'https://www.googleapis.com/auth/calendar.events'
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'
const TOKEN_KEY = 'gtech_gtoken'

let gapiInited = false
let tokenClient = null
let initPromise = null

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
    const s = document.createElement('script')
    s.src = src; s.onload = resolve; s.onerror = reject
    document.head.appendChild(s)
  })
}

function saveToken(token) {
  if (!token) return
  const data = { ...token, saved_at: Date.now() }
  localStorage.setItem(TOKEN_KEY, JSON.stringify(data))
}

function loadToken() {
  try {
    const raw = localStorage.getItem(TOKEN_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    // Token valid for 1 hour — restore if less than 50 min old
    const age = (Date.now() - data.saved_at) / 1000
    if (age < 3000) return data
    return null
  } catch { return null }
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export async function initGoogleCalendar() {
  if (initPromise) return initPromise
  initPromise = (async () => {
    await loadScript('https://apis.google.com/js/api.js')
    await loadScript('https://accounts.google.com/gsi/client')
    await new Promise(r => window.gapi.load('client', r))
    await window.gapi.client.init({ discoveryDocs: [DISCOVERY_DOC] })
    gapiInited = true

    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: () => {},
    })

    // Restore saved token
    const saved = loadToken()
    if (saved) {
      window.gapi.client.setToken(saved)
    }
  })()
  return initPromise
}

export function isSignedIn() {
  const token = window.gapi?.client?.getToken()
  return !!(token?.access_token)
}

export async function signIn() {
  return new Promise((resolve, reject) => {
    tokenClient.callback = (resp) => {
      if (resp.error) { reject(resp); return }
      saveToken(window.gapi.client.getToken())
      resolve(resp)
    }
    // Try silent refresh first, fall back to consent screen
    tokenClient.requestAccessToken({ prompt: '' })
  })
}

// Silent refresh — called automatically, no popup
export async function silentRefresh() {
  return new Promise((resolve) => {
    tokenClient.callback = (resp) => {
      if (resp.error) { clearToken(); resolve(false); return }
      saveToken(window.gapi.client.getToken())
      resolve(true)
    }
    tokenClient.requestAccessToken({ prompt: 'none' })
  })
}

export function signOut() {
  const token = window.gapi?.client?.getToken()
  if (token) {
    window.google.accounts.oauth2.revoke(token.access_token)
    window.gapi.client.setToken(null)
  }
  clearToken()
}

async function ensureToken() {
  if (isSignedIn()) return true
  // Try to restore from localStorage
  const saved = loadToken()
  if (saved) {
    window.gapi.client.setToken(saved)
    return true
  }
  // Try silent refresh
  const ok = await silentRefresh()
  return ok
}

export async function addCalendarEvent({ title, address, date, hour, description }) {
  await ensureToken()
  if (!isSignedIn()) throw new Error('not_signed_in')

  const [year, month, day] = date.split('-').map(Number)
  const start = new Date(year, month - 1, day, hour, 0, 0)
  const end = new Date(year, month - 1, day, hour + 1, 0, 0)

  const event = {
    summary: title,
    location: address || '',
    description: description || '',
    start: { dateTime: start.toISOString(), timeZone: 'Europe/Warsaw' },
    end: { dateTime: end.toISOString(), timeZone: 'Europe/Warsaw' },
  }

  const response = await window.gapi.client.calendar.events.insert({
    calendarId: CALENDAR_ID,
    resource: event,
  })
  return response.result
}

export async function getUpcomingEvents(days = 30) {
  const ok = await ensureToken()
  if (!ok) return []
  try {
    const now = new Date()
    const end = new Date()
    end.setDate(end.getDate() + days)
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
