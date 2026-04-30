import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat-conversation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-conversation.component.html',
  styleUrl: './chat-conversation.component.scss',
})
export class ChatConversationComponent {
  @Input() user: any;
  @Input() lastMessage: any;
  @Input() selected = false;
  @Input() currentUserId = '';
  @Input() unreadCount = 0;
  @Input() isOnline = false;
  @Output() select = new EventEmitter<void>();

  get imageUrl(): string {
    return this.user?.picture || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
  }

  get displayName(): string {
    return this.user?.name || 'Unknown';
  }

  get messageText(): string {
    if (!this.lastMessage?.text) return '';
    if (this.lastMessage.isDeleted) return 'تم حذف هذه الرسالة';
    return this.lastMessage.text.includes('localhost') || this.lastMessage.text.includes('blob:')
      ? '📎 ملف'
      : this.lastMessage.text;
  }

  get isOwnLastMessage(): boolean {
    return this.lastMessage?.senderId === this.currentUserId;
  }

  get timestamp(): string {
    if (!this.lastMessage?.createdAt && !this.lastMessage?.timestamp) return '';
    const d = new Date(this.lastMessage.createdAt || this.lastMessage.timestamp);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'numeric' });
  }

  onClick() {
    this.select.emit();
  }
}
