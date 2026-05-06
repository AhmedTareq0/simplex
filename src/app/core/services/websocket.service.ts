import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  NewEscalationPayload,
  MessageReceivedPayload,
  StatusChangedPayload,
  AgentJoinedPayload,
  TypingIndicatorPayload,
  UnreadCountPayload,
  EngineerAssignedPayload,
  ConversationEndedPayload,
} from '../interfaces/websocket-event.interface';



interface ServerMessage {
  event: string;
  data: any;
}

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private socket?: WebSocket;
  private pingInterval?: ReturnType<typeof setInterval>;
  private readonly PING_MS = 30_000;

  // Reconnect state
  private lastToken?: string;
  private intentionalClose = false;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT = 5;
  private reconnectTimeout?: ReturnType<typeof setTimeout>;

 
  private _newEscalation$ = new Subject<NewEscalationPayload>();
  private _messageReceived$ = new Subject<MessageReceivedPayload>();
  private _statusChanged$ = new Subject<StatusChangedPayload>();
  private _agentJoined$ = new Subject<AgentJoinedPayload>();
  private _typingIndicator$ = new Subject<TypingIndicatorPayload>();
  private _unreadCount$ = new Subject<UnreadCountPayload>();
  private _engineerAssigned$ = new Subject<EngineerAssignedPayload>();
  private _conversationEnded$ = new Subject<ConversationEndedPayload>();
  private _escalationRemoved$ = new Subject<{ conversation_id: string }>();
  private _pong$ = new Subject<void>();
  private _connected$ = new Subject<void>();
  private _disconnected$ = new Subject<CloseEvent>();
  private _error$ = new Subject<Event>();

  readonly connected$ = this._connected$.asObservable();


  readonly disconnected$ = this._disconnected$.asObservable();

  readonly error$ = this._error$.asObservable();

  readonly newEscalation$ = this._newEscalation$.asObservable();
  readonly messageReceived$ = this._messageReceived$.asObservable();
  readonly statusChanged$ = this._statusChanged$.asObservable();
  readonly agentJoined$ = this._agentJoined$.asObservable();
  readonly typingIndicator$ = this._typingIndicator$.asObservable();
  readonly unreadCount$ = this._unreadCount$.asObservable();
  readonly engineerAssigned$ = this._engineerAssigned$.asObservable();
  readonly conversationEnded$ = this._conversationEnded$.asObservable();
  readonly escalationRemoved$ = this._escalationRemoved$.asObservable();
  readonly pong$ = this._pong$.asObservable();

  connect(token: string): void {
    if (this.socket) {
      return;
    }

    this.lastToken = token;
    this.intentionalClose = false;

    const url = `${environment.websocketUrl}?access_token=${token}`;
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      this.reconnectAttempts = 0;
      this._connected$.next();
      this._startPing();
      console.log('[WS] ✅ Connected');
    };

    this.socket.onmessage = (ev) => {
      try {
        const msg: ServerMessage = JSON.parse(ev.data);
        this._routeEvent(msg);
      } catch (e) {
        console.error('[WS] Failed to parse message:', ev.data, e);
      }
    };

    this.socket.onclose = (ev) => {
      this._stopPing();
      this._disconnected$.next(ev);
      this.socket = undefined;
      console.warn('[WS] ❌ Disconnected, code:', ev.code, 'clean:', ev.wasClean);

      // Auto-reconnect if not intentional
      if (!this.intentionalClose && this.lastToken && this.reconnectAttempts < this.MAX_RECONNECT) {
        this._scheduleReconnect();
      }
    };

    this.socket.onerror = (err) => {
      console.error('[WS] Error:', err);
      this._error$.next(err);
    };
  }

  disconnect(): void {
    this.intentionalClose = true;
    this._stopPing();
    this._stopReconnect();
    if (this.socket) {
      this.socket.close();
      this.socket = undefined;
    }
  }

   get isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

 
  joinConversation(conversationId: string): void {
    this._send({ type: 'join_conversation', conversation_id: conversationId });
  }

  leaveConversation(conversationId: string): void {
    this._send({ type: 'leave_conversation', conversation_id: conversationId });
  }

  typing(conversationId: string, senderName: string): void {
    this._send({
      type: 'typing',
      conversation_id: conversationId,
      sender_name: senderName,
      sender_role: 'customer_care',
    });
  }

  markRead(conversationId: string): void {
    this._send({ type: 'mark_read', conversation_id: conversationId });
  }

  ping(): void {
    this._send({ type: 'ping' });
  }

 
  private _send(payload: object): void {
    if (!this.isConnected) {
      console.warn('[WS] Cannot send, socket not connected:', payload);
      return;
    }
    this.socket!.send(JSON.stringify(payload));
  }

  private _startPing(): void {
    this._stopPing();
    this.pingInterval = setInterval(() => this.ping(), this.PING_MS);
  }

  private _stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = undefined;
    }
  }

  private _scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30_000);
    console.log(`[WS] 🔄 Reconnecting in ${delay / 1000}s (attempt ${this.reconnectAttempts}/${this.MAX_RECONNECT})`);
    this.reconnectTimeout = setTimeout(() => {
      if (this.lastToken) {
        this.connect(this.lastToken);
      }
    }, delay);
  }

  private _stopReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }
    this.reconnectAttempts = 0;
  }

  private _routeEvent(msg: ServerMessage): void {
    switch (msg.event) {
      case 'NewEscalation':
        this._newEscalation$.next(msg.data);
        break;
      case 'MessageReceived':
        this._messageReceived$.next(msg.data);
        break;
      case 'StatusChanged':
        this._statusChanged$.next(msg.data);
        break;
      case 'AgentJoined':
        this._agentJoined$.next(msg.data);
        break;
      case 'TypingIndicator':
        this._typingIndicator$.next(msg.data);
        break;
      case 'UnreadCount':
        this._unreadCount$.next(msg.data);
        break;
      case 'EngineerAssigned':
        this._engineerAssigned$.next(msg.data);
        break;
      case 'ConversationEnded':
        this._conversationEnded$.next(msg.data);
        break;
      case 'EscalationRemoved':
        this._escalationRemoved$.next(msg.data);
        break;
      case 'pong':
        this._pong$.next();
        break;
      default:
        console.warn('[WS] Unknown event:', msg.event, msg.data);
    }
  }
}
