import { CuboidData } from '../types'
import { Cuboid } from './Cuboid'

interface Props {
  cuboids: CuboidData[]
}

export function CuboidLayer({ cuboids }: Props) {
  return (
    <group>
      {cuboids.map(c => (
        <Cuboid key={c.uuid} cuboid={c} />
      ))}
    </group>
  )
}