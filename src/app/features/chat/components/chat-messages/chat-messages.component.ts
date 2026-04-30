import {
  Component, Input, signal, ViewChild, ElementRef,
  AfterViewChecked, OnChanges, SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatMessageComponent } from '../chat-message/chat-message.component';
import { ChatFooterComponent } from '../chat-footer/chat-footer.component';

export interface MessageGroup {
  type: 'date' | 'message';
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
  @Input() users: any[] = [];

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
        senderName: sender?.name || '',
        senderPicture: sender?.picture || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
        showSenderInfo,
        isGrouped,
      });

      lastSenderId = msg.senderId;
    }

    this.groupedItems = items;
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
    this.localMessages = [...this.localMessages, newMsg];
    this.buildGroups();
    this.shouldScroll.set(true);
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
    this.localMessages = [...this.localMessages, newMsg];
    this.buildGroups();
    this.shouldScroll.set(true);
  }
}
