-- Admin RPC to update subscription tier — bypasses RLS
CREATE OR REPLACE FUNCTION public.approve_subscription(p_user_id UUID, p_tier TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.profiles
  SET subscription_tier = p_tier
  WHERE id = p_user_id;
  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_subscription(UUID, TEXT) TO authenticated;
