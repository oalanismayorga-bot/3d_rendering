import { useEffect, useRef, useState } from 'react'
import { Scene } from './components/Scene'
import { Timeline } from './components/Timeline'
import { HUD } from './components/HUD'
import { useFrameLoader } from './hooks/useFrameLoader'

const PLAYBACK_INTERVAL_MS = 150

export function App() {
  const {
    currentFrame,
    frameData,
    loading,
    error,
    metrics,
    cacheWarning,
    goToFrame,
    nextFrame,
    prevFrame,
    totalFrames,
  } = useFrameLoader(0)

  const [isPlaying, setIsPlaying] = useState(false)
  const [isLooping, setIsLooping] = useState(false)
  const currentFrameRef = useRef(currentFrame)
  const isLoopingRef = useRef(isLooping)
  currentFrameRef.current = currentFrame
  isLoopingRef.current = isLooping

  useEffect(() => {
    if (!isPlaying) return
    const id = setInterval(() => {
      if (currentFrameRef.current >= totalFrames - 1) {
        if (isLoopingRef.current) {
          goToFrame(0)
        } else {
          setIsPlaying(false)
        }
      } else {
        nextFrame()
      }
    }, PLAYBACK_INTERVAL_MS)
    return () => clearInterval(id)
  }, [isPlaying, nextFrame, goToFrame, totalFrames])

  return (
    <>
      <Scene frameData={frameData} loading={loading} />

      <HUD
        frameId={currentFrame}
        pointCount={frameData?.points.length ?? 0}
        cuboidCount={frameData?.cuboids.length ?? 0}
        loading={loading}
        error={error}
        cacheWarning={cacheWarning}
      />

      <Timeline
        currentFrame={currentFrame}
        totalFrames={totalFrames}
        loading={loading}
        metrics={metrics}
        isPlaying={isPlaying}
        isLooping={isLooping}
        onGoTo={goToFrame}
        onNext={nextFrame}
        onPrev={prevFrame}
        onPlayPause={() => setIsPlaying(p => !p)}
        onToggleLoop={() => setIsLooping(p => !p)}
      />
    </>
  )
}