import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { CurrencyInput } from '../components/CurrencyInput'
import { formatCurrency } from '../utils/currency'
import { Spinner } from '../components/Spinner'
import type { BettingEvent, Bet } from '../types'

export function BetsPage() {
  const { user, refreshUser } = useAuth()
  const [events, setEvents] = useState<BettingEvent[]>([])
  const [bets, setBets] = useState<Bet[]>([])
  const [loading, setLoading] = useState(true)

  // Per-event bet state
  const [betAmounts, setBetAmounts] = useState<Record<string, number>>({})
  const [betChoices, setBetChoices] = useState<Record<string, 'A' | 'B'>>({})
  const [betErrors, setBetErrors] = useState<Record<string, string>>({})
  const [betSuccess, setBetSuccess] = useState<Record<string, string>>({})
  const [betLoading, setBetLoading] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)

    const [eventsRes, betsRes] = await Promise.all([
      supabase.from('betting_events').select('*').order('created_at', { ascending: false }),
      supabase.from('bets').select('*').eq('user_id', user!.id),
    ])

    if (eventsRes.data) setEvents(eventsRes.data)
    if (betsRes.data) setBets(betsRes.data)

    setLoading(false)
  }

  function getUserBetsForEvent(eventId: string): Bet[] {
    return bets.filter((b) => b.event_id === eventId)
  }

  function getTotalPoolForEvent(eventId: string): { a: number; b: number } {
    // We'd need all bets for the event, not just user's
    // For now we show user's own bets
    return { a: 0, b: 0 }
  }

  async function handlePlaceBet(eventId: string) {
    const amount = betAmounts[eventId]
    const choice = betChoices[eventId]

    if (!amount || !choice || !user) return

    setBetErrors((p) => ({ ...p, [eventId]: '' }))
    setBetSuccess((p) => ({ ...p, [eventId]: '' }))
    setBetLoading((p) => ({ ...p, [eventId]: true }))

    if (amount > user.balance) {
      setBetErrors((p) => ({ ...p, [eventId]: 'Nicht genug Gold' }))
      setBetLoading((p) => ({ ...p, [eventId]: false }))
      return
    }

    // Deduct from balance
    const { error: updateErr } = await supabase
      .from('users')
      .update({ balance: user.balance - amount })
      .eq('id', user.id)

    if (updateErr) {
      setBetErrors((p) => ({ ...p, [eventId]: updateErr.message }))
      setBetLoading((p) => ({ ...p, [eventId]: false }))
      return
    }

    // Place bet
    const { error: betErr } = await supabase.from('bets').insert({
      event_id: eventId,
      user_id: user.id,
      amount,
      choice,
    })

    if (betErr) {
      // Rollback balance
      await supabase
        .from('users')
        .update({ balance: user.balance })
        .eq('id', user.id)
      setBetErrors((p) => ({ ...p, [eventId]: betErr.message }))
    } else {
      setBetSuccess((p) => ({ ...p, [eventId]: `${formatCurrency(amount)} auf Option ${choice} gesetzt!` }))
      setBetAmounts((p) => ({ ...p, [eventId]: 0 }))
      setBetChoices((p) => {
        const copy = { ...p }
        delete copy[eventId]
        return copy
      })
      await refreshUser()
      await fetchData()
    }

    setBetLoading((p) => ({ ...p, [eventId]: false }))
  }

  if (loading) return <Spinner />

  const openEvents = events.filter((e) => e.status === 'OPEN')
  const lockedEvents = events.filter((e) => e.status === 'LOCKED')
  const resolvedEvents = events.filter((e) => e.status === 'RESOLVED')

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="font-display text-2xl font-bold text-gold">Wetten</h1>

      {/* Open Events */}
      {openEvents.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-sm uppercase tracking-wider text-text-muted">Offene Wetten</h2>
          {openEvents.map((event) => {
            const userBets = getUserBetsForEvent(event.id)
            return (
              <div key={event.id} className="bg-surface border border-border rounded-2xl p-6 space-y-4">
                <h3 className="font-display text-lg text-text">{event.title}</h3>

                {/* Options */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setBetChoices((p) => ({ ...p, [event.id]: 'A' }))}
                    className={`p-3 rounded-xl border text-sm text-center transition-all ${
                      betChoices[event.id] === 'A'
                        ? 'border-gold bg-gold/10 text-gold'
                        : 'border-border text-text-muted hover:border-text-muted'
                    }`}
                  >
                    <span className="block text-xs text-text-muted/60 mb-1">Option A</span>
                    {event.option_a}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBetChoices((p) => ({ ...p, [event.id]: 'B' }))}
                    className={`p-3 rounded-xl border text-sm text-center transition-all ${
                      betChoices[event.id] === 'B'
                        ? 'border-gold bg-gold/10 text-gold'
                        : 'border-border text-text-muted hover:border-text-muted'
                    }`}
                  >
                    <span className="block text-xs text-text-muted/60 mb-1">Option B</span>
                    {event.option_b}
                  </button>
                </div>

                {/* Bet Amount */}
                <CurrencyInput
                  onChange={(val) => setBetAmounts((p) => ({ ...p, [event.id]: val }))}
                  value={betAmounts[event.id] || 0}
                />

                {betErrors[event.id] && (
                  <p className="text-danger text-sm">{betErrors[event.id]}</p>
                )}
                {betSuccess[event.id] && (
                  <p className="text-success text-sm">{betSuccess[event.id]}</p>
                )}

                <button
                  onClick={() => handlePlaceBet(event.id)}
                  disabled={!betChoices[event.id] || !betAmounts[event.id] || betLoading[event.id]}
                  className="w-full bg-gold hover:bg-gold-light text-bg font-display font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {betLoading[event.id] ? 'Moment...' : 'Wette platzieren'}
                </button>

                {/* User's existing bets */}
                {userBets.length > 0 && (
                  <div className="border-t border-border pt-3 space-y-1">
                    <p className="text-xs text-text-muted">Deine Wetten:</p>
                    {userBets.map((b) => (
                      <p key={b.id} className="text-xs text-text-muted">
                        {formatCurrency(b.amount)} auf{' '}
                        <span className="text-text">{b.choice === 'A' ? event.option_a : event.option_b}</span>
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </section>
      )}

      {/* Locked Events */}
      {lockedEvents.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-sm uppercase tracking-wider text-text-muted">Gesperrt</h2>
          {lockedEvents.map((event) => {
            const userBets = getUserBetsForEvent(event.id)
            return (
              <div key={event.id} className="bg-surface border border-border rounded-2xl p-6 opacity-70">
                <h3 className="font-display text-lg text-text">{event.title}</h3>
                <p className="text-xs text-text-muted mt-1">Keine neuen Wetten mehr möglich</p>
                {userBets.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <p className="text-xs text-text-muted">Deine Wetten:</p>
                    {userBets.map((b) => (
                      <p key={b.id} className="text-xs text-text-muted">
                        {formatCurrency(b.amount)} auf{' '}
                        <span className="text-text">{b.choice === 'A' ? event.option_a : event.option_b}</span>
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </section>
      )}

      {/* Resolved Events */}
      {resolvedEvents.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-sm uppercase tracking-wider text-text-muted">Abgeschlossen</h2>
          {resolvedEvents.map((event) => {
            const userBets = getUserBetsForEvent(event.id)
            const winnerText = event.winner === 'A' ? event.option_a : event.option_b
            return (
              <div key={event.id} className="bg-surface border border-border rounded-2xl p-6 opacity-60">
                <h3 className="font-display text-lg text-text">{event.title}</h3>
                <p className="text-sm text-success mt-1">
                  Gewinner: {winnerText}
                </p>
                {userBets.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {userBets.map((b) => {
                      const won = b.choice === event.winner
                      return (
                        <p key={b.id} className={`text-xs ${won ? 'text-success' : 'text-danger'}`}>
                          {formatCurrency(b.amount)} auf{' '}
                          {b.choice === 'A' ? event.option_a : event.option_b}
                          {won ? ' ✓' : ' ✗'}
                        </p>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </section>
      )}

      {events.length === 0 && (
        <div className="bg-surface border border-border rounded-2xl p-8 text-center">
          <p className="text-text-muted">Noch keine Wetten verfügbar</p>
        </div>
      )}
    </div>
  )
}
