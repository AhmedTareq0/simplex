import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { WebSocketService } from '../../../core/services/websocket.service';

export interface Conversation {
  conversation_id: string;
  status: 'with_customer_care' | 'with_engineer' | 'with_ai' | 'ended' | string;
  machine_id: string;
  customer_name: string;
  customer_care_name: string | null;
  engineer_name: string | null;
  escalation_reason: string | null;
  created_at: string;
  ended_at: string | null;
}

export interface ApiMessage {
  id: string;
  role: 'customer' | 'customer_care' | 'engineer' | 'ai' | string;
  content: string;
  attachment_url: string | null;
  attachment_type: string | null;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly ws = inject(WebSocketService);
  private readonly base = environment.apiUrl;

  readonly activeConversationId = signal<string | null>(null);
  readonly messages = signal<ApiMessage[]>([]);
  readonly lastMessages = signal<Record<string, ApiMessage>>({});
  readonly isLoading = signal(false);

  constructor() {
    this.ws.messageReceived$.subscribe((payload) => {
      const msg: ApiMessage = {
        id: payload.id,
        role: payload.role,
        content: payload.content,
        attachment_url: payload.attachment_url || null,
        attachment_type: payload.attachment_type || null,
        timestamp: payload.timestamp,
      };

      this.lastMessages.update(prev => ({ ...prev, [payload.conversation_id]: msg }));

      if (payload.conversation_id === this.activeConversationId()) {
        this.messages.update((prev) => [...prev, msg]);
      }
    });

     this.ws.conversationEnded$.subscribe((payload) => {
      if (payload.conversation_id === this.activeConversationId()) {
        this.messages.update((prev) => [
          ...prev,
          {
            id: 'end-' + Date.now(),
            role: 'system',
            content: 'تم إنهاء المحادثة من قبل الموظف',
            attachment_url: null,
            attachment_type: null,
            timestamp: new Date().toISOString(),
          },
        ]);
        // Optionally clear active conversation or set a read-only flag
      }
    });
  }

  getConversations(): Observable<any> {
    return this.http.get<any>(`${this.base}/api/ai-assistant/conversations`);
  }

  loadMessages(conversationId: string): void {
    this.isLoading.set(true);
    this.activeConversationId.set(conversationId);
    
    this.http.get<any>(`${this.base}/api/ai-assistant/messages/${conversationId}`)
      .subscribe({
        next: (res) => {
          this.messages.set(res.data.messages);
          this.isLoading.set(false);
          this.ws.joinConversation(conversationId);
        },
        error: () => this.isLoading.set(false)
      });
  }

  sendMessage(conversationId: string, message: string, attachment?: File): Observable<any> {
    const form = new FormData();
    form.append('ConversationId', conversationId);
    form.append('Message', message);
    if (attachment) form.append('Attachment', attachment);
    
    return this.http.post<any>(`${this.base}/api/ai-assistant/customer-care/message`, form);
  }
}
