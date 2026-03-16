-- Notification system — admin broadcasts to all users

CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone can read notifications" ON public.notifications;
CREATE POLICY "anyone can read notifications"
  ON public.notifications FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.create_notification(p_title TEXT, p_body TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.notifications (title, body)
  VALUES (p_title, p_body)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
