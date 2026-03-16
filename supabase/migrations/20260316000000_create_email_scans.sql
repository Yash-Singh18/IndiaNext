-- Email phishing scan results
CREATE TABLE IF NOT EXISTS email_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sender TEXT,
  subject TEXT,
  body_preview TEXT,
  classification TEXT CHECK (classification IN ('safe', 'suspicious', 'phishing')),
  risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scan_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID REFERENCES email_scans(id) ON DELETE CASCADE,
  triage_output JSONB,
  deep_analysis JSONB,
  url_reports JSONB,
  domain_analysis JSONB,
  threat_breakdown JSONB,
  reasons TEXT[],
  recommended_action TEXT
);

-- RLS
ALTER TABLE email_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own email scans"
  ON email_scans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert email scans"
  ON email_scans FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can read own scan results"
  ON scan_results FOR SELECT
  USING (scan_id IN (SELECT id FROM email_scans WHERE user_id = auth.uid()));

CREATE POLICY "Service role can insert scan results"
  ON scan_results FOR INSERT
  WITH CHECK (true);

-- Indexes
CREATE INDEX idx_email_scans_user_id ON email_scans(user_id);
CREATE INDEX idx_email_scans_created_at ON email_scans(created_at DESC);
CREATE INDEX idx_scan_results_scan_id ON scan_results(scan_id);
