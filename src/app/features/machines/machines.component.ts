import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedTableComponent, TableColumn, ButtonComponent } from '../../shared/components';
import { MachineService, Machine } from './services/machine.service';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';
import { MachineEditModalComponent } from './components/machine-edit-modal/machine-edit-modal.component';
import { MachineDetailComponent } from './components/machine-detail/machine-detail.component';
import { ApiResponse } from '../../core/interfaces/api-response.interface';

@Component({
  selector: 'app-machines',
  standalone: true,
  imports: [CommonModule, SharedTableComponent, SkeletonLoaderComponent, MachineEditModalComponent, ButtonComponent, MachineDetailComponent],
  templateUrl: './machines.component.html',
  styleUrl: './machines.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MachinesComponent implements OnInit {
  readonly machineService = inject(MachineService);

  selectedMachine = signal<Machine | null>(null);
  showEditModal = signal(false);
  showDetailModal = signal(false);
  isUpdatingMachine = signal(false);
  isSyncing = signal(false);
  currentPage = signal(1);
  pageSize = signal(10);

  get isLoading(): boolean { return this.machineService.isLoading(); }
  get total(): number { return this.machineService.total(); }
  get machines(): Machine[] { return this.machineService.machines(); }

  columns: TableColumn[] = [
    { field: 'image_url', header: 'الصورة', type: 'image' },
    { field: 'display_name', header: 'الاسم', type: 'text', filterable: true },
    { field: 'category', header: 'الفئة', type: 'text', filterable: true },
    {
      field: 'description',
      header: 'الوصف',
      type: 'text',
      formatter: (value: string) => value && value.length > 60 ? `${value.substring(0, 60)}...` : (value || '-')
    },
    { field: 'type', header: 'النوع', type: 'text' },
    {
      field: 'list_price',
      header: 'السعر',
      type: 'number',
      formatter: (value: number) => value ? `${value.toLocaleString('ar-EG')} ج.م` : 'مجاني'
    },
    {
      field: 'document_url',
      header: 'الكتالوج',
      type: 'link',
      linkText: 'تحميل',
      icon: 'fileAlt'
    }
  ];

  ngOnInit() {
    this.machineService.loadMachines({ page: 1, pageSize: this.pageSize() });
  }

  onAdd() {
    this.selectedMachine.set({ id: 0 } as Machine);
    this.showEditModal.set(true);
    this.showDetailModal.set(false);
  }

  onEdit(machine: Machine) {
    this.selectedMachine.set(machine);
    this.showEditModal.set(true);
    this.showDetailModal.set(false);
  }

  onRowClick(machine: Machine) {
    this.selectedMachine.set(machine);
    this.showDetailModal.set(true);
    this.showEditModal.set(false);
  }

  onPageChange(event: { page: number; rows: number }) {
    this.currentPage.set(event.page);
    this.pageSize.set(event.rows);
    this.machineService.loadMachines({ page: event.page, pageSize: event.rows });
  }

  onDelete(machine: Machine) {
    const odooId = this.getMachineOdooId(machine);
    if (!odooId) return;

    this.machineService.deleteMachine(odooId).subscribe({
      next: (res: ApiResponse<any>) => {
        if (res.success) {
          this.currentPage.set(1);
          this.machineService.loadMachines({ page: 1, pageSize: this.pageSize() });
        }
      }
    });
  }

  onSync() {
    this.isSyncing.set(true);
    this.machineService.syncMachines().subscribe({
      next: (res) => {
        this.isSyncing.set(false);
        if (res.success) {
          this.machineService.loadMachines({ page: 1, pageSize: this.pageSize() });
        }
      },
      error: () => this.isSyncing.set(false)
    });
  }

  handleSaveMachine(formData: FormData) {
    const machine = this.selectedMachine();
    if (!machine) return;

    this.isUpdatingMachine.set(true);
    const odooId = this.getMachineOdooId(machine);
    const observable = machine.id === 0
      ? this.machineService.createMachine(formData)
      : odooId
        ? this.machineService.updateMachine(odooId, formData)
        : null;

    if (!observable) {
      this.isUpdatingMachine.set(false);
      return;
    }

    observable.subscribe({
      next: (res) => {
        this.isUpdatingMachine.set(false);
        if (res.success) {
          this.showEditModal.set(false);
          this.selectedMachine.set(null);
          this.currentPage.set(1);
          this.machineService.loadMachines({ page: 1, pageSize: this.pageSize() });
        }
      },
      error: () => this.isUpdatingMachine.set(false)
    });
  }

  private getMachineOdooId(machine: Machine): number | null {
    return machine.odooId ?? machine.odoo_id ?? machine.id ?? null;
  }
}
