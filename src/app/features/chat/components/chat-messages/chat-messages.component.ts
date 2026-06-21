import {
  Component, input, signal, computed, ViewChild, ElementRef,
  AfterViewChecked, OnChanges, SimpleChanges, inject
} from '@angular/core';
import { ChatMessageComponent } from '../chat-message/chat-message.component';
import { ChatFooterComponent, SendPayload } from '../chat-footer/chat-footer.component';
import { ChatService } from '../../services/chat.service';
import { AuthLocalService } from '@/auth/services/auth-local.service';

export interface MessageGroup {
  type: 'date' | 'message' | 'system';
  label?: string;
  message?: any;
  isOwn?: boolean;
  senderName?: string;
  senderPicture?: string;
  showSenderInfo?: boolean;
  isGrouped?: boolean;
}

const SENDER_NAMES: Record<string, string> = {
  ai: 'AI Assistant',
  customer_care: 'خدمة العملاء',
  engineer: 'المهندس',
};

@Component({
  selector: 'app-chat-messages',
  standalone: true,
  imports: [ChatMessageComponent, ChatFooterComponent],
  templateUrl: './chat-messages.component.html',
  styleUrl: './chat-messages.component.scss',
})
export class ChatMessagesComponent implements AfterViewChecked, OnChanges {
  readonly messages = input<any[]>([]);
  readonly currentUserId = input('');
  readonly conversationId = input('');
  readonly userName = input('');
  readonly users = input<any[]>([]);

  private readonly chatService = inject(ChatService);
  private readonly auth = inject(AuthLocalService);

  /** Superadmin can view chats but cannot send messages */
  readonly canSend = computed(() => !this.auth.isSuperAdmin());

  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;

  groupedItems: MessageGroup[] = [];
  private needsScroll = false;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['messages']) {
      this.groupedItems = this.buildGroups(this.messages());
      this.needsScroll = true;
    }
  }

  ngAfterViewChecked() {
    if (this.needsScroll) {
      this.needsScroll = false;
      this.scrollContainer?.nativeElement.scrollTo({
        top: this.scrollContainer.nativeElement.scrollHeight,
      });
    }
  }

  private buildGroups(messages: any[]): MessageGroup[] {
    const items: MessageGroup[] = [];
    let lastDate = '';
    let lastSenderId = '';

    for (const msg of messages) {
      if (msg.type === 'system') {
        items.push({ type: 'system', label: msg.text });
        lastSenderId = '';
        continue;
      }

      const msgDate = this.getDateLabel(msg.createdAt);
      if (msgDate !== lastDate) {
        items.push({ type: 'date', label: msgDate });
        lastDate = msgDate;
        lastSenderId = '';
      }

      const isOwn = msg.senderId === this.currentUserId();
      const isGrouped = msg.senderId === lastSenderId;
      const sender = this.users().find(u => u.sub === msg.senderId);

      items.push({
        type: 'message',
        message: msg,
        isOwn,
        isGrouped,
        showSenderInfo: !isOwn && !isGrouped,
        senderName: sender?.name || SENDER_NAMES[msg.role?.toLowerCase()] || '',
        senderPicture: sender?.picture || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
      });

      lastSenderId = msg.senderId;
    }

    return items;
  }

  private getDateLabel(date: string | Date): string {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const toDay = (dt: Date) => new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).getTime();

    if (toDay(d) === toDay(now)) return 'اليوم';
    if (toDay(d) === toDay(now) - 86_400_000) return 'أمس';
    return d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  onSend({ text, file }: SendPayload) {
    if (!this.conversationId()) return;
    // Single request with both text and optional file
    this.chatService.sendMessage(this.conversationId(), text, file).subscribe({
      error: (err) => console.error('[ChatMessages] Send failed:', err),
    });
  }

  onTyping() {
    if (this.conversationId()) {
      this.chatService.sendTyping(this.conversationId(), this.userName());
    }
  }
}
