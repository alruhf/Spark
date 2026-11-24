-- Spark kid code: one-time PIN TICKET (Pages migration, Allen 11/22 11:41 PM ET; applying approved 11:42 PM ET "after the preview passes").
-- ADDITIVE ONLY: one new table (RLS on, no policies, no grants) + two functions. Drops/alters nothing existing, touches no existing rows.
-- The existing spark_kid_set_pin (signed kid-JWT path used by /api/kid-token) is LEFT IN PLACE, so the current flow keeps working.
-- Replaces the need for a custom JWT (and so for the legacy JWT secret outside Supabase):
--   1) parent session: spark_begin_kid_pin(kid) -> random 64-hex ticket, valid 120 s, single use, only while that kid has NO code; max 20/kid/day.
--      Only sha256(ticket) is stored.
--   2) the kid's pad: spark_kid_set_pin_ticket(kid, ticket, pin, kind) -> checks the format first, then uses up the ticket and sets the code ONCE
--      (never overwrites). The parent can still only CLEAR a code (spark_clear_kid_pin, unchanged).
-- Re-runnable: IF NOT EXISTS / CREATE OR REPLACE.

CREATE TABLE IF NOT EXISTS public.kid_pin_tickets (
  kid_id      uuid PRIMARY KEY REFERENCES public.kid_profiles(id) ON DELETE CASCADE,
  parent_id   uuid NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
  ticket_hash text NOT NULL CHECK (ticket_hash ~ '^[0-9a-f]{64}$'),
  expires_at  timestamptz NOT NULL,
  issued      int NOT NULL DEFAULT 1,
  day         date NOT NULL DEFAULT current_date
);
ALTER TABLE public.kid_pin_tickets ENABLE ROW LEVEL SECURITY;   -- no policies: no client can read or write it; only the two functions below
REVOKE ALL ON public.kid_pin_tickets FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.spark_begin_kid_pin(p_kid uuid)
RETURNS TABLE (ticket text, ticket_expires timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE uid uuid := auth.uid();
        t text := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
        e timestamptz := now() + interval '120 seconds';
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not signed in' USING ERRCODE = 'insufficient_privilege'; END IF;
  IF coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'spark_session_kind', '') = 'kid' THEN
    RAISE EXCEPTION 'parent session only' USING ERRCODE = 'insufficient_privilege'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.kid_profiles k WHERE k.id = p_kid AND k.parent_id = uid AND k.pin_hash IS NULL) THEN
    RAISE EXCEPTION 'not_your_kid_or_code_set' USING ERRCODE = 'insufficient_privilege'; END IF;
  INSERT INTO public.kid_pin_tickets AS x (kid_id, parent_id, ticket_hash, expires_at)
       VALUES (p_kid, uid, encode(sha256(convert_to(t, 'UTF8')), 'hex'), e)
  ON CONFLICT (kid_id) DO UPDATE SET ticket_hash = EXCLUDED.ticket_hash, expires_at = EXCLUDED.expires_at, parent_id = EXCLUDED.parent_id,
       issued = CASE WHEN x.day = current_date THEN x.issued + 1 ELSE 1 END, day = current_date
     WHERE x.day <> current_date OR x.issued < 20;                -- at most 20 tickets per kid per day
  IF NOT FOUND THEN RAISE EXCEPTION 'too_many_tickets_today' USING ERRCODE = 'check_violation'; END IF;
  RETURN QUERY SELECT t, e;
END $$;

CREATE OR REPLACE FUNCTION public.spark_kid_set_pin_ticket(p_kid uuid, p_ticket text, p_pin text, p_kind text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE uid uuid := auth.uid(); s text := md5(gen_random_uuid()::text);
BEGIN
  IF uid IS NULL OR p_ticket IS NULL OR p_ticket !~ '^[0-9a-f]{64}$' THEN RETURN false; END IF;
  -- same format rules as spark_kid_set_pin, checked BEFORE the ticket is used
  IF p_kind = 'digits' THEN
    IF p_pin IS NULL OR p_pin !~ '^[0-9]{4}$' THEN RAISE EXCEPTION 'PIN must be 4 digits' USING ERRCODE = 'check_violation'; END IF;
  ELSIF p_kind = 'shapes' THEN
    IF p_pin IS NULL OR p_pin !~ '^([csth][1-4]){4}$' THEN RAISE EXCEPTION 'shape PIN must be 4 shape+colour symbols' USING ERRCODE = 'check_violation'; END IF;
  ELSE RAISE EXCEPTION 'pin kind must be digits or shapes' USING ERRCODE = 'check_violation'; END IF;
  UPDATE public.kid_pin_tickets kt SET expires_at = '-infinity'                 -- single use (row kept so the daily count survives)
   WHERE kt.kid_id = p_kid AND kt.parent_id = uid AND kt.expires_at > now()
     AND kt.ticket_hash = encode(sha256(convert_to(p_ticket, 'UTF8')), 'hex');
  IF NOT FOUND THEN RETURN false; END IF;
  UPDATE public.kid_profiles SET pin_salt = s, pin_hash = encode(sha256(convert_to(s || p_kind || ':' || p_pin, 'UTF8')), 'hex'),
         pin_kind = p_kind, pin_fails = 0, pin_locked_until = NULL
   WHERE id = p_kid AND parent_id = uid AND pin_hash IS NULL;                     -- set once: an existing code is never overwritten
  RETURN FOUND;
END $$;

REVOKE ALL ON FUNCTION public.spark_begin_kid_pin(uuid), public.spark_kid_set_pin_ticket(uuid, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.spark_begin_kid_pin(uuid), public.spark_kid_set_pin_ticket(uuid, text, text, text) TO authenticated;
NOTIFY pgrst, 'reload schema';   -- let the REST API see the two new functions right away
