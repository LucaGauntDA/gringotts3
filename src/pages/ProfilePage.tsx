import { useState } from 'react'
import { supabase } from '../utils/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { HouseBadge } from '../components/HouseBadge'
import type { House } from '../types'

const HOUSES: House[] = ['Gryffindor', 'Hufflepuff', 'Ravenclaw', 'Slytherin']

export function ProfilePage() {
  const { user, refreshUser, signOut } = useAuth()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user?.name || '')
  const [house, setHouse] = useState<House>(user?.house || 'Gryffindor')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!user) return null

  async function handleSave() {
    setLoading(true)
    setError('')
    setSuccess('')

    const { error: err } = await supabase
      .from('users')
      .update({ name, house })
      .eq('id', user!.id)

    if (err) {
      setError(err.message)
    } else {
      setSuccess('Profil aktualisiert')
      setEditing(false)
      await refreshUser()
    }
    setLoading(false)
  }

  async function handleDeleteAccount() {
    setLoading(true)
    const { error: err } = await supabase
      .from('users')
      .update({ is_deleted: true })
      .eq('id', user!.id)

    if (err) {
      setError(err.message)
    } else {
      await signOut()
    }
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="font-display text-2xl font-bold text-gold">Profil</h1>

      <div className="bg-surface border border-border rounded-2xl p-6 space-y-6">
        {editing ? (
          <>
            <div>
              <label className="block text-sm text-text-muted mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-text focus:outline-none focus:border-gold transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-2">Haus</label>
              <div className="grid grid-cols-2 gap-2">
                {HOUSES.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHouse(h)}
                    className={`py-2.5 px-3 rounded-lg border text-sm font-display font-semibold transition-all ${
                      house === h
                        ? 'border-gold bg-gold/10 text-gold'
                        : 'border-border text-text-muted hover:border-text-muted'
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 bg-gold hover:bg-gold-light text-bg font-display font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
              >
                {loading ? 'Speichere...' : 'Speichern'}
              </button>
              <button
                onClick={() => {
                  setEditing(false)
                  setName(user.name)
                  setHouse(user.house)
                }}
                className="flex-1 bg-surface-light hover:bg-border text-text font-display py-3 rounded-xl transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl text-text">{user.name}</h2>
                <p className="text-sm text-text-muted mt-1">{user.email}</p>
              </div>
              <HouseBadge house={user.house} size="md" />
            </div>
            <button
              onClick={() => setEditing(true)}
              className="w-full bg-surface-light hover:bg-border text-text font-display py-3 rounded-xl transition-colors"
            >
              Bearbeiten
            </button>
          </>
        )}

        {error && <p className="text-danger text-sm">{error}</p>}
        {success && <p className="text-success text-sm">{success}</p>}
      </div>

      {/* Sign Out (mobile - desktop has it in sidebar) */}
      <button
        onClick={signOut}
        className="w-full md:hidden bg-surface border border-border text-text-muted hover:text-danger font-display py-3 rounded-xl transition-colors"
      >
        Abmelden
      </button>

      {/* Delete Account */}
      <div className="bg-surface border border-danger/20 rounded-2xl p-6">
        <h3 className="font-display text-sm text-danger">Konto löschen</h3>
        <p className="text-xs text-text-muted mt-1 mb-4">
          Dein Konto wird deaktiviert. Deine Daten bleiben für Admins sichtbar.
        </p>
        {confirmDelete ? (
          <div className="flex gap-3">
            <button
              onClick={handleDeleteAccount}
              disabled={loading}
              className="flex-1 bg-danger hover:bg-danger/80 text-white font-display py-2.5 rounded-xl transition-colors text-sm disabled:opacity-50"
            >
              Endgültig löschen
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="flex-1 bg-surface-light text-text font-display py-2.5 rounded-xl transition-colors text-sm"
            >
              Abbrechen
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-sm text-danger/70 hover:text-danger transition-colors"
          >
            Konto löschen...
          </button>
        )}
      </div>
    </div>
  )
}
