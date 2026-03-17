import { useState, useEffect, useRef } from "react";
import { getSocialRank, getMyActiveRoom } from "../services/community/communityService.js";
import {
  getNotifications,
  subscribeToNotifications,
} from "../services/notification/notificationService.js";
import { getSupabaseClient } from "../services/supabase/client.js";
import "./Navbar.css";

const NAV_ITEMS = [
  { label: "Home",            id: "home",      href: "#home" },
  { label: "Threat Scanner",  id: "scanner",   href: "#scanner" },
  { label: "Detect Phishing", id: "dashboard", href: "#dashboard" },
  { label: "Detect Deepfake", id: "deepfake",  href: "#deepfake" },
  { label: "Services",        id: "services",  href: "#services" },
];

function timeAgo(ts) {
  const s = Math.round((Date.now() - new Date(ts).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return Math.round(s / 60) + "m ago";
  if (s < 86400) return Math.round(s / 3600) + "h ago";
  return Math.round(s / 86400) + "d ago";
}

export function Navbar({
  activePage = "home",
  session,
  profile,
  authLoading,
  onHome,
  onChat,
  onDashboard,
  onLogin,
  onLogout,
  onSubscription,
  onDeepfake,
  onApplyExpert,
  onExpertDashboard,
  onCommunityChat,
  onServices,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeRoom, setActiveRoom] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  // ── Theme state ──
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("ns-theme") || "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("ns-theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  // ── Notifications state ──
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [lastSeen, setLastSeen] = useState(() => {
    return sessionStorage.getItem("ns_notif_last_seen") || "1970-01-01T00:00:00Z";
  });
  const notifRef = useRef(null);
  const notifChannelRef = useRef(null);

  // Load notifications + subscribe to realtime when logged in
  useEffect(() => {
    if (!session) return;

    getNotifications()
      .then((data) => setNotifications(data))
      .catch(() => {});

    notifChannelRef.current = subscribeToNotifications((newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
    });

    return () => {
      if (notifChannelRef.current) {
        getSupabaseClient().removeChannel(notifChannelRef.current);
        notifChannelRef.current = null;
      }
    };
  }, [session?.user?.id]);

  // Mark as read when dropdown opens
  useEffect(() => {
    if (notifOpen && notifications.length > 0) {
      const ts = new Date().toISOString();
      setLastSeen(ts);
      sessionStorage.setItem("ns_notif_last_seen", ts);
    }
  }, [notifOpen]);

  // Close notif dropdown on outside click
  useEffect(() => {
    if (!notifOpen) return;
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [notifOpen]);

  const unreadCount = notifications.filter(
    (n) => new Date(n.created_at) > new Date(lastSeen)
  ).length;

  // ── Profile dropdown ──
  useEffect(() => {
    if (dropdownOpen && profile?.id) {
      getMyActiveRoom(profile.id).then(setActiveRoom).catch(() => {});
    }
  }, [dropdownOpen, profile?.id]);

  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  // Close mobile menu on outside click
  const mobileMenuRef = useRef(null);
  useEffect(() => {
    if (!mobileMenuOpen) return;
    function handleClick(e) {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target)
      ) {
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [mobileMenuOpen]);

  function handleNavClick(e, item) {
    setMobileMenuOpen(false);
    if (item.id === "dashboard") {
      e.preventDefault();
      onDashboard?.();
      return;
    }
    if (item.id === "scanner") { e.preventDefault(); onChat?.(); return; }
    if (item.id === "deepfake") { e.preventDefault(); onDeepfake?.(); return; }
    if (item.id === "services") { e.preventDefault(); onServices?.(); return; }
    if (activePage !== "home") { e.preventDefault(); onHome?.(); return; }
  }

  const isExpert = profile?.user_type === "expert";

  return (
    <nav className="ns-nav" ref={mobileMenuRef}>
      <div className="ns-nav-inner">
        <a className="ns-brand" onClick={onHome} href="#home">
          <span className="ns-brand-mark">N</span>
          <span className="ns-brand-name">NorthStar</span>
        </a>

        {/* Desktop nav links */}
        <div className="ns-nav-links ns-nav-links-desktop">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              className={`ns-nav-link${activePage === item.id ? " ns-nav-link-active" : ""}`}
              href={item.href}
              onClick={(e) => handleNavClick(e, item)}
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="ns-nav-actions">
          {/* Theme toggle */}
          <button
            className="ns-theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          {session ? (
            <>
              {/* Notification bell */}
              <div className="ns-notif-wrap" ref={notifRef}>
                <button
                  className="ns-notif-btn"
                  onClick={() => { setNotifOpen((o) => !o); setDropdownOpen(false); }}
                  aria-label="Notifications"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="ns-notif-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
                  )}
                </button>

                {notifOpen && (
                  <div className="ns-notif-dropdown">
                    <div className="ns-notif-header">
                      <span className="ns-notif-title">Notifications</span>
                      {notifications.length > 0 && (
                        <span className="ns-notif-count">{notifications.length}</span>
                      )}
                    </div>
                    <div className="ns-notif-list">
                      {notifications.length === 0 ? (
                        <div className="ns-notif-empty">No notifications yet.</div>
                      ) : (
                        notifications.map((n) => {
                          const isNew = new Date(n.created_at) > new Date(lastSeen);
                          return (
                            <div
                              key={n.id}
                              className={`ns-notif-item${isNew ? " ns-notif-unread" : ""}`}
                            >
                              {isNew && <span className="ns-notif-dot" />}
                              <div className="ns-notif-content">
                                <span className="ns-notif-item-title">{n.title}</span>
                                <span className="ns-notif-item-body">{n.body}</span>
                                <span className="ns-notif-item-time">{timeAgo(n.created_at)}</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div
                className={`ns-tier-badge ns-tier-${profile?.subscription_tier || "free"}`}
                onClick={onSubscription}
                role="button"
                tabIndex={0}
              >
                {(profile?.subscription_tier || "free").toUpperCase()}
              </div>

              {/* Profile chip */}
              <div className="ns-profile-wrap" ref={dropdownRef}>
                <button
                  className="ns-user-chip"
                  onClick={() => { setDropdownOpen((o) => !o); setNotifOpen(false); }}
                  aria-haspopup="true"
                  aria-expanded={dropdownOpen}
                >
                  {isExpert && <span className="ns-expert-dot" />}
                  @{profile?.username ?? "user"}
                </button>

                {dropdownOpen && (
                  <div className="ns-profile-dropdown">
                    <div className="ns-pd-header">
                      <div className="ns-pd-avatar">
                        {(profile?.name?.[0] ?? profile?.username?.[0] ?? "U").toUpperCase()}
                      </div>
                      <div className="ns-pd-name-block">
                        <span className="ns-pd-name">{profile?.name ?? "—"}</span>
                        <span className="ns-pd-username">@{profile?.username ?? "—"}</span>
                      </div>
                    </div>

                    <div className="ns-pd-divider" />

                    <div className="ns-pd-rows">
                      <div className="ns-pd-row">
                        <span className="ns-pd-label">Email</span>
                        <span className="ns-pd-value">{session?.user?.email ?? "—"}</span>
                      </div>
                      <div className="ns-pd-row">
                        <span className="ns-pd-label">Subscription</span>
                        <span className={`ns-pd-badge ns-pd-sub-${profile?.subscription_tier || "free"}`}>
                          {(profile?.subscription_tier || "free").toUpperCase()}
                        </span>
                      </div>
                      <div className="ns-pd-row">
                        <span className="ns-pd-label">User Type</span>
                        <span className={`ns-pd-badge ${isExpert ? "ns-pd-expert" : "ns-pd-normal"}`}>
                          {isExpert ? "Expert" : "Normal"}
                        </span>
                      </div>

                      {isExpert && (
                        <div className="ns-pd-row">
                          <span className="ns-pd-label">Social Score</span>
                          <span className="ns-pd-value">
                            {profile?.social_score ?? 0}
                            <span className="ns-pd-rank"> · {getSocialRank(profile?.social_score ?? 0)}</span>
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="ns-pd-divider" />

                    <div className="ns-pd-actions">
                      {isExpert ? (
                        <>
                          <div className="ns-pd-expert-badge">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M12 2l8 3v6c0 5-3.4 9.7-8 11-4.6-1.3-8-6-8-11V5z" />
                              <polyline points="9 12 11 14 15 10" />
                            </svg>
                            Verified Cyber Expert
                          </div>
                          <button
                            className="ns-pd-btn ns-pd-btn-primary"
                            onClick={() => { setDropdownOpen(false); onExpertDashboard?.(); }}
                          >
                            Expert Panel
                          </button>
                        </>
                      ) : (
                        <button
                          className="ns-pd-btn ns-pd-btn-apply"
                          onClick={() => { setDropdownOpen(false); onApplyExpert?.(); }}
                        >
                          Apply to be an Expert
                        </button>
                      )}

                      {activeRoom && (
                        <button
                          className="ns-pd-btn ns-pd-btn-chat"
                          onClick={() => {
                            setDropdownOpen(false);
                            onCommunityChat?.(activeRoom.id, activeRoom.expert_queries?.title);
                          }}
                        >
                          Open Active Chat
                        </button>
                      )}

                      <button
                        className="ns-pd-btn ns-pd-btn-logout"
                        onClick={() => { setDropdownOpen(false); onLogout?.(); }}
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button
              className="ns-nav-btn ns-nav-btn-primary"
              onClick={onLogin}
              disabled={authLoading}
            >
              {authLoading ? "Loading..." : "Login"}
            </button>
          )}

          {/* Hamburger button — mobile only */}
          <button
            className="ns-hamburger"
            onClick={() => setMobileMenuOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            <span className={`ns-hamburger-line${mobileMenuOpen ? " ns-hamburger-open" : ""}`} />
            <span className={`ns-hamburger-line${mobileMenuOpen ? " ns-hamburger-open" : ""}`} />
            <span className={`ns-hamburger-line${mobileMenuOpen ? " ns-hamburger-open" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile nav links dropdown */}
      {mobileMenuOpen && (
        <div className="ns-mobile-menu">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              className={`ns-mobile-link${activePage === item.id ? " ns-mobile-link-active" : ""}`}
              href={item.href}
              onClick={(e) => handleNavClick(e, item)}
            >
              {item.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}
