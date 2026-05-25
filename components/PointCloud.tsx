import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface Props {
  points: [number, number, number][]
}

// Z height color gradient: deep blue → cyan → green → yellow → red
function zToColor(z: number, zMin: number, zMax: number): THREE.Color {
  const t = Math.max(0, Math.min(1, (z - zMin) / (zMax - zMin)))

  const stops = [
    { t: 0.0,  r: 0.05, g: 0.10, b: 0.60 }, // deep blue
    { t: 0.25, r: 0.00, g: 0.70, b: 0.90 }, // cyan
    { t: 0.5,  r: 0.10, g: 0.90, b: 0.20 }, // green
    { t: 0.75, r: 1.00, g: 0.85, b: 0.00 }, // yellow
    { t: 1.0,  r: 1.00, g: 0.10, b: 0.05 }, // red
  ]

  // Find surrounding stops
  let lo = stops[0], hi = stops[stops.length - 1]
  for (let i = 0; i < stops.length - 1; i++) {
    if (t >= stops[i].t && t <= stops[i + 1].t) {
      lo = stops[i]
      hi = stops[i + 1]
      break
    }
  }

  const range = hi.t - lo.t
  const local = range === 0 ? 0 : (t - lo.t) / range

  return new THREE.Color(
    lo.r + (hi.r - lo.r) * local,
    lo.g + (hi.g - lo.g) * local,
    lo.b + (hi.b - lo.b) * local,
  )
}

export function PointCloud({ points }: Props) {
  const geoRef = useRef<THREE.BufferGeometry>(null)

  const { positions, colors } = useMemo(() => {
    if (!points || points.length === 0) {
      return { positions: new Float32Array(0), colors: new Float32Array(0) }
    }

    const zValues = points.map(p => p[2])
    const zMin = Math.min(...zValues)
    const zMax = Math.max(...zValues)

    const positions = new Float32Array(points.length * 3)
    const colors = new Float32Array(points.length * 3)

    for (let i = 0; i < points.length; i++) {
      const [x, y, z] = points[i]
      positions[i * 3]     = x
      positions[i * 3 + 1] = z  // Three.js Y-up: use z as Y
      positions[i * 3 + 2] = y

      const color = zToColor(z, zMin, zMax)
      colors[i * 3]     = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
    }

    return { positions, colors }
  }, [points])

  return (
    <points>
      <bufferGeometry ref={geoRef}>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        vertexColors
        sizeAttenuation
        transparent
        opacity={0.9}
      />
    </points>
  )
}