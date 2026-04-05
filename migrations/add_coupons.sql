-- Coupons table
CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric NOT NULL CHECK (discount_value > 0),
  max_uses integer DEFAULT NULL, -- NULL = unlimited
  used_count integer NOT NULL DEFAULT 0,
  expires_at timestamptz DEFAULT NULL, -- NULL = never expires
  is_active boolean NOT NULL DEFAULT true,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE DEFAULT NULL, -- NULL = all courses
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Only admins can manage coupons
CREATE POLICY "Admins manage coupons"
  ON coupons
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Anyone authenticated can read active coupons (for validation)
CREATE POLICY "Authenticated users can validate coupons"
  ON coupons FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Track coupon usage per enrollment
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS coupon_id uuid REFERENCES coupons(id) ON DELETE SET NULL;
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS discount_applied numeric DEFAULT 0;
