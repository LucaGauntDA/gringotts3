export type House = 'Gryffindor' | 'Hufflepuff' | 'Ravenclaw' | 'Slytherin'

export interface User {
  id: string
  name: string
  email?: string
  house: House
  balance: number
  is_deleted: boolean
  is_admin: boolean
}

export interface Transaction {
  id: string
  sender_id: string | null
  receiver_id: string | null
  amount: number
  note: string | null
  created_at: string
  sender?: { name: string } | null
  receiver?: { name: string } | null
}

export type BetStatus = 'OPEN' | 'LOCKED' | 'RESOLVED'

export interface BettingEvent {
  id: string
  title: string
  option_a: string
  option_b: string
  status: BetStatus
  winner: 'A' | 'B' | null
  created_by: string
  created_at: string
}

export interface Bet {
  id: string
  event_id: string
  user_id: string
  amount: number
  choice: 'A' | 'B'
  created_at: string
  user?: { name: string }
}

export interface Currency {
  galleons: number
  sickles: number
  knuts: number
}
