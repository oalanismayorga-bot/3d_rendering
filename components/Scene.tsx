import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, Environment } from '@react-three/drei'
import { PointCloud } from './PointCloud'
import { CuboidLayer } from './CuboidLayer'
import { KeyboardController } from './Keyboardcontroller'
import { FrameData } from '../types'

interface Props {
  frameData: FrameData | null
  loading: boolean
}

export function Scene({ frameData, loading }: Props) {
  return (
    <Canvas
      style={{ width: '100vw', height: '100vh', background: '#050810' }}
      camera={{
        position: [0, 25, 60],
        fov: 60,
        near: 0.1,
        far: 2000,
      }}
      gl={{ antialias: true, alpha: false }}
      dpr={[1, 1.5]}
    >
      {/* Keyboard controls (must be inside Canvas for useThree/useFrame) */}
      <KeyboardController />

      {/* Orbit controls for mouse pan/zoom/rotate */}
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.05}
        minDistance={2}
        maxDistance={600}
        zoomSpeed={1.2}
      />

      {/* Ambient + directional lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[50, 100, 50]} intensity={0.8} />

      {/* Ground grid */}
      <Grid
        position={[0, -0.5, 0]}
        args={[200, 200]}
        cellSize={5}
        cellThickness={0.3}
        cellColor="#1a2a3a"
        sectionSize={25}
        sectionThickness={0.8}
        sectionColor="#0a3a5a"
        fadeDistance={250}
        fadeStrength={1.5}
        infiniteGrid
      />

      {/* Scene content */}
      <Suspense fallback={null}>
        {frameData && (
          <>
            <PointCloud points={frameData.points} />
            <CuboidLayer cuboids={frameData.cuboids} />
          </>
        )}
      </Suspense>

      {/* Loading overlay mesh (subtle pulse) */}
      {loading && !frameData && (
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.5, 8, 8]} />
          <meshBasicMaterial color="#4fc3f7" wireframe />
        </mesh>
      )}
    </Canvas>
  )
}