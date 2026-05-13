import { Component, input, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModalComponent, ButtonComponent, SharedConfirmationComponent, SharedInputComponent, SharedSelectComponent } from '@/shared/components';
import { Visit, VisitsService, TimelineItem } from '../../services/visits.service';
import { VisitTimelineComponent } from '../visit-timeline/visit-timeline.component';
import { EmployeeService, Employee } from '@/features/employees/services/employee.service';

@Component({
  selector: 'app-visit-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SharedModalComponent,
    ButtonComponent,
    VisitTimelineComponent,
    SharedConfirmationComponent,
    SharedInputComponent,
    SharedSelectComponent
  ],
  templateUrl: './visit-detail.component.html',
  styleUrl: './visit-detail.component.scss'
})
export class VisitDetailComponent {
  private readonly visitsService = inject(VisitsService);
  private readonly employeeService = inject(EmployeeService);

  visit = input.required<Visit | null>();
  visible = input<boolean>(false);

  close = output<void>();
  edit = output<Visit>();
  updated = output<Visit>();

  isSaving = signal(false);
  activities = signal<TimelineItem[]>([]);
  isLoadingActivities = signal(false);

  // Action states
  showCancelConfirm = signal(false);
  cancelReason = signal('');

  showRescheduleModal = signal(false);
  newPlannedDate = signal('');
  rescheduleNote = signal('');

  showReassignModal = signal(false);
  selectedEngineerId = signal<number | null>(null);
  engineers = signal<Employee[]>([]);

  ngOnChanges() {
    if (this.visible() && this.visit()) {
      this.loadActivities();
      this.loadEngineers();
    }
  }

  loadEngineers() {
    this.employeeService.loadEmployees({ page_size: 100 });
  }

  get engineerOptions() {
    return this.employeeService.employees()
      .filter((e: Employee) => e.department === 'Maintenance' || e.employee_role === 'engineer')
      .map((e: Employee) => ({ label: e.name, value: e.odoo_user_id }));
  }

  loadActivities() {
    const visit = this.visit();
    if (!visit) return;

    this.isLoadingActivities.set(true);
    this.visitsService.getVisitActivities(visit.id).subscribe({
      next: (res) => {
        this.activities.set(res.data);
        this.isLoadingActivities.set(false);
      },
      error: () => this.isLoadingActivities.set(false)
    });
  }

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

  onCancelVisit() {
    const visit = this.visit();
    if (!visit || !this.cancelReason()) return;

    this.isSaving.set(true);
    this.visitsService.cancelVisit(visit.id, this.cancelReason()).subscribe({
      next: (res) => {
        this.isSaving.set(false);
        this.showCancelConfirm.set(false);
        this.updated.emit(res.data);
        this.loadActivities();
      },
      error: () => this.isSaving.set(false)
    });
  }

  onReschedule() {
    const visit = this.visit();
    if (!visit || !this.newPlannedDate()) return;

    this.isSaving.set(true);
    this.visitsService.rescheduleVisit(visit.id, this.newPlannedDate(), this.rescheduleNote()).subscribe({
      next: (res) => {
        this.isSaving.set(false);
        this.showRescheduleModal.set(false);
        this.updated.emit(res.data);
        this.loadActivities();
      },
      error: () => this.isSaving.set(false)
    });
  }

  onReassign() {
    const visit = this.visit();
    if (!visit || !this.selectedEngineerId()) return;

    this.isSaving.set(true);
    this.visitsService.reassignVisit(visit.id, this.selectedEngineerId()!).subscribe({
      next: (res) => {
        this.isSaving.set(false);
        this.showReassignModal.set(false);
        this.updated.emit(res.data);
        this.loadActivities();
      },
      error: () => this.isSaving.set(false)
    });
  }

  // Dynamic buttons logic
  get showStartBtn(): boolean {
    return this.visit()?.status === 'scheduled';
  }

  get showCompleteBtn(): boolean {
    return this.visit()?.status === 'in_progress' || this.visit()?.status === 'scheduled';
  }

  get showRescheduleBtn(): boolean {
    return ['new', 'scheduled'].includes(this.visit()?.status || '');
  }

  get showReassignBtn(): boolean {
    return ['new', 'scheduled'].includes(this.visit()?.status || '');
  }

  get showCancelBtn(): boolean {
    return ['new', 'scheduled', 'in_progress'].includes(this.visit()?.status || '');
  }
}
