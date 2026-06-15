import { Component, input, signal, computed, inject, Output, EventEmitter } from '@angular/core';
import { IconComponent, SharedConfirmationComponent } from '../../../../shared/components';
import { RequestVisitModalComponent } from '../../../visits/components/request-visit-modal/request-visit-modal.component';
import { ChatService } from '../../services/chat.service';
import { AuthLocalService } from '@/auth/services/auth-local.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat-header',
  standalone: true,
  imports: [
    CommonModule,
    IconComponent,
    SharedConfirmationComponent,
    RequestVisitModalComponent,
  ],
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
  @Output() back = new EventEmitter<void>();

  readonly showMenu = signal(false);
  readonly isRequestingVisit = signal(false);
  readonly isDeleting = signal(false);
  readonly showDeleteConfirm = signal(false);
  readonly showVisitForm = signal(false);

  readonly canDeleteChat = computed(() => this.auth.hasPermission('chat.delete'));
  readonly canRequestVisit = computed(() => this.status() === 'with_customer_care' && this.auth.hasPermission('chat.cc'));
  readonly isWithEngineer = computed(() => this.status() === 'with_engineer');

  toggleMenu(): void {
    this.showMenu.update(v => !v);
  }

  openVisitForm(): void {
    this.showVisitForm.set(true);
  }

  submitVisitRequest(metadata: any): void {
    if (!this.conversationId() || this.isRequestingVisit()) return;

    this.isRequestingVisit.set(true);

    this.chatService.requestVisit(this.conversationId(), metadata).subscribe({
      next: () => {
        this.isRequestingVisit.set(false);
        this.showVisitForm.set(false);
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
