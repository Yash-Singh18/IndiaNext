import { useState, useEffect } from "react";
import { Navbar } from "../../components/Navbar.jsx";
import {
  submitPaymentRequest,
  getUserPaymentRequests,
} from "../../services/subscription/subscriptionService.js";
import "./SubscriptionPage.css";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "₹0",
    period: "/mo",
    description: "Basic threat scanning for individuals.",
    features: ["50 Scans per month", "Standard AI Triage", "Basic Email Analysis"],
  },
  {
    id: "pro",
    name: "Individual Pro",
    price: "₹499",
    period: "/mo",
    description: "Unlimited scanning for power users.",
    features: [
      "Unlimited Scans",
      "Deep LLM Analysis",
      "URL Reputation Lookup",
      "Priority Support",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "₹1,999",
    period: "/mo",
    description: "Advanced protection for teams and businesses.",
    features: [
      "Unlimited Scans",
      "Dedicated Infrastructure",
      "Custom Rules engine",
      "Admin Dashboard",
      "24/7 Phone Support",
    ],
  },
];

export function SubscriptionPage({
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
  onAdmin,
  onServices,
}) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const currentTier = profile?.subscription_tier || "free";

  useEffect(() => {
    if (session?.user?.id) {
      loadRequests();
    }
  }, [session?.user?.id]);

  async function loadRequests() {
    try {
      setLoading(true);
      const data = await getUserPaymentRequests(session.user.id);
      setRequests(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubscribe(planId) {
    if (!session) {
      onLogin();
      return;
    }
    setCheckoutPlan(planId);
  }

  async function confirmPayment() {
    if (!checkoutPlan || !session) return;
    setProcessing(true);
    setError("");
    try {
      await submitPaymentRequest(session.user.id, checkoutPlan, {
        name: profile?.name,
        username: profile?.username,
        subscription_tier: profile?.subscription_tier,
      });
      await loadRequests();
      setCheckoutPlan(null);
    } catch (err) {
      setError(err.message || "Failed to submit request");
    } finally {
      setProcessing(false);
    }
  }

  const hasPendingRequest = (planId) => {
    return requests.some((r) => r.requested_tier === planId && r.status === "pending");
  };

  return (
    <div className="sub-root">
      <Navbar
        variant="light"
        activePage="subscription"
        session={session}
        profile={profile}
        authLoading={authLoading}
        onHome={onHome}
        onChat={onChat}
        onDashboard={onDashboard}
        onLogin={onLogin}
        onLogout={onLogout}
        onSubscription={onSubscription}
        onDeepfake={onDeepfake}
        onApplyExpert={onApplyExpert}
        onExpertDashboard={onExpertDashboard}
        onCommunityChat={onCommunityChat}
        onAdmin={onAdmin}
        onServices={onServices}
      />

      <main className="sub-main">
        <div className="sub-header">
          <span className="sub-kicker">Pricing</span>
          <h1 className="sub-title">Choose your protection level</h1>
          <p className="sub-subtitle">
            Scale your AI cyber defense. Upgrade anytime.
          </p>
        </div>

        <div className="sub-grid">
          {PLANS.map((plan) => {
            const isCurrent = currentTier === plan.id;
            const isPending = hasPendingRequest(plan.id);

            return (
              <div
                key={plan.id}
                className={`sub-card ${plan.id === "pro" ? "sub-card-highlight" : ""}`}
              >
                {plan.id === "pro" && <div className="sub-popular-badge">Most Popular</div>}
                <div className="sub-card-header">
                  <h3>{plan.name}</h3>
                  <div className="sub-price">
                    <span className="sub-price-amount">{plan.price}</span>
                    <span className="sub-price-period">{plan.period}</span>
                  </div>
                  <p className="sub-desc">{plan.description}</p>
                </div>

                <div className="sub-features">
                  <ul>
                    {plan.features.map((feat, i) => (
                      <li key={i}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        {feat}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="sub-action">
                  {isCurrent ? (
                    <button className="sub-btn sub-btn-current" disabled>
                      Current Plan
                    </button>
                  ) : isPending ? (
                    <button className="sub-btn sub-btn-pending" disabled>
                      Approval Pending...
                    </button>
                  ) : (
                    <button
                      className={`sub-btn ${plan.id === "pro" ? "sub-btn-primary" : "sub-btn-secondary"}`}
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={plan.id === "free"} // Can't downgrade to free via UI simply directly
                    >
                      {plan.id === "free" ? "Included" : "Upgrade"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {requests.length > 0 && (
          <div className="sub-history">
            <h3>Request History</h3>
            <div className="sub-history-list">
              {requests.map((r) => (
                <div key={r.id} className="sub-history-item">
                  <span className="sh-tier">Requested: {r.requested_tier.toUpperCase()}</span>
                  <span className={`sh-status sh-status-${r.status}`}>
                    {r.status.toUpperCase()}
                  </span>
                  <span className="sh-date">
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Dummy Checkout Modal */}
      {checkoutPlan && (
        <div className="sub-modal-backdrop">
          <div className="sub-modal">
            <h2>Confirm Upgrade</h2>
            <p>
              You are requesting to upgrade to the{" "}
              <strong>{PLANS.find((p) => p.id === checkoutPlan)?.name}</strong> plan.
            </p>
            <div className="sub-dummy-payment">
              <div className="sub-dummy-row">
                <span>Card ending in 4242</span>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                  <line x1="1" y1="10" x2="23" y2="10"></line>
                </svg>
              </div>
            </div>
            {error && <div className="sub-error">{error}</div>}
            <div className="sub-modal-actions">
              <button 
                className="sub-btn sub-btn-secondary" 
                onClick={() => setCheckoutPlan(null)}
                disabled={processing}
              >
                Cancel
              </button>
              <button 
                className="sub-btn sub-btn-primary" 
                onClick={confirmPayment}
                disabled={processing}
              >
                {processing ? "Processing..." : "Pay Now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
