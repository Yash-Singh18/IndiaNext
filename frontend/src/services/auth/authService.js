import { getSupabaseClient } from "../supabase/client.js";

export async function getSession() {
  try {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      throw error;
    }

    return data.session;
  } catch (error) {
    throw toServiceError(error, "Unable to fetch the current auth session.");
  }
}

export async function signInWithGoogle() {
  try {
    const supabase = await getSupabaseClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    throw toServiceError(error, "Unable to start Google sign-in.");
  }
}

export async function signInWithEmail(email) {
  const normalizedEmail = String(email ?? "").trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error("Email is required.");
  }

  try {
    const supabase = await getSupabaseClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    throw toServiceError(error, "Unable to start email sign-in.");
  }
}

export async function signOut() {
  try {
    const supabase = await getSupabaseClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }
  } catch (error) {
    throw toServiceError(error, "Unable to sign out.");
  }
}

export async function deleteAccount() {
  try {
    const supabase = await getSupabaseClient();
    const { error } = await supabase.rpc("delete_own_account");

    if (error) {
      throw error;
    }

    const { error: signOutError } = await supabase.auth.signOut({
      scope: "local",
    });

    if (signOutError) {
      throw signOutError;
    }
  } catch (error) {
    throw toServiceError(error, "Unable to delete your account.");
  }
}

export async function subscribeToAuthChanges(onChange) {
  try {
    const supabase = await getSupabaseClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void onChange(session);
    });

    return () => subscription.unsubscribe();
  } catch (error) {
    throw toServiceError(error, "Unable to subscribe to auth changes.");
  }
}

function toServiceError(error, fallbackMessage) {
  if (error instanceof Error) {
    return error;
  }

  return new Error(fallbackMessage);
}
