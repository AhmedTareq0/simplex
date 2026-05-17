import { Component, input, output, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  SharedModalComponent,
  SharedInputComponent,
  SharedSelectComponent,
  ButtonComponent
} from '@/shared/components';
import { Visit } from '../../services/visits.service';
import { ClientService } from '../../../clients/services/client.service';
import { MachineService } from '../../../machines/services/machine.service';
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
    ButtonComponent
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

  visit = input.required<Visit>();
  isSubmitting = input<boolean>(false);
  visible = input<boolean>(false);

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

  ngOnInit() {
    this.clientService.loadClients({ page_size: 100 });
    this.machineService.loadMachines({ pageSize: 100 });
    this.employeeService.loadEmployees({ department: 'Maintenance', page_size: 100 });
    this.ticketsService.loadTickets({ page_size: 100 });

    const visit = this.visit();
    if (visit && visit.id !== 0) {
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
    } else {
      this.editForm.reset({
        status: 'new',
        priority: 'normal'
      });
    }
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
