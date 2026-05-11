// Google Calendar API via OAuth2 (browser-based, no backend needed)
const CLIENT_ID = '749221872428-4lrqp3h98f0b06f0laokmr75qerm0fq5.apps.googleusercontent.com'
const CALENDAR_ID = 'l1bajerowski@gmail.com'
const SCOPES = 'https://www.googleapis.com/auth/calendar.events'
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'

let gapiInited = false
let gisInited = false
let tokenClient = null

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
    const s = document.createElement('script')
    s.src = src
    s.onload = resolve
    s.onerror = reject
    document.head.appendChild(s)
  })
}

export async function initGoogleCalendar() {
  await loadScript('https://apis.google.com/js/api.js')
  await loadScript('https://accounts.google.com/gsi/client')

  await new Promise(resolve => window.gapi.load('client', resolve))
  await window.gapi.client.init({ discoveryDocs: [DISCOVERY_DOC] })
  gapiInited = true

  await new Promise(resolve => {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: resolve,
    })
    gisInited = true
    resolve()
  })
}

export function isSignedIn() {
  const token = window.gapi?.client?.getToken()
  return token !== null && token !== undefined
}

export async function signIn() {
  return new Promise((resolve, reject) => {
    tokenClient.callback = (resp) => {
      if (resp.error) reject(resp)
      else resolve(resp)
    }
    if (!isSignedIn()) {
      tokenClient.requestAccessToken({ prompt: 'consent' })
    } else {
      tokenClient.requestAccessToken({ prompt: '' })
      resolve()
    }
  })
}

export function signOut() {
  const token = window.gapi?.client?.getToken()
  if (token) {
    window.google.accounts.oauth2.revoke(token.access_token)
    window.gapi.client.setToken('')
  }
}

export async function addCalendarEvent({ title, address, date, hour, description }) {
  if (!isSignedIn()) await signIn()

  const [year, month, day] = date.split('-').map(Number)
  const startDateTime = new Date(year, month - 1, day, hour, 0, 0)
  const endDateTime = new Date(year, month - 1, day, hour + 1, 0, 0)

  const toISO = (d) => d.toISOString().replace(/\.\d{3}Z$/, '+00:00')
    .replace('Z', '')

  const event = {
    summary: title,
    location: address || '',
    description: description || '',
    start: { dateTime: startDateTime.toISOString(), timeZone: 'Europe/Warsaw' },
    end: { dateTime: endDateTime.toISOString(), timeZone: 'Europe/Warsaw' },
  }

  const response = await window.gapi.client.calendar.events.insert({
    calendarId: CALENDAR_ID,
    resource: event,
  })

  return response.result
}

export async function getUpcomingEvents(days = 30) {
  if (!isSignedIn()) return []
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
  } catch {
    return []
  }
}
