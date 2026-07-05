import { Component, input, output, signal, inject, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModalComponent, ButtonComponent, SharedConfirmationComponent, SharedInputComponent, SharedSelectComponent } from '@/shared/components';
import { Visit, VisitsService, TimelineItem } from '../../services/visits.service';
import { VisitTimelineComponent } from '../visit-timeline/visit-timeline.component';
import { EmployeeService, Employee } from '@/features/employees/services/employee.service';
import { MachineService } from '@/features/machines/services/machine.service';
import { AuthLocalService } from '@/auth/services/auth-local.service';
import { RatingModule } from 'primeng/rating';
import { VISIT_STATUS, PRIORITY } from '@/core/constants/status.constants';
import { formatDateTime } from '@/core/utils/date.util';

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
    SharedSelectComponent,
    RatingModule
  ],
  templateUrl: './visit-detail.component.html',
  styleUrl: './visit-detail.component.scss'
})
export class VisitDetailComponent {
  private readonly visitsService = inject(VisitsService);
  private readonly employeeService = inject(EmployeeService);
  private readonly machineService = inject(MachineService);
  readonly auth = inject(AuthLocalService);

  visit = input.required<Visit | null>();
  visible = input<boolean>(false);
  activeVisit = signal<Visit | null>(null);

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

  constructor() {
    effect(() => {
      const isVisible = this.visible();
      const v = this.visit();
      if (isVisible && v) {
        untracked(() => {
          this.activeVisit.set(v);
          this.loadActivities();
          
          this.visitsService.getVisitDetail(v.id).subscribe({
            next: (res) => {
              if (res.data) {
                this.activeVisit.set(res.data);
              }
            }
          });

          if (this.auth.hasPermission('visits.update')) {
            if (this.auth.hasPermission('users.manage')) {
              this.loadEngineers();
            }
            if (this.auth.hasPermission('machines.view') || this.auth.hasPermission('machines.manage')) {
              this.machineService.loadMachines({ pageSize: 100 });
            }
          }
        });
      }
    }, { allowSignalWrites: true });
  }

  loadEngineers() {
    this.employeeService.loadEmployees({ page_size: 100 });
  }

  get engineerOptions() {
    return this.employeeService.employees()
      .filter((e: Employee) => e.department === 'Maintenance' || e.employee_role === 'engineer')
      .map((e: Employee) => ({ label: e.name, value: e.id }));
  }

  loadActivities() {
    const visit = this.activeVisit();
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

  getStatusLabel = VISIT_STATUS.getLabel;
  getPriorityLabel = PRIORITY.getLabel;
  getStatusColor = VISIT_STATUS.getColor;
  formatDate = formatDateTime;

  get customerName(): string {
    const visit = this.activeVisit();
    return visit?.customer?.name || visit?.customer_name || '—';
  }

  get engineerName(): string {
    const visit = this.activeVisit();
    return visit?.engineer?.name || visit?.engineer_name || '—';
  }

  get machineName(): string {
    const visit = this.activeVisit();
    if (visit?.machine?.name) return visit.machine.name;
    if (visit?.machine_name) return visit.machine_name;
    if (visit?.machine_id) {
      const machine = this.machineService.machines().find(m => m.id === visit.machine_id);
      return machine?.name || '—';
    }
    return '—';
  }

  get visitDate(): string | null {
    const visit = this.activeVisit();
    return visit?.planned_start || visit?.visit_date || null;
  }

  onComplete() {
    const visit = this.activeVisit();
    if (!visit || this.isSaving()) return;

    this.isSaving.set(true);
    this.visitsService.updateVisitStatus(visit.id, 'done').subscribe({
      next: (res) => {
        this.isSaving.set(false);
        this.updated.emit(res.data);
      },
      error: () => this.isSaving.set(false)
    });
  }

  onEdit() {
    const visit = this.activeVisit();
    if (visit) this.edit.emit(visit);
  }

  onCancelVisit() {
    const visit = this.activeVisit();
    if (!visit || !this.cancelReason()) return;

    this.isSaving.set(true);
    this.visitsService.cancelVisitEngineer(visit.id, this.cancelReason()).subscribe({
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
    const visit = this.activeVisit();
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
    const visit = this.activeVisit();
    if (!visit || !this.selectedEngineerId()) return;

    // Convert local id to odoo_user_id for the API
    const selectedEmp = this.employeeService.employees().find(e => e.id === this.selectedEngineerId());
    const odooId = selectedEmp ? selectedEmp.odoo_user_id : this.selectedEngineerId()!;

    this.isSaving.set(true);
    this.visitsService.reassignVisit(visit.id, odooId).subscribe({
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
    return this.activeVisit()?.status === 'scheduled';
  }

  get showCompleteBtn(): boolean {
    return this.activeVisit()?.status === 'in_progress' || this.activeVisit()?.status === 'scheduled';
  }

  get showRescheduleBtn(): boolean {
    return ['new', 'scheduled'].includes(this.activeVisit()?.status || '');
  }

  get showReassignBtn(): boolean {
    return ['new', 'scheduled'].includes(this.activeVisit()?.status || '');
  }

  get showCancelBtn(): boolean {
    return ['new', 'scheduled', 'in_progress'].includes(this.activeVisit()?.status || '');
  }
}
