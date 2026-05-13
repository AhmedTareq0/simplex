import { Component, inject, signal, OnInit, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SharedTableComponent, TableColumn, ButtonComponent } from '../../shared/components';
import { EmployeeService, Employee } from './services/employee.service';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';
import { AuthLocalService } from '../../auth/services/auth-local.service';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [
    CommonModule,
    SharedTableComponent,
    SkeletonLoaderComponent
  ],
  templateUrl: './employees.component.html',
  styleUrl: './employees.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeesComponent implements OnInit {
  readonly employeeService = inject(EmployeeService);
  readonly auth = inject(AuthLocalService);
  private readonly router = inject(Router);

  currentPage = signal(1);
  pageSize = signal(10);
  activeTab = signal('all');

  tabs = [
    { label: 'الكل', value: 'all' },
    { label: 'المهندسين', value: 'engineer' },
    { label: 'خدمة العملاء', value: 'customer_care' },
  ];

  get isLoading(): boolean { return this.employeeService.isLoading(); }
  get total(): number { return this.employeeService.total(); }
  get employees(): Employee[] { return this.employeeService.employees(); }

  filteredEmployees = computed(() => {
    const list = this.employees;
    const tab = this.activeTab();
    if (tab === 'all') return list;
    return list.filter(e => e.employee_role === tab);
  });

  columns: TableColumn[] = [
    {
      field: 'is_online',
      header: 'الحالة',
      type: 'status',
      formatter: (value: boolean) => value ? 'متصل' : 'غير متصل',
      colorFormatter: (value: boolean) => value ? '#10b981' : '#94a3b8'
    },
    { field: 'avatar_url', header: 'الصورة', type: 'image' },
    { field: 'name', header: 'الاسم', type: 'text', filterable: true },
    { field: 'email', header: 'البريد الإلكتروني', type: 'text' },
    { field: 'phone', header: 'رقم الهاتف', type: 'text', formatter: (value: string | null) => value || '—' },
    { field: 'department', header: 'القسم', type: 'text' },
    {
      field: 'employee_role',
      header: 'الدور الوظيفي',
      type: 'badge',
      formatter: (value: string) => ({
        engineer: 'مهندس',
        customer_care: 'خدمة عملاء'
      } as any)[value] || value
    },
    {
      field: 'total_assigned_tickets',
      header: 'تذاكر نشطة',
      type: 'badge',
      color: '#2563eb',
      formatter: (value: number) => (value || 0).toString()
    },
    {
      field: 'total_assigned_visits',
      header: 'زيارات نشطة',
      type: 'badge',
      color: '#7c3aed',
      formatter: (value: number) => (value || 0).toString()
    },
  ];

  ngOnInit() {
    this.loadData();
  }

  setTab(tab: string) {
    this.activeTab.set(tab);
    this.currentPage.set(1);
    this.loadData();
  }

  loadData() {
    const role = this.activeTab() === 'all' ? undefined : this.activeTab();
    this.employeeService.loadEmployees({
      page: this.currentPage(),
      page_size: this.pageSize(),
      employee_role: role
    });
  }

  onRowClick(employee: Employee) {
    this.router.navigate(['/employees', employee.id]);
  }

  onPageChange(event: { page: number; rows: number }) {
    this.currentPage.set(event.page);
    this.pageSize.set(event.rows);
    this.loadData();
  }
}
