import { useEffect, useRef, useCallback } from "react";
import { ChatMessage } from "./ChatMessage.jsx";
import { ChatInput } from "./ChatInput.jsx";
import "./ChatPanel.css";

export function ChatPanel({ isOpen, onClose, onExpand, chat }) {
  const messagesEndRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (isOpen) {
      chat.connect();
    }
  }, [isOpen, chat]);

  useEffect(() => {
    scrollToBottom();
  }, [chat.messages, scrollToBottom]);

  if (!isOpen) return null;

  return (
    <div className="chat-panel">
      <div className="chat-panel-header">
        <div className="chat-panel-title">
          <div className={`chat-status-dot ${chat.connected ? "chat-status-online" : ""}`} />
          <span>NorthStar AI</span>
        </div>
        <div className="chat-header-actions">
          <button className="chat-expand-btn" onClick={onExpand} aria-label="Expand to full page">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <polyline points="15 3 21 3 21 9" />
              <polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
          </button>
          <button className="chat-close-btn" onClick={onClose} aria-label="Close chat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      <div className="chat-panel-messages">
        {chat.messages.length === 0 && (
          <div className="chat-empty">
            <div className="chat-empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <p>Ask me anything about your uploaded documents, or just say hello!</p>
          </div>
        )}
        {chat.messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} />
        ))}
        {chat.streaming && (
          <div className="chat-typing">
            <span /><span /><span />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput onSend={chat.sendMessage} onSendAudio={chat.sendAudio} disabled={chat.streaming} />
    </div>
  );
}
