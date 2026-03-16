import { getSupabaseClient } from "../supabase/client.js";

export async function getNotifications() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data || [];
}

export async function createNotification(title, body) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc("create_notification", {
    p_title: title,
    p_body: body,
  });
  if (error) throw error;
  return data;
}

export function subscribeToNotifications(callback) {
  const supabase = getSupabaseClient();
  return supabase
    .channel("notifications_live")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "notifications" },
      (payload) => callback(payload.new)
    )
    .subscribe();
}
