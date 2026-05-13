import { Component, input, output, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  SharedModalComponent,
  SharedInputComponent,
  SharedSelectComponent,
  ButtonComponent
} from '@/shared/components';
import { Visit } from '../../services/visits.service';

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

  visit = input.required<Visit>();
  isSubmitting = input<boolean>(false);
  visible = input<boolean>(false);

  save = output<any>();
  cancel = output<void>();

  editForm: FormGroup = this.fb.group({
    customer_name: ['', Validators.required],
    engineer_name: ['', Validators.required],
    machine_name: [''],
    planned_start: ['', Validators.required],
    status: ['in_progress', Validators.required],
    priority: ['medium', Validators.required],
    notes: ['']
  });

  statusOptions = [
    { label: 'جديدة', value: 'new' },
    { label: 'قيد التنفيذ', value: 'in_progress' },
    { label: 'مكتملة', value: 'done' },
    { label: 'ملغاة', value: 'cancelled' }
  ];

  priorityOptions = [
    { label: 'عالية', value: 'high' },
    { label: 'متوسطة', value: 'medium' },
    { label: 'عادية', value: 'normal' },
    { label: 'منخفضة', value: 'low' }
  ];

  ngOnInit() {
    const visit = this.visit();
    if (visit && visit.id !== 0) {
      const visitDate = visit.planned_start || visit.visit_date || '';
      this.editForm.patchValue({
        customer_name: visit.customer?.name || visit.customer_name || '',
        engineer_name: visit.engineer?.name || visit.engineer_name || '',
        machine_name: visit.machine_name || '',
        planned_start: visitDate ? visitDate.split('T')[0] : '',
        status: visit.status || 'in_progress',
        priority: visit.priority || 'medium',
        notes: visit.notes || ''
      });
    } else {
      this.editForm.reset({
        status: 'in_progress',
        priority: 'medium'
      });
    }
  }

  onSubmit() {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    this.save.emit(this.editForm.value);
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
