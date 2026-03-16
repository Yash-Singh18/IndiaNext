import { useState } from "react";
import { applyExpert } from "../../services/community/communityService.js";
import "./ApplyExpertPage.css";

const QUESTIONS = [
  {
    id: 1,
    text: "Which attack tricks users into revealing credentials?",
    options: ["A. MITM", "B. DDoS", "C. Phishing", "D. SQL Injection"],
    correct: "C",
  },
  {
    id: 2,
    text: "Which URL is suspicious?",
    options: ["A. paypal.com", "B. paypaI-login.com", "C. amazon.com", "D. github.com"],
    correct: "B",
  },
  {
    id: 3,
    text: "If someone asks for your OTP on the phone, what should you do?",
    options: ["A. Share OTP", "B. Ignore", "C. Report", "D. Reset password"],
    correct: "C",
  },
];

export function ApplyExpertPage({ session, profile, onBack }) {
  const [answers, setAnswers] = useState({ 1: null, 2: null, 3: null });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [score, setScore] = useState(0);

  function select(qId, letter) {
    if (submitted) return;
    setAnswers((a) => ({ ...a, [qId]: letter }));
  }

  async function handleSubmit() {
    if (Object.values(answers).some((a) => a === null)) {
      setError("Please answer all questions.");
      return;
    }
    setError("");
    const correct = QUESTIONS.filter((q) => answers[q.id] === q.correct).length;
    setScore(correct);

    setLoading(true);
    try {
      await applyExpert(profile.id, profile.username, correct);
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Failed to submit application.");
    } finally {
      setLoading(false);
    }
  }

  if (!session || !profile) {
    return (
      <div className="ae-root">
        <div className="ae-center">
          <p>Please log in to apply.</p>
          <button className="ae-btn-secondary" onClick={onBack}>Go Back</button>
        </div>
      </div>
    );
  }

  if (profile.user_type === "expert") {
    return (
      <div className="ae-root">
        <div className="ae-center">
          <div className="ae-already-expert">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#065f46" strokeWidth="2">
              <path d="M12 2l8 3v6c0 5-3.4 9.7-8 11-4.6-1.3-8-6-8-11V5z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
            <h2>You are already a Verified Cyber Expert</h2>
            <button className="ae-btn-secondary" onClick={onBack}>Back to Home</button>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="ae-root">
        <div className="ae-center">
          <div className="ae-result">
            <div className="ae-result-icon">
              {score >= 2 ? (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#065f46" strokeWidth="2">
                  <path d="M12 2l8 3v6c0 5-3.4 9.7-8 11-4.6-1.3-8-6-8-11V5z" />
                  <polyline points="9 12 11 14 15 10" />
                </svg>
              ) : (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              )}
            </div>
            <h2>Application Submitted</h2>
            <p className="ae-result-score">
              Your score: <strong>{score} / {QUESTIONS.length}</strong>
            </p>
            <p className="ae-result-msg">
              {score >= 2
                ? "Great score! Your application is under review. An admin will approve shortly."
                : "Your application is under review. You can re-apply to improve your score later."}
            </p>
            <button className="ae-btn-secondary" onClick={onBack}>Back to Home</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ae-root">
      <div className="ae-container">
        <button className="ae-back-link" onClick={onBack}>← Back</button>

        <div className="ae-header">
          <h1>Cybersecurity Knowledge Test</h1>
          <p>Answer all questions to apply for Expert status. Reviewed by admin.</p>
        </div>

        <div className="ae-questions">
          {QUESTIONS.map((q) => (
            <div key={q.id} className="ae-question-card">
              <p className="ae-q-text">
                <span className="ae-q-num">Q{q.id}</span> {q.text}
              </p>
              <div className="ae-options">
                {q.options.map((opt) => {
                  const letter = opt[0];
                  return (
                    <button
                      key={letter}
                      className={`ae-option${answers[q.id] === letter ? " ae-option-selected" : ""}`}
                      onClick={() => select(q.id, letter)}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {error && <div className="ae-error">{error}</div>}

        <button
          className="ae-btn-primary"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Submitting…" : "Submit Application"}
        </button>
      </div>
    </div>
  );
}
