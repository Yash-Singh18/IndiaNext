const WS_URL = import.meta.env.VITE_AI_SERVICE_WS_URL || "ws://localhost:8000/ws/chat";

class ChatService {
  constructor() {
    this.ws = null;
    this.sessionId = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect(sessionId) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    this.sessionId = sessionId || crypto.randomUUID();
    this.ws = new WebSocket(`${WS_URL}/${this.sessionId}`);
    this.ws.binaryType = "arraybuffer";

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this._emit("connected", { sessionId: this.sessionId });
    };

    this.ws.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        // Audio response
        this._emit("audio", event.data);
        return;
      }

      try {
        const data = JSON.parse(event.data);
        this._emit(data.type, data);
      } catch {
        this._emit("token", { type: "token", content: event.data });
      }
    };

    this.ws.onclose = () => {
      this._emit("disconnected", {});
      this._tryReconnect();
    };

    this.ws.onerror = () => {
      this._emit("error", { content: "Connection error" });
    };

    return this.sessionId;
  }

  disconnect() {
    this.reconnectAttempts = this.maxReconnectAttempts; // prevent reconnect
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  sendMessage(content) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: "text", content }));
  }

  sendAudio(audioBlob) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    audioBlob.arrayBuffer().then((buffer) => {
      this.ws.send(buffer);
    });
  }

  cancel() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: "cancel" }));
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    return () => {
      const cbs = this.listeners.get(event) || [];
      this.listeners.set(event, cbs.filter((cb) => cb !== callback));
    };
  }

  _emit(event, data) {
    const cbs = this.listeners.get(event) || [];
    cbs.forEach((cb) => cb(data));
  }

  _tryReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
    setTimeout(() => this.connect(this.sessionId), delay);
  }

  get isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

export const chatService = new ChatService();
