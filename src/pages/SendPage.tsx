import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { CurrencyInput } from '../components/CurrencyInput'
import { formatCurrency } from '../utils/currency'
import type { User } from '../types'

export function SendPage() {
  const { user, refreshUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [amount, setAmount] = useState(0)
  const [note, setNote] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('is_deleted', false)
      .order('name')

    if (data && user) {
      setUsers(data.filter((u: User) => u.id !== user.id))
    }
  }

  function toggleUser(userId: string) {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!user || selectedUsers.length === 0 || amount <= 0) return

    setError('')
    setSuccess('')
    setLoading(true)

    const totalAmount = amount * selectedUsers.length

    if (totalAmount > user.balance) {
      setError(`Nicht genug Gold. Du brauchst ${formatCurrency(totalAmount)}, hast aber nur ${formatCurrency(user.balance)}.`)
      setLoading(false)
      return
    }

    try {
      for (const receiverId of selectedUsers) {
        const { error: rpcError } = await supabase.rpc('send_money', {
          sender_id_in: user.id,
          receiver_id_in: receiverId,
          amount_in: amount,
          note_in: note.trim() || null,
        })

        if (rpcError) throw rpcError
      }

      const recipientNames = users
        .filter((u) => selectedUsers.includes(u.id))
        .map((u) => u.name)
        .join(', ')

      setSuccess(`${formatCurrency(amount)} an ${recipientNames} gesendet!`)
      setSelectedUsers([])
      setAmount(0)
      setNote('')
      await refreshUser()
    } catch (err: any) {
      setError(err.message || 'Überweisung fehlgeschlagen')
    }

    setLoading(false)
  }

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="font-display text-2xl font-bold text-gold">Gold senden</h1>

      <form onSubmit={handleSend} className="space-y-6">
        {/* Recipient Selection */}
        <div className="bg-surface border border-border rounded-2xl p-6">
          <label className="block text-sm text-text-muted mb-3 font-display uppercase tracking-wider">
            Empfänger ({selectedUsers.length} ausgewählt)
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Suchen..."
            className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-text text-sm mb-3 focus:outline-none focus:border-gold transition-colors"
          />
          <div className="max-h-48 overflow-y-auto space-y-1">
            {filteredUsers.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => toggleUser(u.id)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-left text-sm transition-colors ${
                  selectedUsers.includes(u.id)
                    ? 'bg-gold/10 border border-gold/30 text-gold'
                    : 'hover:bg-surface-light text-text'
                }`}
              >
                <span>{u.name}</span>
                <span className="text-xs text-text-muted">{u.house}</span>
              </button>
            ))}
            {filteredUsers.length === 0 && (
              <p className="text-text-muted text-sm text-center py-4">Keine Nutzer gefunden</p>
            )}
          </div>
        </div>

        {/* Amount */}
        <div className="bg-surface border border-border rounded-2xl p-6">
          <label className="block text-sm text-text-muted mb-3 font-display uppercase tracking-wider">
            Betrag {selectedUsers.length > 1 && <span className="normal-case">(pro Person)</span>}
          </label>
          <CurrencyInput onChange={setAmount} value={amount} />
          {selectedUsers.length > 1 && amount > 0 && (
            <p className="mt-3 text-xs text-text-muted">
              Gesamt: {formatCurrency(amount * selectedUsers.length)} ({selectedUsers.length} × {formatCurrency(amount)})
            </p>
          )}
        </div>

        {/* Note */}
        <div className="bg-surface border border-border rounded-2xl p-6">
          <label className="block text-sm text-text-muted mb-3 font-display uppercase tracking-wider">
            Verwendungszweck <span className="normal-case text-text-muted">(optional)</span>
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional"
            className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-text text-sm focus:outline-none focus:border-gold transition-colors"
          />
        </div>

        {error && (
          <div className="bg-danger/10 border border-danger/30 rounded-xl px-4 py-3 text-danger text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-success/10 border border-success/30 rounded-xl px-4 py-3 text-success text-sm">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || selectedUsers.length === 0 || amount <= 0}
          className="w-full bg-gold hover:bg-gold-light text-bg font-display font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Überweise...' : 'Gold senden'}
        </button>
      </form>
    </div>
  )
}
