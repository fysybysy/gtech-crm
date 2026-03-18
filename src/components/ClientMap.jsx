import React, { useState, useEffect, useRef } from 'react'
import { STAGE_STYLES, STAGES, formatDate, matchSearch } from '../utils'
import StageBadge from './StageBadge'
import { getDayPlan, saveDayPlan, saveClient } from '../firebase'

const STAGE_COLORS = {
  'Prospekt':             '#a0a0b0',
  '1 Wizyta':             '#7ec8ff',
  '2 Wizyta':             '#b09aff',
  '3 Wizyta':             '#ffb85c',
  'Spotkanie produktowe': '#ff9a7c',
  '1 Zamówienie':         '#5cffb8',
  'Klient':               '#d4ff5c',
}
const getColor = (stage) => STAGE_COLORS[stage] || '#a0a0b0'

function makeSVGIcon(color, size = 32) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 40">
    <path d="M16 0C9.373 0 4 5.373 4 12c0 9 12 28 12 28S28 21 28 12C28 5.373 22.627 0 16 0z" fill="${color}" stroke="#0d0e10" stroke-width="1.5"/>
    <circle cx="16" cy="12" r="5" fill="#0d0e10" opacity="0.7"/>
  </svg>`
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

function makeSVGIconHighlight(color, size = 36) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 40">
    <path d="M16 0C9.373 0 4 5.373 4 12c0 9 12 28 12 28S28 21 28 12C28 5.373 22.627 0 16 0z" fill="${color}" stroke="#fff" stroke-width="2.5"/>
    <circle cx="16" cy="12" r="5" fill="#0d0e10" opacity="0.9"/>
  </svg>`
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

async function geocodeAddress(address, retries = 2) {
  if (!address) return null
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await new Promise(r => setTimeout(r, 1200))
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 8000)
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=pl`,
        { headers: { 'Accept-Language': 'pl', 'User-Agent': 'gtech-crm/1.0' }, signal: controller.signal }
      )
      clearTimeout(timeout)
      const data = await res.json()
      if (data && data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
      return null
    } catch (e) {
      if (attempt < retries) await new Promise(r => setTimeout(r, 2000 * (attempt + 1)))
    }
  }
  return null
}

export default function ClientMap({ clients, onClientClick, onAddClient, onAddMeeting }) {
  const mapRef = useRef(null)
  const leafletMap = useRef(null)
  const markersRef = useRef({})
  const searchMarkersRef = useRef([])
  const highlightedRef = useRef(null)

  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const [geocodedCount, setGeocodedCount] = useState(0)
  const [totalToGeocode, setTotalToGeocode] = useState(0)
  const [planIds, setPlanIds] = useState([])
  const [stageFilter, setStageFilter] = useState('all')
  const [legend, setLegend] = useState(true)

  // Date filter
  const [showDateFilter, setShowDateFilter] = useState(false)
  const [dateField, setDateField] = useState('lastVisit')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Compute visible clients (respects both filters)
  const visibleClients = React.useMemo(() => {
    const safe = Array.isArray(clients) ? clients : []
    return safe.filter(c => {
      if (!c.lat || !c.lng) return false
      const stageOk = stageFilter === 'all' || c.stage === stageFilter
      let dateOk = true
      if (dateFrom || dateTo) {
        const val = c[dateField]
        if (!val) return false
        if (dateFrom && val < dateFrom) dateOk = false
        if (dateTo && val > dateTo) dateOk = false
      }
      return stageOk && dateOk
    })
  }, [clients, stageFilter, dateField, dateFrom, dateTo])

  const hasActiveFilter = stageFilter !== 'all' || dateFrom || dateTo

  // Client search
  const [clientSearch, setClientSearch] = useState('')
  const [clientResults, setClientResults] = useState([])
  const [clientDropOpen, setClientDropOpen] = useState(false)
  const clientDropRef = useRef(null)

  // Date filter — show/hide markers based on date range
  useEffect(() => {
    if (!leafletMap.current) return
    const map = leafletMap.current
    const safe = Array.isArray(clients) ? clients : []
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      const client = safe.find(c => c.id === id)
      if (!client) return
      const stageOk = stageFilter === 'all' || client.stage === stageFilter
      let dateOk = true
      if (dateFrom || dateTo) {
        const val = client[dateField]
        if (!val) { dateOk = false }
        else {
          if (dateFrom && val < dateFrom) dateOk = false
          if (dateTo && val > dateTo) dateOk = false
        }
      }
      const show = stageOk && dateOk
      if (show && !map.hasLayer(marker)) marker.addTo(map)
      if (!show && map.hasLayer(marker)) map.removeLayer(marker)
    })
  }, [stageFilter, dateField, dateFrom, dateTo, clients])

  // OSM search
  const [osmQuery, setOsmQuery] = useState('')
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    getDayPlan().then(items => setPlanIds((items || []).map(x => x.id)))
  }, [])

  // Close client dropdown on outside click
  useEffect(() => {
    const h = (e) => { if (clientDropRef.current && !clientDropRef.current.contains(e.target)) setClientDropOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  // Client search filter
  useEffect(() => {
    const q = clientSearch.trim()
    if (!q) { setClientResults([]); return }
    const safe = Array.isArray(clients) ? clients : []
    const results = safe.filter(c =>
      (c.lat && c.lng) && (matchSearch(c.name, q) || matchSearch(c.address || '', q))
    ).slice(0, 8)
    setClientResults(results)
    setClientDropOpen(results.length > 0)
  }, [clientSearch, clients])

  const focusClient = (client) => {
    if (!leafletMap.current || !window.L) return
    const L = window.L
    const map = leafletMap.current
    setClientSearch(client.name)
    setClientDropOpen(false)

    // Remove previous highlight
    if (highlightedRef.current) {
      map.removeLayer(highlightedRef.current)
      highlightedRef.current = null
    }

    map.setView([client.lat, client.lng], 15, { animate: true })

    // Add highlight marker
    const color = getColor(client.stage)
    const icon = L.icon({ iconUrl: makeSVGIconHighlight(color), iconSize: [36, 44], iconAnchor: [18, 44], popupAnchor: [0, -46] })
    const hlMarker = L.marker([client.lat, client.lng], { icon, zIndexOffset: 1000 }).addTo(map)
    highlightedRef.current = hlMarker

    // Open original marker popup
    const orig = markersRef.current[client.id]
    if (orig) { orig.openPopup() }

    setTimeout(() => {
      if (highlightedRef.current === hlMarker) {
        map.removeLayer(hlMarker)
        highlightedRef.current = null
      }
    }, 4000)
  }

  // Load Leaflet
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

  // Init map — zoom to current location
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || leafletMap.current) return
    const L = window.L
    const map = L.map(mapRef.current, { zoomControl: true }).setView([51.2465, 22.5684], 12)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors', maxZoom: 19
    }).addTo(map)
    leafletMap.current = map

    // Try to get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { map.setView([pos.coords.latitude, pos.coords.longitude], 13) },
        () => {} // silently fall back to Lublin
      )
    }
  }, [leafletLoaded])

  // Build popup content
  const buildPopup = (client, planIdsCurrent) => {
    const color = getColor(client.stage)
    const ip = planIdsCurrent.includes(client.id)
    const div = document.createElement('div')

    const render = (inPlan) => {
      div.innerHTML = `
        <div style="min-width:230px;font-family:sans-serif">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">
            <div style="width:10px;height:10px;border-radius:50%;background:${color};flex-shrink:0"></div>
            <div style="font-weight:700;font-size:14px;color:#1a1a2e;flex:1">${client.name}</div>
          </div>
          ${client.address ? `<div style="font-size:11px;color:#666;margin-bottom:5px;font-family:monospace;line-height:1.4">${client.address}</div>` : ''}
          <div style="display:flex;gap:5px;margin-bottom:5px;flex-wrap:wrap">
            <span style="font-size:11px;padding:2px 8px;border-radius:4px;background:${STAGE_STYLES[client.stage]?.bg||'#eee'};color:${color};font-weight:600">${client.stage}</span>
            <span style="font-size:11px;color:#666">szansa: ${client.chance||0}%</span>
          </div>
          ${client.lastVisit ? `<div style="font-size:11px;color:#888;margin-bottom:8px">ost. wizyta: ${formatDate(client.lastVisit)}</div>` : '<div style="margin-bottom:8px"></div>'}
        </div>
      `
      const btnGroup = document.createElement('div')
      btnGroup.style.cssText = 'display:flex;flex-direction:column;gap:5px'

      // Dodaj wizytę
      const meetBtn = document.createElement('button')
      meetBtn.textContent = '🤝 Dodaj wizytę'
      meetBtn.style.cssText = 'width:100%;padding:7px;border-radius:6px;border:none;background:#d4ff5c;color:#0d0e10;font-size:12px;font-weight:700;cursor:pointer'
      meetBtn.onclick = () => { if (onAddMeeting) onAddMeeting(client); leafletMap.current?.closePopup() }
      btnGroup.appendChild(meetBtn)

      // Wyznacz trasę
      if (client.address) {
        const routeBtn = document.createElement('button')
        routeBtn.textContent = '🧭 Wyznacz trasę'
        routeBtn.style.cssText = 'width:100%;padding:7px;border-radius:6px;border:1px solid #5caaff;background:rgba(92,170,255,0.1);color:#2a7adf;font-size:12px;font-weight:700;cursor:pointer'
        routeBtn.onclick = () => {
          window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(client.address)}`, '_blank')
        }
        btnGroup.appendChild(routeBtn)
      }

      // Dodaj do planu dnia
      const planBtn = document.createElement('button')
      planBtn.disabled = inPlan
      planBtn.style.cssText = `width:100%;padding:7px;border-radius:6px;border:${inPlan?'1px solid #ccc':'1px solid #5caaff'};background:${inPlan?'#f5f5f5':'rgba(92,170,255,0.1)'};color:${inPlan?'#999':'#2a7adf'};font-size:12px;font-weight:700;cursor:${inPlan?'default':'pointer'}`
      planBtn.textContent = inPlan ? '✓ W planie dnia' : '📅 Dodaj do planu dnia'
      planBtn.onclick = async () => {
        if (inPlan) return
        const current = await getDayPlan()
        const list = Array.isArray(current) ? current : []
        if (!list.find(x => x.id === client.id)) {
          await saveDayPlan([...list, client])
          setPlanIds(prev => [...prev, client.id])
          render(true)
        }
      }
      btnGroup.appendChild(planBtn)

      // Szczegóły
      const detailBtn = document.createElement('button')
      detailBtn.textContent = 'Szczegóły klienta →'
      detailBtn.style.cssText = 'width:100%;padding:6px;border-radius:6px;border:1px solid #ddd;background:#f5f5f5;color:#333;font-size:12px;font-weight:600;cursor:pointer'
      detailBtn.onclick = () => { if (onClientClick) onClientClick(client); leafletMap.current?.closePopup() }
      btnGroup.appendChild(detailBtn)

      div.appendChild(btnGroup)
    }

    render(ip)
    return div
  }

  // Add markers
  useEffect(() => {
    if (!leafletMap.current || !leafletLoaded) return
    const L = window.L
    const map = leafletMap.current
    const safe = Array.isArray(clients) ? clients : []
    const needsGeocode = safe.filter(c => c.address && (!c.lat || !c.lng))
    setTotalToGeocode(needsGeocode.length)
    setGeocodedCount(0)

    const addMarker = (client, lat, lng) => {
      const color = getColor(client.stage)
      const icon = L.icon({ iconUrl: makeSVGIcon(color), iconSize: [28, 35], iconAnchor: [14, 35], popupAnchor: [0, -36] })
      if (markersRef.current[client.id]) map.removeLayer(markersRef.current[client.id])
      const marker = L.marker([lat, lng], { icon })
      marker.bindPopup(() => buildPopup(client, planIds), { maxWidth: 260 })
      if (stageFilter === 'all' || client.stage === stageFilter) marker.addTo(map)
      markersRef.current[client.id] = marker
    }

    safe.forEach(c => { if (c.address && c.lat && c.lng) addMarker(c, c.lat, c.lng) })

    if (needsGeocode.length === 0) return
    ;(async () => {
      setGeocoding(true)
      let count = 0
      for (const client of needsGeocode) {
        try {
          const coords = await geocodeAddress(client.address)
          if (coords) {
            addMarker(client, coords.lat, coords.lng)
            try { await saveClient({ ...client, lat: coords.lat, lng: coords.lng }) } catch {}
          }
        } catch {}
        count++
        setGeocodedCount(count)
      }
      setGeocoding(false)
    })()
  }, [clients, leafletLoaded])

  // Stage filter
  useEffect(() => {
    if (!leafletMap.current) return
    const map = leafletMap.current
    const safe = Array.isArray(clients) ? clients : []
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      const client = safe.find(c => c.id === id)
      if (!client) return
      const show = stageFilter === 'all' || client.stage === stageFilter
      if (show && !map.hasLayer(marker)) marker.addTo(map)
      if (!show && map.hasLayer(marker)) map.removeLayer(marker)
    })
  }, [stageFilter, clients])

  // Date filter — show/hide markers based on date range
  useEffect(() => {
    if (!leafletMap.current) return
    const map = leafletMap.current
    const safe = Array.isArray(clients) ? clients : []
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      const client = safe.find(c => c.id === id)
      if (!client) return
      const stageOk = stageFilter === 'all' || client.stage === stageFilter
      let dateOk = true
      if (dateFrom || dateTo) {
        const val = client[dateField]
        if (!val) { dateOk = false }
        else {
          if (dateFrom && val < dateFrom) dateOk = false
          if (dateTo && val > dateTo) dateOk = false
        }
      }
      const show = stageOk && dateOk
      if (show && !map.hasLayer(marker)) marker.addTo(map)
      if (!show && map.hasLayer(marker)) map.removeLayer(marker)
    })
  }, [stageFilter, dateField, dateFrom, dateTo, clients])

  // OSM search
  const handleOsmSearch = async () => {
    if (!osmQuery.trim() || !leafletMap.current) return
    setSearching(true)
    const L = window.L
    const map = leafletMap.current
    searchMarkersRef.current.forEach(m => map.removeLayer(m))
    searchMarkersRef.current = []
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(osmQuery)}&format=json&limit=10&addressdetails=1&countrycodes=pl`,
        { headers: { 'Accept-Language': 'pl', 'User-Agent': 'gtech-crm/1.0' } }
      )
      const data = await res.json()
      if (data.length > 0) {
        const bounds = []
        data.forEach(place => {
          const lat = parseFloat(place.lat), lng = parseFloat(place.lon)
          bounds.push([lat, lng])
          const icon = L.divIcon({ html: `<div style="background:#ff5c5c;width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>`, iconSize: [22,22], iconAnchor: [11,22], popupAnchor: [0,-26], className: '' })
          const name = place.name || place.display_name.split(',')[0]
          const shortAddr = [place.address?.road, place.address?.house_number, place.address?.city || place.address?.town].filter(Boolean).join(' ')
          const displayAddr = shortAddr || place.display_name.split(',').slice(0,3).join(',').trim()
          const div = document.createElement('div')
          div.style.cssText = 'min-width:200px;font-family:sans-serif'
          div.innerHTML = `<div style="font-weight:700;font-size:13px;color:#1a1a2e;margin-bottom:4px">${name}</div><div style="font-size:11px;color:#666;margin-bottom:10px;line-height:1.4">${displayAddr}</div>`
          const addBtn = document.createElement('button')
          addBtn.textContent = '+ Dodaj jako nowego klienta'
          addBtn.style.cssText = 'width:100%;padding:7px;border-radius:6px;border:none;background:#d4ff5c;color:#0d0e10;font-size:12px;font-weight:700;cursor:pointer'
          addBtn.onclick = () => { if (onAddClient) onAddClient({ name, address: displayAddr }); map.closePopup() }
          div.appendChild(addBtn)
          const marker = L.marker([lat, lng], { icon })
          marker.bindPopup(div, { maxWidth: 240 }).addTo(map)
          searchMarkersRef.current.push(marker)
        })
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
      }
    } catch {}
    setSearching(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)' }}>

      {/* Toolbar */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flexShrink: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap' }}>🗺 Mapa</div>

        {/* Client search */}
        <div ref={clientDropRef} style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: 15, pointerEvents: 'none' }}>👤</span>
            <input
              value={clientSearch}
              onChange={e => setClientSearch(e.target.value)}
              onFocus={() => clientResults.length > 0 && setClientDropOpen(true)}
              placeholder="Szukaj klienta na mapie..."
              style={{ width: '100%', padding: '7px 12px 7px 30px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--sans)', fontSize: 13, outline: 'none' }}
            />
          </div>
          {clientDropOpen && clientResults.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '0 0 8px 8px', maxHeight: 220, overflowY: 'auto' }}>
              {clientResults.map(c => (
                <div key={c.id} onClick={() => focusClient(c)} style={{ padding: '9px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: getColor(c.stage), flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                    {c.address && <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.address}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* OSM search */}
        <div style={{ display: 'flex', gap: 6, flex: 1, minWidth: 180 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: 15, pointerEvents: 'none' }}>⌕</span>
            <input value={osmQuery} onChange={e => setOsmQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleOsmSearch()} placeholder="Szukaj firm na mapie..." style={{ width: '100%', padding: '7px 12px 7px 30px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--sans)', fontSize: 13, outline: 'none' }} />
          </div>
          <button onClick={handleOsmSearch} disabled={searching || !osmQuery.trim()} style={{ padding: '7px 12px', borderRadius: 7, border: 'none', background: 'var(--accent)', color: '#0d0e10', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: searching ? 0.6 : 1, whiteSpace: 'nowrap' }}>
            {searching ? '...' : 'Szukaj'}
          </button>
        </div>

        {/* Stage filter */}
        <select value={stageFilter} onChange={e => setStageFilter(e.target.value)} style={{ padding: '6px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--sans)', fontSize: 13, cursor: 'pointer' }}>
          <option value="all">Wszystkie etapy</option>
          {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
          {geocoding ? `⏳ ${geocodedCount}/${totalToGeocode}` : `${Array.isArray(clients) ? clients.filter(c => c.lat && c.lng).length : 0} na mapie`}
        </div>

        <button onClick={() => setLegend(v => !v)} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--muted)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
          {legend ? 'Ukryj legendę' : 'Legenda'}
        </button>
        <button
          onClick={() => setShowDateFilter(v => !v)}
          style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${(dateFrom||dateTo) ? 'var(--accent2)' : 'var(--border)'}`, background: (dateFrom||dateTo) ? 'rgba(92,170,255,0.1)' : 'var(--surface2)', color: (dateFrom||dateTo) ? 'var(--accent2)' : 'var(--muted)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--sans)', whiteSpace: 'nowrap' }}
        >
          📅 {(dateFrom||dateTo) ? 'Filtr daty ✓' : 'Filtr daty'}
        </button>
      </div>

      {/* Date filter panel */}
      {showDateFilter && (
        <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', flexShrink: 0 }}>
          <select
            value={dateField}
            onChange={e => setDateField(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--sans)', fontSize: 13, cursor: 'pointer' }}
          >
            <option value="lastVisit">Ostatnia wizyta</option>
            <option value="lastOrder">Ostatnie zamówienie</option>
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--muted)', whiteSpace: 'nowrap' }}>Od:</span>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--sans)', fontSize: 13, outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--muted)', whiteSpace: 'nowrap' }}>Do:</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--sans)', fontSize: 13, outline: 'none' }} />
          </div>
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(''); setDateTo('') }}
              style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--danger)', background: 'transparent', color: 'var(--danger)', fontFamily: 'var(--sans)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              ✕ Wyczyść
            </button>
          )}
          <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted)' }}>
            {visibleClients.length} widocznych pinezek
          </span>
        </div>
      )}

      {/* Legend */}
      {legend && (
        <div style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)', padding: '7px 20px', display: 'flex', gap: 14, flexWrap: 'wrap', flexShrink: 0, alignItems: 'center' }}>
          {STAGES.map(s => (
            <div key={s} onClick={() => setStageFilter(stageFilter === s ? 'all' : s)} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', opacity: stageFilter !== 'all' && stageFilter !== s ? 0.35 : 1, transition: 'opacity 0.2s' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: getColor(s), flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted)' }}>{s}</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5c5c', flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted)' }}>Wyniki wyszukiwania</span>
          </div>
        </div>
      )}

      {/* Main content: sidebar + map */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Sidebar — only when filter active */}
        {hasActiveFilter && (
          <div style={{ width: '30%', minWidth: 220, maxWidth: 360, background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Klienci ({visibleClients.length})</span>
              <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted)' }}>
                {stageFilter !== 'all' ? stageFilter : ''}
                {stageFilter !== 'all' && (dateFrom || dateTo) ? ' · ' : ''}
                {dateFrom || dateTo ? (dateFrom === dateTo && dateFrom ? dateFrom : [dateFrom, dateTo].filter(Boolean).join(' – ')) : ''}
              </span>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {visibleClients.length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 12 }}>
                  Brak klientów<br/>dla wybranych filtrów
                </div>
              ) : visibleClients.map(c => (
                <div
                  key={c.id}
                  onClick={() => focusClient(c)}
                  style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: getColor(c.stage), flexShrink: 0 }} />
                    <div style={{ fontSize: 13, fontWeight: 700, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                  </div>
                  {c.address && (
                    <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingLeft: 16, marginBottom: 4 }}>{c.address}</div>
                  )}
                  <div style={{ paddingLeft: 16, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <StageBadge stage={c.stage} />
                    {c.lastVisit && (
                      <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)' }}>
                        wizyta: {formatDate(c.lastVisit)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Map */}
        <div ref={mapRef} style={{ flex: 1, zIndex: 0 }} />
      </div>

      {!leafletLoaded && (
        <div style={{ position: 'absolute', inset: 0, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
          <div style={{ color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 14 }}>Ładowanie mapy...</div>
        </div>
      )}
    </div>
  )
}
