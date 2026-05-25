import { useState, useEffect, useCallback, useRef } from 'react'
import { FrameData, CacheMetrics } from '../types'
import { frameCache, FRAME_COUNT, WINDOW_SIZE } from '../services/FrameCache'

export function useFrameLoader(initialFrame = 0) {
  const [currentFrame, setCurrentFrame] = useState(initialFrame)
  const [frameData, setFrameData] = useState<FrameData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<CacheMetrics>(frameCache.getMetrics())
  const [cacheWarning, setCacheWarning] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const goToFrame = useCallback((frameId: number) => {
    const clamped = Math.max(0, Math.min(FRAME_COUNT - 1, frameId))
    setCurrentFrame(clamped)
  }, [])

  const nextFrame = useCallback(() => goToFrame(currentFrame + 1), [currentFrame, goToFrame])
  const prevFrame = useCallback(() => goToFrame(currentFrame - 1), [currentFrame, goToFrame])

  useEffect(() => {
    // Cancel any previous load
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    setLoading(true)
    setError(null)

    // Try cache first for instant render
    const cached = frameCache.getFrame(currentFrame)
    if (cached) {
      setFrameData(cached)
      setLoading(false)
      setMetrics(frameCache.getMetrics())
    }

    frameCache.loadFrame(currentFrame)
      .then(data => {
        if (abortRef.current?.signal.aborted) return
        setFrameData(data)
        setLoading(false)
        setMetrics(frameCache.getMetrics())
      })
      .catch(err => {
        if (abortRef.current?.signal.aborted) return
        setError(`Failed to load frame ${currentFrame}: ${err.message}`)
        setLoading(false)
      })

    // Preload sliding window
    frameCache.preloadWindow(currentFrame, WINDOW_SIZE)

    return () => { abortRef.current?.abort() }
  }, [currentFrame])

  // Wire soft-warning callback
  useEffect(() => {
    frameCache.setWarningCallback(msg => setCacheWarning(msg))
    return () => frameCache.setWarningCallback(undefined)
  }, [])

  // Poll metrics every 2s to reflect preload progress
  useEffect(() => {
    const id = setInterval(() => setMetrics(frameCache.getMetrics()), 2000)
    return () => clearInterval(id)
  }, [])

  return {
    currentFrame,
    frameData,
    loading,
    error,
    metrics,
    cacheWarning,
    goToFrame,
    nextFrame,
    prevFrame,
    totalFrames: FRAME_COUNT,
  }
}