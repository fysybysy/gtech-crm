import React, { useEffect } from 'react'

export default function Modal({ open, onClose, children, maxWidth = 700 }) {
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    if (open) { window.addEventListener('keydown', h); document.body.style.overflow = 'hidden' }
    return () => { window.removeEventListener('keydown', h); document.body.style.overflow = '' }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="modal-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
    >
      <div
        className="modal-inner"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, width: '100%', maxWidth, maxHeight: '90vh', overflowY: 'auto', padding: 32, animation: 'modalIn 0.2s ease' }}
      >
        {children}
      </div>
      <style>{`
        @keyframes modalIn { from { transform: translateY(20px); opacity:0 } to { transform: translateY(0); opacity:1 } }
        @media (max-width: 768px) {
          .modal-overlay { align-items: flex-end !important; padding: 0 !important; }
          .modal-inner { border-radius: 16px 16px 0 0 !important; max-height: 92vh !important; padding: 20px 16px 32px !important; animation: modalUp 0.25s ease !important; }
          @keyframes modalUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
        }
      `}</style>
    </div>
  )
}
