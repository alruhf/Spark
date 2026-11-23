-- Spark accounts follow-up (acc2, Nov 21 2026). ADDITIVE ONLY: adds two columns and one table. Drops/alters nothing existing, touches no rows.
-- For Allen to paste into the Supabase SQL editor (project spark-accounts, Preview) the same way as 20261115100000. Safe to run twice.
-- The game already works WITHOUT this script (start age also rides in the kid's save; consent is recorded by spark_set_consent);
-- with it, the one-time start age gets its own columns and each consent checkbox gets its own record.

-- 1) one-time start age (Allen 11/21: asked once at kid creation, a starting reference only; never asked again)
ALTER TABLE public.kid_profiles ADD COLUMN IF NOT EXISTS start_age smallint;
ALTER TABLE public.kid_profiles ADD COLUMN IF NOT EXISTS start_age_set_at timestamptz;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'kid_profiles_start_age_chk') THEN
    ALTER TABLE public.kid_profiles ADD CONSTRAINT kid_profiles_start_age_chk CHECK (start_age IS NULL OR start_age BETWEEN 3 AND 18);
  END IF;
END $$;
GRANT SELECT (start_age, start_age_set_at) ON public.kid_profiles TO authenticated;
GRANT INSERT (start_age, start_age_set_at), UPDATE (start_age, start_age_set_at) ON public.kid_profiles TO authenticated;

-- 2) consent records: one row per ticked checkbox (guardian / data / privacy) per version
CREATE TABLE IF NOT EXISTS public.parent_consents (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  parent_id  uuid NOT NULL DEFAULT auth.uid() REFERENCES public.parents(id) ON DELETE CASCADE,
  item       text NOT NULL CHECK (item IN ('guardian', 'data', 'privacy')),
  version    text NOT NULL CHECK (length(version) BETWEEN 1 AND 40),
  agreed_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS parent_consents_parent_idx ON public.parent_consents(parent_id);
ALTER TABLE public.parent_consents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS consents_own_select ON public.parent_consents;
CREATE POLICY consents_own_select ON public.parent_consents FOR SELECT TO authenticated USING (parent_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS consents_own_insert ON public.parent_consents;
CREATE POLICY consents_own_insert ON public.parent_consents FOR INSERT TO authenticated WITH CHECK (parent_id = (SELECT auth.uid()));
REVOKE ALL ON public.parent_consents FROM anon, authenticated;
GRANT SELECT ON public.parent_consents TO authenticated;
GRANT INSERT (item, version) ON public.parent_consents TO authenticated;
