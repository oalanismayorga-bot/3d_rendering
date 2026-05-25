import { FrameData, CacheEntry, CacheMetrics } from '../types'

const BASE_URL = 'https://static.scale.com/uploads/pandaset-challenge'
const TOTAL_FRAMES = 50

function getMaxCacheMb(): number {
  const params = new URLSearchParams(window.location.search)
  const val = params.get('MAX_FRAME_CACHE_MB')
  return val ? parseFloat(val) : 512
}

function getWindowSize(): number {
  const params = new URLSearchParams(window.location.search)
  const val = params.get('WINDOW_SIZE')
  return val ? parseInt(val, 10) : 2  // default ±2
}

function calculateByteSize(data: FrameData): number {
  const n = data.points.length
  const c = data.cuboids.length

  const jsonPoints      = n * 3 * 8        // raw float64 in JS heap
  const bufferPositions = n * 3 * 4        // Float32Array positions (PointCloud.tsx)
  const bufferColors    = n * 3 * 4        // Float32Array colors    (PointCloud.tsx)

  // --- BoxGeometry per cuboid ---
  const boxPositions = 24 * 3 * 4     // 288 bytes
  const boxNormals   = 24 * 3 * 4     // 288 bytes
  const boxUvs       = 24 * 2 * 4     // 192 bytes
  const boxIndex     = 36 * 2         // 72 bytes
  const boxTotal     = boxPositions + boxNormals + boxUvs + boxIndex  // 840 bytes

  // --- EdgesGeometry per cuboid ---
  const edgesTotal   = 12 * 2 * 3 * 4  // 288 bytes

  return (
    jsonPoints + bufferPositions + bufferColors +          // points
    c * (boxTotal + edgesTotal)                            // cuboids
  )
}

export class FrameCache {
  private cache = new Map<number, CacheEntry>()
  private inFlight = new Map<number, Promise<FrameData>>()
  private hits = 0
  private misses = 0
  private maxBytes: number
  private softWarnThreshold = 0.85 // warn at 85% usage
  private onWarning?: (msg: string) => void
  private usedBytes = 0 

  constructor(onWarning?: (msg: string) => void) {
    this.maxBytes = getMaxCacheMb() * 1024 * 1024
    this.onWarning = onWarning
  }

  setWarningCallback(cb: ((msg: string) => void) | undefined) {
    this.onWarning = cb
  }

  get limitMb(): number {
    return this.maxBytes / (1024 * 1024)
  }

  private currentUsageBytes(): number {
    return this.usedBytes
  }

  private evict(neededBytes: number): void {
    // Sort by lastAccess ascending (oldest first)
    const entries = [...this.cache.entries()]
      .filter(([, e]) => e.status === 'ready')
      .sort(([, a], [, b]) => a.lastAccess - b.lastAccess)

    for (const [frameId, entry] of entries) {
      if (this.usedBytes + neededBytes <= this.maxBytes) break
      console.log(`[FrameCache] Evicting frame ${frameId} (${(entry.byteSize / 1024 / 1024).toFixed(2)} MB)`)
      this.cache.delete(frameId)
      this.usedBytes -= entry.byteSize
    }
  }

  private checkSoftWarning(): void {
    const ratio = this.usedBytes / this.maxBytes
    if (ratio >= this.softWarnThreshold) {
      const msg = `Cache usage at ${(ratio * 100).toFixed(1)}% (${(this.usedBytes / 1024 / 1024).toFixed(1)} / ${this.limitMb} MB)`
      console.warn(`[FrameCache] ${msg}`)
      this.onWarning?.(msg)
    }
  }

  private async _fetchFrame(frameId: number): Promise<FrameData> {
    this.cache.set(frameId, {
      data: null as unknown as FrameData,
      byteSize: 0,
      status: 'loading',
      lastAccess: Date.now(),
    })

    try {
      const paddedId = String(frameId).padStart(2, '0')
      const res = await fetch(`${BASE_URL}/frame_${paddedId}.json`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: FrameData = await res.json()

      const byteSize = calculateByteSize(data)

      if (this.usedBytes + byteSize > this.maxBytes) {
        this.evict(byteSize)
      }

      this.cache.set(frameId, {
        data,
        byteSize,
        status: 'ready',
        lastAccess: Date.now(),
      })
      this.usedBytes += byteSize

      this.checkSoftWarning()
      return data
    } catch (err) {
      this.cache.set(frameId, {
        data: null as unknown as FrameData,
        byteSize: 0,
        status: 'error',
        lastAccess: Date.now(),
      })
      throw err
    }
  }

  async loadFrame(frameId: number): Promise<FrameData> {
    // Return cached if ready
    const existing = this.cache.get(frameId)
    if (existing?.status === 'ready') {
      existing.lastAccess = Date.now()
      this.hits++
      return existing.data
    }

    // Avoid duplicate in-flight requests
    if (this.inFlight.has(frameId)) {
      this.hits++
      return this.inFlight.get(frameId)!
    }

    this.misses++
    const promise = this._fetchFrame(frameId)
    this.inFlight.set(frameId, promise)

    try {
      return await promise
    } finally {
      this.inFlight.delete(frameId)  // ← limpia cuando termina (éxito o error)
    }
  }

  getFrame(frameId: number): FrameData | null {
    const entry = this.cache.get(frameId)
    if (entry?.status === 'ready') {
      entry.lastAccess = Date.now()
      return entry.data
    }
    return null
  }

  /** Preload a sliding window around currentFrame */
  preloadWindow(currentFrame: number, windowSize = 2): void {
    for (let i = -windowSize; i <= windowSize; i++) {
      const id = currentFrame + i
      if (id >= 0 && id < TOTAL_FRAMES) {
        const entry = this.cache.get(id)
        if (!entry || entry.status === 'error') {
          this.loadFrame(id).catch(() => {/* silently ignore preload errors */})
        }
      }
    }
  }

  getMetrics(): CacheMetrics {
    const total = this.hits + this.misses
    return {
      usageMb: parseFloat((this.usedBytes / 1024 / 1024).toFixed(2)),
      limitMb: this.limitMb,
      entries: [...this.cache.values()].filter(e => e.status === 'ready').length,
      hitRate: total > 0 ? parseFloat(((this.hits / total) * 100).toFixed(1)) : 0,
      frames: [...this.cache.entries()]
        .filter(([, e]) => e.status === 'ready')
        .map(([id]) => id)
        .sort((a, b) => a - b),
    }
  }
}

export const frameCache = new FrameCache()
export const FRAME_COUNT = TOTAL_FRAMES
export const WINDOW_SIZE = getWindowSize()