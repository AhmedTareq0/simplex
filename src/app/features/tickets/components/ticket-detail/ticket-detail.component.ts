import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthLocalService } from '@/auth/services/auth-local.service';
import { SharedModalComponent, SharedConfirmationComponent } from '@/shared/components';
import { TicketsService, Ticket } from '../../services/tickets.service';
import { RatingModule } from 'primeng/rating';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModalComponent, SharedConfirmationComponent, RatingModule],
  templateUrl: './ticket-detail.component.html',
  styleUrl: './ticket-detail.component.scss',
})
export class TicketDetailComponent {
  private readonly ticketsService = inject(TicketsService);
  private readonly router = inject(Router);
  readonly auth = inject(AuthLocalService);

  get canManageTicket(): boolean {
    return this.auth.isCustomerSupport() || this.auth.isSuperAdmin();
  }

  @Input() visible = false;
  @Input() ticket: any = null;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() updated = new EventEmitter<Ticket>();
  @Output() edit = new EventEmitter<any>();

  // Resolve fields
  showResolveModal = signal(false);
  isResolving = signal(false);
  resolveNotes = '';

  // Cancel fields
  showCancelModal = signal(false);
  isCancelling = signal(false);
  cancelReason = '';

  close() {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  startEdit() {
    this.edit.emit(this.ticket);
  }

  openResolve() {
    this.resolveNotes = '';
    this.showResolveModal.set(true);
  }

  confirmResolve() {
    if (this.isResolving()) return;
    this.isResolving.set(true);

    this.ticketsService.resolveTicket(+this.ticket.id, this.resolveNotes).subscribe({
      next: () => {
        this.isResolving.set(false);
        this.showResolveModal.set(false);
        
        // Reflect change locally
        this.ticket.status = 'resolved';
        
        this.updated.emit(this.ticket);
      },
      error: () => this.isResolving.set(false)
    });
  }

  openCancel() {
    this.cancelReason = '';
    this.showCancelModal.set(true);
  }

  confirmCancel() {
    if (this.isCancelling()) return;
    this.isCancelling.set(true);

    this.ticketsService.cancelTicket(+this.ticket.id, this.cancelReason).subscribe({
      next: () => {
        this.isCancelling.set(false);
        this.showCancelModal.set(false);
        
        // Reflect change locally
        this.ticket.status = 'closed';
        
        this.updated.emit(this.ticket);
      },
      error: () => this.isCancelling.set(false)
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
    return ({ high: 'عالية', medium: 'متوسطة', normal: 'متوسطة', low: 'منخفضة' } as any)[p] || p;
  }

  getPriorityColor(p: string): string {
    return ({ high: '#ef4444', medium: '#f59e0b', normal: '#f59e0b', low: '#10b981' } as any)[p] || '#6b7280';
  }

  formatDate(date: string | null): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });
  }
}
