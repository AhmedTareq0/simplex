import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-chat-conversation',
  standalone: true,
  imports: [],
  templateUrl: './chat-conversation.component.html',
  styleUrl: './chat-conversation.component.scss',
})
export class ChatConversationComponent {
   readonly user = input<any>(null);
  readonly lastMessage = input<any>(null);
  readonly selected = input(false);
  readonly currentUserId = input('');
  readonly unreadCount = input(0);
  readonly isOnline = input(false);
  readonly select = output<void>();

  get imageUrl(): string {
    return this.user()?.picture || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
  }

  get displayName(): string {
    return this.user()?.name || 'Unknown';
  }

  get messageText(): string {
    const msg = this.lastMessage();
    const text = msg?.text || msg?.content;
    if (!text) return '';
    if (msg.isDeleted) return 'تم حذف هذه الرسالة';
    
    // Check if it's a file URL
    const isFileUrl = text.includes('localhost') || text.includes('blob:') || 
      (text.includes('http') && (text.includes('.jpg') || text.includes('.png') || text.includes('.pdf')));
    
    return isFileUrl ? '📎 ملف' : text;
  }

  get isOwnLastMessage(): boolean {
    const msg = this.lastMessage();
    if (!msg) return false;
    
    const senderId = msg.senderId;
    if (senderId) return senderId === this.currentUserId();

    const role = msg.role?.toLowerCase();
    if (role === 'customer_care') return this.currentUserId() === 'support';
    if (role === 'engineer') return this.currentUserId() === 'engineer';
    return false;
  }

  get senderPrefix(): string {
    if (!this.lastMessage()) return '';
    return this.isOwnLastMessage ? 'أنا: ' : 'العميل: ';
  }

  get timestamp(): string {
    const msg = this.lastMessage();
    const rawDate = msg?.timestamp || msg?.createdAt || msg?.created_at;
    if (!rawDate) return '';
    
    const d = new Date(rawDate);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    
    if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'numeric' });
  }

  get machineId(): string {
    return this.user()?.machineId || '';
  }

  get machineName(): string {
    return this.user()?.machineName || '';
  }

  onClick() {
    this.select.emit();
  }
}
