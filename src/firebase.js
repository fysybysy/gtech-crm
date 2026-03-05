import { initializeApp } from 'firebase/app'
import { getFirestore, collection, doc, getDocs, getDoc, setDoc, addDoc, deleteDoc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyBeOS6mMftLFfe_qBVBcY2PYSCf-xPTfSE",
  authDomain: "g-tech-crm.firebaseapp.com",
  projectId: "g-tech-crm",
  storageBucket: "g-tech-crm.firebasestorage.app",
  messagingSenderId: "214638553585",
  appId: "1:214638553585:web:48b023b6e567cc0da2bc50"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)

const COLL = 'clients'
const PLAN_DOC = doc(getFirestore(app), 'dayplan', 'current')

// ── Clients ──────────────────────────────────────────────
export async function getAllClients() {
  const snap = await getDocs(collection(db, COLL))
  return snap.docs.map(d => ({ ...d.data(), id: d.id }))
}

export async function getClient(id) {
  const snap = await getDoc(doc(db, COLL, id))
  if (!snap.exists()) return null
  return { ...snap.data(), id: snap.id }
}

export async function saveClient(obj) {
  const { id, ...data } = obj
  if (id) {
    await setDoc(doc(db, COLL, id), data)
    return id
  } else {
    const ref = await addDoc(collection(db, COLL), data)
    return ref.id
  }
}

export async function deleteClient(id) {
  await deleteDoc(doc(db, COLL, id))
}

// ── Day Plan ─────────────────────────────────────────────
export async function getDayPlan() {
  try {
    const snap = await getDoc(PLAN_DOC)
    if (!snap.exists()) return []
    return snap.data().items || []
  } catch {
    return []
  }
}

export async function saveDayPlan(items) {
  await setDoc(PLAN_DOC, { items, updatedAt: new Date().toISOString() })
}
