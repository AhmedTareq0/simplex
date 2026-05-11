import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ApiResponse, PagedResult } from '../../../core/interfaces/api-response.interface';
import { buildHttpParams } from '../../../core/utils/http-params.util';
import { Observable } from 'rxjs';

export interface Employee {
  id: number;
  odoo_user_id: number;
  partner_id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  avatar_url: string | null;
  employee_role: string;
  department: string;
  created_at: string;
  last_login_at: string | null;
}

export interface EmployeeFilters {
  page?: number;
  page_size?: number;
  search?: string;
  department?: string;
}

export interface EmployeeDetails {
  id: number;
  name: string;
  email: string;
  department: string;
  employee_role: string;
  total_assigned_tickets: number;
  total_assigned_visits: number;
  avatar_url: string | null;
  last_login_at: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  readonly employees = signal<Employee[]>([]);
  readonly isLoading = signal(false);
  readonly total = signal(0);

  loadEmployees(filters: EmployeeFilters = {}): void {
    this.isLoading.set(true);

    const params = buildHttpParams({
      page: filters.page,
      pageSize: filters.page_size,
      search: filters.search,
      department: filters.department,
    });

    this.http.get<ApiResponse<PagedResult<Employee>>>(
      `${this.apiUrl}/api/users/employees`, { params }
    )
      .subscribe({
        next: (res) => {
          this.employees.set(res.data?.items || []);
          this.total.set(res.data?.total || 0);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      });
  }

  getEmployeeDetails(id: number): Observable<ApiResponse<EmployeeDetails>> {
    return this.http.get<ApiResponse<EmployeeDetails>>(`${this.apiUrl}/api/users/employees/${id}/details`);
  }
}
