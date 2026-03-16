import { useState, useEffect } from 'react'
import { currencyToKnuts } from '../utils/currency'
import type { Currency } from '../types'

interface CurrencyInputProps {
  onChange: (knuts: number) => void
  value?: number
}

export function CurrencyInput({ onChange, value }: CurrencyInputProps) {
  const [currency, setCurrency] = useState<Currency>({ galleons: 0, sickles: 0, knuts: 0 })

  useEffect(() => {
    if (value === 0 || value === undefined) {
      setCurrency({ galleons: 0, sickles: 0, knuts: 0 })
    }
  }, [value])

  function handleChange(field: keyof Currency, val: string) {
    const num = Math.max(0, parseInt(val) || 0)
    const updated = { ...currency, [field]: num }
    setCurrency(updated)
    onChange(currencyToKnuts(updated))
  }

  return (
    <div className="flex gap-3">
      <div className="flex-1">
        <label className="block text-xs text-text-muted mb-1 font-body">Galleonen</label>
        <input
          type="number"
          min="0"
          value={currency.galleons || ''}
          onChange={(e) => handleChange('galleons', e.target.value)}
          placeholder="0"
          className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text font-mono text-sm focus:outline-none focus:border-gold transition-colors"
        />
      </div>
      <div className="flex-1">
        <label className="block text-xs text-text-muted mb-1 font-body">Sickel</label>
        <input
          type="number"
          min="0"
          value={currency.sickles || ''}
          onChange={(e) => handleChange('sickles', e.target.value)}
          placeholder="0"
          className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text font-mono text-sm focus:outline-none focus:border-gold transition-colors"
        />
      </div>
      <div className="flex-1">
        <label className="block text-xs text-text-muted mb-1 font-body">Knuts</label>
        <input
          type="number"
          min="0"
          value={currency.knuts || ''}
          onChange={(e) => handleChange('knuts', e.target.value)}
          placeholder="0"
          className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text font-mono text-sm focus:outline-none focus:border-gold transition-colors"
        />
      </div>
    </div>
  )
}
