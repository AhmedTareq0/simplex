import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '@/../environments/environment';
import {
  AiConversation,
  AiChatMessage,
  StartConversationResponse,
  SendAiChatResponse,
  AiMessagesResponse,
} from '@/core/interfaces/ai-assistant.interface';
import { AuthLocalService } from '@/auth/services/auth-local.service';

const SESSION_TTL_MS = 4 * 60 * 60 * 1000; // 4 Hours

@Injectable({ providedIn: 'root' })
export class AiAssistantService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthLocalService);
  private readonly base = environment.apiUrl;

  // Widget visibility state
  readonly isSidebarOpen = signal<boolean>(false);
  readonly isChatOpen = signal<boolean>(false);
  readonly isChatMinimized = signal<boolean>(false);
  readonly isNewSessionModalOpen = signal<boolean>(false);

  // Active state
  readonly activeConversation = signal<AiConversation | null>(null);
  readonly messages = signal<AiChatMessage[]>([]);
  readonly isLoadingMessages = signal<boolean>(false);
  readonly isAiThinking = signal<boolean>(false);

  // Conversations list stored and loaded per employee
  readonly conversations = signal<AiConversation[]>(this.loadCachedConversations());

  // Active conversation is expired computed
  readonly isCurrentConversationExpired = computed(() => {
    const conv = this.activeConversation();
    if (!conv) return false;
    return this.checkIsExpired(conv.expires_at);
  });

  // Time left formatted computed
  readonly timeLeftFormatted = computed(() => {
    const conv = this.activeConversation();
    if (!conv) return '';
    return this.formatTimeLeft(conv.expires_at);
  });

  private get storageKey(): string {
    const user = this.auth.currentUser();
    const userId = user?.id || 'guest';
    return `simplex_ai_conversations_${userId}`;
  }

  private loadCachedConversations(): AiConversation[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveConversations(convs: AiConversation[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(convs));
    } catch { }
  }

  checkIsExpired(expiresAt: string): boolean {
    const expireTime = new Date(expiresAt).getTime();
    return Date.now() >= expireTime;
  }

  formatTimeLeft(expiresAt: string): string {
    const diffMs = new Date(expiresAt).getTime() - Date.now();
    if (diffMs <= 0) return 'منتهية';
    const totalMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) {
      return `متبقي ${hours} س و ${minutes} د`;
    }
    return `متبقي ${minutes} دقيقة`;
  }

  toggleSidebar(): void {
    this.isSidebarOpen.update((v) => !v);
  }

  openSidebar(): void {
    this.isSidebarOpen.set(true);
  }

  closeSidebar(): void {
    this.isSidebarOpen.set(false);
  }

  openNewSessionModal(): void {
    this.isNewSessionModalOpen.set(true);
  }

  closeNewSessionModal(): void {
    this.isNewSessionModalOpen.set(false);
  }

  minimizeChat(): void {
    this.isChatMinimized.update((v) => !v);
  }

  closeChat(): void {
    this.isChatOpen.set(false);
    this.activeConversation.set(null);
    this.messages.set([]);
  }

  selectConversation(conv: AiConversation): void {
    this.activeConversation.set(conv);
    this.isChatOpen.set(true);
    this.isChatMinimized.set(false);
    this.loadMessages(conv.id);
  }

  renameConversation(conversationId: string, newTitle: string): void {
    const trimmed = newTitle.trim();
    if (!trimmed) return;

    this.conversations.update((list) => {
      const updated = list.map((c) => (c.id === conversationId ? { ...c, title: trimmed } : c));
      this.saveConversations(updated);
      return updated;
    });

    if (this.activeConversation()?.id === conversationId) {
      this.activeConversation.update((c) => (c ? { ...c, title: trimmed } : null));
    }
  }

  deleteConversation(conversationId: string): void {
    this.conversations.update((list) => {
      const updated = list.filter((c) => c.id !== conversationId);
      this.saveConversations(updated);
      return updated;
    });

    if (this.activeConversation()?.id === conversationId) {
      this.closeChat();
    }
  }

  /**
   * 1. Start a new AI conversation
   * POST /api/ai-assistant/conversation
   * Body: { "machine_id": 0 }
   */
  startConversation(machine: { id: number; name: string; type?: string; image?: string | null }): Observable<any> {
    const payload = { machine_id: machine.id };
    return this.http.post<any>(`${this.base}/api/ai-assistant/conversation`, payload).pipe(
      tap((res) => {
        const data: StartConversationResponse = res?.data || res;
        const convId = data.conversation_id || (data as any).id;
        const now = new Date();
        const expiresAt = new Date(now.getTime() + SESSION_TTL_MS).toISOString();

        const newConv: AiConversation = {
          id: convId,
          machine_id: machine.id,
          machine_name: machine.name,
          machine_type: machine.type || '',
          machine_image: machine.image || null,
          title: `استفسار ماكينة ${machine.name}`,
          created_at: now.toISOString(),
          expires_at: expiresAt,
          last_message: 'بدأت الجلسة الآن',
          last_message_at: now.toISOString(),
        };

        this.conversations.update((list) => {
          const updated = [newConv, ...list];
          this.saveConversations(updated);
          return updated;
        });

        this.selectConversation(newConv);
        this.closeNewSessionModal();
      })
    );
  }

  /**
   * 2. Send Message to AI
   * POST /api/ai-assistant/chat
   * Request body multipart/form-data:
   * ConversationId, Message, Attachment
   */
  sendMessage(messageText: string, attachment?: File): void {
    const conv = this.activeConversation();
    if (!conv) return;

    if (this.checkIsExpired(conv.expires_at)) {
      return;
    }

    const trimmed = messageText.trim();
    if (!trimmed && !attachment) return;

    // Create optimistic user message
    const tempUserMsgId = 'msg-' + Date.now();
    let attachmentUrlPreview: string | null = null;
    if (attachment && attachment.type.startsWith('image/')) {
      attachmentUrlPreview = URL.createObjectURL(attachment);
    }

    const userMessage: AiChatMessage = {
      id: tempUserMsgId,
      role: 'user',
      content: trimmed,
      attachment_url: attachmentUrlPreview,
      attachment_type: attachment?.type || null,
      timestamp: new Date().toISOString(),
    };

    this.messages.update((prev) => [...prev, userMessage]);
    this.isAiThinking.set(true);

    // Update conversation last message in list
    this.updateLastMessage(conv.id, trimmed || (attachment ? 'مرفق' : ''));

    const formData = new FormData();
    formData.append('ConversationId', conv.id);
    formData.append('Message', trimmed || ' ');
    if (attachment) {
      formData.append('Attachment', attachment);
    }

    this.http.post<any>(`${this.base}/api/ai-assistant/chat`, formData).subscribe({
      next: (res) => {
        this.isAiThinking.set(false);
        const data: SendAiChatResponse = res?.data || res;
        const replyText = data.reply || (data as any).content || (data as any).message;

        const aiMessage: AiChatMessage = {
          id: 'ai-' + Date.now(),
          role: 'ai',
          content: replyText,
          attachment_url: data.attachment_url || null,
          timestamp: data.timestamp || new Date().toISOString(),
        };

        this.messages.update((prev) => [...prev, aiMessage]);
        this.updateLastMessage(conv.id, replyText);
      },
      error: (err) => {
        this.isAiThinking.set(false);
        const errorMsg: AiChatMessage = {
          id: 'err-' + Date.now(),
          role: 'system',
          content: 'عذراً، حدث خطأ أثناء معالجة الرد من المساعد الذكي. يرجى المحاولة مرة أخرى.',
          timestamp: new Date().toISOString(),
        };
        this.messages.update((prev) => [...prev, errorMsg]);
      },
    });
  }

  /**
   * 3. End Conversation
   * POST /api/ai-assistant/conversation/end
   * Schema { "conversation_id": "string" }
   */
  endConversation(conversationId: string): Observable<any> {
    return this.http
      .post<any>(`${this.base}/api/ai-assistant/conversation/end`, {
        conversation_id: conversationId,
      })
      .pipe(
        tap(() => {
          this.conversations.update((list) => {
            const updated = list.map((c) =>
              c.id === conversationId ? { ...c, expires_at: new Date().toISOString() } : c
            );
            this.saveConversations(updated);
            return updated;
          });
          if (this.activeConversation()?.id === conversationId) {
            this.activeConversation.update((c) =>
              c ? { ...c, expires_at: new Date().toISOString() } : null
            );
          }
        })
      );
  }

  /**
   * 4. Full message history
   * GET /api/ai-assistant/messages?conversationId=string
   */
  loadMessages(conversationId: string): void {
    this.isLoadingMessages.set(true);

    this.http
      .get<any>(`${this.base}/api/ai-assistant/messages`, {
        params: { conversationId: conversationId },
      })
      .subscribe({
        next: (res) => {
          this.isLoadingMessages.set(false);
          const rawMessages: any[] = res?.data?.messages || res?.messages || [];
          const mapped: AiChatMessage[] = rawMessages.map((m) => ({
            id: m.id || 'msg-' + Math.random(),
            role: m.role === 'customer_care' || m.role === 'user' ? 'user' : (m.role === 'ai' ? 'ai' : 'system'),
            content: m.content || m.text || '',
            attachment_url: m.attachment_url || null,
            attachment_type: m.attachment_type || null,
            timestamp: m.timestamp || m.created_at || new Date().toISOString(),
          }));
          this.messages.set(mapped);
        },
        error: () => {
          this.isLoadingMessages.set(false);
        },
      });
  }

  private updateLastMessage(convId: string, lastMsg: string): void {
    const nowIso = new Date().toISOString();
    this.conversations.update((list) => {
      const updated = list.map((c) =>
        c.id === convId ? { ...c, last_message: lastMsg, last_message_at: nowIso } : c
      );
      this.saveConversations(updated);
      return updated;
    });
  }
}
