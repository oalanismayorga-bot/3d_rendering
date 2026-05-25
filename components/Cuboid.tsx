import { useRef, useState, useMemo } from 'react'
import { ThreeEvent } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { CuboidData } from '../types'

interface Props {
  cuboid: CuboidData
}

const LABEL_COLORS: Record<string, string> = {
  Car:             '#4fc3f7',
  Truck:           '#ff8a65',
  Pedestrian:      '#aed581',
  Cyclist:         '#ffd54f',
  Motorcycle:      '#ce93d8',
  'Traffic Cone':  '#ff7043',
  'Towed Object':  '#80cbc4',
  'Cones':         '#ff7043',
  'Other Vehicle - Uncommon': '#ffb74d',
  'Temporary Construction Barriers': '#90a4ae',
}

function getLabelColor(label: string): string {
  return LABEL_COLORS[label] ?? '#e0e0e0'
}

export function Cuboid({ cuboid }: Props) {
  const [hovered, setHovered] = useState(false)
  const meshRef = useRef<THREE.Mesh>(null)

  const { yaw, label, uuid, stationary } = cuboid
  const px = cuboid['position.x']
  const py = cuboid['position.y']
  const pz = cuboid['position.z']
  const dx = cuboid['dimensions.x']
  const dy = cuboid['dimensions.y']
  const dz = cuboid['dimensions.z']

  // Convert scene coords to Three.js (Y-up: scene Z becomes Three Y)
  const pos: [number, number, number] = [px, pz + dz / 2, py]
  const size: [number, number, number] = [dx, dz, dy]

  const color = getLabelColor(label)

  const edgesGeometry = useMemo(() => {
    const box = new THREE.BoxGeometry(...size)
    return new THREE.EdgesGeometry(box)
  }, [size[0], size[1], size[2]])

  const onPointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setHovered(true)
    document.body.style.cursor = 'pointer'
  }

  const onPointerOut = () => {
    setHovered(false)
    document.body.style.cursor = 'auto'
  }

  return (
    <group position={pos} rotation={[0, -yaw, 0]}>
      {/* Semi-transparent face mesh */}
      <mesh
        ref={meshRef}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
      >
        <boxGeometry args={size} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={hovered ? 0.28 : 0.12}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Solid edges */}
      <lineSegments geometry={edgesGeometry}>
        <lineBasicMaterial
          color={hovered ? '#ffffff' : color}
          linewidth={1}
          transparent
          opacity={hovered ? 1.0 : 0.85}
        />
      </lineSegments>

      {/* Hover tooltip */}
      {hovered && (
        <Html
          position={[0, size[1] / 2 + 0.3, 0]}
          center
          distanceFactor={30}
          style={{ pointerEvents: 'none' }}
        >
          <div style={{
            background: 'rgba(10, 12, 20, 0.92)',
            border: `1px solid ${color}`,
            borderRadius: '6px',
            padding: '8px 12px',
            color: '#f0f0f0',
            fontSize: '11px',
            fontFamily: 'monospace',
            minWidth: '170px',
            backdropFilter: 'blur(8px)',
            boxShadow: `0 0 12px ${color}44`,
          }}>
            <div style={{ color, fontWeight: 'bold', fontSize: '13px', marginBottom: '6px' }}>
              {label}
            </div>
            <div style={{ color: '#555', fontSize: '10px', marginBottom: '6px', wordBreak: 'break-all' }}>
              {uuid.slice(0, 18)}…
            </div>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <tbody>
                <Row label="W × L × H" value={`${dx.toFixed(2)} × ${dy.toFixed(2)} × ${dz.toFixed(2)} m`} />
                <Row label="X" value={px.toFixed(3)} />
                <Row label="Y" value={py.toFixed(3)} />
                <Row label="Z" value={pz.toFixed(3)} />
                <Row label="Yaw" value={`${(yaw * 180 / Math.PI).toFixed(1)}°`} />
                {stationary !== undefined && (
                  <Row label="Stationary" value={stationary ? 'Yes' : 'No'} />
                )}
              </tbody>
            </table>
          </div>
        </Html>
      )}
    </group>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td style={{ color: '#888', paddingRight: '8px', paddingBottom: '2px' }}>{label}</td>
      <td style={{ color: '#e0e0e0', textAlign: 'right' }}>{value}</td>
    </tr>
  )
}