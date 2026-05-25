export interface FrameData {
  frame_id: number
  points: [number, number, number][]
  cuboids: CuboidData[]
}

export interface CuboidData {
  uuid: string
  label: string
  yaw: number
  stationary?: boolean
  camera_used?: number
  'position.x': number
  'position.y': number
  'position.z': number
  'dimensions.x': number
  'dimensions.y': number
  'dimensions.z': number
  'cuboids.sibling_id'?: string
  'cuboids.sensor_id'?: number
}

export interface CacheEntry {
  data: FrameData
  byteSize: number
  status: 'loading' | 'ready' | 'error'
  lastAccess: number
}

export interface CacheMetrics {
  usageMb: number
  limitMb: number
  entries: number
  hitRate: number
  frames: number[]
}