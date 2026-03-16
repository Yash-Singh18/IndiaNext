import "./Navbar.css";

const NAV_ITEMS = [
  { label: "Home", id: "home", href: "#home" },
  { label: "Threat Scanner", id: "scanner", href: "#scanner" },
  { label: "Detect Phishing", id: "dashboard", href: "#dashboard" },
  { label: "Detect Deepfake", id: "deepfake", href: "#deepfake" },
  { label: "About", id: "about", href: "#about" },
];

export function Navbar({
  variant = "light",
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
}) {
  function handleNavClick(e, item) {
    if (item.id === "dashboard") {
      e.preventDefault();
      if (session) {
        onDashboard?.();
      } else {
        onLogin?.();
      }
      return;
    }

    if (item.id === "scanner") {
      e.preventDefault();
      onChat?.();
      return;
    }

    if (item.id === "deepfake") {
      e.preventDefault();
      onDeepfake?.();
      return;
    }

    // Home, About — if we're NOT on the homepage, navigate there first
    if (activePage !== "home") {
      e.preventDefault();
      onHome?.();
      return;
    }
    // On homepage, let the anchor scroll naturally
  }

  return (
    <nav className={`ns-nav ns-nav-${variant}`}>
      <div className="ns-nav-inner">
        <a className="ns-brand" onClick={onHome} href="#home">
          <span className="ns-brand-mark">N</span>
          <span className="ns-brand-name">NorthStar</span>
        </a>

        <div className="ns-nav-links">
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
          {session ? (
            <>
              <div
                className={`ns-tier-badge ns-tier-${profile?.subscription_tier || 'free'}`}
                onClick={onSubscription}
                role="button"
                tabIndex={0}
              >
                {(profile?.subscription_tier || 'free').toUpperCase()}
              </div>
              <span className="ns-user-chip">
                @{profile?.username ?? "user"}
              </span>
              <button className="ns-nav-btn ns-nav-btn-secondary" onClick={onLogout}>
                Sign out
              </button>
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
        </div>
      </div>
    </nav>
  );
}
