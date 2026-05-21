import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ApiResponse, PagedResult } from '../../../core/interfaces/api-response.interface';
import { buildHttpParams } from '../../../core/utils/http-params.util';
import { Observable, map, tap } from 'rxjs';

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
  total_assigned_tickets?: number;
  total_assigned_visits?: number;
  is_online?: boolean;
}

export interface EmployeeFilters {
  page?: number;
  page_size?: number;
  search?: string;
  department?: string;
  employee_role?: string;
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

export interface SupportTicket {
  id: number;
  odoo_id: number;
  title: string;
  status: string;
  priority: string;
  created_at: string;
}

export interface Visit {
  id: number;
  name: string;
  status: string;
  visit_date: string;
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
    this.fetchEmployees(filters).subscribe();
  }

  fetchEmployees(filters: EmployeeFilters = {}): Observable<Employee[]> {
    this.isLoading.set(true);

    const params = buildHttpParams({
      page: filters.page,
      pageSize: filters.page_size,
      search: filters.search,
      department: filters.department,
      employee_role: filters.employee_role,
    });

    return this.http.get<ApiResponse<PagedResult<Employee>>>(
      `${this.apiUrl}/api/users/employees`, { params }
    ).pipe(
      tap({
        next: (res) => {
          this.employees.set(res.data?.items || []);
          this.total.set(res.data?.total || 0);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      }),
      map(() => this.employees())
    );
  }

  getEmployeeDetails(id: number): Observable<ApiResponse<EmployeeDetails>> {
    return this.http.get<ApiResponse<EmployeeDetails>>(`${this.apiUrl}/api/users/employees/${id}/details`);
  }

  getEmployeeTickets(id: number, page = 1, pageSize = 10): Observable<ApiResponse<PagedResult<SupportTicket>>> {
    const params = buildHttpParams({ page, pageSize });
    return this.http.get<ApiResponse<PagedResult<SupportTicket>>>(
      `${this.apiUrl}/api/users/${id}/tickets`, { params }
    );
  }

  getEmployeeVisits(id: number, page = 1, pageSize = 10): Observable<ApiResponse<PagedResult<Visit>>> {
    const params = buildHttpParams({ page, pageSize });
    return this.http.get<ApiResponse<PagedResult<Visit>>>(
      `${this.apiUrl}/api/users/${id}/visits`, { params }
    );
  }
}
