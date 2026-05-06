import { Component, Input, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../../../shared/components';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-chat-header',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './chat-header.component.html',
  styleUrl: './chat-header.component.scss',
})
export class ChatHeaderComponent {
  private readonly chatService = inject(ChatService);

  @Input() person: any;
  @Input() isOnline = false;
  @Input() isTyping = false;
  @Input() conversationId = '';
  @Input() status = '';

  showMenu = signal(false);

  toggleMenu(): void {
    this.showMenu.update(v => !v);
  }

  requestVisit(): void {
    if (!this.conversationId) return;

    this.chatService.requestVisit(this.conversationId).subscribe({
      next: () => {
        this.showMenu.set(false);
        // Add notification or toast if available
      },
      error: (err) => {
        console.error('Error requesting visit:', err);
      }
    });
  }
}
