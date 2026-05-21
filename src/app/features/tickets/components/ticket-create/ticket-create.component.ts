import { Component, EventEmitter, Input, Output, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SharedModalComponent } from '../../../../shared/components/shared-modal/shared-modal.component';
import { SharedSelectComponent } from '../../../../shared/components/shared-select/shared-select.component';
import { SharedInputComponent } from '../../../../shared/components/shared-input/shared-input.component';
import { TicketsService, CreateTicketPayload, UpdateTicketPayload } from '../../services/tickets.service';
import { MachineService } from '../../../machines/services/machine.service';
import { EmployeeService } from '../../../employees/services/employee.service';
import { ChatService, Conversation } from '../../../chat/services/chat.service';
import { ClientService } from '../../../clients/services/client.service';
import { AuthLocalService } from '@/auth/services/auth-local.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-ticket-create',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    SharedInputComponent,
    SharedSelectComponent,
    SharedModalComponent,
  ],
  templateUrl: './ticket-create.component.html',
  styleUrl: './ticket-create.component.scss',
})
export class TicketCreateComponent {
  private readonly ticketsService = inject(TicketsService);
  private readonly machineService = inject(MachineService);
  private readonly employeeService = inject(EmployeeService);
  private readonly chatService = inject(ChatService);
  readonly clientService = inject(ClientService);
  readonly auth = inject(AuthLocalService);

  @Input() visible = false;
  @Input() isEditMode = false;
  @Input() editData: any = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() created = new EventEmitter<void>();
  @Output() updated = new EventEmitter<any>();

  readonly isSaving = signal(false);
  readonly errorMessage = signal('');
  readonly conversations = signal<Conversation[]>([]);

  readonly machineOptions = computed(() =>
    this.machineService.machines().map(m => ({ label: m.name, value: m.id }))
  );

  readonly clientOptions = computed(() =>
    this.clientService.clients().map(c => ({ label: c.name, value: c.odoo_user_id }))
  );

  readonly customerCareOptions = computed(() =>
    this.employeeService.employees()
      .filter(e => e.employee_role === 'customer_care' || e.employee_role === 'customer_support')
      .map(e => ({ label: e.name, value: e.id }))
  );

  readonly conversationOptions = computed(() =>
    this.conversations().map(c => ({
      label: `${c.customer_name} - ${c.conversation_id.substring(0, 8)}`,
      value: c.conversation_id
    }))
  );

  formData = {
    customer_id: null as number | null,
    title: '',
    priority: 'medium' as string,
    machine_id: null as number | null,
    customer_care_id: null as number | null,
  };

  priorityOptions = [
    { label: 'عالية', value: 'high' },
    { label: 'متوسطة', value: 'medium' },
    { label: 'منخفضة', value: 'low' },
  ];

  statusOptions = [
    { label: 'مفتوحة', value: 'open' },
    { label: 'قيد التنفيذ', value: 'in_progress' },
    { label: 'محلولة', value: 'resolved' },
    { label: 'مغلقة', value: 'closed' },
    { label: 'منتهية', value: 'solved' },
    { label: 'ملغاة', value: 'cancelled' },
  ];

  ngOnInit() {}

  ngOnChanges() {
    if (!this.visible) return;

    this.errorMessage.set('');

    if (this.auth.hasPermission('chat.cc') || this.auth.hasPermission('chat.engineer')) {
      this.chatService.getConversations({ page_size: 100 }).subscribe(res => {
        this.conversations.set(res.data?.items || []);
      });
    }

     forkJoin({
      clients: this.clientService.fetchClients({ page_size: 100 }),
      employees: this.employeeService.fetchEmployees({ page_size: 100 }),
      machines: this.machineService.fetchMachines({ pageSize: 100 }),
    }).subscribe(() => {
      if (this.isEditMode && this.editData) {
        const ccEmployee = this.employeeService.employees()
          .find(e => e.name === this.editData.customer_care_name);

        const client = this.clientService.clients()
          .find(c => c.name === this.editData.customer_name);

        const machine = this.machineService.machines()
          .find(m => m.id === this.editData.machine_id || m.name === this.editData.machine_name);

        this.formData = {
          customer_id: client?.odoo_user_id ?? this.editData.customer_id ?? null,
          title: this.editData.title || '',
          priority: (this.editData.priority || 'medium').toLowerCase(),
          machine_id: machine?.id ?? this.editData.machine_id ?? null,
          customer_care_id: ccEmployee?.id ?? this.editData.customer_care_id ?? null,
        };
      } else {
        this.formData = {
          customer_id: null,
          title: '',
          priority: 'medium',
          machine_id: null,
          customer_care_id: null,
        };
      }
    });
  }

  close() {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  onSave() {
    if (!this.formData.title || (!this.isEditMode && (!this.formData.customer_id || !this.formData.machine_id))) {
      this.errorMessage.set('يرجى ملء الحقول الإلزامية (العميل، العنوان، والماكينة)');
      return;
    }

    if (!this.isEditMode && this.auth.isSuperAdmin() && !this.formData.customer_care_id) {
      this.errorMessage.set('يرجى اختيار مسؤول خدمة العملاء');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');

    if (this.isEditMode && this.editData?.id) {
      const payload: UpdateTicketPayload = {
        title: this.formData.title,
        priority: this.formData.priority,
        ...(this.formData.customer_care_id != null ? { customer_care_id: this.formData.customer_care_id } : {}),
        ...(this.formData.customer_id != null ? { customer_id: this.formData.customer_id } : {}),
        ...(this.formData.machine_id != null ? { machine_id: this.formData.machine_id } : {}),
      };

      this.ticketsService.updateTicket(Number(this.editData.id), payload).subscribe({
        next: (res) => {
          this.isSaving.set(false);
          this.updated.emit(res.data);
          this.close();
        },
        error: (err) => {
          this.isSaving.set(false);
          this.errorMessage.set(err?.error?.message || 'فشل تحديث التذكرة');
        },
      });
    } else {
      const payload: CreateTicketPayload = {
        customer_id: this.formData.customer_id!,
        title: this.formData.title,
        priority: this.formData.priority as CreateTicketPayload['priority'],
        machine_id: this.formData.machine_id!,
        customer_care_id: this.auth.isSuperAdmin() ? this.formData.customer_care_id! : Number(this.auth.currentUser()?.id),
      };

      this.ticketsService.createTicket(payload).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.created.emit();
          this.close();
        },
        error: (err) => {
          this.isSaving.set(false);
          this.errorMessage.set(err?.error?.message || 'فشل إنشاء التذكرة');
        },
      });
    }
  }
}
