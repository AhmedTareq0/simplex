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
  @Output() select = new EventEmitter<void>();

  get imageUrl(): string {
    return this.user?.picture || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
  }

  get displayName(): string {
    return this.user?.name || 'Unknown';
  }

  get messageText(): string {
    if (!this.lastMessage?.text) return '';
    return this.lastMessage.text.includes('localhost') ? 'media' : this.lastMessage.text;
  }

  get timestamp(): string {
    if (!this.lastMessage?.timestamp) return '';
    const d = new Date(this.lastMessage.timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  onClick() {
    this.select.emit();
  }
}
