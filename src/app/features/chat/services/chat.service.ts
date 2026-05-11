import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { WebSocketService } from '../../../core/services/websocket.service';

export interface Conversation {
  conversation_id: string;
  status: 'with_customer_care' | 'with_engineer' | 'with_ai' | 'ended' | string;
  machine?: { id: number; name: string; type: string; image: string };
  machine_id?: string;
  customer_name: string;
  customer_profile_image?: string;
  customer_care_name: string | null;
  engineer_name: string | null;
  escalation_reason: string | null;
  created_at: string;
  ended_at: string | null;
  last_message?: ApiMessage | string;
  last_message_at?: string;
}

export interface ApiMessage {
  id: string;
  role: 'customer' | 'customer_care' | 'engineer' | 'ai' | string;
  content: string;
  attachment_url: string | null;
  attachment_type: string | null;
  timestamp: string;
  status?: 'sent' | 'delivered' | 'read';
  reply_to?: ApiMessage;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly ws = inject(WebSocketService);
  private readonly base = environment.apiUrl;

  readonly activeConversationId = signal<string | null>(null);
  readonly messages = signal<ApiMessage[]>([]);
  readonly lastMessages = signal<Record<string, ApiMessage>>(this.loadCachedLastMessages());
  readonly unreadCounts = signal<Record<string, number>>({});
  readonly isLoading = signal(false);

  // Exposed WS streams for components
  readonly newEscalation$ = this.ws.newEscalation$;
  readonly statusChanged$ = this.ws.statusChanged$;
  readonly agentJoined$ = this.ws.agentJoined$;
  readonly typingIndicator$ = this.ws.typingIndicator$;
  readonly conversationReopened$ = this.ws.conversationReopened$;

  private loadCachedLastMessages(): Record<string, ApiMessage> {
    try {
      const cached = localStorage.getItem('chat_last_messages');
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  }

  private cacheLastMessages(msgs: Record<string, ApiMessage>) {
    try {
      localStorage.setItem('chat_last_messages', JSON.stringify(msgs));
    } catch { }
  }

  constructor() {
    // New message received
    this.ws.messageReceived$.subscribe((payload) => {
      const msg: ApiMessage = {
        id: payload.id,
        role: payload.role,
        content: payload.content,
        attachment_url: payload.attachment_url || null,
        attachment_type: payload.attachment_type || null,
        timestamp: payload.timestamp,
      };

      this.lastMessages.update(prev => {
        const next = { ...prev, [payload.conversation_id]: msg };
        this.cacheLastMessages(next);
        return next;
      });

      if (payload.conversation_id === this.activeConversationId()) {
        this.messages.update(prev => [...prev, msg]);
      }
    });

    // Conversation ended by customer — append system message
    // this.ws.conversationEnded$.subscribe((payload) => {
    //   if (payload.conversation_id === this.activeConversationId()) {
    //     this.messages.update(prev => [
    //       ...prev,
    //       {
    //         id: 'end-' + Date.now(),
    //         role: 'system',
    //         content: 'تم إنهاء المحادثة من قبل العميل',
    //         attachment_url: null,
    //         attachment_type: null,
    //         timestamp: new Date().toISOString(),
    //       },
    //     ]);
    //   }
    // });

    // Agent joined — append system message
    // this.ws.agentJoined$.subscribe((payload) => {
    //   if (payload.conversation_id === this.activeConversationId()) {
    //     const roleName = payload.role === 'engineer' ? 'المهندس' : 'خدمة العملاء';
    //     this.messages.update(prev => [
    //       ...prev,
    //       {
    //         id: 'join-' + Date.now(),
    //         role: 'system',
    //         content: `تم انضمام ${roleName} ${payload.name} للمحادثة`,
    //         attachment_url: null,
    //         attachment_type: null,
    //         timestamp: new Date().toISOString(),
    //       },
    //     ]);
    //   }
    // });

    // Unread count updated
    this.ws.unreadCount$.subscribe((payload) => {
      this.unreadCounts.update(prev => ({ ...prev, [payload.conversation_id]: payload.count }));
    });
  }

  getConversations(): Observable<any> {
    return this.http.get<any>(`${this.base}/api/ai-assistant/conversations`).pipe(
      tap((res: any) => {
        const lastMsgs: Record<string, ApiMessage> = {};
        (res.data?.items || []).forEach((c: any) => {
          const lm = c.last_message || c.lastMessage || c.last_message_content;
          if (lm) {
            lastMsgs[c.conversation_id] = typeof lm === 'string'
              ? {
                id: '',
                role: '',
                content: lm,
                attachment_url: null,
                attachment_type: null,
                timestamp: c.last_message_at || c.created_at,
              } as ApiMessage
              : lm;
          }
        });
        if (Object.keys(lastMsgs).length > 0) {
          this.lastMessages.update(prev => {
            const next = { ...prev, ...lastMsgs };
            this.cacheLastMessages(next);
            return next;
          });
        }
      })
    );
  }

  loadMessages(conversationId: string): void {
    this.isLoading.set(true);
    this.activeConversationId.set(conversationId);

    this.http.get<any>(`${this.base}/api/ai-assistant/messages`, {
      params: { conversationId: conversationId }
    })
      .subscribe({
        next: (res) => {
          this.messages.set(res.data.messages);
          this.isLoading.set(false);
          this.ws.joinConversation(conversationId);
        },
        error: () => this.isLoading.set(false),
      });
  }

  sendMessage(conversationId: string, message: string, attachment?: File): Observable<any> {
    const form = new FormData();
    form.append('ConversationId', conversationId);
    form.append('Message', message.trim() || ' ');
    if (attachment) form.append('Attachment', attachment);
    return this.http.post<any>(`${this.base}/api/ai-assistant/customer-care/message`, form);
  }

  requestVisit(conversationId: string): Observable<any> {
    return this.http.post<any>(
      `${this.base}/api/ai-assistant/customer-care/request-engineer-visit`,
      { conversation_id: conversationId }
    ).pipe(
      tap((res) => {
        if (res.success && res.data && res.data.engineer_name) {
          const sysMsg: ApiMessage = {
            id: 'sys-' + Date.now(),
            role: 'system',
            content: `تم انضمام المهندس ${res.data.engineer_name} للمحادثة`,
            attachment_url: null,
            attachment_type: null,
            timestamp: new Date().toISOString(),
          };

          if (conversationId === this.activeConversationId()) {
            this.messages.update(prev => [...prev, sysMsg]);
          }

        }
      })
    );
  }

  markRead(conversationId: string): void {
    this.ws.markRead(conversationId);
    this.unreadCounts.update(prev => ({ ...prev, [conversationId]: 0 }));
  }

  sendTyping(conversationId: string, senderName: string): void {
    this.ws.typing(conversationId, senderName);
  }
}
