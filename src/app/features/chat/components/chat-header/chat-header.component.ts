import { Component, input, signal, computed, inject, Output, EventEmitter } from '@angular/core';
import { IconComponent, SharedConfirmationComponent } from '../../../../shared/components';
import { ChatService } from '../../services/chat.service';
import { AuthLocalService } from '../../../../auth/services/auth-local.service';

@Component({
  selector: 'app-chat-header',
  standalone: true,
  imports: [IconComponent, SharedConfirmationComponent],
  templateUrl: './chat-header.component.html',
  styleUrl: './chat-header.component.scss',
})
export class ChatHeaderComponent {
  private readonly chatService = inject(ChatService);
  private readonly auth = inject(AuthLocalService);

  readonly person = input<any>(null);
  readonly isOnline = input(false);
  readonly isTyping = input(false);
  readonly conversationId = input('');
  readonly status = input('');

  @Output() close = new EventEmitter<void>();
  @Output() deleted = new EventEmitter<string>();

  readonly showMenu = signal(false);
  readonly isRequestingVisit = signal(false);
  readonly isDeleting = signal(false);
  readonly showDeleteConfirm = signal(false);

  readonly isSuperAdmin = computed(() => this.auth.isSuperAdmin());
  readonly canRequestVisit = computed(() => this.status() === 'with_customer_care');
  readonly isWithEngineer = computed(() => this.status() === 'with_engineer');
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

  onDeleteClick(): void {
    this.showDeleteConfirm.set(true);
    this.showMenu.set(false);
  }

  confirmDelete(): void {
    const id = this.conversationId();
    if (!id || this.isDeleting()) return;

    this.isDeleting.set(true);
    this.chatService.deleteConversation(id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.showDeleteConfirm.set(false);
        this.deleted.emit(id);
      },
      error: () => {
        this.isDeleting.set(false);
        this.showDeleteConfirm.set(false);
      },
    });
  }
}
