import { useEffect, useCallback } from 'react'
import { CacheMetrics } from '../types'
import { FRAME_COUNT } from '../services/FrameCache'

interface Props {
  currentFrame: number
  totalFrames: number
  loading: boolean
  metrics: CacheMetrics
  isPlaying: boolean
  isLooping: boolean
  onGoTo: (frame: number) => void
  onNext: () => void
  onPrev: () => void
  onPlayPause: () => void
  onToggleLoop: () => void
}

export function Timeline({ currentFrame, totalFrames, loading, metrics, isPlaying, isLooping, onGoTo, onNext, onPrev, onPlayPause, onToggleLoop }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'ArrowRight') { e.preventDefault(); onNext() }
      if (e.shiftKey && e.key === 'ArrowLeft')  { e.preventDefault(); onPrev() }
      if (e.key === ' ' && !e.shiftKey) { e.preventDefault(); onPlayPause() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onNext, onPrev, onPlayPause])

  const usagePct = Math.min(100, (metrics.usageMb / metrics.limitMb) * 100)
  const isNearLimit = usagePct >= 85

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      background: 'linear-gradient(to top, rgba(5,8,18,0.97) 0%, rgba(5,8,18,0.85) 80%, transparent 100%)',
      padding: '16px 24px 20px',
      fontFamily: 'monospace',
    }}>
      {/* Cache metrics bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '10px', fontSize: '11px' }}>
        <span style={{ color: '#555' }}>CACHE</span>
        <div style={{ flex: 1, height: '3px', background: '#1a1a2e', borderRadius: '2px', position: 'relative' }}>
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: `${usagePct}%`,
            background: isNearLimit ? '#ff6b35' : '#3dd9ac',
            borderRadius: '2px',
            transition: 'width 0.5s ease',
          }} />
        </div>
        <span style={{ color: isNearLimit ? '#ff6b35' : '#3dd9ac', minWidth: '120px' }}>
          {metrics.usageMb.toFixed(1)} / {metrics.limitMb} MB
        </span>
        <span style={{ color: '#444' }}>|</span>
        <span style={{ color: '#557' }}>HIT {metrics.hitRate}%</span>
        <span style={{ color: '#444' }}>|</span>
        <span style={{ color: '#557' }}>{metrics.entries} frames cached</span>
      </div>

      {/* Scrubber + controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Prev button */}
        <button onClick={onPrev} disabled={currentFrame === 0 || isPlaying} style={btnStyle}>
          ◀
        </button>

        {/* Play/Pause button */}
        <button onClick={onPlayPause} style={{
          ...btnStyle,
          minWidth: '64px',
          background: isPlaying ? 'rgba(255,152,0,0.15)' : 'rgba(79,195,247,0.12)',
          borderColor: isPlaying ? '#ff9800' : '#4fc3f7',
          color: isPlaying ? '#ff9800' : '#4fc3f7',
          fontWeight: 'bold',
          letterSpacing: '1px',
        }}>
          {isPlaying ? '⏸ PAUSE' : '▶ PLAY'}
        </button>

        {/* Loop checkbox */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', userSelect: 'none' }}>
          <input
            type="checkbox"
            checked={isLooping}
            onChange={onToggleLoop}
            style={{ accentColor: '#4fc3f7', cursor: 'pointer' }}
          />
          <span style={{ color: isLooping ? '#4fc3f7' : '#445', fontSize: '11px', fontFamily: 'monospace' }}>
            LOOP
          </span>
        </label>

        {/* Frame ticks */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'flex-end',
          gap: '2px',
          height: '32px',
          cursor: 'pointer',
          position: 'relative',
        }}>
          {Array.from({ length: totalFrames }, (_, i) => {
            const isCurrent = i === currentFrame
            const isCached = metrics.frames.includes(i)
            return (
              <div
                key={i}
                onClick={() => onGoTo(i)}
                title={`Frame ${String(i).padStart(2, '0')}`}
                style={{
                  flex: 1,
                  height: isCurrent ? '32px' : isCached ? '18px' : '10px',
                  background: isCurrent
                    ? '#4fc3f7'
                    : isCached
                    ? '#1e4a6e'
                    : '#1a1f2e',
                  borderRadius: '2px 2px 0 0',
                  transition: 'height 0.15s ease, background 0.2s ease',
                  cursor: 'pointer',
                  position: 'relative',
                }}
              />
            )
          })}
        </div>

        {/* Next button */}
        <button onClick={onNext} disabled={currentFrame === totalFrames - 1 || isPlaying} style={btnStyle}>
          ▶
        </button>

        {/* Frame counter */}
        <div style={{
          color: '#4fc3f7',
          fontSize: '13px',
          minWidth: '72px',
          textAlign: 'right',
        }}>
          {loading && <span style={{ color: '#ff9800', marginRight: '6px' }}>⟳</span>}
          <span style={{ color: '#888' }}>F</span>
          {String(currentFrame).padStart(2, '0')}
          <span style={{ color: '#333' }}>/{String(totalFrames - 1).padStart(2, '0')}</span>
        </div>
      </div>

      {/* Keyboard hint */}
      <div style={{ marginTop: '6px', fontSize: '10px', color: '#333', textAlign: 'center' }}>
        SPACE play/pause &nbsp;|&nbsp; SHIFT+← → frame step &nbsp;|&nbsp; WASD move &nbsp;|&nbsp; Q/E up/down &nbsp;|&nbsp; ←→↑↓ rotate &nbsp;|&nbsp; scroll zoom
      </div>
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid #2a3a4a',
  color: '#4fc3f7',
  borderRadius: '4px',
  padding: '4px 10px',
  cursor: 'pointer',
  fontSize: '12px',
  fontFamily: 'monospace',
}