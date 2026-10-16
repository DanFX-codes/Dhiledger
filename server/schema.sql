CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  company_name TEXT,
  locale TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, organization_id)
);

CREATE TABLE IF NOT EXISTS imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  import_identifier TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'PROCESSING', 'IMPORTED', 'FAILED')),
  row_count INTEGER NOT NULL DEFAULT 0,
  accepted_count INTEGER NOT NULL DEFAULT 0,
  rejected_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  import_id UUID REFERENCES imports(id) ON DELETE SET NULL,
  transaction_date DATE NOT NULL,
  vendor TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(14, 2) NOT NULL,
  currency TEXT NOT NULL,
  reference TEXT,
  category TEXT,
  account TEXT,
  department TEXT,
  payment_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, reference, transaction_date, vendor, amount)
);

CREATE TABLE IF NOT EXISTS findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'UNDER_REVIEW', 'ACTION_PLANNED', 'RESOLVED', 'DISMISSED')),
  severity TEXT,
  estimated_amount NUMERIC(14, 2),
  currency TEXT,
  rule_version TEXT NOT NULL,
  detection_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  explanation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS finding_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finding_id UUID NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  evidence_type TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS finding_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finding_id UUID NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS savings_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  finding_id UUID REFERENCES findings(id) ON DELETE SET NULL,
  vendor TEXT NOT NULL,
  description TEXT NOT NULL,
  currency TEXT NOT NULL,
  baseline_amount NUMERIC(14, 2) NOT NULL,
  baseline_period TEXT NOT NULL,
  claimed_amount NUMERIC(14, 2),
  actual_amount NUMERIC(14, 2),
  actual_period TEXT,
  status TEXT NOT NULL DEFAULT 'POTENTIAL' CHECK (status IN ('POTENTIAL', 'CLAIMED', 'VERIFIED', 'REJECTED')),
  verification_notes TEXT,
  reviewer_id UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  evidence JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_org_date ON transactions(organization_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_org_vendor ON transactions(organization_id, vendor);
CREATE INDEX IF NOT EXISTS idx_imports_org ON imports(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_findings_org ON findings(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_savings_org ON savings_records(organization_id, created_at DESC);
