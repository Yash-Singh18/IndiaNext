import { getSupabaseClient } from "../supabase/client.js";

const supabase = getSupabaseClient();

// ─── Rank helpers ──────────────────────────────────────────────────────────────
export function getSocialRank(score) {
  if (score >= 200) return "Cyber Sentinel";
  if (score >= 50)  return "Security Guardian";
  if (score >= 10)  return "Cyber Helper";
  return "Beginner Expert";
}

// ─── Expert Applications ────────────────────────────────────────────────────────
export async function applyExpert(userId, username, score) {
  const { error } = await supabase
    .from("expert_applications")
    .insert({ user_id: userId, username, score });
  if (error) throw error;
}

export async function getExpertApplications() {
  const { data, error } = await supabase.rpc("get_all_expert_applications");
  if (error) throw error;
  return data || [];
}

export async function approveExpertApplication(applicationId) {
  const { data, error } = await supabase.rpc("approve_expert_application", {
    p_application_id: applicationId,
  });
  if (error) throw error;
  if (!data) throw new Error("Application not found or already reviewed.");
}

export async function rejectExpertApplication(applicationId) {
  const { data, error } = await supabase.rpc("reject_expert_application", {
    p_application_id: applicationId,
  });
  if (error) throw error;
  if (!data) throw new Error("Application not found or already reviewed.");
}

// ─── Expert Queries ─────────────────────────────────────────────────────────────
export async function createQuery(userId, title, description) {
  const { data, error } = await supabase
    .from("expert_queries")
    .insert({ user_id: userId, title, description })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getOpenQueries() {
  const { data, error } = await supabase
    .from("expert_queries")
    .select("id, title, description, created_at, user_id, profiles!expert_queries_user_id_fkey(username, name)")
    .eq("status", "open")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

// Atomic accept: updates status + creates chat room in one DB transaction
// Returns { success: boolean, room_id: string | null }
export async function acceptQuery(queryId, expertId) {
  const { data, error } = await supabase.rpc("accept_query", {
    p_query_id:  queryId,
    p_expert_id: expertId,
  });
  if (error) throw error;
  // data is an array of rows from RETURNS TABLE
  return data?.[0] ?? { success: false, room_id: null };
}

export async function resolveQuery(queryId, expertId) {
  const { data, error } = await supabase.rpc("resolve_query", {
    p_query_id:  queryId,
    p_expert_id: expertId,
  });
  if (error) throw error;
  return !!data;
}

// Subscribe to expert_queries changes (Supabase Realtime)
// callback receives the Supabase realtime payload
export function subscribeToQueries(callback) {
  const channel = supabase
    .channel("expert_queries_realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "expert_queries" },
      callback
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

// ─── Chat ───────────────────────────────────────────────────────────────────────
export async function getChatRoom(roomId) {
  const { data, error } = await supabase
    .from("chat_rooms")
    .select(`
      id, created_at,
      expert_queries!query_id(id, title, status),
      user:profiles!chat_rooms_user_id_fkey(id, username, name),
      expert:profiles!chat_rooms_expert_id_fkey(id, username, name)
    `)
    .eq("id", roomId)
    .single();
  if (error) throw error;
  return data;
}

export async function getChatMessages(roomId) {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("id, message, created_at, sender_id, profiles!sender_id(username)")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function saveChatMessage(roomId, senderId, message) {
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({ room_id: roomId, sender_id: senderId, message })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Get the most recent active (in_progress) room for this user
// Returns the room or null
export async function getMyActiveRoom(userId) {
  const { data, error } = await supabase
    .from("chat_rooms")
    .select(`
      id,
      expert_queries!query_id(id, title, status)
    `)
    .or(`user_id.eq.${userId},expert_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error || !data) return null;

  // Find a room whose query is still in_progress
  return data.find((r) => r.expert_queries?.status === "in_progress") ?? null;
}
