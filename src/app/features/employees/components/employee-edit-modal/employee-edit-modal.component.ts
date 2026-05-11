import { Component, input, output, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { 
  SharedModalComponent, 
  SharedInputComponent, 
  SharedSelectComponent, 
  IconComponent,
  ButtonComponent
} from '../../../../shared/components';
import { Employee } from '../../services/employee.service';

@Component({
  selector: 'app-employee-edit-modal',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule, 
    SharedModalComponent,
    SharedInputComponent,
    SharedSelectComponent,
    IconComponent,
    ButtonComponent
  ],
  templateUrl: './employee-edit-modal.component.html',
  styleUrls: ['./employee-edit-modal.component.scss']
})
export class EmployeeEditModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  employee = input.required<Employee>();
  visible = input<boolean>(false);
  isSubmitting = input<boolean>(false);

  save = output<FormData>();
  cancel = output<void>();

  editForm!: FormGroup;
  imagePreview = signal<string | null>(null);
  selectedFile: File | null = null;

  departmentOptions = [
    { label: 'المبيعات', value: 'Sales' },
    { label: 'الدعم الفني', value: 'Support' },
    { label: 'الهندسة', value: 'Engineering' },
    { label: 'الإدارة', value: 'Management' }
  ];

  roleOptions = [
    { label: 'مدير', value: 'Admin' },
    { label: 'موظف', value: 'User' },
    { label: 'دعم فني', value: 'Support' }
  ];

  ngOnInit() {
    this.initForm();
    if (this.employee().image_url) {
      this.imagePreview.set(this.employee().image_url);
    }
  }

  private initForm() {
    const e = this.employee();
    this.editForm = this.fb.group({
      name: [e.name || '', Validators.required],
      display_name: [e.display_name || '', Validators.required],
      email: [e.email || '', [Validators.required, Validators.email]],
      phone: [e.phone || '', Validators.required],
      department: [e.department || 'Support', Validators.required],
      employee_role: [e.employee_role || 'User', Validators.required],
      active: [e.active ?? true]
    });
  }

  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => this.imagePreview.set(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  onSubmit() {
    if (this.editForm.invalid) return;

    const formData = new FormData();
    const values = this.editForm.value;
    
    Object.keys(values).forEach(key => {
      formData.append(key, values[key]);
    });

    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    this.save.emit(formData);
  }
}
