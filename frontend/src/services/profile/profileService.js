import { getSupabaseClient } from "../supabase/client.js";

export async function getProfile(userId) {
  try {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, username, dob, created_at")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    throw toServiceError(error, "Unable to load the profile record.");
  }
}

export async function saveProfile(userId, input) {
  const payload = validateProfileInput(userId, input);

  try {
    const supabase = await getSupabaseClient();
    const existingProfile = await getProfile(userId);

    const query = existingProfile
      ? supabase
          .from("profiles")
          .update(payload)
          .eq("id", userId)
      : supabase.from("profiles").insert(payload);

    const { data, error } = await query
      .select("id, name, username, dob, created_at")
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    throw toServiceError(error, "Unable to save the profile record.");
  }
}

function validateProfileInput(userId, input) {
  const name = String(input.name ?? "").trim();
  const username = String(input.username ?? "")
    .trim()
    .toLowerCase();
  const dob = String(input.dob ?? "").trim();

  if (!name) {
    throw new Error("Name is required.");
  }

  if (!/^[a-z0-9_]{3,24}$/.test(username)) {
    throw new Error(
      "Username must be 3-24 characters and use lowercase letters, numbers, or underscores."
    );
  }

  if (!dob) {
    throw new Error("Date of birth is required.");
  }

  const dobDate = new Date(dob);

  if (Number.isNaN(dobDate.getTime())) {
    throw new Error("Date of birth must be a valid date.");
  }

  if (dobDate > new Date()) {
    throw new Error("Date of birth cannot be in the future.");
  }

  return {
    id: userId,
    name,
    username,
    dob,
  };
}

function toServiceError(error, fallbackMessage) {
  if (error instanceof Error) {
    return error;
  }

  return new Error(fallbackMessage);
}
