-- ─────────────────────────────────────────────────────────────
-- Community Expert System — idempotent fix migration
-- Handles partial state from previous run
-- ─────────────────────────────────────────────────────────────

-- 1. Ensure all profile columns exist
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT NOT NULL DEFAULT 'free'
    CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  ADD COLUMN IF NOT EXISTS credits_used    INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credits_reset_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS user_type       TEXT NOT NULL DEFAULT 'normal'
    CHECK (user_type IN ('normal', 'expert')),
  ADD COLUMN IF NOT EXISTS social_score    INTEGER NOT NULL DEFAULT 0;

-- 2. Expert Applications — table + policies (idempotent)
CREATE TABLE IF NOT EXISTS public.expert_applications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  username   TEXT NOT NULL,
  score      INTEGER NOT NULL,
  status     TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.expert_applications ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.expert_applications TO authenticated;

DROP POLICY IF EXISTS "ea_insert_own"    ON public.expert_applications;
DROP POLICY IF EXISTS "ea_select_own"    ON public.expert_applications;
DROP POLICY IF EXISTS "ea_admin_select"  ON public.expert_applications;
DROP POLICY IF EXISTS "ea_admin_update"  ON public.expert_applications;

CREATE POLICY "ea_insert_own"
  ON public.expert_applications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ea_select_own"
  ON public.expert_applications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "ea_admin_select"
  ON public.expert_applications FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "ea_admin_update"
  ON public.expert_applications FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  ));

-- 3. Expert Queries
CREATE TABLE IF NOT EXISTS public.expert_queries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open', 'in_progress', 'resolved')),
  assigned_expert UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.expert_queries ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.expert_queries TO authenticated;

DROP POLICY IF EXISTS "eq_select_all"  ON public.expert_queries;
DROP POLICY IF EXISTS "eq_insert_own"  ON public.expert_queries;
DROP POLICY IF EXISTS "eq_update_any"  ON public.expert_queries;

CREATE POLICY "eq_select_all"
  ON public.expert_queries FOR SELECT TO authenticated USING (true);

CREATE POLICY "eq_insert_own"
  ON public.expert_queries FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "eq_update_any"
  ON public.expert_queries FOR UPDATE TO authenticated USING (true);

-- 4. Chat Rooms
CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_id   UUID NOT NULL REFERENCES public.expert_queries(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  expert_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.chat_rooms TO authenticated;

DROP POLICY IF EXISTS "cr_select_participants" ON public.chat_rooms;
DROP POLICY IF EXISTS "cr_insert_all"          ON public.chat_rooms;

CREATE POLICY "cr_select_participants"
  ON public.chat_rooms FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = expert_id);

CREATE POLICY "cr_insert_all"
  ON public.chat_rooms FOR INSERT TO authenticated WITH CHECK (true);

-- 5. Chat Messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id    UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message    TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.chat_messages TO authenticated;

DROP POLICY IF EXISTS "cm_select_participants" ON public.chat_messages;
DROP POLICY IF EXISTS "cm_insert_participants" ON public.chat_messages;

CREATE POLICY "cm_select_participants"
  ON public.chat_messages FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.chat_rooms
    WHERE id = room_id AND (user_id = auth.uid() OR expert_id = auth.uid())
  ));

CREATE POLICY "cm_insert_participants"
  ON public.chat_messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.chat_rooms
      WHERE id = room_id AND (user_id = auth.uid() OR expert_id = auth.uid())
    )
  );

-- 6. accept_query RPC
CREATE OR REPLACE FUNCTION public.accept_query(p_query_id UUID, p_expert_id UUID)
RETURNS TABLE(success BOOLEAN, room_id UUID)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_room_id UUID;
  v_user_id UUID;
BEGIN
  UPDATE public.expert_queries
  SET status = 'in_progress', assigned_expert = p_expert_id
  WHERE id = p_query_id AND status = 'open'
  RETURNING user_id INTO v_user_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::UUID;
    RETURN;
  END IF;

  INSERT INTO public.chat_rooms (query_id, user_id, expert_id)
  VALUES (p_query_id, v_user_id, p_expert_id)
  RETURNING id INTO v_room_id;

  RETURN QUERY SELECT TRUE, v_room_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_query(UUID, UUID) TO authenticated;

-- 7. resolve_query RPC
CREATE OR REPLACE FUNCTION public.resolve_query(p_query_id UUID, p_expert_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.expert_queries
  SET status = 'resolved'
  WHERE id = p_query_id AND assigned_expert = p_expert_id AND status = 'in_progress';

  IF NOT FOUND THEN RETURN FALSE; END IF;

  UPDATE public.profiles SET social_score = social_score + 1 WHERE id = p_expert_id;
  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_query(UUID, UUID) TO authenticated;
