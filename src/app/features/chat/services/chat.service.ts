import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

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

export interface ConversationsResponse {
  success: boolean;
  message: string | null;
  data: Conversation[];
}

export interface ApiMessage {
  id: string;
  role: string;
  content: string;
  attachment_url: string | null;
  attachment_type: string | null;
  timestamp: string;
}

export interface MessagesResponse {
  success: boolean;
  message: string | null;
  data: {
    conversation_id: string;
    status: string;
    messages: ApiMessage[];
  };
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  getConversations(): Observable<ConversationsResponse> {
    return this.http.get<ConversationsResponse>(`${this.base}/api/ai-assistant/conversations`);
  }

  getMessages(conversationId: string): Observable<MessagesResponse> {
    return this.http.get<MessagesResponse>(`${this.base}/api/ai-assistant/messages/${conversationId}`);
  }

  sendMessage(conversationId: string, message: string, attachment?: File): Observable<any> {
    const form = new FormData();
    form.append('ConversationId', conversationId);
    form.append('Message', message);
    if (attachment) {
      form.append('Attachment', attachment);
    }
    return this.http.post<any>(`${this.base}/api/ai-assistant/customer-care/message`, form);
  }
}
