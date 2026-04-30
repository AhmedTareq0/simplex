import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SharedModalComponent } from '../../../../shared/components/shared-modal/shared-modal.component';
import { SharedSelectComponent } from '../../../../shared/components/shared-select/shared-select.component';
import { SharedInputComponent } from '../../../../shared/components/shared-input/shared-input.component';

export interface CreateUserData {
  id?: string;
  name: string;
  machine: string;
  status: 'active' | 'inactive' | 'maintenance';
  visitDate: string;
  priority: 'low' | 'medium' | 'high';
}

@Component({
  selector: 'app-customer-support-create',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    SharedInputComponent,
    SharedSelectComponent,
    SharedModalComponent,
  ],
  templateUrl: './customer-support-create.component.html',
  styleUrl: './customer-support-create.component.scss',
})
export class CustomerSupportCreateComponent {
  @Input() visible = false;
  @Input() isEditMode = false;
  @Input() editData: CreateUserData | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() create = new EventEmitter<CreateUserData>();
  @Output() update = new EventEmitter<CreateUserData>();

  newUser: Partial<CreateUserData> = {
    name: '',
    machine: '',
    status: 'active',
    visitDate: new Date().toISOString().split('T')[0],
    priority: 'medium',
  };

  customerOptions = [
    { label: 'أحمد ناصر', value: 'أحمد ناصر' },
    { label: 'محمد مصطفى', value: 'محمد مصطفى' },
    { label: 'محمود علي', value: 'محمود علي' },
    { label: 'شركة الأمل', value: 'شركة الأمل' },
    { label: 'مصنع الشرق', value: 'مصنع الشرق' },
  ];

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
        this.newUser = { ...this.editData };
      } else {
        this.newUser = {
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
    if (!this.newUser.name || !this.newUser.machine) return;

    const userData: CreateUserData = {
      name: this.newUser.name,
      machine: this.newUser.machine,
      status: (this.newUser.status as CreateUserData['status']) || 'active',
      visitDate: this.newUser.visitDate || new Date().toISOString().split('T')[0],
      priority: (this.newUser.priority as CreateUserData['priority']) || 'medium',
    };

    if (this.isEditMode && this.editData?.id) {
      userData.id = this.editData.id;
      this.update.emit(userData);
    } else {
      this.create.emit(userData);
    }
    this.close();
  }
}
