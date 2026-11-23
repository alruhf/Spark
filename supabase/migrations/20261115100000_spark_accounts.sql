-- Spark Studio family accounts (spark16, Nov 15 2026). Supabase Postgres. Separate from the Neon spark-signals DB.
-- Parent = Supabase auth user (email). Kids have NO email/login: an avatar + optional kid-picked PIN (4 digits or 4 shapes), max 5 per parent.
-- Allen 11/15 items 4-8: look / nickname / age_band / look_done / pin_kind on kid_profiles; ladders + tiers on kid_progress. NOT applied anywhere yet.
-- Every row carries parent_id; RLS limits each parent to their own family. Kid progress: one row per kid, newer save wins.
-- Re-runnable: CREATE ... IF NOT EXISTS / CREATE OR REPLACE / DROP POLICY IF EXISTS.

-- ---------------------------------------------------------------- tables
CREATE TABLE IF NOT EXISTS public.parents (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_at      timestamptz,            -- parent ticked the consent box (wording supplied by Allen)
  consent_version text CHECK (consent_version IS NULL OR length(consent_version) BETWEEN 1 AND 40),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.kid_profiles (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id  uuid NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
  avatar     text NOT NULL CHECK (avatar ~ '^[a-z0-9-]{1,24}$'),   -- picture id from the game's avatar set, never a photo
  color      text CHECK (color IS NULL OR color ~ '^#[0-9a-fA-F]{6}$'),
  pin_hash   text,                                                 -- sha256(salt || pin), NULL = no PIN
  pin_salt   text,
  pin_fails  int NOT NULL DEFAULT 0,                              -- wrong PIN tries in a row
  pin_locked_until timestamptz,                                    -- after 5 wrong tries: locked for 5 minutes
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (parent_id, avatar)                                       -- each kid in a family has a different picture
);
ALTER TABLE public.kid_profiles ADD COLUMN IF NOT EXISTS pin_fails int NOT NULL DEFAULT 0;
ALTER TABLE public.kid_profiles ADD COLUMN IF NOT EXISTS pin_locked_until timestamptz;
CREATE INDEX IF NOT EXISTS kid_profiles_parent_idx ON public.kid_profiles(parent_id);
-- Allen 11/15 items 4-7: per-kid look, parent-entered nickname, age band, look-done mark, PIN kind.
-- look = the game's {skin,hair,eyes} option ids only (same as sparkWardrobeV1.profiles[pid].look); never a photo or free text.
CREATE OR REPLACE FUNCTION public.spark_look_ok(l jsonb) RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path = public, pg_temp AS $$
  SELECT l IS NULL OR (jsonb_typeof(l) = 'object' AND pg_column_size(l) <= 256
    AND NOT EXISTS (SELECT 1 FROM jsonb_each(l) e WHERE e.key NOT IN ('skin', 'hair', 'eyes') OR jsonb_typeof(e.value) <> 'string'
                    OR (e.value #>> '{}') !~ ('^' || left(e.key, 1) || '[0-9]$')));
$$;
ALTER TABLE public.kid_profiles ADD COLUMN IF NOT EXISTS look jsonb;
ALTER TABLE public.kid_profiles ADD COLUMN IF NOT EXISTS nickname text;       -- typed by the PARENT only (kids never type); short, letters/digits
ALTER TABLE public.kid_profiles ADD COLUMN IF NOT EXISTS age_band text;       -- k 4-6 | e 7-9 | u 10-12 | t 13+
ALTER TABLE public.kid_profiles ADD COLUMN IF NOT EXISTS look_done boolean NOT NULL DEFAULT false;
ALTER TABLE public.kid_profiles ADD COLUMN IF NOT EXISTS pin_kind text;       -- 'digits' (4 numbers) | 'shapes' (4 shape+colour symbols); NULL = no PIN
ALTER TABLE public.kid_profiles DROP CONSTRAINT IF EXISTS kid_profiles_look_chk;
ALTER TABLE public.kid_profiles ADD CONSTRAINT kid_profiles_look_chk CHECK (public.spark_look_ok(look));
ALTER TABLE public.kid_profiles DROP CONSTRAINT IF EXISTS kid_profiles_nickname_chk;
ALTER TABLE public.kid_profiles ADD CONSTRAINT kid_profiles_nickname_chk CHECK (nickname IS NULL OR (char_length(nickname) BETWEEN 1 AND 16 AND nickname ~ '^[[:alnum:]][[:alnum:] .''-]*$'));
ALTER TABLE public.kid_profiles DROP CONSTRAINT IF EXISTS kid_profiles_age_band_chk;
ALTER TABLE public.kid_profiles ADD CONSTRAINT kid_profiles_age_band_chk CHECK (age_band IS NULL OR age_band IN ('k', 'e', 'u', 't'));
ALTER TABLE public.kid_profiles DROP CONSTRAINT IF EXISTS kid_profiles_pin_kind_chk;
ALTER TABLE public.kid_profiles ADD CONSTRAINT kid_profiles_pin_kind_chk CHECK ((pin_kind IS NULL AND pin_hash IS NULL) OR (pin_kind IN ('digits', 'shapes') AND pin_hash IS NOT NULL));

CREATE TABLE IF NOT EXISTS public.kid_progress (
  kid_id     uuid PRIMARY KEY REFERENCES public.kid_profiles(id) ON DELETE CASCADE,
  parent_id  uuid NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
  data       jsonb NOT NULL CHECK (pg_column_size(data) <= 1048576),
  updated_at timestamptz NOT NULL,             -- when the device made this save (decides newer-wins)
  server_at  timestamptz NOT NULL DEFAULT now() -- when it reached the server
);
-- item 8: the kid's ladders (spark-progress kids[pid].ladders) and tiers/streak/ghostNext (spark-age per-kid block) travel with the save
ALTER TABLE public.kid_progress ADD COLUMN IF NOT EXISTS ladders jsonb;
ALTER TABLE public.kid_progress ADD COLUMN IF NOT EXISTS tiers jsonb;
ALTER TABLE public.kid_progress DROP CONSTRAINT IF EXISTS kid_progress_sync_chk;
ALTER TABLE public.kid_progress ADD CONSTRAINT kid_progress_sync_chk CHECK ((ladders IS NULL OR (jsonb_typeof(ladders) = 'object' AND pg_column_size(ladders) <= 65536))
  AND (tiers IS NULL OR (jsonb_typeof(tiers) = 'object' AND pg_column_size(tiers) <= 8192)));

-- ---------------------------------------------------------------- new auth user -> parents row
CREATE OR REPLACE FUNCTION public.spark_handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  INSERT INTO public.parents (id) VALUES (NEW.id) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS spark_on_auth_user_created ON auth.users;
CREATE TRIGGER spark_on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.spark_handle_new_user();
INSERT INTO public.parents (id) SELECT id FROM auth.users ON CONFLICT (id) DO NOTHING;  -- users made before this migration

-- ---------------------------------------------------------------- 5 kids per parent (enforced in the DB)
CREATE OR REPLACE FUNCTION public.spark_kid_cap() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE n int;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.parent_id IS DISTINCT FROM OLD.parent_id THEN
    RAISE EXCEPTION 'kid profiles cannot move to another family' USING ERRCODE = 'check_violation';
  END IF;
  IF TG_OP = 'INSERT' THEN
    PERFORM 1 FROM public.parents WHERE id = NEW.parent_id FOR UPDATE;  -- serialise concurrent adds for one family
    SELECT count(*) INTO n FROM public.kid_profiles WHERE parent_id = NEW.parent_id;
    IF n >= 5 THEN
      RAISE EXCEPTION 'kid_limit: a family can have at most 5 kid profiles' USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS spark_kid_cap_trg ON public.kid_profiles;
CREATE TRIGGER spark_kid_cap_trg BEFORE INSERT OR UPDATE ON public.kid_profiles
  FOR EACH ROW EXECUTE FUNCTION public.spark_kid_cap();

-- progress rows must belong to the kid's own family
CREATE OR REPLACE FUNCTION public.spark_progress_family() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.kid_profiles k WHERE k.id = NEW.kid_id AND k.parent_id = NEW.parent_id) THEN
    RAISE EXCEPTION 'kid does not belong to this family' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS spark_progress_family_trg ON public.kid_progress;
CREATE TRIGGER spark_progress_family_trg BEFORE INSERT OR UPDATE ON public.kid_progress
  FOR EACH ROW EXECUTE FUNCTION public.spark_progress_family();

-- ---------------------------------------------------------------- RLS: each parent sees only their own family
ALTER TABLE public.parents      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kid_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kid_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS parents_own_select ON public.parents;
CREATE POLICY parents_own_select ON public.parents FOR SELECT TO authenticated USING (id = (SELECT auth.uid()));
DROP POLICY IF EXISTS parents_own_update ON public.parents;
CREATE POLICY parents_own_update ON public.parents FOR UPDATE TO authenticated USING (id = (SELECT auth.uid())) WITH CHECK (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS kids_own_select ON public.kid_profiles;
CREATE POLICY kids_own_select ON public.kid_profiles FOR SELECT TO authenticated USING (parent_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS kids_own_insert ON public.kid_profiles;  -- consent first, then kids
CREATE POLICY kids_own_insert ON public.kid_profiles FOR INSERT TO authenticated WITH CHECK (
  parent_id = (SELECT auth.uid()) AND EXISTS (SELECT 1 FROM public.parents p WHERE p.id = (SELECT auth.uid()) AND p.consent_at IS NOT NULL));
DROP POLICY IF EXISTS kids_own_update ON public.kid_profiles;
CREATE POLICY kids_own_update ON public.kid_profiles FOR UPDATE TO authenticated USING (parent_id = (SELECT auth.uid())) WITH CHECK (parent_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS kids_own_delete ON public.kid_profiles;
CREATE POLICY kids_own_delete ON public.kid_profiles FOR DELETE TO authenticated USING (parent_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS progress_own_select ON public.kid_progress;
CREATE POLICY progress_own_select ON public.kid_progress FOR SELECT TO authenticated USING (parent_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS progress_own_insert ON public.kid_progress;
DROP POLICY IF EXISTS progress_own_update ON public.kid_progress;
DROP POLICY IF EXISTS progress_own_delete ON public.kid_progress;

-- ---------------------------------------------------------------- privileges: nothing for anon; authenticated via RLS; PIN columns never readable
REVOKE ALL ON public.parents, public.kid_profiles, public.kid_progress FROM anon, authenticated;
GRANT SELECT ON public.parents TO authenticated;
GRANT UPDATE (consent_at, consent_version) ON public.parents TO authenticated;
-- pin_hash / pin_salt / pin_fails / pin_locked_until are never granted; pin_kind is readable (so the pad shows numbers or shapes) but only the PIN functions write it
GRANT SELECT (id, parent_id, avatar, color, created_at, look, nickname, age_band, look_done, pin_kind) ON public.kid_profiles TO authenticated;
GRANT INSERT (parent_id, avatar, color, look, nickname, age_band, look_done) ON public.kid_profiles TO authenticated;
GRANT UPDATE (avatar, color, look, nickname, age_band, look_done) ON public.kid_profiles TO authenticated;
GRANT DELETE ON public.kid_profiles TO authenticated;
GRANT SELECT ON public.kid_progress TO authenticated;   -- writes ONLY via spark_save_progress() (newer wins)

-- ---------------------------------------------------------------- RPCs the game calls (all checked against auth.uid())
-- newer save wins: an older or equal device save never overwrites the stored one. Future times are clamped to now()+5 min.
-- SECURITY DEFINER (authenticated has no direct write grant on kid_progress); ownership checked here.
DROP FUNCTION IF EXISTS public.spark_save_progress(uuid, jsonb, timestamptz);
-- item 8: optional ladders + tiers ride along with the same newer-wins rule (one save = data + ladders + tiers together)
CREATE OR REPLACE FUNCTION public.spark_save_progress(p_kid uuid, p_data jsonb, p_saved_at timestamptz, p_ladders jsonb DEFAULT NULL, p_tiers jsonb DEFAULT NULL)
RETURNS TABLE (applied boolean, updated_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE uid uuid := auth.uid(); t timestamptz := least(p_saved_at, now() + interval '5 minutes'); r timestamptz;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not signed in' USING ERRCODE = 'insufficient_privilege'; END IF;
  IF p_saved_at IS NULL THEN RAISE EXCEPTION 'bad time' USING ERRCODE = 'check_violation'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.kid_profiles k WHERE k.id = p_kid AND k.parent_id = uid) THEN
    RAISE EXCEPTION 'not your kid' USING ERRCODE = 'insufficient_privilege'; END IF;
  IF p_data IS NULL OR jsonb_typeof(p_data) <> 'object' THEN RAISE EXCEPTION 'bad data' USING ERRCODE = 'check_violation'; END IF;
  INSERT INTO public.kid_progress AS kp (kid_id, parent_id, data, ladders, tiers, updated_at, server_at)
       VALUES (p_kid, uid, p_data, p_ladders, p_tiers, t, now())
  ON CONFLICT (kid_id) DO UPDATE SET data = EXCLUDED.data, ladders = coalesce(EXCLUDED.ladders, kp.ladders), tiers = coalesce(EXCLUDED.tiers, kp.tiers),
       updated_at = EXCLUDED.updated_at, server_at = now()
       WHERE kp.updated_at < EXCLUDED.updated_at
  RETURNING kp.updated_at INTO r;
  IF r IS NOT NULL THEN RETURN QUERY SELECT true, r; RETURN; END IF;
  RETURN QUERY SELECT false, kp.updated_at FROM public.kid_progress kp WHERE kp.kid_id = p_kid;
END $$;

CREATE OR REPLACE FUNCTION public.spark_set_consent(p_version text) RETURNS timestamptz
LANGUAGE sql SECURITY INVOKER SET search_path = public, pg_temp AS $$
  UPDATE public.parents SET consent_at = now(), consent_version = p_version WHERE id = auth.uid() RETURNING consent_at;
$$;

-- PIN (item 5/6). The KID picks it, on the kid's own screen, after the parent has signed in on this device:
--   spark_kid_set_pin(kid, pin, kind) works ONLY while that kid has no PIN (set once). kind 'digits' = 4 numbers (ages 10+),
--   'shapes' = 4 symbols, each a shape letter (c circle, s square, t triangle, h heart) + a colour digit 1-4, e.g. 'c1s2t3h4' (ages 4-9).
--   The parent can only CLEAR it (spark_clear_kid_pin); nothing lets a client read the hash/salt, and nothing lets anyone overwrite a PIN.
--   A trusted signed JWT must carry a TOP-LEVEL spark_kid_id = this kid id and spark_session_kind = 'kid' (NOT user_metadata, which the
--   parent can edit). The ordinary parent session has neither claim and cannot set a PIN. Client-supplied args cannot grant this scope.
--   A kid token issuer is deliberately NOT implemented/provisioned here: Supabase is unconnected, so this function and the client
--   pad stay dormant/fail-closed until a trusted issuer exists. A PIN is a sibling convenience, not a replacement for parent auth.
DROP FUNCTION IF EXISTS public.spark_set_kid_pin(uuid, text);
CREATE OR REPLACE FUNCTION public.spark_kid_set_pin(p_kid uuid, p_pin text, p_kind text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE s text := md5(gen_random_uuid()::text);
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  -- Authorize from signed top-level JWT claims ONLY (never user_metadata/app input).
  IF coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'spark_session_kind', '') <> 'kid'
     OR coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'spark_kid_id', '') <> p_kid::text THEN RETURN false; END IF;
  IF p_kind = 'digits' THEN IF p_pin IS NULL OR p_pin !~ '^[0-9]{4}$' THEN RAISE EXCEPTION 'PIN must be 4 digits' USING ERRCODE = 'check_violation'; END IF;
  ELSIF p_kind = 'shapes' THEN IF p_pin IS NULL OR p_pin !~ '^([csth][1-4]){4}$' THEN RAISE EXCEPTION 'shape PIN must be 4 shape+colour symbols' USING ERRCODE = 'check_violation'; END IF;
  ELSE RAISE EXCEPTION 'pin kind must be digits or shapes' USING ERRCODE = 'check_violation'; END IF;
  UPDATE public.kid_profiles SET pin_salt = s, pin_hash = encode(sha256(convert_to(s || p_kind || ':' || p_pin, 'UTF8')), 'hex'), pin_kind = p_kind,
         pin_fails = 0, pin_locked_until = NULL
   WHERE id = p_kid AND parent_id = auth.uid() AND pin_hash IS NULL;   -- set once: an existing PIN is never overwritten
  RETURN FOUND;
END $$;
CREATE OR REPLACE FUNCTION public.spark_clear_kid_pin(p_kid uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  IF coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'spark_session_kind', '') = 'kid' THEN RETURN false; END IF; -- parent session only
  UPDATE public.kid_profiles SET pin_hash = NULL, pin_salt = NULL, pin_kind = NULL, pin_fails = 0, pin_locked_until = NULL
   WHERE id = p_kid AND parent_id = auth.uid();
  RETURN FOUND;
END $$;

-- check a PIN: 5 wrong tries in a row lock that kid's PIN for 5 minutes (the parent clearing the PIN unlocks; the kid then picks a new one).
-- NOTE: a sibling lock for the picker on a shared device, not security against the signed-in parent account.
DROP FUNCTION IF EXISTS public.spark_check_kid_pin(uuid, text);
CREATE OR REPLACE FUNCTION public.spark_check_kid_pin(p_kid uuid, p_pin text)
RETURNS TABLE (ok boolean, locked_until timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE k public.kid_profiles%ROWTYPE;
BEGIN
  SELECT * INTO k FROM public.kid_profiles WHERE id = p_kid AND parent_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RETURN QUERY SELECT false, NULL::timestamptz; RETURN; END IF;
  IF k.pin_hash IS NULL THEN RETURN QUERY SELECT true, NULL::timestamptz; RETURN; END IF;
  IF k.pin_locked_until IS NOT NULL AND k.pin_locked_until > now() THEN RETURN QUERY SELECT false, k.pin_locked_until; RETURN; END IF;
  IF k.pin_hash = encode(sha256(convert_to(k.pin_salt || k.pin_kind || ':' || coalesce(p_pin, ''), 'UTF8')), 'hex') THEN
    UPDATE public.kid_profiles SET pin_fails = 0, pin_locked_until = NULL WHERE id = p_kid;
    RETURN QUERY SELECT true, NULL::timestamptz; RETURN;
  END IF;
  UPDATE public.kid_profiles SET pin_fails = CASE WHEN k.pin_fails + 1 >= 5 THEN 0 ELSE k.pin_fails + 1 END,
         pin_locked_until = CASE WHEN k.pin_fails + 1 >= 5 THEN now() + interval '5 minutes' ELSE NULL END
   WHERE id = p_kid RETURNING kid_profiles.pin_locked_until INTO k.pin_locked_until;
  RETURN QUERY SELECT false, k.pin_locked_until;
END $$;

-- family list for the picker: avatar, colour, nickname, age band, look, has_pin + pin_kind (never the hash)
DROP FUNCTION IF EXISTS public.spark_list_kids();
CREATE OR REPLACE FUNCTION public.spark_list_kids()
RETURNS TABLE (id uuid, avatar text, color text, nickname text, age_band text, look jsonb, look_done boolean, has_pin boolean, pin_kind text,
               created_at timestamptz, progress_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT k.id, k.avatar, k.color, k.nickname, k.age_band, k.look, k.look_done, k.pin_hash IS NOT NULL, k.pin_kind, k.created_at, p.updated_at
    FROM public.kid_profiles k LEFT JOIN public.kid_progress p ON p.kid_id = k.id
   WHERE k.parent_id = auth.uid() ORDER BY k.created_at;
$$;

REVOKE ALL ON FUNCTION public.spark_save_progress(uuid, jsonb, timestamptz, jsonb, jsonb), public.spark_set_consent(text),
  public.spark_kid_set_pin(uuid, text, text), public.spark_clear_kid_pin(uuid), public.spark_check_kid_pin(uuid, text), public.spark_list_kids(),
  public.spark_handle_new_user(), public.spark_kid_cap(), public.spark_progress_family() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.spark_save_progress(uuid, jsonb, timestamptz, jsonb, jsonb), public.spark_set_consent(text),
  public.spark_kid_set_pin(uuid, text, text), public.spark_clear_kid_pin(uuid), public.spark_check_kid_pin(uuid, text), public.spark_list_kids() TO authenticated;
