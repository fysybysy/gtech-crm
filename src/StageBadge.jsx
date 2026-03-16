import React from 'react'
import { STAGE_STYLES, STAGE_STYLES_LIGHT } from '../utils'

export default function StageBadge({ stage }) {
  if (!stage) return null
  const isLight = document.documentElement.getAttribute('data-theme') === 'light'
  const styles = isLight ? STAGE_STYLES_LIGHT : STAGE_STYLES
  const s = styles[stage] || { bg: isLight ? '#e2e4e8' : 'rgba(90,95,110,0.3)', color: isLight ? '#4a5060' : '#5a5f6e' }

  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: 20,
      fontSize: 11,
      fontFamily: 'var(--mono)',
      fontWeight: 700,
      whiteSpace: 'nowrap',
      background: s.bg,
      color: s.color,
      textShadow: isLight ? '0 0 1px rgba(0,0,0,0.15)' : 'none',
      border: isLight ? '1px solid rgba(0,0,0,0.08)' : 'none',
    }}>
      {stage}
    </span>
  )
}
