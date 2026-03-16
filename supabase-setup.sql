-- ═══════════════════════════════════════════════
-- GRINGOTTS – Supabase Setup
-- Führe dieses Script im Supabase SQL Editor aus.
-- ═══════════════════════════════════════════════

-- 1. Users-Tabelle (erweitert auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT NOT NULL,
  house TEXT NOT NULL CHECK (house IN ('Gryffindor', 'Hufflepuff', 'Ravenclaw', 'Slytherin')),
  balance INTEGER NOT NULL DEFAULT 0,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  is_admin BOOLEAN NOT NULL DEFAULT false
);

-- 2. Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES users(id),
  receiver_id UUID REFERENCES users(id),
  amount INTEGER NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Betting Events
CREATE TABLE IF NOT EXISTS betting_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'LOCKED', 'RESOLVED')),
  winner TEXT CHECK (winner IN ('A', 'B')),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Bets
CREATE TABLE IF NOT EXISTS bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES betting_events(id),
  user_id UUID NOT NULL REFERENCES users(id),
  amount INTEGER NOT NULL,
  choice TEXT NOT NULL CHECK (choice IN ('A', 'B')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. View: users_with_email (für Admin-Panel)
CREATE OR REPLACE VIEW users_with_email AS
SELECT u.*, a.email
FROM users u
JOIN auth.users a ON u.id = a.id;

-- 6. RPC: Sichere Überweisung (atomar)
CREATE OR REPLACE FUNCTION send_money(
  sender_id_in UUID,
  receiver_id_in UUID,
  amount_in INTEGER,
  note_in TEXT
) RETURNS void AS $$
BEGIN
  -- Prüfen ob Sender genug Gold hat
  IF (SELECT balance FROM users WHERE id = sender_id_in) < amount_in THEN
    RAISE EXCEPTION 'Unzureichendes Goldvermögen';
  END IF;

  -- Gold beim Sender abziehen
  UPDATE users SET balance = balance - amount_in WHERE id = sender_id_in;

  -- Gold beim Empfänger gutschreiben
  UPDATE users SET balance = balance + amount_in WHERE id = receiver_id_in;

  -- Transaktion protokollieren
  INSERT INTO transactions (sender_id, receiver_id, amount, note)
  VALUES (sender_id_in, receiver_id_in, amount_in, note_in);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RLS deaktivieren (für den Anfang – später Policies einrichten!)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE betting_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE bets DISABLE ROW LEVEL SECURITY;
