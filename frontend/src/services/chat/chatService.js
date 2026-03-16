const WS_URL = import.meta.env.VITE_AI_SERVICE_WS_URL || "ws://localhost:8000/ws/chat";

class ChatService {
  constructor() {
    this.ws = null;
    this.sessionId = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.pendingMessages = [];
    this.shouldReconnect = true;
  }

  connect(sessionId) {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.shouldReconnect = true;
    this.sessionId = sessionId || crypto.randomUUID();
    this.ws = new WebSocket(`${WS_URL}/${this.sessionId}`);
    this.ws.binaryType = "arraybuffer";

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this._emit("connected", { sessionId: this.sessionId });
      this._flushPendingMessages();
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
      this.ws = null;
      if (this.shouldReconnect) {
        this._tryReconnect();
      }
    };

    this.ws.onerror = () => {
      this._emit("error", { content: "Connection error" });
    };

    return this.sessionId;
  }

  disconnect() {
    this.shouldReconnect = false;
    this.reconnectAttempts = this.maxReconnectAttempts; // prevent reconnect
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  sendMessage(content) {
    this._sendOrQueue(JSON.stringify({ type: "text", content }));
  }

  sendAudio(audioBlob) {
    audioBlob.arrayBuffer().then((buffer) => {
      this._sendOrQueue(buffer);
    });
  }

  cancel() {
    this._sendOrQueue(JSON.stringify({ type: "cancel" }));
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

  _sendOrQueue(payload) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(payload);
      return;
    }

    this.pendingMessages.push(payload);
    if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
      this.connect(this.sessionId);
    }
  }

  _flushPendingMessages() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || this.pendingMessages.length === 0) {
      return;
    }

    for (const payload of this.pendingMessages) {
      this.ws.send(payload);
    }
    this.pendingMessages = [];
  }

  get isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

export const chatService = new ChatService();
