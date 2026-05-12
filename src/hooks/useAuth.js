import { db } from '../firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'

const SESSION_KEY = 'gtech_session'

// SHA-256 via Web Crypto API (built into browsers, no library needed)
async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// Create user in Firebase (run once manually or on first setup)
export async function createUser(username, password, googleEmail = '') {
  const hash = await sha256(password)
  await setDoc(doc(db, 'users', username), {
    username,
    passwordHash: hash,
    googleEmail,
    createdAt: new Date().toISOString(),
  })
}

// Verify login
export async function loginUser(username, password) {
  const hash = await sha256(password)
  const snap = await getDoc(doc(db, 'users', username))
  if (!snap.exists()) throw new Error('Nieprawidłowy login lub hasło')
  const user = snap.data()
  if (user.passwordHash !== hash) throw new Error('Nieprawidłowy login lub hasło')
  return { username: user.username, googleEmail: user.googleEmail || '' }
}

// Session management
export function saveSession(user, remember) {
  const data = { ...user, savedAt: Date.now(), remember }
  if (remember) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(data))
  } else {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data))
  }
}

export function loadSession() {
  try {
    const ls = localStorage.getItem(SESSION_KEY)
    if (ls) {
      const data = JSON.parse(ls)
      // Persistent session valid for 30 days
      if (Date.now() - data.savedAt < 30 * 24 * 60 * 60 * 1000) return data
      localStorage.removeItem(SESSION_KEY)
    }
    const ss = sessionStorage.getItem(SESSION_KEY)
    if (ss) return JSON.parse(ss)
  } catch {}
  return null
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem(SESSION_KEY)
}
