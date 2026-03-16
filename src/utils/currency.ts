import type { Currency } from '../types'

const KNUTS_PER_SICKLE = 29
const SICKLES_PER_GALLEON = 17
const KNUTS_PER_GALLEON = KNUTS_PER_SICKLE * SICKLES_PER_GALLEON // 493

export function knutsToCurrency(knuts: number): Currency {
  const galleons = Math.floor(knuts / KNUTS_PER_GALLEON)
  const remaining = knuts % KNUTS_PER_GALLEON
  const sickles = Math.floor(remaining / KNUTS_PER_SICKLE)
  const remainingKnuts = remaining % KNUTS_PER_SICKLE
  return { galleons, sickles, knuts: remainingKnuts }
}

export function currencyToKnuts(currency: Currency): number {
  return (
    currency.galleons * KNUTS_PER_GALLEON +
    currency.sickles * KNUTS_PER_SICKLE +
    currency.knuts
  )
}

export function formatCurrency(knuts: number): string {
  const c = knutsToCurrency(knuts)
  const parts: string[] = []
  if (c.galleons > 0) parts.push(`${c.galleons}G`)
  if (c.sickles > 0) parts.push(`${c.sickles}S`)
  if (c.knuts > 0 || parts.length === 0) parts.push(`${c.knuts}K`)
  return parts.join(' ')
}

export function formatCurrencyLong(knuts: number): string {
  const c = knutsToCurrency(knuts)
  const parts: string[] = []
  if (c.galleons > 0) parts.push(`${c.galleons} Galleone${c.galleons !== 1 ? 'n' : ''}`)
  if (c.sickles > 0) parts.push(`${c.sickles} Sickel`)
  if (c.knuts > 0 || parts.length === 0) parts.push(`${c.knuts} Knut${c.knuts !== 1 ? 's' : ''}`)
  return parts.join(', ')
}

export { KNUTS_PER_SICKLE, SICKLES_PER_GALLEON, KNUTS_PER_GALLEON }
