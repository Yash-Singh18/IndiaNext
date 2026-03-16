-- Enable Realtime broadcasts for tables used in live-update flows
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expert_queries;
