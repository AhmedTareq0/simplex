import { Component, input, signal, computed, inject } from '@angular/core';
import { IconComponent } from '../../../../shared/components';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-chat-header',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './chat-header.component.html',
  styleUrl: './chat-header.component.scss',
})
export class ChatHeaderComponent {
  private readonly chatService = inject(ChatService);

  // Angular 17+ signal inputs — reactive with computed()
  readonly person = input<any>(null);
  readonly isOnline = input(false);
  readonly isTyping = input(false);
  readonly conversationId = input('');
  readonly status = input('');

  readonly showMenu = signal(false);
  readonly isRequestingVisit = signal(false);

  // Show request visit button only when with customer care
  readonly canRequestVisit = computed(() => this.status() === 'with_customer_care');
  
  // Show engineer info when engineer has joined
  readonly isWithEngineer = computed(() => this.status() === 'with_engineer');
  
  // Show menu only if there's something to show
  readonly hasMenuItems = computed(() => this.canRequestVisit() || this.isWithEngineer());

  toggleMenu(): void {
    this.showMenu.update(v => !v);
  }

  requestVisit(): void {
    if (!this.conversationId() || this.isRequestingVisit()) return;
    this.isRequestingVisit.set(true);
    this.chatService.requestVisit(this.conversationId()).subscribe({
      next: () => {
        this.isRequestingVisit.set(false);
        this.showMenu.set(false);
      },
      error: () => this.isRequestingVisit.set(false),
    });
  }
}
