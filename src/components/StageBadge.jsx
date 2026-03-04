import React from 'react'
import { STAGE_STYLES } from '../utils'

export default function StageBadge({ stage }) {
  if (!stage) return null
  const s = STAGE_STYLES[stage] || { bg: 'rgba(90,95,110,0.3)', color: '#5a5f6e' }
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: 20,
      fontSize: 11,
      fontFamily: 'var(--mono)',
      fontWeight: 500,
      whiteSpace: 'nowrap',
      background: s.bg,
      color: s.color,
    }}>
      {stage}
    </span>
  )
}
