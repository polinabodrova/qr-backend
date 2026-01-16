-- QR Codes table
CREATE TABLE IF NOT EXISTS qr_codes (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(12) UNIQUE NOT NULL,
  name VARCHAR(255),
  destination_url TEXT NOT NULL,
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),
  utm_term VARCHAR(255),
  utm_content VARCHAR(255),
  dcm_impression_tag TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  archived_at TIMESTAMP
);

-- Scan events table
CREATE TABLE IF NOT EXISTS scan_events (
  id SERIAL PRIMARY KEY,
  qr_code_id INTEGER NOT NULL,
  scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_agent TEXT,
  referrer VARCHAR(500),
  ip_hash VARCHAR(64),
  country VARCHAR(2),
  device_type VARCHAR(20),
  browser VARCHAR(50),
  FOREIGN KEY (qr_code_id) REFERENCES qr_codes(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_qr_codes_slug ON qr_codes(slug);
CREATE INDEX IF NOT EXISTS idx_scan_events_qr_code_id ON scan_events(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_scan_events_scanned_at ON scan_events(qr_code_id, scanned_at);
