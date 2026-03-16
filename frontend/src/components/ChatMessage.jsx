import { useState } from "react";

export function ChatMessage({ message }) {
  const [sourcesExpanded, setSourcesExpanded] = useState(false);
  const isUser = message.role === "user";

  return (
    <div className={`chat-msg ${isUser ? "chat-msg-user" : "chat-msg-ai"}`}>
      {!isUser && (
        <div className="chat-msg-avatar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
      )}
      <div className="chat-msg-bubble">
        <div
          className="chat-msg-text"
          dangerouslySetInnerHTML={{ __html: formatMarkdown(message.content) }}
        />

        {message.confidence != null && message.confidence > 0 && (
          <span className={`chat-confidence ${getConfidenceClass(message.confidence)}`}>
            {Math.round(message.confidence * 100)}% confidence
          </span>
        )}

        {message.sources && message.sources.length > 0 && (
          <div className="chat-sources">
            <button
              className="chat-sources-toggle"
              onClick={() => setSourcesExpanded(!sourcesExpanded)}
            >
              {sourcesExpanded ? "Hide" : "Show"} sources ({message.sources.length})
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                width="14"
                height="14"
                style={{ transform: sourcesExpanded ? "rotate(180deg)" : "none", transition: "transform 200ms" }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {sourcesExpanded && (
              <div className="chat-sources-list">
                {message.sources.map((src, i) => (
                  <div key={i} className="chat-source-item">
                    <span className="chat-source-badge">Source {i + 1}</span>
                    <span className="chat-source-file">{src.file_name}</span>
                    <span className="chat-source-page">p.{src.page_number}</span>
                    <p className="chat-source-preview">{src.text_preview}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function getConfidenceClass(score) {
  if (score >= 0.7) return "chat-confidence-high";
  if (score >= 0.4) return "chat-confidence-med";
  return "chat-confidence-low";
}

function formatMarkdown(text) {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/\[Source (\d+)\]/g, '<span class="chat-source-ref">[Source $1]</span>')
    .replace(/\n/g, "<br />");
}
