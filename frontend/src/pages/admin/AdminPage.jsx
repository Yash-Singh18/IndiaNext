import { useState, useEffect } from "react";
import {
  getPaymentRequests,
  approveRequest,
  rejectRequest,
} from "../../services/subscription/subscriptionService.js";
import "./AdminPage.css";

const ADMIN_USERNAME = "Yash";
const ADMIN_PASSWORD = "northstar";

export function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

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
    if (loggedIn) loadRequests();
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
          <p>Manage subscription upgrades and payment approvals.</p>
        </div>

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
      </main>
    </div>
  );
}
