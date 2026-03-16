import { useEffect, useRef, useCallback } from "react";
import { ChatMessage } from "../../components/ChatMessage.jsx";
import { ChatInput } from "../../components/ChatInput.jsx";
import "./ChatPage.css";

export function ChatPage({ chat, onBack }) {
  const messagesEndRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    chat.connect();
  }, [chat]);

  useEffect(() => {
    scrollToBottom();
  }, [chat.messages, scrollToBottom]);

  return (
    <div className="cp-root">
      {/* Top bar */}
      <header className="cp-topbar">
        <button className="cp-back-btn" onClick={onBack} aria-label="Back to home">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="cp-topbar-brand">
          <span className="cp-brand-star">&#10022;</span>
          <span>NorthStar AI</span>
        </div>
        <div className="cp-topbar-right">
          <div className="cp-connection">
            <div className={`chat-status-dot ${chat.connected ? "chat-status-online" : ""}`} />
            <span>{chat.connected ? "Connected" : "Connecting..."}</span>
          </div>
          <button className="cp-clear-btn" onClick={chat.clearMessages}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-2 14H7L5 6" />
            </svg>
            Clear
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="cp-messages">
        {chat.messages.length === 0 && (
          <div className="cp-empty">
            <div className="cp-empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" width="64" height="64">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <h2 className="cp-empty-title">NorthStar AI</h2>
            <p className="cp-empty-desc">
              Ask questions about your ingested documents. I'll find answers from your knowledge base with source citations.
            </p>
            <div className="cp-suggestions">
              {[
                "What financial schemes are available for farmers?",
                "Summarize the key points from uploaded documents",
                "Explain rural banking guidelines",
              ].map((q) => (
                <button
                  key={q}
                  className="cp-suggestion"
                  onClick={() => chat.sendMessage(q)}
                  disabled={chat.streaming}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {chat.messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} />
        ))}

        {chat.streaming && chat.messages.length > 0 && !(chat.messages[chat.messages.length - 1]?.streaming) && (
          <div className="chat-typing">
            <span /><span /><span />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="cp-input-wrapper">
        <ChatInput onSend={chat.sendMessage} onSendAudio={chat.sendAudio} disabled={chat.streaming} />
      </div>
    </div>
  );
}
