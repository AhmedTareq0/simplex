import { Component, input, output, signal, inject, OnInit, computed, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  SharedModalComponent,
  SharedInputComponent,
  SharedSelectComponent,
  ButtonComponent
} from '@/shared/components';
import { IconComponent } from '@/shared/components/icon/icon.component';
import { Visit, VisitsService } from '../../services/visits.service';
import { ClientService } from '../../../clients/services/client.service';
import { MachineService, Machine } from '../../../machines/services/machine.service';
import { EmployeeService } from '../../../employees/services/employee.service';
import { TicketsService } from '../../../tickets/services/tickets.service';

@Component({
  selector: 'app-visit-edit-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModalComponent,
    SharedInputComponent,
    SharedSelectComponent,
    ButtonComponent,
    IconComponent
  ],
  templateUrl: './visit-edit-modal.component.html',
  styleUrl: './visit-edit-modal.component.scss'
})
export class VisitEditModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly clientService = inject(ClientService);
  private readonly machineService = inject(MachineService);
  private readonly employeeService = inject(EmployeeService);
  private readonly ticketsService = inject(TicketsService);
  private readonly visitsService = inject(VisitsService);

  visit = input.required<Visit>();
  isSubmitting = input<boolean>(false);
  visible = input<boolean>(false);

  activeVisit = signal<Visit | null>(null);
  isLoadingDetails = signal(false);

  save = output<any>();
  cancel = output<void>();

  editForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    customer_id: [null, Validators.required],
    engineer_id: [null],
    machine_id: [null, Validators.required],
    ticket_id: [null],
    visit_date: ['', Validators.required],
    status: ['new', Validators.required],
    priority: ['normal', Validators.required],
    notes: ['']
  });

  customerOptions = computed(() => this.clientService.clients().map(c => ({ label: c.name, value: c.id })));
  machineOptions = computed(() => this.machineService.machines().map(m => ({ label: m.name, value: m.id })));
  engineerOptions = computed(() => this.employeeService.employees().filter(e => e.department === 'Maintenance' || e.employee_role === 'Maintenance').map(e => ({ label: e.name, value: e.id })));
  ticketOptions = computed(() => this.ticketsService.tickets().map(t => ({ label: `#${t.id} - ${t.title}`, value: t.id })));

  statusOptions = computed(() => {
    const isEdit = this.visit() && this.visit().id !== 0;
    if (isEdit) {
      return [
        { label: 'جديدة', value: 'new' },
        { label: 'قيد التنفيذ', value: 'in_progress' },
        { label: 'ملغاة', value: 'cancelled' }
      ];
    } else {
      return [
        { label: 'جديدة', value: 'new' },
        { label: 'قيد التنفيذ', value: 'in_progress' }
      ];
    }
  });

  priorityOptions = [
    { label: 'عالية', value: 'high' },
    { label: 'عادية', value: 'normal' }
  ];

  // For Spare Parts
  readonly availableMachines = signal<Machine[]>([]);
  readonly isMachinesLoading = signal(false);
  readonly selectedProductIds = signal<number[]>([]);
  readonly machineSearchQuery = signal('');
  readonly displayedMachinesLimit = signal(4);
  readonly MACHINES_PAGE_SIZE = 4;

  readonly filteredMachines = computed(() => {
    const query = this.machineSearchQuery().toLowerCase().trim();
    const machines = this.availableMachines();
    
    // Sort selected products to appear first
    const sorted = [...machines].sort((a, b) => {
      const aSelected = this.isProductSelected(a.id) ? -1 : 1;
      const bSelected = this.isProductSelected(b.id) ? -1 : 1;
      return aSelected - bSelected;
    });

    if (!query) return sorted;
    return sorted.filter(machine => 
      machine.display_name.toLowerCase().includes(query) ||
      (machine.default_code && machine.default_code.toLowerCase().includes(query))
    );
  });

  readonly displayedMachines = computed(() => {
    return this.filteredMachines().slice(0, this.displayedMachinesLimit());
  });

  readonly hasMoreMachines = computed(() => {
    return this.filteredMachines().length > this.displayedMachinesLimit();
  });

  constructor() {
    effect(() => {
      if (this.visible()) {
        untracked(() => {
          this.selectedProductIds.set([]);
          this.machineSearchQuery.set('');
          this.displayedMachinesLimit.set(this.MACHINES_PAGE_SIZE);
          
          const v = this.visit();
          if (v && v.id !== 0) {
            this.activeVisit.set(v); // temporary fallback
            this.patchForm(v);
            this.isLoadingDetails.set(true);
            this.visitsService.getVisitDetail(v.id).subscribe({
              next: (res) => {
                if (res.data) {
                  this.activeVisit.set(res.data);
                  this.patchForm(res.data);
                  if (!this.isMachinesLoading() && this.availableMachines().length > 0) {
                    this.preselectProducts(this.availableMachines());
                  }
                }
                this.isLoadingDetails.set(false);
              },
              error: () => this.isLoadingDetails.set(false)
            });
          } else {
            this.activeVisit.set(null);
          }

          this.loadAvailableMachines();
        });
      }
    });
  }

  private loadAvailableMachines(): void {
    this.isMachinesLoading.set(true);
    this.machineService.fetchSpareParts({ available: true, pageSize: 100 }).subscribe({
      next: (machines) => {
        this.availableMachines.set(machines);
        this.isMachinesLoading.set(false);
        this.preselectProducts(machines);
      },
      error: () => this.isMachinesLoading.set(false),
    });
  }

  private preselectProducts(machines: Machine[]): void {
    const visit = this.activeVisit();
    if (visit && visit.id !== 0 && visit.products && visit.products.length > 0) {
      const selectedIds = visit.products.map(vp => {
        const match = machines.find(m => m.name === vp.name || m.display_name === vp.name);
        return match ? match.id : null;
      }).filter(id => id !== null) as number[];
      
      if (selectedIds.length > 0) {
        const current = this.selectedProductIds();
        this.selectedProductIds.set([...new Set([...current, ...selectedIds])]);
      }
    }
  }

  toggleProduct(id: number): void {
    this.selectedProductIds.update(ids =>
      ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]
    );
  }

  isProductSelected(id: number): boolean {
    return this.selectedProductIds().includes(id);
  }

  loadMoreMachines(): void {
    this.displayedMachinesLimit.update(limit => limit + this.MACHINES_PAGE_SIZE);
  }

  onMachineSearchChange(query: string): void {
    this.machineSearchQuery.set(query);
    this.displayedMachinesLimit.set(this.MACHINES_PAGE_SIZE);
  }

  ngOnInit() {
    this.clientService.loadClients({ page_size: 100 });
    this.machineService.loadMachines({ pageSize: 100 });
    this.employeeService.loadEmployees({ department: 'Maintenance', page_size: 100 });
    this.ticketsService.loadTickets({ page_size: 100 });

    if (!this.visit() || this.visit().id === 0) {
      this.editForm.reset({
        status: 'new',
        priority: 'normal'
      });
    }
  }

  private patchForm(visit: Visit) {
    this.editForm.get('title')?.clearValidators();
    this.editForm.get('customer_id')?.clearValidators();
    this.editForm.get('machine_id')?.clearValidators();
    this.editForm.get('title')?.updateValueAndValidity();
    this.editForm.get('customer_id')?.updateValueAndValidity();
    this.editForm.get('machine_id')?.updateValueAndValidity();

    const visitDate = visit.planned_start || visit.visit_date || '';
    this.editForm.patchValue({
      title: visit.name || '',
      customer_id: visit.customer_id || visit.customer?.id || null,
      engineer_id: visit.engineer_id || visit.engineer?.id || null,
      machine_id: visit.machine_id || null,
      ticket_id: visit.ticket_id || null,
      visit_date: visitDate ? visitDate.split('T')[0] : '',
      status: visit.status || 'new',
      priority: visit.priority || 'normal',
      notes: visit.notes || ''
    });
  }

  onSubmit() {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const val = this.editForm.value;
    const isEdit = this.visit().id !== 0;

    if (isEdit) {
      const payload: any = {};
      const visit = this.visit();

      // 1. Reschedule
      const originalDate = (visit.planned_start || visit.visit_date || '').split('T')[0];
      if (val.visit_date && val.visit_date !== originalDate) {
        payload.planned_start = new Date(val.visit_date).toISOString();
      }

      // 2. Reassign Engineer
      const currentEngineerId = visit.engineer_id || visit.engineer?.id || null;
      if (val.engineer_id !== currentEngineerId) {
        if (val.engineer_id) {
          const selectedEng = this.employeeService.employees().find(e => e.id === Number(val.engineer_id));
          payload.engineer_id = selectedEng ? selectedEng.odoo_user_id : Number(val.engineer_id);
        } else {
          payload.engineer_id = null;
        }
      }

      // 3. Cancel
      if (val.status === 'cancelled') {
        payload.cancel = true;
        payload.cancellation_reason = val.notes || 'تم الإلغاء بواسطة المدير';
      }

      // 4. Notes
      if (val.notes && val.notes !== (visit.notes || '')) {
        if (val.status !== 'cancelled') {
          payload.notes = val.notes;
        }
      }

      if (Object.keys(payload).length === 0 && val.status !== visit.status) {
        payload.status = val.status;
      }

      const ids = this.selectedProductIds();
      if (ids.length > 0) {
        payload.product_ids = ids;
      }

      this.save.emit(payload);
    } else {
      const selectedClient = this.clientService.clients().find(c => c.id === Number(val.customer_id));
      const payload: any = {
        title: val.title,
        customer_id: selectedClient ? selectedClient.odoo_user_id : Number(val.customer_id),
        machine_id: Number(val.machine_id),
        visit_date: new Date(val.visit_date).toISOString(),
        priority: val.priority || 'normal',
        status: val.status || 'new'
      };

      if (val.ticket_id) {
        payload.ticket_id = Number(val.ticket_id);
      }
      if (val.engineer_id) {
        const selectedEngineer = this.employeeService.employees().find(e => e.id === Number(val.engineer_id));
        payload.engineer_id = selectedEngineer ? selectedEngineer.odoo_user_id : Number(val.engineer_id);
      }

      const ids = this.selectedProductIds();
      if (ids.length > 0) {
        payload.product_ids = ids;
      }

      this.save.emit(payload);
    }
  }

  getErrorMessage(controlName: string): string {
    const control = this.editForm.get(controlName);
    if (control && control.touched && control.invalid) {
      if (control.errors?.['required']) return 'هذا الحقل مطلوب';
      if (control.errors?.['email']) return 'البريد الإلكتروني غير صالح';
    }
    return '';
  }
}
