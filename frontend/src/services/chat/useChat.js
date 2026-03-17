import { useState, useEffect, useRef, useCallback } from "react";
import { chatService } from "./chatService.js";

function createMessage(message) {
  return { id: crypto.randomUUID(), ...message };
}

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
  const streamingMessageIdRef = useRef(null);

  const connect = useCallback(() => {
    activeRef.current = true;
    if (!chatService.isConnected) {
      chatService.connect();
    }
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
        // Capture value now — the ref may be cleared by "done" before the updater runs
        const snapshot = streamBufferRef.current;
        setMessages((prev) => {
          if (streamingMessageIdRef.current) {
            const index = prev.findIndex((message) => message.id === streamingMessageIdRef.current);
            if (index >= 0) {
              const next = [...prev];
              next[index] = { ...next[index], content: snapshot };
              return next;
            }
          }

          const assistantMessage = createMessage({
            role: "assistant",
            content: snapshot,
            streaming: true,
          });
          streamingMessageIdRef.current = assistantMessage.id;
          return [...prev, assistantMessage];
        });
      }),

      chatService.on("sources", (data) => {
        setMessages((prev) => {
          if (!streamingMessageIdRef.current) {
            return prev;
          }

          const index = prev.findIndex((message) => message.id === streamingMessageIdRef.current);
          if (index < 0) {
            return prev;
          }

          const next = [...prev];
          next[index] = {
            ...next[index],
            sources: data.sources,
            confidence: data.confidence,
          };
          return next;
        });
      }),

      chatService.on("transcript", (data) => {
        setMessages((prev) => [...prev, createMessage({ role: "user", content: data.content })]);
      }),

      chatService.on("done", () => {
        setStreaming(false);
        setMessages((prev) => {
          // Clear buffer inside updater so pending token updaters run first
          streamBufferRef.current = "";
          if (!streamingMessageIdRef.current) {
            return prev;
          }

          const index = prev.findIndex((message) => message.id === streamingMessageIdRef.current);
          streamingMessageIdRef.current = null;

          if (index < 0) {
            return prev;
          }

          const next = [...prev];
          next[index] = { ...next[index], streaming: false };
          return next;
        });
      }),

      chatService.on("error", (data) => {
        setStreaming(false);
        setMessages((prev) => {
          streamBufferRef.current = "";
          if (!streamingMessageIdRef.current) {
            return [
              ...prev,
              createMessage({ role: "assistant", content: `Error: ${data.content}`, error: true }),
            ];
          }

          const index = prev.findIndex((message) => message.id === streamingMessageIdRef.current);
          streamingMessageIdRef.current = null;

          if (index < 0) {
            return [
              ...prev,
              createMessage({ role: "assistant", content: `Error: ${data.content}`, error: true }),
            ];
          }

          const next = [...prev];
          next[index] = {
            ...next[index],
            content: `Error: ${data.content}`,
            error: true,
            streaming: false,
          };
          return next;
        });
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
    const assistantMessage = createMessage({
      role: "assistant",
      content: "",
      streaming: true,
    });
    streamingMessageIdRef.current = assistantMessage.id;
    setMessages((prev) => [
      ...prev,
      createMessage({ role: "user", content: text }),
      assistantMessage,
    ]);
    setStreaming(true);
    streamBufferRef.current = "";
    if (!chatService.isConnected) {
      chatService.connect();
    }
    chatService.sendMessage(text);
  }, []);

  const sendAudio = useCallback((blob) => {
    setStreaming(true);
    streamBufferRef.current = "";
    if (!chatService.isConnected) {
      chatService.connect();
    }
    chatService.sendAudio(blob);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    streamBufferRef.current = "";
    streamingMessageIdRef.current = null;
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
