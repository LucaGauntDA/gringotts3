import { useAuth } from '../hooks/useAuth'
import { formatCurrency, formatCurrencyLong } from '../utils/currency'
import { HouseBadge } from '../components/HouseBadge'

export function VaultPage() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-gold">
          Willkommen, {user.name}
        </h1>
        <div className="mt-2">
          <HouseBadge house={user.house} size="md" />
        </div>
      </div>

      {/* Balance Card */}
      <div className="bg-surface border border-border rounded-2xl p-8">
        <p className="text-text-muted text-sm uppercase tracking-wider font-display">Dein Vermögen</p>
        <p className="mt-3 font-mono text-4xl md:text-5xl font-bold text-gold">
          {formatCurrency(user.balance)}
        </p>
        <p className="mt-2 text-text-muted text-sm">
          {formatCurrencyLong(user.balance)}
        </p>
      </div>

      {/* Quick Info */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface border border-border rounded-xl p-4 text-center">
          <p className="text-2xl">💰</p>
          <p className="text-xs text-text-muted mt-1 font-display">Senden</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4 text-center">
          <p className="text-2xl">📜</p>
          <p className="text-xs text-text-muted mt-1 font-display">Verlauf</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4 text-center">
          <p className="text-2xl">🎲</p>
          <p className="text-xs text-text-muted mt-1 font-display">Wetten</p>
        </div>
      </div>

      {/* Currency Info */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <h3 className="font-display text-sm text-gold uppercase tracking-wider mb-4">Wechselkurse</h3>
        <div className="space-y-2 text-sm text-text-muted">
          <p>1 Galleone = 17 Sickel</p>
          <p>1 Sickel = 29 Knuts</p>
          <p>1 Galleone = 493 Knuts</p>
        </div>
      </div>
    </div>
  )
}
