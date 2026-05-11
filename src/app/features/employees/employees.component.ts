import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedTableComponent, TableColumn, ButtonComponent } from '../../shared/components';
import { EmployeeService, Employee } from './services/employee.service';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';
import { AuthLocalService } from '../../auth/services/auth-local.service';
import { EmployeeDetailComponent } from './components/employee-detail/employee-detail.component';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [
    CommonModule,
    SharedTableComponent,
    SkeletonLoaderComponent,
    EmployeeDetailComponent,
  ],
  templateUrl: './employees.component.html',
  styleUrl: './employees.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeesComponent implements OnInit {
  readonly employeeService = inject(EmployeeService);
  readonly auth = inject(AuthLocalService);

  selectedEmployee = signal<Employee | null>(null);
  showDetailModal = signal(false);
  currentPage = signal(1);
  pageSize = signal(10);

  get isLoading(): boolean { return this.employeeService.isLoading(); }
  get total(): number { return this.employeeService.total(); }
  get employees(): Employee[] { return this.employeeService.employees(); }

  columns: TableColumn[] = [
    { field: 'avatar_url', header: 'الصورة', type: 'image' },
    { field: 'name', header: 'الاسم', type: 'text', filterable: true },
    { field: 'email', header: 'البريد الإلكتروني', type: 'text' },
    { field: 'phone', header: 'رقم الهاتف', type: 'text', formatter: (value: string | null) => value || '—' },
    { field: 'department', header: 'القسم', type: 'text' },

  ];

  ngOnInit() {
    this.employeeService.loadEmployees({ page: 1, page_size: this.pageSize() });
  }

  onRowClick(employee: Employee) {
    this.selectedEmployee.set(employee);
    this.showDetailModal.set(true);
  }

  onPageChange(event: { page: number; rows: number }) {
    this.currentPage.set(event.page);
    this.pageSize.set(event.rows);
    this.employeeService.loadEmployees({ page: event.page, page_size: event.rows });
  }
}
