import { NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { formatCurrency } from '../utils/currency'
import { HouseBadge } from './HouseBadge'

export function Navbar() {
  const { user, signOut } = useAuth()

  if (!user) return null

  const links = [
    { to: '/', label: 'Vault', icon: '🏦' },
    { to: '/send', label: 'Senden', icon: '💰' },
    { to: '/history', label: 'Verlauf', icon: '📜' },
    { to: '/bets', label: 'Wetten', icon: '🎲' },
    { to: '/profile', label: 'Profil', icon: '👤' },
  ]

  const adminLinks = user.is_admin
    ? [{ to: '/admin', label: 'Admin', icon: '👑' }]
    : []

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-50 md:static md:border-t-0 md:border-r md:w-64 md:min-h-screen md:flex md:flex-col">
      {/* Desktop header */}
      <div className="hidden md:block p-6 border-b border-border">
        <h1 className="font-display text-2xl font-bold text-gold tracking-wide">Gringotts</h1>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-sm text-text-muted">{user.name}</span>
          <HouseBadge house={user.house} size="sm" />
        </div>
        <p className="mt-2 font-mono text-gold text-sm">{formatCurrency(user.balance)}</p>
      </div>

      {/* Nav links */}
      <div className="flex md:flex-col md:flex-1 md:p-3 md:gap-1">
        {[...links, ...adminLinks].map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex-1 md:flex-none flex flex-col md:flex-row items-center md:gap-3 justify-center md:justify-start py-2 md:px-4 md:py-3 md:rounded-lg text-xs md:text-sm transition-colors ${
                isActive
                  ? 'text-gold bg-surface-light/50'
                  : 'text-text-muted hover:text-text hover:bg-surface-light/30'
              }`
            }
          >
            <span className="text-lg md:text-base">{link.icon}</span>
            <span className="mt-0.5 md:mt-0">{link.label}</span>
          </NavLink>
        ))}
      </div>

      {/* Desktop sign out */}
      <div className="hidden md:block p-4 border-t border-border">
        <button
          onClick={signOut}
          className="w-full text-sm text-text-muted hover:text-danger transition-colors text-left px-4 py-2 rounded-lg hover:bg-surface-light/30"
        >
          Abmelden
        </button>
      </div>
    </nav>
  )
}
