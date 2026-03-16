import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { formatCurrency } from '../utils/currency'
import { Spinner } from '../components/Spinner'
import type { Transaction } from '../types'

export function HistoryPage() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) fetchHistory()
  }, [user])

  async function fetchHistory() {
    setLoading(true)

    // Fetch transactions where user is sender or receiver
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        sender:users!transactions_sender_id_fkey(name),
        receiver:users!transactions_receiver_id_fkey(name)
      `)
      .or(`sender_id.eq.${user!.id},receiver_id.eq.${user!.id}`)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setTransactions(data)
    }

    setLoading(false)
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr)
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) return <Spinner />

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="font-display text-2xl font-bold text-gold">Verlauf</h1>

      {transactions.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-8 text-center">
          <p className="text-text-muted">Noch keine Transaktionen</p>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map((tx) => {
            const isSender = tx.sender_id === user!.id
            const isAdminAdjustment = !tx.sender_id || !tx.receiver_id

            return (
              <div
                key={tx.id}
                className="bg-surface border border-border rounded-xl px-5 py-4 flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {isAdminAdjustment ? (
                        <span className="text-text-muted">Admin-Korrektur</span>
                      ) : isSender ? (
                        <>
                          <span className="text-text-muted">An </span>
                          <span className="text-text">{tx.receiver?.name || 'Unbekannt'}</span>
                        </>
                      ) : (
                        <>
                          <span className="text-text-muted">Von </span>
                          <span className="text-text">{tx.sender?.name || 'Unbekannt'}</span>
                        </>
                      )}
                    </span>
                  </div>
                  {tx.note && (
                    <p className="text-xs text-text-muted mt-1 truncate">{tx.note}</p>
                  )}
                  <p className="text-xs text-text-muted/60 mt-1">{formatDate(tx.created_at)}</p>
                </div>
                <span
                  className={`font-mono text-sm font-medium whitespace-nowrap ${
                    isAdminAdjustment
                      ? 'text-gold'
                      : isSender
                        ? 'text-danger'
                        : 'text-success'
                  }`}
                >
                  {isAdminAdjustment ? '' : isSender ? '−' : '+'}
                  {formatCurrency(tx.amount)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
