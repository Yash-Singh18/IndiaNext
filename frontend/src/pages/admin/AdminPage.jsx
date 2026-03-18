import { useState, useEffect } from "react";
import {
  getPaymentRequests,
  approveRequest,
  rejectRequest,
} from "../../services/subscription/subscriptionService.js";
import {
  getExpertApplications,
  approveExpertApplication,
  rejectExpertApplication,
} from "../../services/community/communityService.js";
import {
  getNotifications,
  createNotification,
} from "../../services/notification/notificationService.js";
import "./AdminPage.css";

const ADMIN_USERNAME = import.meta.env.VITE_ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "changeme";

export function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [tab, setTab] = useState("payments"); // "payments" | "experts" | "notifications"

  const [requests, setRequests] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);

  // Notifications
  const [notifList, setNotifList] = useState([]);
  const [notifTitle, setNotifTitle] = useState("");
  const [notifBody, setNotifBody] = useState("");
  const [notifSending, setNotifSending] = useState(false);

  function handleAdminLogin(e) {
    e.preventDefault();
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      setLoggedIn(true);
      setLoginError("");
    } else {
      setLoginError("Invalid username or password.");
    }
  }

  useEffect(() => {
    if (loggedIn) {
      loadRequests();
      loadApplications();
      loadNotifications();
    }
  }, [loggedIn]);

  async function loadRequests() {
    setLoading(true);
    try {
      const data = await getPaymentRequests();
      setRequests(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadApplications() {
    try {
      const data = await getExpertApplications();
      setApplications(data || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadNotifications() {
    try {
      const data = await getNotifications();
      setNotifList(data || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSendNotification(e) {
    e.preventDefault();
    if (!notifTitle.trim() || !notifBody.trim()) return;
    setNotifSending(true);
    try {
      await createNotification(notifTitle.trim(), notifBody.trim());
      setNotifTitle("");
      setNotifBody("");
      await loadNotifications();
    } catch (err) {
      alert("Failed to send: " + (err.message || err));
    } finally {
      setNotifSending(false);
    }
  }

  async function handleApprove(id) {
    if (!confirm("Approve this upgrade?")) return;
    await approveRequest(id);
    await loadRequests();
  }

  async function handleReject(id) {
    if (!confirm("Reject this request?")) return;
    await rejectRequest(id);
    await loadRequests();
  }

  async function handleApproveExpert(app) {
    if (!confirm(`Approve ${app.username} as Expert?`)) return;
    try {
      await approveExpertApplication(app.id);
      await loadApplications();
    } catch (err) {
      alert("Failed: " + (err.message || err));
    }
  }

  async function handleRejectExpert(app) {
    if (!confirm(`Reject application from ${app.username}?`)) return;
    try {
      await rejectExpertApplication(app.id);
      await loadApplications();
    } catch (err) {
      alert("Failed: " + (err.message || err));
    }
  }

  if (!loggedIn) {
    return (
      <div className="admin-root">
        <div className="admin-login-wrap">
          <form className="admin-login-card" onSubmit={handleAdminLogin}>
            <div className="admin-login-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40">
                <path d="M12 2l8 3v6c0 5-3.4 9.7-8 11-4.6-1.3-8-6-8-11V5z" />
              </svg>
            </div>
            <h2>Admin Access</h2>
            <p>Enter admin credentials to continue.</p>
            {loginError && <div className="admin-login-error">{loginError}</div>}
            <input
              className="admin-login-input"
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
            <input
              className="admin-login-input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button className="admin-btn admin-login-btn" type="submit">
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-root">
      <header className="admin-topbar">
        <div className="admin-topbar-brand">
          <span>NorthStar</span>
          <span className="admin-topbar-sep">·</span>
          <span>Admin</span>
        </div>
        <button className="admin-logout-btn" onClick={() => setLoggedIn(false)}>
          Log out
        </button>
      </header>

      <main className="admin-main">
        <div className="admin-header">
          <h1>Admin Dashboard</h1>
          <p>Manage subscription upgrades and expert applications.</p>
        </div>

        {/* Tabs */}
        <div className="admin-tabs">
          <button
            className={`admin-tab${tab === "payments" ? " admin-tab-active" : ""}`}
            onClick={() => setTab("payments")}
          >
            Payment Requests
          </button>
          <button
            className={`admin-tab${tab === "experts" ? " admin-tab-active" : ""}`}
            onClick={() => setTab("experts")}
          >
            Expert Applications
            {applications.filter((a) => a.status === "pending").length > 0 && (
              <span className="admin-tab-badge">
                {applications.filter((a) => a.status === "pending").length}
              </span>
            )}
          </button>
          <button
            className={`admin-tab${tab === "notifications" ? " admin-tab-active" : ""}`}
            onClick={() => setTab("notifications")}
          >
            Notifications
          </button>
        </div>

        {/* ── Payment Requests ── */}
        {tab === "payments" && (
          <div className="admin-card">
            <div className="admin-card-header">
              <h3>Payment Requests</h3>
              <button className="admin-refresh" onClick={loadRequests}>Refresh</button>
            </div>

            {loading ? (
              <div className="admin-loading">Loading requests...</div>
            ) : requests.length === 0 ? (
              <div className="admin-empty">No payment requests found.</div>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>User</th>
                      <th>Current Tier</th>
                      <th>Requested</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((req) => (
                      <tr key={req.id}>
                        <td>{new Date(req.created_at).toLocaleString()}</td>
                        <td>
                          <div className="td-user">
                            <strong>{req.profiles?.name}</strong>
                            <span>@{req.profiles?.username}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`ad-tier-badge ad-tier-${req.profiles?.subscription_tier}`}>
                            {req.profiles?.subscription_tier?.toUpperCase() || "FREE"}
                          </span>
                        </td>
                        <td>
                          <span className={`ad-tier-badge ad-tier-${req.requested_tier}`}>
                            {req.requested_tier.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <span className={`ad-status ad-status-${req.status}`}>
                            {req.status.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          {req.status === "pending" ? (
                            <div className="admin-actions">
                              <button className="aa-btn aa-approve" onClick={() => handleApprove(req.id)}>
                                Approve
                              </button>
                              <button className="aa-btn aa-reject" onClick={() => handleReject(req.id)}>
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="ad-reviewed">Reviewed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Expert Applications ── */}
        {tab === "experts" && (
          <div className="admin-card">
            <div className="admin-card-header">
              <h3>Expert Applications</h3>
              <button className="admin-refresh" onClick={loadApplications}>Refresh</button>
            </div>

            {applications.length === 0 ? (
              <div className="admin-empty">No expert applications yet.</div>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Username</th>
                      <th>Score</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => (
                      <tr key={app.id}>
                        <td>{new Date(app.created_at).toLocaleString()}</td>
                        <td>
                          <span className="ad-username">@{app.username}</span>
                        </td>
                        <td>
                          <span className="ad-score">{app.score} / 3</span>
                        </td>
                        <td>
                          <span className={`ad-status ad-status-${app.status}`}>
                            {app.status.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          {app.status === "pending" ? (
                            <div className="admin-actions">
                              <button className="aa-btn aa-approve" onClick={() => handleApproveExpert(app)}>
                                Approve
                              </button>
                              <button className="aa-btn aa-reject" onClick={() => handleRejectExpert(app)}>
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="ad-reviewed">Reviewed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        {/* ── Notifications ── */}
        {tab === "notifications" && (
          <div className="admin-card">
            <div className="admin-card-header">
              <h3>Send Notification</h3>
            </div>

            <form className="admin-notif-form" onSubmit={handleSendNotification}>
              <input
                className="admin-login-input"
                type="text"
                placeholder="Title"
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
              />
              <textarea
                className="admin-login-input admin-notif-textarea"
                placeholder="Notification body…"
                value={notifBody}
                onChange={(e) => setNotifBody(e.target.value)}
                rows={3}
              />
              <button
                className="admin-btn admin-login-btn"
                type="submit"
                disabled={notifSending || !notifTitle.trim() || !notifBody.trim()}
              >
                {notifSending ? "Sending…" : "Send to All Users"}
              </button>
            </form>

            {notifList.length > 0 && (
              <>
                <div className="admin-card-header" style={{ marginTop: "1.5rem" }}>
                  <h3>Sent Notifications</h3>
                  <button className="admin-refresh" onClick={loadNotifications}>Refresh</button>
                </div>
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Title</th>
                        <th>Body</th>
                      </tr>
                    </thead>
                    <tbody>
                      {notifList.map((n) => (
                        <tr key={n.id}>
                          <td>{new Date(n.created_at).toLocaleString()}</td>
                          <td><strong>{n.title}</strong></td>
                          <td style={{ maxWidth: "300px", whiteSpace: "pre-wrap" }}>{n.body}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
