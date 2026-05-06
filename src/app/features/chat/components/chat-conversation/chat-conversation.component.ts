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
    const text = this.lastMessage?.text || this.lastMessage?.content;
    if (!text) return '';
    if (this.lastMessage.isDeleted) return 'تم حذف هذه الرسالة';
    return text.includes('localhost') || text.includes('blob:') || text.includes('http') && (text.includes('.jpg') || text.includes('.png') || text.includes('.pdf'))
      ? '📎 ملف'
      : text;
  }

  get isOwnLastMessage(): boolean {
    if (!this.lastMessage) return false;
    const senderId = this.lastMessage.senderId;
    if (senderId) return senderId === this.currentUserId;

    const role = this.lastMessage.role?.toLowerCase();
    if (role === 'customer_care') return this.currentUserId === 'support';
    if (role === 'engineer') return this.currentUserId === 'engineer';
    return false;
  }

  get senderPrefix(): string {
    if (!this.lastMessage) return '';
    return this.isOwnLastMessage ? 'أنا: ' : 'العميل: ';
  }

  get timestamp(): string {
    const rawDate = this.lastMessage?.timestamp || this.lastMessage?.createdAt || this.lastMessage?.created_at;
    if (!rawDate) return '';
    const d = new Date(rawDate);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'numeric' });
  }

  get statusLabel(): string {
    const map: Record<string, string> = {
      'with_customer_care': 'خدمة العملاء',
      'with_engineer': 'المهندس',
      'with_ai': 'AI',
      'ended': 'منتهية',
    };
    return map[this.user?.status] || this.user?.status || '';
  }

  get machineId(): string {
    return this.user?.machineId || '';
  }

  get statusClass(): string {
    const map: Record<string, string> = {
      'with_customer_care': 'status-care',
      'with_engineer': 'status-engineer',
      'with_ai': 'status-ai',
      'ended': 'status-ended',
    };
    return map[this.user?.status] || '';
  }

  onClick() {
    this.select.emit();
  }
}
