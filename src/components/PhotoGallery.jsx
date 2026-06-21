import { useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

export default function PhotoGallery({ fotos = [] }) {
  const [current, setCurrent] = useState(0)
  const [lightbox, setLightbox] = useState(false)

  if (!fotos.length) {
    return (
      <div style={{
        height: 280,
        background: 'linear-gradient(135deg, #16a34a22, #16a34a44)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 'var(--radius-lg)',
      }}>
        <span style={{ fontSize: 64 }}>⚽</span>
      </div>
    )
  }

  function prev(e) {
    e.stopPropagation()
    setCurrent(c => (c - 1 + fotos.length) % fotos.length)
  }
  function next(e) {
    e.stopPropagation()
    setCurrent(c => (c + 1) % fotos.length)
  }

  return (
    <>
      <div style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', cursor: 'pointer' }}
        onClick={() => setLightbox(true)}
      >
        <img
          src={fotos[current]}
          alt={`Foto ${current + 1}`}
          style={{ width: '100%', height: 280, objectFit: 'cover', display: 'block' }}
          onError={e => e.target.style.display = 'none'}
        />
        {fotos.length > 1 && (
          <>
            <button onClick={prev} style={navBtn('left')}>
              <ChevronLeft size={20} />
            </button>
            <button onClick={next} style={navBtn('right')}>
              <ChevronRight size={20} />
            </button>
            <div style={{
              position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
              display: 'flex', gap: 4,
            }}>
              {fotos.map((_, i) => (
                <button key={i} onClick={e => { e.stopPropagation(); setCurrent(i) }} style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: i === current ? 'white' : 'rgba(255,255,255,0.5)',
                  border: 'none', cursor: 'pointer', padding: 0,
                }} />
              ))}
            </div>
            <div style={{
              position: 'absolute', top: 8, right: 8,
              background: 'rgba(0,0,0,0.5)', color: 'white',
              borderRadius: 4, padding: '2px 8px', fontSize: 12,
            }}>
              {current + 1} / {fotos.length}
            </div>
          </>
        )}
      </div>

      {lightbox && (
        <div className="modal-overlay" onClick={() => setLightbox(false)} style={{ background: 'rgba(0,0,0,0.9)' }}>
          <button onClick={() => setLightbox(false)} style={{
            position: 'absolute', top: 16, right: 16,
            background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white',
            width: 36, height: 36, borderRadius: '50%', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={18} />
          </button>
          <img
            src={fotos[current]}
            alt={`Foto ${current + 1}`}
            style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain' }}
            onClick={e => e.stopPropagation()}
          />
          {fotos.length > 1 && (
            <>
              <button onClick={prev} style={{ ...navBtn('left'), position: 'fixed' }}>
                <ChevronLeft size={20} />
              </button>
              <button onClick={next} style={{ ...navBtn('right'), position: 'fixed' }}>
                <ChevronRight size={20} />
              </button>
            </>
          )}
        </div>
      )}
    </>
  )
}

function navBtn(side) {
  return {
    position: 'absolute',
    top: '50%', transform: 'translateY(-50%)',
    [side]: 8,
    background: 'rgba(0,0,0,0.4)',
    border: 'none', color: 'white',
    width: 36, height: 36, borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }
}
