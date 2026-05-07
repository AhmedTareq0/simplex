import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SharedModalComponent } from '../../../../shared/components/shared-modal/shared-modal.component';
import { TicketsService, Ticket } from '../../services/tickets.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [FormsModule, SharedModalComponent],
  templateUrl: './ticket-detail.component.html',
  styleUrl: './ticket-detail.component.scss',
})
export class TicketDetailComponent implements OnChanges {
  private readonly ticketsService = inject(TicketsService);
  private readonly router = inject(Router);

  @Input() visible = false;
  @Input() user: any = null;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() update = new EventEmitter<Ticket>();
  @Output() delete = new EventEmitter<string>();

  isEditing = signal(false);
  isSaving = signal(false);
  isDeleting = signal(false);

  editStatus = signal('');
  editPriority = signal('');
  editVisitDate = signal('');

  statusOptions = [
    { label: 'مفتوحة', value: 'open' },
    { label: 'قيد التنفيذ', value: 'in_progress' },
    { label: 'محلولة', value: 'resolved' },
    { label: 'مغلقة', value: 'closed' },
  ];

  priorityOptions = [
    { label: 'عالية', value: 'high' },
    { label: 'متوسطة', value: 'medium' },
    { label: 'منخفضة', value: 'low' },
  ];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['user']?.currentValue) {
      this.isEditing.set(false);
      this.resetForm();
    }
  }

  resetForm() {
    this.editStatus.set(this.user?.status || '');
    this.editPriority.set(this.user?.priority || '');
    this.editVisitDate.set(this.user?.visit_date ? this.user.visit_date.split('T')[0] : '');
  }

  close() {
    this.visible = false;
    this.visibleChange.emit(false);
    this.isEditing.set(false);
  }

  startEdit() {
    this.resetForm();
    this.isEditing.set(true);
  }

  cancelEdit() {
    this.isEditing.set(false);
  }

  save() {
    if (this.isSaving() || !this.user?.id) return;
    this.isSaving.set(true);

    this.ticketsService.updateTicket(Number(this.user.id), {
      status: this.editStatus(),
      priority: this.editPriority(),
      visit_date: this.editVisitDate() || null,
    }).subscribe({
      next: (res) => {
        this.update.emit(res.data);
        this.isEditing.set(false);
        this.isSaving.set(false);
      },
      error: () => this.isSaving.set(false),
    });
  }

  onDelete() {
    if (this.isDeleting() || !this.user?.id) return;
    this.isDeleting.set(true);

    this.ticketsService.deleteTicket(Number(this.user.id)).subscribe({
      next: () => {
        this.delete.emit(this.user.id);
        this.isDeleting.set(false);
        this.close();
      },
      error: () => this.isDeleting.set(false),
    });
  }

  goToChat() {
    if (this.user?.conversation_id) {
      this.close();
      this.router.navigate(['/chat'], { queryParams: { conversation: this.user.conversation_id } });
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
