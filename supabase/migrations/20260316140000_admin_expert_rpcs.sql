-- Admin RPC functions for expert application management
-- SECURITY DEFINER bypasses RLS — admin access controlled at frontend level

-- Get all expert applications (bypasses ea_admin_select RLS)
CREATE OR REPLACE FUNCTION public.get_all_expert_applications()
RETURNS SETOF public.expert_applications
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
    SELECT * FROM public.expert_applications
    ORDER BY created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_all_expert_applications() TO authenticated;

-- Approve: sets application status + flips user_type to expert atomically
CREATE OR REPLACE FUNCTION public.approve_expert_application(p_application_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  UPDATE public.expert_applications
  SET status = 'approved'
  WHERE id = p_application_id AND status = 'pending'
  RETURNING user_id INTO v_user_id;

  IF NOT FOUND THEN RETURN FALSE; END IF;

  UPDATE public.profiles
  SET user_type = 'expert'
  WHERE id = v_user_id;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_expert_application(UUID) TO authenticated;

-- Reject: sets application status to rejected
CREATE OR REPLACE FUNCTION public.reject_expert_application(p_application_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.expert_applications
  SET status = 'rejected'
  WHERE id = p_application_id AND status = 'pending';

  IF NOT FOUND THEN RETURN FALSE; END IF;
  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reject_expert_application(UUID) TO authenticated;
