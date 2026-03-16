import { useState, useEffect } from "react";
import { HomePage } from "./pages/home/HomePage.jsx";
import { ChatPage } from "./pages/chat/ChatPage.jsx";
import { DashboardPage } from "./pages/dashboard/DashboardPage.jsx";
import { useChat } from "./services/chat/useChat.js";
import {
  getSession,
  signInWithEmail,
  signInWithGoogle,
  signOut,
  subscribeToAuthChanges,
} from "./services/auth/authService.js";
import { getProfile, saveProfile } from "./services/profile/profileService.js";

function toErrorMessage(error, fallback) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function App() {
  const [page, setPage] = useState("landing"); // "landing" | "chat" | "dashboard"
  const chat = useChat();

  const [state, setState] = useState({
    authLoading: true,
    authActionLoading: false,
    authModalOpen: false,
    session: null,
    profile: null,
    profileLoading: false,
    profileSaving: false,
    errorMessage: "",
    successMessage: "",
  });

  async function syncProfile(userId) {
    setState((s) => ({ ...s, profileLoading: true }));
    try {
      const profile = await getProfile(userId);
      setState((s) => ({ ...s, profile, profileLoading: false }));
    } catch {
      setState((s) => ({ ...s, profileLoading: false }));
    }
  }

  useEffect(() => {
    let unsubscribe = null;

    async function bootstrap() {
      try {
        const session = await getSession();
        setState((s) => ({ ...s, session, authLoading: false }));

        if (session?.user) {
          syncProfile(session.user.id);
        }

        const unsub = await subscribeToAuthChanges((newSession) => {
          setState((s) => ({
            ...s,
            session: newSession,
            profile: null,
            authModalOpen: false,
            errorMessage: "",
            successMessage: "",
          }));

          if (newSession?.user) {
            syncProfile(newSession.user.id);
          }
        });

        unsubscribe = unsub;
      } catch (error) {
        setState((s) => ({
          ...s,
          authLoading: false,
          errorMessage: toErrorMessage(error, "Unable to initialize authentication."),
        }));
      }
    }

    void bootstrap();

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  async function handleLogin() {
    setState((s) => ({ ...s, authActionLoading: true, errorMessage: "", successMessage: "" }));
    try {
      await signInWithGoogle();
    } catch (error) {
      setState((s) => ({
        ...s,
        authActionLoading: false,
        errorMessage: toErrorMessage(error, "Google sign-in could not be started."),
        authModalOpen: true,
      }));
    }
  }

  async function handleEmailLogin(email) {
    setState((s) => ({ ...s, authActionLoading: true, errorMessage: "", successMessage: "" }));
    try {
      await signInWithEmail(email);
      setState((s) => ({
        ...s,
        authActionLoading: false,
        authModalOpen: false,
        successMessage: `Magic link sent to ${email.trim().toLowerCase()}.`,
      }));
    } catch (error) {
      setState((s) => ({
        ...s,
        authActionLoading: false,
        errorMessage: toErrorMessage(error, "Email sign-in could not be started."),
      }));
    }
  }

  async function handleLogout() {
    setState((s) => ({ ...s, authActionLoading: true, errorMessage: "", successMessage: "" }));
    try {
      await signOut();
      setState((s) => ({ ...s, profile: null }));
    } catch (error) {
      setState((s) => ({
        ...s,
        errorMessage: toErrorMessage(error, "Unable to sign out."),
      }));
    } finally {
      setState((s) => ({ ...s, authActionLoading: false }));
    }
  }

  async function handleProfileSubmit(formValues) {
    if (!state.session?.user) return;
    setState((s) => ({ ...s, profileSaving: true, errorMessage: "" }));
    try {
      const profile = await saveProfile(state.session.user.id, formValues);
      setState((s) => ({ ...s, profile, profileSaving: false }));
    } catch (error) {
      setState((s) => ({
        ...s,
        profileSaving: false,
        errorMessage: toErrorMessage(error, "Unable to save profile."),
      }));
    }
  }

  const actions = {
    onCloseLogin: () => setState((s) => ({ ...s, authModalOpen: false, errorMessage: "" })),
    onEmailLogin: handleEmailLogin,
    onLogin: handleLogin,
    onLogout: handleLogout,
    onOpenLogin: () => setState((s) => ({ ...s, authModalOpen: true, errorMessage: "", successMessage: "" })),
    onProfileSubmit: handleProfileSubmit,
  };

  if (page === "chat") {
    return <ChatPage chat={chat} onBack={() => setPage("landing")} />;
  }

  if (page === "dashboard") {
    return (
      <DashboardPage
        session={state.session}
        profile={state.profile}
        onBack={() => setPage("landing")}
        onLogout={handleLogout}
        onOpenChat={() => setPage("chat")}
      />
    );
  }

  return (
    <HomePage
      state={state}
      actions={actions}
      chat={chat}
      onOpenChatPage={() => setPage("chat")}
      onOpenDashboard={() => setPage("dashboard")}
    />
  );
}
