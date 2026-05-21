import { Component, EventEmitter, Input, Output, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthLocalService } from '@/auth/services/auth-local.service';
import { SharedModalComponent, SharedConfirmationComponent } from '@/shared/components';
import { RequestVisitModalComponent } from '../../../visits/components/request-visit-modal/request-visit-modal.component';
import { TicketsService, Ticket } from '../../services/tickets.service';
import { RatingModule } from 'primeng/rating';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModalComponent, SharedConfirmationComponent, RatingModule, RequestVisitModalComponent],
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

  get isActiveTicket(): boolean {
    if (!this.ticket || !this.ticket.status) return false;
    const status = this.ticket.status.toLowerCase();
    return ['open', 'in_progress'].includes(status);
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

  // Request Visit fields
  showVisitForm = signal(false);
  isRequestingVisit = signal(false);

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



  openRequestVisit() {
    this.showVisitForm.set(true);
  }

  submitVisitRequest(metadata: any) {
    if (this.isRequestingVisit()) return;

    this.isRequestingVisit.set(true);

    this.ticketsService.requestVisit(+this.ticket.id, metadata).subscribe({
      next: (res) => {
        this.isRequestingVisit.set(false);
        this.showVisitForm.set(false);
        
        // Update ticket with new data from server (engineer_name, visit_id, status)
        if (res.data) {
          Object.assign(this.ticket, res.data);
          this.updated.emit(this.ticket);
        }
      },
      error: () => this.isRequestingVisit.set(false)
    });
  }

  goToChat() {
    if (this.ticket?.conversation_id) {
      this.close();
      this.router.navigate(['/chat'], { queryParams: { conversation: this.ticket.conversation_id } });
    }
  }

  getStatusLabel(s: string): string {
    const val = String(s || '').toLowerCase().trim().replace(/[\s_-]+/g, '_');
    return ({ open: 'مفتوحة', in_progress: 'قيد التنفيذ', resolved: 'محلولة', closed: 'مغلقة', solved: 'منتهية', cancelled: 'ملغاة' } as any)[val] || s;
  }

  getStatusColor(s: string): string {
    const val = String(s || '').toLowerCase().trim().replace(/[\s_-]+/g, '_');
    return ({ open: '#3b82f6', in_progress: '#f59e0b', resolved: '#10b981', closed: '#6b7280', solved: '#8b5cf6', cancelled: '#ef4444' } as any)[val] || '#6b7280';
  }

  getPriorityLabel(p: string): string {
    const val = String(p || '').toLowerCase().trim();
    return ({ high: 'عالية', medium: 'متوسطة', normal: 'متوسطة', low: 'منخفضة' } as any)[val] || p;
  }

  getPriorityColor(p: string): string {
    const val = String(p || '').toLowerCase().trim();
    return ({ high: '#ef4444', medium: '#f59e0b', normal: '#f59e0b', low: '#10b981' } as any)[val] || '#6b7280';
  }

  formatDate(date: string | null): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });
  }
}
