interface Props {
  frameId: number
  pointCount: number
  cuboidCount: number
  loading: boolean
  error: string | null
  cacheWarning: string | null
}

export function HUD({ frameId, pointCount, cuboidCount, loading, error, cacheWarning }: Props) {
  return (
    <>
      {/* Top-left: frame stats */}
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        zIndex: 100,
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#4fc3f7',
        background: 'rgba(5,8,18,0.75)',
        border: '1px solid #0a2a3a',
        borderRadius: '6px',
        padding: '10px 14px',
        lineHeight: '1.8',
        backdropFilter: 'blur(6px)',
      }}>
        <div style={{ color: '#888', fontSize: '10px', marginBottom: '4px', letterSpacing: '2px' }}>
          PANDASET VIEWER
        </div>
        <div>
          <span style={{ color: '#555' }}>FRAME  </span>
          <span style={{ color: '#4fc3f7' }}>{String(frameId).padStart(2, '0')}</span>
        </div>
        <div>
          <span style={{ color: '#555' }}>POINTS </span>
          <span style={{ color: '#aed581' }}>{pointCount.toLocaleString()}</span>
        </div>
        <div>
          <span style={{ color: '#555' }}>BOXES  </span>
          <span style={{ color: '#ff8a65' }}>{cuboidCount}</span>
        </div>
        {loading && (
          <div style={{ color: '#ff9800', marginTop: '4px' }}>
            ⟳ Loading…
          </div>
        )}
      </div>

      {/* Top-right: color legend */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 100,
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#888',
        background: 'rgba(5,8,18,0.75)',
        border: '1px solid #0a2a3a',
        borderRadius: '6px',
        padding: '10px 14px',
        backdropFilter: 'blur(6px)',
      }}>
        <div style={{ marginBottom: '6px', color: '#555', letterSpacing: '1px' }}>HEIGHT</div>
        <div style={{
          width: '12px',
          height: '80px',
          borderRadius: '3px',
          background: 'linear-gradient(to top, #0d19a3, #00b2e6, #19e633, #ffd900, #ff1a0d)',
          margin: '0 auto 4px',
        }} />
        <div style={{ textAlign: 'center', color: '#4fc3f7' }}>high</div>
        <div style={{ textAlign: 'center', color: '#3a3f5c' }}>low</div>
      </div>

      {/* Cache soft warning */}
      {cacheWarning && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 150,
          background: 'rgba(30,15,5,0.92)',
          border: '1px solid #ff6b35',
          borderRadius: '6px',
          padding: '6px 16px',
          color: '#ff6b35',
          fontFamily: 'monospace',
          fontSize: '11px',
          letterSpacing: '1px',
        }}>
          ⚠ {cacheWarning}
        </div>
      )}

      {/* Error display */}
      {error && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 200,
          background: 'rgba(30,5,5,0.95)',
          border: '1px solid #ff3333',
          borderRadius: '8px',
          padding: '20px 28px',
          color: '#ff6666',
          fontFamily: 'monospace',
          fontSize: '13px',
          maxWidth: '400px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '20px', marginBottom: '8px' }}>⚠</div>
          {error}
        </div>
      )}
    </>
  )
}