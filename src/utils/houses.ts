import type { House } from '../types'

export const houseColors: Record<House, { bg: string; text: string; accent: string }> = {
  Gryffindor: { bg: 'bg-gryffindor', text: 'text-gryffindor', accent: '#ae0001' },
  Hufflepuff: { bg: 'bg-hufflepuff', text: 'text-hufflepuff', accent: '#ecb939' },
  Ravenclaw: { bg: 'bg-ravenclaw', text: 'text-ravenclaw', accent: '#222f5b' },
  Slytherin: { bg: 'bg-slytherin', text: 'text-slytherin', accent: '#2a623d' },
}

export const houseEmojis: Record<House, string> = {
  Gryffindor: '🦁',
  Hufflepuff: '🦡',
  Ravenclaw: '🦅',
  Slytherin: '🐍',
}
