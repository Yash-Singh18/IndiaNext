-- ─────────────────────────────────────────────────────────────
-- Community Expert System Migration
-- ─────────────────────────────────────────────────────────────

-- 1. Extend profiles with user_type + social_score
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS user_type TEXT NOT NULL DEFAULT 'normal'
    CHECK (user_type IN ('normal', 'expert')),
  ADD COLUMN IF NOT EXISTS social_score INTEGER NOT NULL DEFAULT 0;

-- ─────────────────────────────────────────────────────────────
-- 2. Expert Applications
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.expert_applications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  username     TEXT NOT NULL,
  score        INTEGER NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.expert_applications ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.expert_applications TO authenticated;

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

-- ─────────────────────────────────────────────────────────────
-- 3. Expert Queries
-- ─────────────────────────────────────────────────────────────
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

-- All authenticated users can read queries (experts need to see open ones)
CREATE POLICY "eq_select_all"
  ON public.expert_queries FOR SELECT TO authenticated
  USING (true);

-- Users insert their own queries
CREATE POLICY "eq_insert_own"
  ON public.expert_queries FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Updates done via SECURITY DEFINER functions below (accept_query / resolve_query)
-- Allow direct updates too for flexibility
CREATE POLICY "eq_update_any"
  ON public.expert_queries FOR UPDATE TO authenticated
  USING (true);

-- ─────────────────────────────────────────────────────────────
-- 4. Chat Rooms  (created only when expert accepts — never on query post)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_id   UUID NOT NULL REFERENCES public.expert_queries(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  expert_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.chat_rooms TO authenticated;

-- Only participants can see their room
CREATE POLICY "cr_select_participants"
  ON public.chat_rooms FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = expert_id);

-- Insert done via accept_query SECURITY DEFINER function
CREATE POLICY "cr_insert_all"
  ON public.chat_rooms FOR INSERT TO authenticated
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- 5. Chat Messages
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id    UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message    TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.chat_messages TO authenticated;

-- Room participants can read messages
CREATE POLICY "cm_select_participants"
  ON public.chat_messages FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.chat_rooms
    WHERE id = room_id AND (user_id = auth.uid() OR expert_id = auth.uid())
  ));

-- Room participants can send messages
CREATE POLICY "cm_insert_participants"
  ON public.chat_messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.chat_rooms
      WHERE id = room_id AND (user_id = auth.uid() OR expert_id = auth.uid())
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 6. accept_query — atomic: updates status + creates chat room
--    Returns (success BOOLEAN, room_id UUID)
--    Uses FOR UPDATE to prevent two experts accepting simultaneously.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.accept_query(p_query_id UUID, p_expert_id UUID)
RETURNS TABLE(success BOOLEAN, room_id UUID)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_room_id UUID;
  v_user_id UUID;
BEGIN
  -- Lock the row; only proceeds if status is still 'open'
  -- FOR UPDATE prevents a concurrent transaction from also updating
  UPDATE public.expert_queries
  SET
    status          = 'in_progress',
    assigned_expert = p_expert_id
  WHERE id = p_query_id
    AND status = 'open'
  RETURNING user_id INTO v_user_id;

  IF NOT FOUND THEN
    -- Either already taken or does not exist
    RETURN QUERY SELECT FALSE, NULL::UUID;
    RETURN;
  END IF;

  -- Create the chat room only after successful lock
  INSERT INTO public.chat_rooms (query_id, user_id, expert_id)
  VALUES (p_query_id, v_user_id, p_expert_id)
  RETURNING id INTO v_room_id;

  RETURN QUERY SELECT TRUE, v_room_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_query(UUID, UUID) TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- 7. resolve_query — closes query + increments expert social_score
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.resolve_query(p_query_id UUID, p_expert_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.expert_queries
  SET status = 'resolved'
  WHERE id              = p_query_id
    AND assigned_expert = p_expert_id
    AND status          = 'in_progress';

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  UPDATE public.profiles
  SET social_score = social_score + 1
  WHERE id = p_expert_id;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_query(UUID, UUID) TO authenticated;
