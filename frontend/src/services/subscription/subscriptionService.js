import { getSupabaseClient } from "../supabase/client.js";

const REQUESTS_KEY = "northstar_payment_requests";

function loadRequests() {
  try {
    return JSON.parse(localStorage.getItem(REQUESTS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveRequests(requests) {
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
}

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Uses 1 credit for a scan. Returns true if successful, false otherwise.
export async function useCredit(userId) {
  try {
    const supabase = await getSupabaseClient();
    const { data: profile, error: readError } = await supabase
      .from("profiles")
      .select("credits_used, credits_reset_at, subscription_tier")
      .eq("id", userId)
      .single();

    if (readError) throw readError;

    const FREE_LIMIT = 50;
    const now = new Date();
    const resetAt = new Date(profile.credits_reset_at);

    let creditsUsed = profile.credits_used;
    let newResetAt = profile.credits_reset_at;
    if (now.getMonth() !== resetAt.getMonth() || now.getFullYear() !== resetAt.getFullYear()) {
      creditsUsed = 0;
      newResetAt = now.toISOString();
    }

    if (profile.subscription_tier === "free" && creditsUsed >= FREE_LIMIT) {
      return false;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ credits_used: creditsUsed + 1, credits_reset_at: newResetAt })
      .eq("id", userId);

    if (updateError) throw updateError;
    return true;
  } catch (error) {
    console.error("Error using credit:", error);
    return true; // fail open so scanning still works
  }
}

export async function canUseScan(userId) {
  try {
    const supabase = await getSupabaseClient();
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("credits_used, credits_reset_at, subscription_tier")
      .eq("id", userId)
      .single();

    if (error) throw error;

    const FREE_LIMIT = 50;
    const now = new Date();
    const resetAt = new Date(profile.credits_reset_at);

    let creditsUsed = profile.credits_used;
    if (now.getMonth() !== resetAt.getMonth() || now.getFullYear() !== resetAt.getFullYear()) {
      creditsUsed = 0;
    }

    if (profile.subscription_tier !== "free") {
      return { allowed: true, remaining: "Unlimited", tier: profile.subscription_tier };
    }

    const remaining = Math.max(0, FREE_LIMIT - creditsUsed);
    return { allowed: remaining > 0, remaining, tier: "free" };
  } catch (error) {
    console.error("Error checking scan credits:", error);
    return { allowed: true, remaining: 50, tier: "free" }; // fail open
  }
}

// Submit a payment/upgrade request — stored in localStorage
export async function submitPaymentRequest(userId, tier, profileInfo = {}) {
  const requests = loadRequests();

  // Prevent duplicate pending requests for the same tier
  const duplicate = requests.find(
    (r) => r.user_id === userId && r.requested_tier === tier && r.status === "pending"
  );
  if (duplicate) return;

  const newRequest = {
    id: genId(),
    user_id: userId,
    requested_tier: tier,
    status: "pending",
    created_at: new Date().toISOString(),
    // Embed profile snapshot so admin can see user details
    profiles: {
      name: profileInfo.name || "Unknown",
      username: profileInfo.username || "unknown",
      subscription_tier: profileInfo.subscription_tier || "free",
    },
  };

  saveRequests([newRequest, ...requests]);
}

// Get requests for a specific user
export async function getUserPaymentRequests(userId) {
  const requests = loadRequests();
  return requests.filter((r) => r.user_id === userId);
}

// Get all requests (admin view)
export async function getPaymentRequests() {
  return loadRequests();
}

export async function approveRequest(requestId) {
  const requests = loadRequests();
  const req = requests.find((r) => r.id === requestId);

  if (req) {
    try {
      const supabase = await getSupabaseClient();
      const { error } = await supabase.rpc("approve_subscription", {
        p_user_id: req.user_id,
        p_tier: req.requested_tier,
      });
      if (error) throw error;
    } catch (err) {
      console.error("Failed to update subscription tier in DB:", err);
      throw err;
    }
  }

  const updated = requests.map((r) =>
    r.id === requestId
      ? { ...r, status: "approved", reviewed_at: new Date().toISOString() }
      : r
  );
  saveRequests(updated);
}

export async function rejectRequest(requestId) {
  const requests = loadRequests();
  const updated = requests.map((r) =>
    r.id === requestId
      ? { ...r, status: "rejected", reviewed_at: new Date().toISOString() }
      : r
  );
  saveRequests(updated);
}
