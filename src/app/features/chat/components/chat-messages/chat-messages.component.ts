import {
  Component, Input, signal, ViewChild, ElementRef,
  AfterViewChecked, OnChanges, SimpleChanges, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatMessageComponent } from '../chat-message/chat-message.component';
import { ChatFooterComponent } from '../chat-footer/chat-footer.component';
import { ChatService } from '../../services/chat.service';

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

@Component({
  selector: 'app-chat-messages',
  standalone: true,
  imports: [CommonModule, ChatMessageComponent, ChatFooterComponent],
  templateUrl: './chat-messages.component.html',
  styleUrl: './chat-messages.component.scss',
})
export class ChatMessagesComponent implements AfterViewChecked, OnChanges {
  @Input() messages: any[] = [];
  @Input() currentUserId = '';
  @Input() conversationId = '';
  @Input() users: any[] = [];

  private readonly chatService = inject(ChatService);

  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;

  shouldScroll = signal(false);
  groupedItems: MessageGroup[] = [];

  // local copy so we can append without mutating the input
  private localMessages: any[] = [];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['messages']) {
      // reset local messages when conversation changes
      this.localMessages = [...(this.messages || [])];
      this.buildGroups();
      this.shouldScroll.set(true);
    }
  }

  ngAfterViewChecked() {
    if (this.shouldScroll()) {
      this.scrollToBottom();
      this.shouldScroll.set(false);
    }
  }

  buildGroups() {
    const items: MessageGroup[] = [];
    let lastDate = '';
    let lastSenderId = '';

    for (const msg of this.localMessages) {

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

      const isOwn = msg.senderId === this.currentUserId;
      const sender = this.users.find(u => u.sub === msg.senderId);
      const isGrouped = msg.senderId === lastSenderId;
      const showSenderInfo = !isOwn && !isGrouped;

      items.push({
        type: 'message',
        message: msg,
        isOwn,
        senderName: sender?.name || this.getSenderDisplayName(msg),
        senderPicture: sender?.picture || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
        showSenderInfo,
        isGrouped,
      });

      lastSenderId = msg.senderId;
    }

    this.groupedItems = items;
  }

  private getSenderDisplayName(msg: any): string {
    const role = msg.role?.toLowerCase() || '';
    if (role === 'ai') return 'AI Assistant';
    if (role === 'customer_care') return 'خدمة العملاء';
    if (role === 'engineer') return 'المهندس';
    return '';
  }

  getDateLabel(date: string | Date): string {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    if (msgDay.getTime() === today.getTime()) return 'اليوم';
    if (msgDay.getTime() === yesterday.getTime()) return 'أمس';
    return d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  scrollToBottom() {
    if (this.scrollContainer?.nativeElement) {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    }
  }

  onSendMessage(text: string) {
    const newMsg = {
      senderId: this.currentUserId,
      text,
      createdAt: new Date(),
      type: 'text',
      status: 'sent',
    };

    // Optimistic update — show immediately
    this.localMessages = [...this.localMessages, newMsg];
    this.buildGroups();
    this.shouldScroll.set(true);

    if (this.conversationId) {
      this.chatService.sendMessage(this.conversationId, text).subscribe({
        error: () => {
          // Rollback on failure
          this.localMessages = this.localMessages.filter(m => m !== newMsg);
          this.buildGroups();
        },
      });
    }
  }

  onSendFile(file: File) {
    const url = URL.createObjectURL(file);
    const newMsg = {
      senderId: this.currentUserId,
      text: url,
      createdAt: new Date(),
      type: 'file',
      status: 'sent',
    };

    // Optimistic update — show local preview immediately
    this.localMessages = [...this.localMessages, newMsg];
    this.buildGroups();
    this.shouldScroll.set(true);

    if (this.conversationId) {
      // Send with empty message text + attachment
      this.chatService.sendMessage(this.conversationId, '', file).subscribe({
        error: () => {
          this.localMessages = this.localMessages.filter(m => m !== newMsg);
          this.buildGroups();
        },
      });
    }
  }
}
