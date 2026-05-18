import { Component, inject, signal, effect, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { SharedTableComponent, TableColumn, ButtonComponent, SkeletonLoaderComponent } from '@/shared/components';
import { ApiResponse } from '@/core/interfaces/api-response.interface';
import { AuthLocalService } from '@/auth/services/auth-local.service';
import { AdminSyncService } from '@/core/services/admin-sync.service';
import { VisitsService, Visit } from './services/visits.service';
import { VisitDetailComponent } from './components/visit-detail/visit-detail.component';
import { VisitEditModalComponent } from './components/visit-edit-modal/visit-edit-modal.component';

@Component({
  selector: 'app-visits',
  standalone: true,
  imports: [
    CommonModule,
    SharedTableComponent,
    SkeletonLoaderComponent,
    ButtonComponent,
    VisitDetailComponent,
    VisitEditModalComponent
  ],
  templateUrl: './visits.component.html',
  styleUrl: './visits.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VisitsComponent implements OnInit {
  readonly visitsService = inject(VisitsService);
  readonly auth = inject(AuthLocalService);
  private readonly syncService = inject(AdminSyncService);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  selectedVisit = signal<Visit | null>(null);
  showEditModal = signal(false);
  showDetailModal = signal(false);
  isUpdatingVisit = signal(false);
  isSyncing = this.syncService.isSyncing;
  currentPage = signal(1);
  pageSize = signal(10);

  readonly visitIdParam = signal<string | null>(null);

  constructor() {
    effect(() => {
      const visitId = this.visitIdParam();
      const list = this.visitsService.visits();
      if (visitId && list.length > 0) {
        const found = list.find(v => v.id === +visitId || v.ticket_id === +visitId);
        if (found) {
          this.onRowClick(found);
          this.cdr.markForCheck();
        }
      }
    });
  }

  get isLoading(): boolean { return this.visitsService.isLoading(); }
  get total(): number { return this.visitsService.total(); }
  get visits(): Visit[] { return this.visitsService.visits(); }
  get nextVisit() { return this.visitsService.nextVisit; }

  formatVisitDate(dateStr?: string | null): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      new: 'جديدة',
      in_progress: 'قيد التنفيذ',
      done: 'مكتمل',
      cancelled: 'ملغى',
      scheduled: 'مجدول',
      completed: 'مكتمل'
    };
    return labels[status] || status;
  }

  columns: TableColumn[] = [
    { field: 'name', header: 'اسم الزيارة', type: 'text', filterable: true },
    {
      field: 'planned_start',
      header: 'تاريخ الزيارة',
      type: 'text',
      formatter: (value: string, row: Visit) => {
        const date = value || row?.visit_date;
        return date ? new Date(date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
      }
    },
    {
      field: 'customer',
      header: 'العميل',
      type: 'text',
      formatter: (_value: any, row: Visit) => row?.customer?.name || row?.customer_name || '—'
    },
    {
      field: 'engineer',
      header: 'المهندس',
      type: 'text',
      formatter: (_value: any, row: Visit) => row?.engineer?.name || row?.engineer_name || '—'
    },
    {
      field: 'status',
      header: 'الحالة',
      type: 'badge',
      filterable: true,
      filterType: 'dropdown',
      filterOptions: [
        { label: 'جديدة', value: 'new' },
        { label: 'قيد التنفيذ', value: 'in_progress' },
        { label: 'مكتمل', value: 'done' },
        { label: 'ملغى', value: 'cancelled' }
      ],
      formatter: (value: string) => {
        const labels: Record<string, string> = {
          new: 'جديدة',
          in_progress: 'قيد التنفيذ',
          done: 'مكتمل',
          cancelled: 'ملغى',
          scheduled: 'مجدول',
          completed: 'مكتمل'
        };
        return labels[value] || value;
      }
    }
  ];

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const visitId = params['id'];
      if (visitId) {
        this.visitIdParam.set(visitId);
        this.visitsService.loadVisits({ page: 1, page_size: 100 });
      } else {
        this.visitsService.loadVisits({ page: 1, page_size: this.pageSize() });
      }
    });
  }

  onAdd() {
    this.selectedVisit.set({ id: 0 } as Visit);
    this.showEditModal.set(true);
    this.showDetailModal.set(false);
  }

  onEdit(visit: Visit) {
    this.selectedVisit.set(visit);
    this.showEditModal.set(true);
    this.showDetailModal.set(false);
  }

  onRowClick(visit: Visit) {
    this.selectedVisit.set(visit);
    this.showDetailModal.set(true);
    this.showEditModal.set(false);
  }

  onPageChange(event: { page: number; rows: number }) {
    this.currentPage.set(event.page);
    this.pageSize.set(event.rows);
    this.visitsService.loadVisits({ page: event.page, page_size: event.rows });
  }

  handleSaveVisit(data: any) {
    const visit = this.selectedVisit();
    if (!visit) return;

    this.isUpdatingVisit.set(true);
    const observable = visit.id === 0
      ? this.visitsService.createVisit(data)
      : this.visitsService.updateVisit(visit.id, data);

    observable.subscribe({
      next: (res: ApiResponse<Visit>) => {
        this.isUpdatingVisit.set(false);
        if (res.success) {
          this.showEditModal.set(false);
          this.selectedVisit.set(null);
          this.currentPage.set(1);
          this.visitsService.loadVisits({ page: 1, page_size: this.pageSize() });
        }
      },
      error: () => this.isUpdatingVisit.set(false)
    });
  }

  handleVisitUpdate(_updatedVisit: Visit) {
    this.visitsService.loadVisits({ page: 1, page_size: this.pageSize() });
    this.currentPage.set(1);
    this.showDetailModal.set(false);
  }

  onSync() {
    this.syncService.syncModule('visits').subscribe({
      next: (res) => {
        if (res.success) {
          this.visitsService.loadVisits({ page: 1, page_size: this.pageSize() });
        }
      }
    });
  }
}
