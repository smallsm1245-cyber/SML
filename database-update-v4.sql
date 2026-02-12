-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🎬 SMALLSM ARCHIVE - DATABASE UPDATE v4 (Tendencies)
-- Top / Bottom 세부 성향 관리 기능 추가
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ═══════════════════════════════════════════════════
-- 1. TENDENCIES TABLE
-- ═══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS tendencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('top', 'bottom')),
    name TEXT NOT NULL,
    description TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    matched_id UUID REFERENCES tendencies(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for sorting
CREATE INDEX IF NOT EXISTS idx_tendencies_order ON tendencies(display_order);
CREATE INDEX IF NOT EXISTS idx_tendencies_type ON tendencies(type);

-- Enable RLS
ALTER TABLE tendencies ENABLE ROW LEVEL SECURITY;

-- PostgREST API access policy (Admin only for full access)
-- Note: Replace with actual admin email as per project pattern
CREATE POLICY "Admin full access to tendencies"
ON tendencies
FOR ALL
TO authenticated
USING (auth.email() = 'your-admin-email@example.com')
WITH CHECK (auth.email() = 'your-admin-email@example.com');

-- Public read access
CREATE POLICY "Public read tendencies"
ON tendencies
FOR SELECT
TO anon, authenticated
USING (true);

-- ═══════════════════════════════════════════════════
-- 2. UPDATED_AT TRIGGER
-- ═══════════════════════════════════════════════════

DROP TRIGGER IF EXISTS update_tendencies_updated_at ON tendencies;
CREATE TRIGGER update_tendencies_updated_at
BEFORE UPDATE ON tendencies
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
