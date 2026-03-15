import React, { useState, useEffect, useRef, useCallback } from 'react'
import { STAGE_STYLES, STAGES } from '../utils'
import { getDayPlan, saveDayPlan } from '../firebase'
import StageBadge from './StageBadge'
import { formatDate } from '../utils'

// ── Stage colors for markers ──────────────────────────────
const STAGE_COLORS = {
  'Prospekt':             '#a0a0b0',
  '1 Wizyta':             '#7ec8ff',
  '2 Wizyta':             '#b09aff',
  '3 Wizyta':             '#ffb85c',
  'Spotkanie produktowe': '#ff9a7c',
  '1 Zamówienie':         '#5cffb8',
  'Klient':               '#d4ff5c',
}

function getColor(stage) {
  return STAGE_COLORS[stage] || '#a0a0b0'
}

function makeSVGIcon(color, size = 32) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 40">
    <path d="M16 0C9.373 0 4 5.373 4 12c0 9 12 28 12 28S28 21 28 12C28 5.373 22.627 0 16 0z" fill="${color}" stroke="#0d0e10" stroke-width="1.5"/>
    <circle cx="16" cy="12" r="5" fill="#0d0e10" opacity="0.7"/>
  </svg>`
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

// ── Geocode cache in sessionStorage ──────────────────────
function getCached(addr) {
  try { return JSON.parse(sessionStorage.getItem('geo_' + addr)) } catch { return null }
}
function setCache(addr, coords) {
  try { sessionStorage.setItem('geo_' + addr, JSON.stringify(coords)) } catch {}
}

async function geocode(address) {
  if (!address) return null
  const cached = getCached(address)
  if (cached) return cached
  try {
    await new Promise(r => setTimeout(r, 1100)) // Nominatim rate limit 1/s
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=pl`, {
      headers: { 'Accept-Language': 'pl', 'User-Agent': 'gtech-crm/1.0' }
    })
    const data = await res.json()
    if (data && data[0]) {
      const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
      setCache(address, coords)
      return coords
    }
  } catch {}
  return null
}

// ── Mini popup card ───────────────────────────────────────
function ClientPopup({ client, onAddToPlan, inPlan }) {
  const color = getColor(client.stage)
  return (
    <div style={{ minWidth: 220, fontFamily: 'var(--sans)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
        <div style={{ fontWeight: 700, fontSize: 14, color: '#1a1a2e' }}>{client.name}</div>
      </div>
      {client.address && <div style={{ fontSize: 11, color: '#666', marginBottom: 6, fontFamily: 'monospace' }}>{client.address}</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: STAGE_STYLES[client.stage]?.bg || '#eee', color: color, fontWeight: 600 }}>{client.stage}</span>
        <span style={{ fontSize: 11, color: '#666' }}>szansa: {client.chance || 0}%</span>
      </div>
      {client.lastVisit && <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>ost. wizyta: {formatDate(client.lastVisit)}</div>}
      <button
        onClick={onAddToPlan}
        disabled={inPlan}
        style={{ width: '100%', padding: '7px 12px', borderRadius: 6, border: inPlan ? '1px solid #ccc' : '1px solid #5caaff', background: inPlan ? '#f5f5f5' : 'rgba(92,170,255,0.1)', color: inPlan ? '#999' : '#2a7adf', fontFamily: 'sans-serif', fontSize: 12, fontWeight: 700, cursor: inPlan ? 'default' : 'pointer' }}
      >
        {inPlan ? '✓ W planie dnia' : '📅 Dodaj do planu dnia'}
      </button>
    </div>
  )
}

// ── Main component ────────────────────────────────────────
export default function ClientMap({ clients, onClientClick, onAddClient }) {
  const mapRef = useRef(null)
  const leafletMap = useRef(null)
  const markersRef = useRef({})
  const searchMarkersRef = useRef([])

  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const [geocodedCount, setGeocodedCount] = useState(0)
  const [totalToGeocode, setTotalToGeocode] = useState(0)
  const [planIds, setPlanIds] = useState([])
  const [stageFilter, setStageFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [legend, setLegend] = useState(true)

  // Load plan IDs
  useEffect(() => {
    getDayPlan().then(items => setPlanIds((items || []).map(x => x.id)))
  }, [])

  // Load Leaflet dynamically
  useEffect(() => {
    if (window.L) { setLeafletLoaded(true); return }
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)

    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => setLeafletLoaded(true)
    document.head.appendChild(script)
  }, [])

  // Init map
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || leafletMap.current) return
    const L = window.L
    const map = L.map(mapRef.current, { zoomControl: true }).setView([52.069, 19.480], 6)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)
    leafletMap.current = map
  }, [leafletLoaded])

  // Add/update client markers
  useEffect(() => {
    if (!leafletMap.current || !leafletLoaded) return
    const L = window.L
    const map = leafletMap.current
    const safe = Array.isArray(clients) ? clients : []
    const toGeocode = safe.filter(c => c.address && !getCached(c.address))

    setTotalToGeocode(toGeocode.length)
    setGeocodedCount(0)

    const addMarker = (client, lat, lng) => {
      const color = getColor(client.stage)
      const icon = L.icon({ iconUrl: makeSVGIcon(color), iconSize: [28, 35], iconAnchor: [14, 35], popupAnchor: [0, -36] })

      if (markersRef.current[client.id]) {
        map.removeLayer(markersRef.current[client.id])
      }

      const marker = L.marker([lat, lng], { icon })
      marker.bindPopup(() => {
        const div = document.createElement('div')
        const inPlan = planIds.includes(client.id)

        const render = (ip) => {
          div.innerHTML = ''
          const nameEl = document.createElement('div')
          nameEl.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:8px'
          nameEl.innerHTML = `<div style="width:10px;height:10px;border-radius:50%;background:${color};flex-shrink:0"></div><div style="font-weight:700;font-size:14px;color:#1a1a2e">${client.name}</div>`
          div.appendChild(nameEl)

          if (client.address) {
            const addrEl = document.createElement('div')
            addrEl.style.cssText = 'font-size:11px;color:#666;margin-bottom:6px;font-family:monospace'
            addrEl.textContent = client.address
            div.appendChild(addrEl)
          }

          const stageEl = document.createElement('div')
          stageEl.style.cssText = 'display:flex;align-items:center;gap:6px;margin-bottom:8px;flex-wrap:wrap'
          stageEl.innerHTML = `<span style="font-size:11px;padding:2px 8px;border-radius:4px;background:${STAGE_STYLES[client.stage]?.bg||'#eee'};color:${color};font-weight:600">${client.stage}</span><span style="font-size:11px;color:#666">szansa: ${client.chance||0}%</span>`
          div.appendChild(stageEl)

          if (client.lastVisit) {
            const visitEl = document.createElement('div')
            visitEl.style.cssText = 'font-size:11px;color:#888;margin-bottom:8px'
            visitEl.textContent = `ost. wizyta: ${formatDate(client.lastVisit)}`
            div.appendChild(visitEl)
          }

          const btn = document.createElement('button')
          btn.disabled = ip
          btn.style.cssText = `width:100%;padding:7px 12px;border-radius:6px;border:${ip?'1px solid #ccc':'1px solid #5caaff'};background:${ip?'#f5f5f5':'rgba(92,170,255,0.1)'};color:${ip?'#999':'#2a7adf'};font-family:sans-serif;font-size:12px;font-weight:700;cursor:${ip?'default':'pointer'}`
          btn.textContent = ip ? '✓ W planie dnia' : '📅 Dodaj do planu dnia'
          btn.onclick = async () => {
            if (ip) return
            const current = await getDayPlan()
            const list = Array.isArray(current) ? current : []
            if (!list.find(x => x.id === client.id)) {
              await saveDayPlan([...list, client])
              setPlanIds(prev => [...prev, client.id])
              render(true)
            }
          }
          div.appendChild(btn)

          const detailBtn = document.createElement('button')
          detailBtn.style.cssText = 'width:100%;padding:6px 12px;border-radius:6px;border:1px solid #ddd;background:#f9f9f9;color:#333;font-family:sans-serif;font-size:12px;font-weight:600;cursor:pointer;margin-top:6px'
          detailBtn.textContent = 'Szczegóły klienta →'
          detailBtn.onclick = () => { if (onClientClick) onClientClick(client); map.closePopup() }
          div.appendChild(detailBtn)
        }

        render(planIds.includes(client.id))
        return div
      }, { maxWidth: 260 })

      if (stageFilter === 'all' || client.stage === stageFilter) {
        marker.addTo(map)
      }
      markersRef.current[client.id] = marker
    }

    // Process clients sequentially for geocoding
    ;(async () => {
      if (toGeocode.length > 0) setGeocoding(true)
      let count = 0
      for (const client of safe) {
        if (!client.address) continue
        const cached = getCached(client.address)
        if (cached) {
          addMarker(client, cached.lat, cached.lng)
        } else {
          const coords = await geocode(client.address)
          if (coords) {
            addMarker(client, coords.lat, coords.lng)
            count++
            setGeocodedCount(count)
          }
        }
      }
      setGeocoding(false)
    })()
  }, [clients, leafletLoaded])

  // Filter markers by stage
  useEffect(() => {
    if (!leafletMap.current) return
    const map = leafletMap.current
    const safe = Array.isArray(clients) ? clients : []
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      const client = safe.find(c => c.id === id)
      if (!client) return
      if (stageFilter === 'all' || client.stage === stageFilter) {
        if (!map.hasLayer(marker)) marker.addTo(map)
      } else {
        if (map.hasLayer(marker)) map.removeLayer(marker)
      }
    })
  }, [stageFilter, clients])

  // Search OSM for businesses
  const handleSearch = async () => {
    if (!searchQuery.trim() || !leafletMap.current) return
    setSearching(true)
    setSearchResults([])
    const L = window.L
    const map = leafletMap.current

    // Clear old search markers
    searchMarkersRef.current.forEach(m => map.removeLayer(m))
    searchMarkersRef.current = []

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=10&addressdetails=1&countrycodes=pl`, {
        headers: { 'Accept-Language': 'pl', 'User-Agent': 'gtech-crm/1.0' }
      })
      const data = await res.json()
      setSearchResults(data)

      if (data.length > 0) {
        const bounds = []
        data.forEach(place => {
          const lat = parseFloat(place.lat)
          const lng = parseFloat(place.lon)
          bounds.push([lat, lng])

          const icon = L.divIcon({
            html: `<div style="background:#ff5c5c;width:24px;height:24px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>`,
            iconSize: [24, 24], iconAnchor: [12, 24], popupAnchor: [0, -28], className: ''
          })

          const name = place.name || place.display_name.split(',')[0]
          const addr = place.display_name

          const marker = L.marker([lat, lng], { icon })
          const div = document.createElement('div')
          div.style.cssText = 'min-width:200px;font-family:sans-serif'
          div.innerHTML = `
            <div style="font-weight:700;font-size:13px;color:#1a1a2e;margin-bottom:4px">${name}</div>
            <div style="font-size:11px;color:#666;margin-bottom:10px;line-height:1.4">${addr}</div>
          `
          const addBtn = document.createElement('button')
          addBtn.textContent = '+ Dodaj jako klienta'
          addBtn.style.cssText = 'width:100%;padding:7px;border-radius:6px;border:none;background:#d4ff5c;color:#0d0e10;font-size:12px;font-weight:700;cursor:pointer'
          addBtn.onclick = () => {
            const shortAddr = [place.address?.road, place.address?.house_number, place.address?.city || place.address?.town].filter(Boolean).join(' ')
            onAddClient && onAddClient({ name, address: shortAddr || addr.split(',').slice(0,2).join(',').trim() })
            map.closePopup()
          }
          div.appendChild(addBtn)

          marker.bindPopup(div, { maxWidth: 240 }).addTo(map)
          searchMarkersRef.current.push(marker)
        })

        if (bounds.length > 0) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
      }
    } catch (e) { console.error(e) }
    setSearching(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)' }}>

      {/* Toolbar */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', flexShrink: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginRight: 4 }}>🗺 Mapa Klientów</div>

        {/* Stage filter */}
        <select
          value={stageFilter}
          onChange={e => setStageFilter(e.target.value)}
          style={{ padding: '7px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--sans)', fontSize: 13, cursor: 'pointer' }}
        >
          <option value="all">Wszystkie etapy</option>
          {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Search */}
        <div style={{ display: 'flex', gap: 8, flex: 1, minWidth: 240 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: 15, pointerEvents: 'none' }}>⌕</span>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Szukaj firm na mapie... (np. salon fryzjerski Katowice)"
              style={{ width: '100%', padding: '7px 12px 7px 34px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--sans)', fontSize: 13, outline: 'none' }}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={searching || !searchQuery.trim()}
            style={{ padding: '7px 16px', borderRadius: 7, border: 'none', background: 'var(--accent)', color: '#0d0e10', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 700, cursor: searching ? 'default' : 'pointer', opacity: searching ? 0.6 : 1, whiteSpace: 'nowrap' }}
          >
            {searching ? 'Szukam...' : 'Szukaj'}
          </button>
        </div>

        {/* Stats */}
        <div style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
          {geocoding
            ? `Geokodowanie ${geocodedCount}/${totalToGeocode}...`
            : `${Array.isArray(clients) ? clients.filter(c => c.address).length : 0} klientów na mapie`
          }
        </div>

        {/* Legend toggle */}
        <button
          onClick={() => setLegend(v => !v)}
          style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--muted)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--sans)', whiteSpace: 'nowrap' }}
        >
          {legend ? 'Ukryj legendę' : 'Legenda'}
        </button>
      </div>

      {/* Legend */}
      {legend && (
        <div style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)', padding: '8px 20px', display: 'flex', gap: 16, flexWrap: 'wrap', flexShrink: 0 }}>
          {STAGES.map(s => (
            <div
              key={s}
              onClick={() => setStageFilter(stageFilter === s ? 'all' : s)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', opacity: stageFilter !== 'all' && stageFilter !== s ? 0.4 : 1, transition: 'opacity 0.2s' }}
            >
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: getColor(s), border: '1px solid rgba(0,0,0,0.2)', flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--muted)' }}>{s}</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5c5c', border: '1px solid rgba(0,0,0,0.2)', flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--muted)' }}>Wyniki wyszukiwania</span>
          </div>
        </div>
      )}

      {/* Map */}
      <div ref={mapRef} style={{ flex: 1, zIndex: 0 }} />

      {/* Loading overlay */}
      {!leafletLoaded && (
        <div style={{ position: 'absolute', inset: 0, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
          <div style={{ color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 14 }}>Ładowanie mapy...</div>
        </div>
      )}
    </div>
  )
}
