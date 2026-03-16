import type { House } from '../types'
import { houseEmojis } from '../utils/houses'

const houseBgColors: Record<House, string> = {
  Gryffindor: '#ae0001',
  Hufflepuff: '#ecb939',
  Ravenclaw: '#222f5b',
  Slytherin: '#2a623d',
}

const houseTextColors: Record<House, string> = {
  Gryffindor: '#fff',
  Hufflepuff: '#1a1a1a',
  Ravenclaw: '#fff',
  Slytherin: '#fff',
}

export function HouseBadge({ house, size = 'sm' }: { house: House; size?: 'sm' | 'md' }) {
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-display font-semibold ${padding}`}
      style={{ backgroundColor: houseBgColors[house], color: houseTextColors[house] }}
    >
      {houseEmojis[house]} {house}
    </span>
  )
}
