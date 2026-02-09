-- Add parent_id column to categories table for 2-depth hierarchy
ALTER TABLE "public"."categories" 
ADD COLUMN "parent_id" uuid REFERENCES "public"."categories"("id") ON DELETE SET NULL;

-- Add comment
COMMENT ON COLUMN "public"."categories"."parent_id" IS 'Parent category ID for nested structure (NULL = Top level)';

-- Policy update (if needed, usually existing policies cover updates)
-- Assuming existing RLS allows update if user is authenticated/admin.
