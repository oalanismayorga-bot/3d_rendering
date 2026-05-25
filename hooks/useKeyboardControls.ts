import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const MOVE_SPEED = 0.3
const ROTATE_SPEED = 0.02
const VERTICAL_SPEED = 0.2

export function useKeyboardControls(enabled = true) {
  const keys = useRef<Set<string>>(new Set())
  const { camera, controls } = useThree()

  useEffect(() => {
    if (!enabled) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault()
      }
      keys.current.add(e.key.toLowerCase())
    }
    const onKeyUp = (e: KeyboardEvent) => {
      keys.current.delete(e.key.toLowerCase())
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [enabled])

  useFrame(() => {
    if (!enabled || !controls) return
    const k = keys.current
    const orbitControls = controls as any

    // --- WASD: move camera + target parallel to ground plane ---
    const forward = new THREE.Vector3()
    camera.getWorldDirection(forward)
    forward.y = 0
    forward.normalize()

    const right = new THREE.Vector3()
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize()

    const delta = new THREE.Vector3()
    if (k.has('w')) delta.addScaledVector(forward, MOVE_SPEED)
    if (k.has('s')) delta.addScaledVector(forward, -MOVE_SPEED)
    if (k.has('a')) delta.addScaledVector(right, -MOVE_SPEED)
    if (k.has('d')) delta.addScaledVector(right, MOVE_SPEED)

    // --- Q/E: vertical movement ---
    if (k.has('q')) delta.y -= VERTICAL_SPEED
    if (k.has('e')) delta.y += VERTICAL_SPEED

    if (!delta.equals(new THREE.Vector3())) {
      camera.position.add(delta)
      orbitControls.target.add(delta)
    }

    // --- Arrow keys: rotate by adjusting camera position in spherical coords ---
    const rotating = k.has('arrowleft') || k.has('arrowright') || k.has('arrowup') || k.has('arrowdown')
    if (rotating) {
      const offset = camera.position.clone().sub(orbitControls.target)
      const spherical = new THREE.Spherical().setFromVector3(offset)

      if (k.has('arrowleft'))  spherical.theta -= ROTATE_SPEED
      if (k.has('arrowright')) spherical.theta += ROTATE_SPEED
      if (k.has('arrowup'))    spherical.phi   -= ROTATE_SPEED * 0.5
      if (k.has('arrowdown'))  spherical.phi   += ROTATE_SPEED * 0.5

      spherical.phi = Math.max(0.05, Math.min(Math.PI - 0.05, spherical.phi))
      spherical.makeSafe()
      offset.setFromSpherical(spherical)
      camera.position.copy(orbitControls.target).add(offset)
    }

    orbitControls.update()
  })
}