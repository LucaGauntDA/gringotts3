import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { CurrencyInput } from '../components/CurrencyInput'
import { formatCurrency } from '../utils/currency'
import { HouseBadge } from '../components/HouseBadge'
import { Spinner } from '../components/Spinner'
import type { User, Transaction, BettingEvent, Bet } from '../types'

type Tab = 'users' | 'transactions' | 'bets'

export function AdminPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('users')

  if (!user?.is_admin) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <p className="text-text-muted">Kein Zugriff</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="font-display text-2xl font-bold text-gold">👑 Admin</h1>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['users', 'transactions', 'bets'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg font-display text-sm transition-colors ${
              tab === t
                ? 'bg-gold text-bg'
                : 'bg-surface text-text-muted hover:text-text border border-border'
            }`}
          >
            {t === 'users' ? 'Nutzer' : t === 'transactions' ? 'Transaktionen' : 'Wetten'}
          </button>
        ))}
      </div>

      {tab === 'users' && <UsersTab />}
      {tab === 'transactions' && <TransactionsTab />}
      {tab === 'bets' && <BetsTab />}
    </div>
  )
}

/* ─── Users Tab ─── */
function UsersTab() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [adjustUser, setAdjustUser] = useState<User | null>(null)
  const [adjustAmount, setAdjustAmount] = useState(0)
  const [adjustNote, setAdjustNote] = useState('')
  const [adjustMode, setAdjustMode] = useState<'add' | 'subtract'>('add')

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    setLoading(true)
    const { data } = await supabase
      .from('users_with_email')
      .select('*')
      .order('name')
    if (data) setUsers(data as User[])
    setLoading(false)
  }

  async function handleAdjustBalance() {
    if (!adjustUser || adjustAmount <= 0) return

    const delta = adjustMode === 'add' ? adjustAmount : -adjustAmount
    const newBalance = adjustUser.balance + delta

    if (newBalance < 0) {
      alert('Kontostand kann nicht negativ werden')
      return
    }

    const { error: updateErr } = await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('id', adjustUser.id)

    if (updateErr) {
      alert(updateErr.message)
      return
    }

    // Log as admin transaction
    await supabase.from('transactions').insert({
      sender_id: adjustMode === 'subtract' ? adjustUser.id : null,
      receiver_id: adjustMode === 'add' ? adjustUser.id : null,
      amount: adjustAmount,
      note: adjustNote.trim() || 'Admin-Korrektur',
    })

    setAdjustUser(null)
    setAdjustAmount(0)
    setAdjustNote('')
    fetchUsers()
  }

  async function toggleDeleted(u: User) {
    await supabase
      .from('users')
      .update({ is_deleted: !u.is_deleted })
      .eq('id', u.id)
    fetchUsers()
  }

  if (loading) return <Spinner />

  return (
    <div className="space-y-4">
      {/* Adjust Modal */}
      {adjustUser && (
        <div className="bg-surface border border-gold/30 rounded-2xl p-6 space-y-4">
          <h3 className="font-display text-gold">
            Kontostand anpassen: {adjustUser.name}
          </h3>
          <p className="text-sm text-text-muted">
            Aktuell: <span className="font-mono text-text">{formatCurrency(adjustUser.balance)}</span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setAdjustMode('add')}
              className={`px-4 py-2 rounded-lg text-sm font-display ${
                adjustMode === 'add' ? 'bg-success text-white' : 'bg-surface-light text-text-muted'
              }`}
            >
              + Hinzufügen
            </button>
            <button
              onClick={() => setAdjustMode('subtract')}
              className={`px-4 py-2 rounded-lg text-sm font-display ${
                adjustMode === 'subtract' ? 'bg-danger text-white' : 'bg-surface-light text-text-muted'
              }`}
            >
              − Abziehen
            </button>
          </div>
          <CurrencyInput onChange={setAdjustAmount} value={adjustAmount} />
          <input
            type="text"
            value={adjustNote}
            onChange={(e) => setAdjustNote(e.target.value)}
            placeholder="Grund (optional)"
            className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-text text-sm focus:outline-none focus:border-gold transition-colors"
          />
          <div className="flex gap-3">
            <button
              onClick={handleAdjustBalance}
              disabled={adjustAmount <= 0}
              className="flex-1 bg-gold hover:bg-gold-light text-bg font-display font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50"
            >
              Anwenden
            </button>
            <button
              onClick={() => setAdjustUser(null)}
              className="flex-1 bg-surface-light text-text font-display py-2.5 rounded-xl transition-colors"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* User List */}
      {users.map((u) => (
        <div
          key={u.id}
          className={`bg-surface border border-border rounded-xl px-5 py-4 flex items-center justify-between gap-4 ${
            u.is_deleted ? 'opacity-40' : ''
          }`}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-text">{u.name}</span>
              <HouseBadge house={u.house} size="sm" />
              {u.is_admin && <span className="text-xs text-gold">👑</span>}
              {u.is_deleted && <span className="text-xs text-danger">gesperrt</span>}
            </div>
            <p className="text-xs text-text-muted mt-0.5">{u.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm text-gold">{formatCurrency(u.balance)}</span>
            <button
              onClick={() => setAdjustUser(u)}
              className="text-xs text-text-muted hover:text-gold transition-colors"
              title="Kontostand anpassen"
            >
              ±
            </button>
            <button
              onClick={() => toggleDeleted(u)}
              className="text-xs text-text-muted hover:text-danger transition-colors"
              title={u.is_deleted ? 'Entsperren' : 'Sperren'}
            >
              {u.is_deleted ? '🔓' : '🔒'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── Transactions Tab ─── */
function TransactionsTab() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTransactions()
  }, [])

  async function fetchTransactions() {
    setLoading(true)
    const { data } = await supabase
      .from('transactions')
      .select(`
        *,
        sender:users!transactions_sender_id_fkey(name),
        receiver:users!transactions_receiver_id_fkey(name)
      `)
      .order('created_at', { ascending: false })
      .limit(100)

    if (data) setTransactions(data)
    setLoading(false)
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) return <Spinner />

  return (
    <div className="space-y-2">
      {transactions.map((tx) => (
        <div
          key={tx.id}
          className="bg-surface border border-border rounded-xl px-5 py-3 flex items-center justify-between gap-4"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm text-text">
              <span className="text-text-muted">{tx.sender?.name || 'System'}</span>
              {' → '}
              <span className="text-text-muted">{tx.receiver?.name || 'System'}</span>
            </p>
            {tx.note && <p className="text-xs text-text-muted truncate">{tx.note}</p>}
            <p className="text-xs text-text-muted/60">{formatDate(tx.created_at)}</p>
          </div>
          <span className="font-mono text-sm text-gold whitespace-nowrap">
            {formatCurrency(tx.amount)}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ─── Bets Tab ─── */
function BetsTab() {
  const { user } = useAuth()
  const [events, setEvents] = useState<BettingEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [title, setTitle] = useState('')
  const [optionA, setOptionA] = useState('')
  const [optionB, setOptionB] = useState('')

  useEffect(() => {
    fetchEvents()
  }, [])

  async function fetchEvents() {
    setLoading(true)
    const { data } = await supabase
      .from('betting_events')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setEvents(data)
    setLoading(false)
  }

  async function handleCreate() {
    if (!title || !optionA || !optionB || !user) return

    const { error } = await supabase.from('betting_events').insert({
      title,
      option_a: optionA,
      option_b: optionB,
      created_by: user.id,
    })

    if (error) {
      alert(error.message)
    } else {
      setTitle('')
      setOptionA('')
      setOptionB('')
      setShowCreate(false)
      fetchEvents()
    }
  }

  async function handleStatusChange(eventId: string, status: 'LOCKED' | 'RESOLVED', winner?: 'A' | 'B') {
    const update: any = { status }
    if (winner) update.winner = winner

    const { error } = await supabase
      .from('betting_events')
      .update(update)
      .eq('id', eventId)

    if (error) {
      alert(error.message)
      return
    }

    // If resolving, handle payout
    if (status === 'RESOLVED' && winner) {
      await handlePayout(eventId, winner)
    }

    fetchEvents()
  }

  async function handlePayout(eventId: string, winner: 'A' | 'B') {
    // Get all bets for this event
    const { data: allBets } = await supabase
      .from('bets')
      .select('*')
      .eq('event_id', eventId)

    if (!allBets || allBets.length === 0) return

    const totalPool = allBets.reduce((sum, b) => sum + b.amount, 0)
    const winnerBets = allBets.filter((b) => b.choice === winner)
    const winnerPool = winnerBets.reduce((sum, b) => sum + b.amount, 0)

    if (winnerPool === 0) return // No winners

    // Distribute proportionally
    for (const bet of winnerBets) {
      const share = Math.floor((bet.amount / winnerPool) * totalPool)

      // Credit the winner
      const { data: userData } = await supabase
        .from('users')
        .select('balance')
        .eq('id', bet.user_id)
        .single()

      if (userData) {
        await supabase
          .from('users')
          .update({ balance: userData.balance + share })
          .eq('id', bet.user_id)

        // Log payout transaction
        await supabase.from('transactions').insert({
          sender_id: null,
          receiver_id: bet.user_id,
          amount: share,
          note: `Wettgewinn`,
        })
      }
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="space-y-4">
      <button
        onClick={() => setShowCreate(!showCreate)}
        className="bg-gold hover:bg-gold-light text-bg font-display font-semibold px-5 py-2.5 rounded-xl transition-colors"
      >
        + Neue Wette
      </button>

      {showCreate && (
        <div className="bg-surface border border-gold/30 rounded-2xl p-6 space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titel der Wette"
            className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-text focus:outline-none focus:border-gold transition-colors"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={optionA}
              onChange={(e) => setOptionA(e.target.value)}
              placeholder="Option A"
              className="bg-bg border border-border rounded-lg px-4 py-3 text-text focus:outline-none focus:border-gold transition-colors"
            />
            <input
              type="text"
              value={optionB}
              onChange={(e) => setOptionB(e.target.value)}
              placeholder="Option B"
              className="bg-bg border border-border rounded-lg px-4 py-3 text-text focus:outline-none focus:border-gold transition-colors"
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={!title || !optionA || !optionB}
            className="w-full bg-gold hover:bg-gold-light text-bg font-display font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
          >
            Erstellen
          </button>
        </div>
      )}

      {events.map((event) => (
        <div key={event.id} className="bg-surface border border-border rounded-xl px-5 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-text">{event.title}</h3>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                event.status === 'OPEN'
                  ? 'bg-success/20 text-success'
                  : event.status === 'LOCKED'
                    ? 'bg-gold/20 text-gold'
                    : 'bg-text-muted/20 text-text-muted'
              }`}
            >
              {event.status}
            </span>
          </div>
          <p className="text-sm text-text-muted">
            A: {event.option_a} · B: {event.option_b}
          </p>

          {event.status === 'OPEN' && (
            <button
              onClick={() => handleStatusChange(event.id, 'LOCKED')}
              className="text-xs bg-gold/10 text-gold px-3 py-1.5 rounded-lg hover:bg-gold/20 transition-colors"
            >
              Sperren
            </button>
          )}

          {event.status === 'LOCKED' && (
            <div className="flex gap-2">
              <button
                onClick={() => handleStatusChange(event.id, 'RESOLVED', 'A')}
                className="text-xs bg-success/10 text-success px-3 py-1.5 rounded-lg hover:bg-success/20 transition-colors"
              >
                A gewinnt
              </button>
              <button
                onClick={() => handleStatusChange(event.id, 'RESOLVED', 'B')}
                className="text-xs bg-success/10 text-success px-3 py-1.5 rounded-lg hover:bg-success/20 transition-colors"
              >
                B gewinnt
              </button>
            </div>
          )}

          {event.status === 'RESOLVED' && event.winner && (
            <p className="text-xs text-success">
              Gewinner: {event.winner === 'A' ? event.option_a : event.option_b}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
