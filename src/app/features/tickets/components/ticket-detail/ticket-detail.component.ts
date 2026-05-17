import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModalComponent } from '../../../../shared/components/shared-modal/shared-modal.component';
import { TicketsService, Ticket } from '../../services/tickets.service';
import { Router } from '@angular/router';
import { AuthLocalService } from '@/auth/services/auth-local.service';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [CommonModule, SharedModalComponent],
  templateUrl: './ticket-detail.component.html',
  styleUrl: './ticket-detail.component.scss',
})
export class TicketDetailComponent {
  private readonly ticketsService = inject(TicketsService);
  private readonly router = inject(Router);
  readonly auth = inject(AuthLocalService);

  @Input() visible = false;
  @Input() ticket: any = null;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() updated = new EventEmitter<Ticket>();
  @Output() delete = new EventEmitter<string>();
  @Output() edit = new EventEmitter<any>();

  isDeleting = signal(false);

  close() {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  startEdit() {
    this.edit.emit(this.ticket);
  }

  onDelete() {
    if (this.isDeleting() || !this.ticket?.id) return;
    this.isDeleting.set(true);

    this.ticketsService.deleteTicket(Number(this.ticket.id)).subscribe({
      next: () => {
        this.delete.emit(this.ticket.id);
        this.isDeleting.set(false);
        this.close();
      },
      error: () => this.isDeleting.set(false),
    });
  }

  goToChat() {
    if (this.ticket?.conversation_id) {
      this.close();
      this.router.navigate(['/chat'], { queryParams: { conversation: this.ticket.conversation_id } });
    }
  }

  getStatusLabel(s: string): string {
    return ({ open: 'مفتوحة', in_progress: 'قيد التنفيذ', resolved: 'محلولة', closed: 'مغلقة', solved: 'منتهية' } as any)[s] || s;
  }

  getStatusColor(s: string): string {
    return ({ open: '#3b82f6', in_progress: '#f59e0b', resolved: '#10b981', closed: '#6b7280', solved: '#8b5cf6' } as any)[s] || '#6b7280';
  }

  getPriorityLabel(p: string): string {
    return ({ high: 'عالية', medium: 'متوسطة', low: 'منخفضة' } as any)[p] || p;
  }

  getPriorityColor(p: string): string {
    return ({ high: '#ef4444', medium: '#f59e0b', low: '#10b981' } as any)[p] || '#6b7280';
  }

  formatDate(date: string | null): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });
  }
}
