import { useState, useEffect, useRef, useCallback } from "react";
import { chatService } from "./chatService.js";

/**
 * Shared chat hook — call once in App, pass state down to both
 * the popup ChatPanel and the full-page ChatPage.
 */
export function useChat() {
  const [messages, setMessages] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [connected, setConnected] = useState(false);
  const streamBufferRef = useRef("");
  const activeRef = useRef(false); // tracks whether any chat UI is open

  const connect = useCallback(() => {
    if (activeRef.current) return; // already wired
    activeRef.current = true;
    chatService.connect();
  }, []);

  const disconnect = useCallback(() => {
    activeRef.current = false;
    chatService.disconnect();
  }, []);

  // Wire up listeners once on mount, tear down on unmount
  useEffect(() => {
    const unsubs = [
      chatService.on("connected", () => setConnected(true)),
      chatService.on("disconnected", () => setConnected(false)),

      chatService.on("token", (data) => {
        streamBufferRef.current += data.content;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.role === "assistant" && last.streaming) {
            return [
              ...prev.slice(0, -1),
              { ...last, content: streamBufferRef.current },
            ];
          }
          return [
            ...prev,
            { role: "assistant", content: streamBufferRef.current, streaming: true },
          ];
        });
      }),

      chatService.on("sources", (data) => {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.role === "assistant") {
            return [
              ...prev.slice(0, -1),
              { ...last, sources: data.sources, confidence: data.confidence },
            ];
          }
          return prev;
        });
      }),

      chatService.on("transcript", (data) => {
        setMessages((prev) => [...prev, { role: "user", content: data.content }]);
      }),

      chatService.on("done", () => {
        setStreaming(false);
        streamBufferRef.current = "";
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.streaming) {
            return [...prev.slice(0, -1), { ...last, streaming: false }];
          }
          return prev;
        });
      }),

      chatService.on("error", (data) => {
        setStreaming(false);
        streamBufferRef.current = "";
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Error: ${data.content}`, error: true },
        ]);
      }),

      chatService.on("audio", (arrayBuffer) => {
        const blob = new Blob([arrayBuffer], { type: "audio/mpeg" });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.play();
      }),
    ];

    return () => unsubs.forEach((u) => u());
  }, []);

  const sendMessage = useCallback((text) => {
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setStreaming(true);
    streamBufferRef.current = "";
    chatService.sendMessage(text);
  }, []);

  const sendAudio = useCallback((blob) => {
    setStreaming(true);
    streamBufferRef.current = "";
    chatService.sendAudio(blob);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    streamBufferRef.current = "";
  }, []);

  return {
    messages,
    streaming,
    connected,
    connect,
    disconnect,
    sendMessage,
    sendAudio,
    clearMessages,
  };
}
