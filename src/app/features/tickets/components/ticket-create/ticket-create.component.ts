import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SharedModalComponent } from '../../../../shared/components/shared-modal/shared-modal.component';
import { SharedSelectComponent } from '../../../../shared/components/shared-select/shared-select.component';
import { SharedInputComponent } from '../../../../shared/components/shared-input/shared-input.component';

export interface CreateTicketData {
  id?: string;
  name: string;
  machine: string;
  status: 'active' | 'inactive' | 'maintenance';
  visitDate: string;
  priority: 'low' | 'medium' | 'high';
}

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
  @Input() visible = false;
  @Input() isEditMode = false;
  @Input() editData: CreateTicketData | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() create = new EventEmitter<CreateTicketData>();
  @Output() update = new EventEmitter<CreateTicketData>();

  newTicket: Partial<CreateTicketData> = {
    name: '',
    machine: '',
    status: 'active',
    visitDate: new Date().toISOString().split('T')[0],
    priority: 'medium',
  };

  statusOptions = [
    { label: 'نشط', value: 'active' },
    { label: 'غير نشط', value: 'inactive' },
    { label: 'صيانة', value: 'maintenance' },
  ];

  priorityOptions = [
    { label: 'عالية', value: 'high' },
    { label: 'متوسطة', value: 'medium' },
    { label: 'منخفضة', value: 'low' },
  ];

  ngOnChanges() {
    if (this.visible) {
      if (this.isEditMode && this.editData) {
        this.newTicket = { ...this.editData };
      } else {
        this.newTicket = {
          name: '',
          machine: '',
          status: 'active',
          visitDate: new Date().toISOString().split('T')[0],
          priority: 'medium',
        };
      }
    }
  }

  close() {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  onSave() {
    if (!this.newTicket.name || !this.newTicket.machine) return;

    const ticketData: CreateTicketData = {
      name: this.newTicket.name,
      machine: this.newTicket.machine,
      status: (this.newTicket.status as CreateTicketData['status']) || 'active',
      visitDate: this.newTicket.visitDate || new Date().toISOString().split('T')[0],
      priority: (this.newTicket.priority as CreateTicketData['priority']) || 'medium',
    };

    if (this.isEditMode && this.editData?.id) {
      ticketData.id = this.editData.id;
      this.update.emit(ticketData);
    } else {
      this.create.emit(ticketData);
    }
    this.close();
  }
}
