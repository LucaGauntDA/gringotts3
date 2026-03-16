import { useState } from 'react'
import { supabase } from '../utils/supabaseClient'
import type { House } from '../types'

type Mode = 'login' | 'register' | 'verify'

const HOUSES: House[] = ['Gryffindor', 'Hufflepuff', 'Ravenclaw', 'Slytherin']

export function LoginPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [house, setHouse] = useState<House>('Gryffindor')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) setError(err.message)
    setLoading(false)
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, house } },
    })

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    setMode('verify')
    setLoading(false)
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error: err } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'signup',
    })

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    // Create user profile in users table
    if (data.user) {
      const { error: profileErr } = await supabase.from('users').insert({
        id: data.user.id,
        name,
        house,
        balance: 0,
        is_deleted: false,
        is_admin: false,
      })
      if (profileErr && profileErr.code !== '23505') {
        // 23505 = duplicate, user already exists
        setError(profileErr.message)
      }
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl font-bold text-gold tracking-wider">Gringotts</h1>
          <p className="text-text-muted mt-2 text-lg italic">Die sicherste Zaubererbank der Welt</p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-border rounded-2xl p-8">
          {mode === 'verify' ? (
            <form onSubmit={handleVerify} className="space-y-5">
              <h2 className="font-display text-xl text-gold mb-2">Verifizierung</h2>
              <p className="text-text-muted text-sm">
                Wir haben dir einen Code an <span className="text-text">{email}</span> geschickt.
              </p>
              <div>
                <label className="block text-sm text-text-muted mb-1">Code</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-text font-mono tracking-widest text-center text-lg focus:outline-none focus:border-gold transition-colors"
                  maxLength={6}
                />
              </div>
              {error && <p className="text-danger text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gold hover:bg-gold-light text-bg font-display font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Prüfe...' : 'Bestätigen'}
              </button>
            </form>
          ) : (
            <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-5">
              <h2 className="font-display text-xl text-gold">
                {mode === 'login' ? 'Anmelden' : 'Konto eröffnen'}
              </h2>

              {mode === 'register' && (
                <>
                  <div>
                    <label className="block text-sm text-text-muted mb-1">Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="Harry Potter"
                      className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-text focus:outline-none focus:border-gold transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-text-muted mb-1">Haus</label>
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
                </>
              )}

              <div>
                <label className="block text-sm text-text-muted mb-1">E-Mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="owl@hogwarts.edu"
                  className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-text focus:outline-none focus:border-gold transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-text-muted mb-1">Passwort</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-text focus:outline-none focus:border-gold transition-colors"
                />
              </div>

              {error && <p className="text-danger text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gold hover:bg-gold-light text-bg font-display font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Moment...' : mode === 'login' ? 'Eintreten' : 'Konto eröffnen'}
              </button>

              <p className="text-center text-sm text-text-muted">
                {mode === 'login' ? (
                  <>
                    Noch kein Konto?{' '}
                    <button type="button" onClick={() => { setMode('register'); setError('') }} className="text-gold hover:underline">
                      Registrieren
                    </button>
                  </>
                ) : (
                  <>
                    Schon ein Konto?{' '}
                    <button type="button" onClick={() => { setMode('login'); setError('') }} className="text-gold hover:underline">
                      Anmelden
                    </button>
                  </>
                )}
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
