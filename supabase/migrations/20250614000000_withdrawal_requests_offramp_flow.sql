-- Off-ramp escrow flow: ops marks fiat sent → merchant passkey-releases USDC

ALTER TABLE withdrawal_requests
  ADD COLUMN IF NOT EXISTS fiat_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS fiat_sent_by TEXT,
  ADD COLUMN IF NOT EXISTS merchant_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS release_tx_hash TEXT,
  ADD COLUMN IF NOT EXISTS release_destination_address TEXT;

COMMENT ON COLUMN withdrawal_requests.fiat_sent_at IS 'When ops confirmed CLP was sent to merchant bank';
COMMENT ON COLUMN withdrawal_requests.merchant_confirmed_at IS 'When merchant confirmed fiat received and authorized USDC release';
COMMENT ON COLUMN withdrawal_requests.release_tx_hash IS 'Stellar tx hash for USDC sweep to Sozu off-ramp treasury';
