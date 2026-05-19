import { Component, EventEmitter, Input, Output, inject, signal, computed, effect } from '@angular/core';
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
  private readonly clientService = inject(ClientService);
  private readonly auth = inject(AuthLocalService);

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

  constructor() {
    effect(() => {
      const emps = this.employeeService.employees();
      if (this.isEditMode && this.editData && emps.length > 0 && !this.formData.engineer_id) {
        const emp = emps.find(e => e.name === this.editData.engineer_name);
        if (emp) {
          this.formData.engineer_id = emp.odoo_user_id;
        }
      }
    });
  }


  readonly engineerOptions = computed(() =>
    this.employeeService.employees()
      .filter(e => e.department === 'Maintenance' || e.employee_role === 'Maintenance')
      .map(e => ({ label: e.name, value: e.odoo_user_id }))
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
    engineer_id: null as number | null,
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
  ];

  ngOnInit() {
  }

  ngOnChanges() {
    if (this.visible) {
      if (this.auth.hasPermission('tickets.create') || this.auth.hasPermission('tickets.update')) {
        this.clientService.loadClients({ page_size: 100 });
        this.employeeService.loadEmployees({ department: 'Maintenance', page_size: 100 });
        this.machineService.loadMachines({ pageSize: 100 });

        if (this.auth.hasPermission('chat.cc') || this.auth.hasPermission('chat.engineer')) {
          this.chatService.getConversations({ page_size: 100 }).subscribe(res => {
            this.conversations.set(res.data?.items || []);
          });
        }
      }

      this.errorMessage.set('');
      if (this.isEditMode && this.editData) {
        const emp = this.employeeService.employees().find(e => e.name === this.editData.engineer_name);
        this.formData = {
          customer_id: this.editData.customer_id || null,
          title: this.editData.title || '',
          priority: this.editData.priority === 'normal' ? 'medium' : (this.editData.priority || 'medium'),
          machine_id: this.editData.machine_id || null,
          engineer_id: emp ? emp.odoo_user_id : (this.editData.engineer_id || null),
        };
      } else {
        this.formData = {
          customer_id: null,
          title: '',
          priority: 'medium',
          machine_id: null,
          engineer_id: null,
        };
      }
    }
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

    this.isSaving.set(true);
    this.errorMessage.set('');

    if (this.isEditMode && this.editData?.id) {
      const payload: UpdateTicketPayload = {
        title: this.formData.title,
        priority: this.formData.priority,
        engineer_id: this.formData.engineer_id,
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
        machine_id: this.formData.machine_id || undefined,
        engineer_id: this.formData.engineer_id,
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
