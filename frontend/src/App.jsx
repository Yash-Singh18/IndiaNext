import { useState, useEffect, useRef } from "react";
import { AdminPage } from "./pages/admin/AdminPage.jsx";
import { ServicesPage } from "./pages/services/ServicesPage.jsx";
import { ApplyExpertPage } from "./pages/applyExpert/ApplyExpertPage.jsx";
import { ChatPage } from "./pages/chat/ChatPage.jsx";
import { CommunityChatPage } from "./pages/communityChat/CommunityChatPage.jsx";
import { DashboardPage } from "./pages/dashboard/DashboardPage.jsx";
import { DeepfakePage } from "./pages/deepfake/DeepfakePage.jsx";
import { ExpertDashboardPage } from "./pages/expertDashboard/ExpertDashboardPage.jsx";
import { HomePage } from "./pages/home/HomePage.jsx";
import { SubscriptionPage } from "./pages/subscription/SubscriptionPage.jsx";
import { useChat } from "./services/chat/useChat.js";
import {
  getSession,
  signInWithEmail,
  signInWithGoogle,
  signOut,
  subscribeToAuthChanges,
} from "./services/auth/authService.js";
import { getProfile, saveProfile } from "./services/profile/profileService.js";
import { getSupabaseClient } from "./services/supabase/client.js";

function toErrorMessage(error, fallback) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function App() {
  const [page, setPage] = useState("landing");
  const [communityRoomId, setCommunityRoomId] = useState(null);
  const chat = useChat();
  const profileChannelRef = useRef(null);

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

    // Subscribe to live profile changes (e.g. admin flips user_type to 'expert')
    const supabase = getSupabaseClient();
    if (profileChannelRef.current) {
      supabase.removeChannel(profileChannelRef.current);
    }
    profileChannelRef.current = supabase
      .channel(`profile_live_${userId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${userId}` },
        (payload) => {
          setState((s) => ({ ...s, profile: payload.new }));
        }
      )
      .subscribe();
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
    if (profileChannelRef.current) {
      getSupabaseClient().removeChannel(profileChannelRef.current);
      profileChannelRef.current = null;
    }
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

  function handleOpenCommunityChat(roomId) {
    setCommunityRoomId(roomId);
    setPage("communityChat");
  }

  const actions = {
    onCloseLogin: () => setState((s) => ({ ...s, authModalOpen: false, errorMessage: "" })),
    onEmailLogin: handleEmailLogin,
    onLogin: handleLogin,
    onLogout: handleLogout,
    onOpenLogin: () => setState((s) => ({ ...s, authModalOpen: true, errorMessage: "", successMessage: "" })),
    onProfileSubmit: handleProfileSubmit,
  };

  if (page === "services") {
    return (
      <ServicesPage
        session={state.session}
        profile={state.profile}
        authLoading={state.authLoading}
        onHome={() => setPage("landing")}
        onChat={() => setPage("chat")}
        onDashboard={() => setPage("dashboard")}
        onLogin={actions.onOpenLogin}
        onLogout={actions.onLogout}
        onSubscription={() => setPage("subscription")}
        onDeepfake={() => setPage("deepfake")}
        onApplyExpert={() => setPage("applyExpert")}
        onExpertDashboard={() => setPage("expertDashboard")}
        onCommunityChat={handleOpenCommunityChat}
        onServices={() => setPage("services")}
      />
    );
  }

  if (page === "chat") {
    return <ChatPage chat={chat} onBack={() => setPage("landing")} />;
  }

  if (page === "admin") {
    return <AdminPage />;
  }

  if (page === "applyExpert") {
    return (
      <ApplyExpertPage
        session={state.session}
        profile={state.profile}
        onBack={() => setPage("landing")}
      />
    );
  }

  if (page === "expertDashboard") {
    return (
      <ExpertDashboardPage
        session={state.session}
        profile={state.profile}
        onBack={() => setPage("landing")}
        onCommunityChat={handleOpenCommunityChat}
      />
    );
  }

  if (page === "communityChat") {
    return (
      <CommunityChatPage
        roomId={communityRoomId}
        session={state.session}
        profile={state.profile}
        onBack={() => setPage("landing")}
      />
    );
  }

  if (page === "subscription") {
    return (
      <SubscriptionPage
        session={state.session}
        profile={state.profile}
        authLoading={state.authLoading}
        onHome={() => setPage("landing")}
        onChat={() => setPage("chat")}
        onDashboard={() => setPage("dashboard")}
        onLogin={actions.onOpenLogin}
        onLogout={actions.onLogout}
        onSubscription={() => setPage("subscription")}
        onDeepfake={() => setPage("deepfake")}
        onApplyExpert={() => setPage("applyExpert")}
        onExpertDashboard={() => setPage("expertDashboard")}
        onCommunityChat={handleOpenCommunityChat}
        onServices={() => setPage("services")}
      />
    );
  }

  if (page === "deepfake") {
    return (
      <DeepfakePage
        session={state.session}
        profile={state.profile}
        authLoading={state.authLoading}
        onHome={() => setPage("landing")}
        onChat={() => setPage("chat")}
        onDashboard={() => setPage("dashboard")}
        onLogin={actions.onOpenLogin}
        onLogout={actions.onLogout}
        onSubscription={() => setPage("subscription")}
        onDeepfake={() => setPage("deepfake")}
        onApplyExpert={() => setPage("applyExpert")}
        onExpertDashboard={() => setPage("expertDashboard")}
        onCommunityChat={handleOpenCommunityChat}
        onServices={() => setPage("services")}
      />
    );
  }

  if (page === "dashboard") {
    return (
      <DashboardPage
        session={state.session}
        profile={state.profile}
        authLoading={state.authLoading}
        onBack={() => setPage("landing")}
        onLogout={handleLogout}
        onOpenChat={() => setPage("chat")}
        onLogin={actions.onOpenLogin}
        onSubscription={() => setPage("subscription")}
        onAdmin={() => setPage("admin")}
        onDeepfake={() => setPage("deepfake")}
        onApplyExpert={() => setPage("applyExpert")}
        onExpertDashboard={() => setPage("expertDashboard")}
        onCommunityChat={handleOpenCommunityChat}
        onServices={() => setPage("services")}
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
      onSubscription={() => setPage("subscription")}
      onAdmin={() => setPage("admin")}
      onDeepfake={() => setPage("deepfake")}
      onApplyExpert={() => setPage("applyExpert")}
      onExpertDashboard={() => setPage("expertDashboard")}
      onCommunityChat={handleOpenCommunityChat}
      onServices={() => setPage("services")}
    />
  );
}
