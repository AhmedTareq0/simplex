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

  @Input() visible = false;
  @Input() isEditMode = false;
  @Input() editData: any = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() created = new EventEmitter<void>();
  @Output() updated = new EventEmitter<any>();

  readonly isSaving = signal(false);
  readonly errorMessage = signal('');
  readonly conversations = signal<Conversation[]>([]);

  // Use computed signals to map data from the existing services
  readonly machineOptions = computed(() => 
    this.machineService.machines().map(m => ({ label: m.name, value: m.name }))
  );

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
    title: '',
    description: '',
    priority: 'medium' as string,
    status: 'open' as string,
    visit_date: '' as string,
    machine_id: '' as string,
    engineer_id: null as number | null,
    conversation_id: '' as string,
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
    // Load data using existing services
    this.machineService.loadMachines({ pageSize: 100 });
    this.employeeService.loadEmployees({ department: 'Maintenance', page_size: 100 });
    this.chatService.getConversations({ page_size: 100 }).subscribe(res => {
      this.conversations.set(res.data?.items || []);
    });
  }

  ngOnChanges() {
    if (this.visible) {
      this.errorMessage.set('');
      if (this.isEditMode && this.editData) {
        this.formData = {
          title: this.editData.title || '',
          description: this.editData.description || '',
          priority: this.editData.priority || 'medium',
          status: this.editData.status || 'open',
          visit_date: this.editData.visit_date ? this.editData.visit_date.split('T')[0] : '',
          machine_id: this.editData.machine_id || '',
          engineer_id: this.editData.engineer_id || null,
          conversation_id: this.editData.conversation_id || '',
        };
      } else {
        this.formData = {
          title: '',
          description: '',
          priority: 'medium',
          status: 'open',
          visit_date: '',
          machine_id: '',
          engineer_id: null,
          conversation_id: '',
        };
      }
    }
  }

  close() {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  onSave() {
    if (!this.formData.title) {
      this.errorMessage.set('يرجى ملء العنوان');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');

    if (this.isEditMode && this.editData?.id) {
      const payload: UpdateTicketPayload = {
        title: this.formData.title,
        description: this.formData.description,
        status: this.formData.status,
        priority: this.formData.priority,
        visit_date: this.formData.visit_date || null,
        engineer_id: this.formData.engineer_id,
        conversation_id: this.formData.conversation_id || null,
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
        title: this.formData.title,
        description: this.formData.description,
        priority: this.formData.priority as CreateTicketPayload['priority'],
        machine_id: this.formData.machine_id || undefined,
        status: this.formData.status,
        visit_date: this.formData.visit_date || null,
        engineer_id: this.formData.engineer_id,
        conversation_id: this.formData.conversation_id || null,
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
