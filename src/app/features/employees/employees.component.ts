import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedTableComponent, TableColumn, ButtonComponent } from '../../shared/components';
import { EmployeeService, Employee } from './services/employee.service';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';
import { AuthLocalService } from '../../auth/services/auth-local.service';
import { EmployeeEditModalComponent } from './components/employee-edit-modal/employee-edit-modal.component';
import { EmployeeDetailComponent } from './components/employee-detail/employee-detail.component';
import { ApiResponse } from '../../core/interfaces/api-response.interface';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [
    CommonModule, 
    SharedTableComponent, 
    SkeletonLoaderComponent, 
    ButtonComponent, 
    EmployeeEditModalComponent, 
    EmployeeDetailComponent
  ],
  templateUrl: './employees.component.html',
  styleUrl: './employees.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeesComponent implements OnInit {
  readonly employeeService = inject(EmployeeService);
  readonly auth = inject(AuthLocalService);

  selectedEmployee = signal<Employee | null>(null);
  showEditModal = signal(false);
  showDetailModal = signal(false);
  isSubmitting = signal(false);

  get isLoading(): boolean { return this.employeeService.isLoading(); }
  get employees(): Employee[] { return this.employeeService.employees(); }

  columns: TableColumn[] = [
    { field: 'image_url', header: 'الصورة', type: 'image' },
    { field: 'display_name', header: 'الاسم', type: 'text', filterable: true },
    { field: 'email', header: 'البريد الإلكتروني', type: 'text' },
    { field: 'phone', header: 'رقم الهاتف', type: 'text' },
    { field: 'department', header: 'القسم', type: 'text' },
    { field: 'employee_role', header: 'الدور', type: 'badge', color: '#6366f1' },
    { 
      field: 'active', 
      header: 'الحالة', 
      type: 'status',
      formatter: (val: boolean) => val ? 'نشط' : 'غير نشط',
      color: '#10b981'
    }
  ];

  ngOnInit() {
    this.employeeService.loadEmployees();
  }

  onAdd() {
    this.selectedEmployee.set({ id: 0 } as Employee);
    this.showEditModal.set(true);
    this.showDetailModal.set(false);
  }

  onEdit(employee: Employee) {
    this.selectedEmployee.set(employee);
    this.showEditModal.set(true);
    this.showDetailModal.set(false);
  }

  onRowClick(employee: Employee) {
    this.selectedEmployee.set(employee);
    this.showDetailModal.set(true);
    this.showEditModal.set(false);
  }

  handleSaveEmployee(formData: FormData) {
    const employee = this.selectedEmployee();
    if (!employee) return;

    this.isSubmitting.set(true);
    const observable = employee.id === 0 
      ? this.employeeService.createEmployee(formData)
      : this.employeeService.updateEmployee(employee.id, formData);

    observable.subscribe({
      next: (res: ApiResponse<Employee>) => {
        this.isSubmitting.set(false);
        if (res.success) {
          this.showEditModal.set(false);
          this.selectedEmployee.set(null);
          this.employeeService.loadEmployees();
        }
      },
      error: () => this.isSubmitting.set(false)
    });
  }
}
