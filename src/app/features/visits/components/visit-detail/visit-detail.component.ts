import { Component, input, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModalComponent, ButtonComponent } from '@/shared/components';
import { Visit, VisitsService } from '../../services/visits.service';

@Component({
  selector: 'app-visit-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModalComponent, ButtonComponent],
  templateUrl: './visit-detail.component.html',
  styleUrl: './visit-detail.component.scss'
})
export class VisitDetailComponent {
  private readonly visitsService = inject(VisitsService);

  visit = input.required<Visit | null>();
  visible = input<boolean>(false);

  close = output<void>();
  edit = output<Visit>();
  updated = output<Visit>();

  isSaving = signal(false);

  getStatusLabel(status: string): string {
    return ({
      new: 'جديدة',
      scheduled: 'مجدولة',
      in_progress: 'قيد التنفيذ',
      done: 'مكتملة',
      completed: 'مكتملة',
      cancelled: 'ملغاة'
    } as Record<string, string>)[status] || status;
  }

  getPriorityLabel(priority: string): string {
    return ({
      high: 'عالية',
      medium: 'متوسطة',
      normal: 'عادية',
      low: 'منخفضة'
    } as Record<string, string>)[priority] || priority;
  }

  getStatusColor(status: string): string {
    return ({
      new: '#8b5cf6',
      scheduled: '#3b82f6',
      in_progress: '#f59e0b',
      done: '#10b981',
      completed: '#10b981',
      cancelled: '#ef4444'
    } as Record<string, string>)[status] || '#6b7280';
  }

  formatDate(date: string | null): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('ar-EG', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  get customerName(): string {
    const visit = this.visit();
    return visit?.customer?.name || visit?.customer_name || '—';
  }

  get engineerName(): string {
    const visit = this.visit();
    return visit?.engineer?.name || visit?.engineer_name || '—';
  }

  get machineName(): string {
    return this.visit()?.machine_name || '—';
  }

  get visitDate(): string | null {
    const visit = this.visit();
    return visit?.planned_start || visit?.visit_date || null;
  }

  onComplete() {
    const visit = this.visit();
    if (!visit || this.isSaving()) return;

    this.isSaving.set(true);
    this.visitsService.updateVisit(visit.id, { status: 'done' }).subscribe({
      next: (res) => {
        this.isSaving.set(false);
        this.updated.emit(res.data);
      },
      error: () => this.isSaving.set(false)
    });
  }

  onEdit() {
    const visit = this.visit();
    if (visit) this.edit.emit(visit);
  }
}
