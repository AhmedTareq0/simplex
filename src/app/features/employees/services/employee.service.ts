import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/interfaces/api-response.interface';
import { Observable } from 'rxjs';

export interface Employee {
  id: number;
  name: string;
  display_name: string;
  email: string;
  phone: string;
  department: string;
  employee_role: string;
  user_type: string;
  active: boolean;
  image_url: string | null;
  last_login: string | null;
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

  loadEmployees(): void {
    this.isLoading.set(true);
    this.http.get<ApiResponse<Employee[]>>(`${this.apiUrl}/api/employees/all`)
      .subscribe({
        next: (res) => {
          this.employees.set(res.data || []);
          this.total.set(res.data?.length || 0);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      });
  }

  updateEmployee(id: number, data: any): Observable<ApiResponse<Employee>> {
    return this.http.put<ApiResponse<Employee>>(`${this.apiUrl}/api/employees/${id}`, data);
  }

  createEmployee(data: any): Observable<ApiResponse<Employee>> {
    return this.http.post<ApiResponse<Employee>>(`${this.apiUrl}/api/employees/create`, data);
  }
}
