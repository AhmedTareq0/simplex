import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/interfaces/api-response.interface';

export interface ReportsSummary {
  ticket_resolution_rate: {
    percentage: number;
    change_percentage: number;
    trend: 'up' | 'down';
  };
  average_response_time: {
    minutes: number;
    change_percentage: number;
    trend: 'faster' | 'slower' | 'stable';
    previous_period_minutes: number;
  };
  customer_satisfaction: {
    score: number;
    total_ratings: number;
  };
}

export interface TeamPerformanceItem {
  employee_id: number;
  employee_name: string;
  resolved_tickets_count: number;
  open_tickets_count: number;
  resolved_visits_count: number;
  open_visits_count: number;
  satisfaction_percentage: number;
  average_response_time_minutes: number;
}

export interface FiltersMetadata {
  departments: string[];
  employees: {
    id: number;
    odoo_user_id: number;
    name: string;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getFiltersMetadata(): Observable<ApiResponse<FiltersMetadata>> {
    return this.http.get<ApiResponse<FiltersMetadata>>(`${this.apiUrl}/api/reports/filters-metadata`);
  }

  getSummary(params: {
    start_date?: string;
    end_date?: string;
    department?: string;
    employee_id?: number;
  }): Observable<ApiResponse<ReportsSummary>> {
    let httpParams = new HttpParams();
    if (params.start_date) httpParams = httpParams.set('start_date', params.start_date);
    if (params.end_date) httpParams = httpParams.set('end_date', params.end_date);
    if (params.department && params.department !== 'all') httpParams = httpParams.set('department', params.department);
    if (params.employee_id) httpParams = httpParams.set('employee_id', String(params.employee_id));

    return this.http.get<ApiResponse<ReportsSummary>>(`${this.apiUrl}/api/reports/summary`, { params: httpParams });
  }

  getTeamPerformance(params: {
    start_date?: string;
    end_date?: string;
    department?: string;
    employee_id?: number;
    search?: string;
    page?: number;
    page_size?: number;
    sort_by?: string;
    sort_order?: string;
  }): Observable<ApiResponse<{ items: TeamPerformanceItem[]; total: number; page: number; page_size: number; total_pages: number }>> {
    let httpParams = new HttpParams();
    if (params.start_date) httpParams = httpParams.set('start_date', params.start_date);
    if (params.end_date) httpParams = httpParams.set('end_date', params.end_date);
    if (params.department && params.department !== 'all') httpParams = httpParams.set('department', params.department);
    if (params.employee_id) httpParams = httpParams.set('employee_id', String(params.employee_id));
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.page) httpParams = httpParams.set('page', String(params.page));
    if (params.page_size) httpParams = httpParams.set('page_size', String(params.page_size));
    if (params.sort_by) httpParams = httpParams.set('sort_by', params.sort_by);
    if (params.sort_order) httpParams = httpParams.set('sort_order', params.sort_order);

    return this.http.get<ApiResponse<{ items: TeamPerformanceItem[]; total: number; page: number; page_size: number; total_pages: number }>>(`${this.apiUrl}/api/reports/team-performance`, { params: httpParams });
  }

  exportExcelUrl(params: {
    start_date?: string;
    end_date?: string;
    department?: string;
    employee_id?: number;
    search?: string;
    sort_by?: string;
    sort_order?: string;
  }): string {
    let httpParams = new HttpParams();
    if (params.start_date) httpParams = httpParams.set('start_date', params.start_date);
    if (params.end_date) httpParams = httpParams.set('end_date', params.end_date);
    if (params.department && params.department !== 'all') httpParams = httpParams.set('department', params.department);
    if (params.employee_id) httpParams = httpParams.set('employee_id', String(params.employee_id));
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.sort_by) httpParams = httpParams.set('sort_by', params.sort_by);
    if (params.sort_order) httpParams = httpParams.set('sort_order', params.sort_order);

    return `${this.apiUrl}/api/reports/export/excel?${httpParams.toString()}`;
  }

  exportPdfUrl(params: {
    start_date?: string;
    end_date?: string;
    department?: string;
    employee_id?: number;
    search?: string;
    sort_by?: string;
    sort_order?: string;
  }): string {
    let httpParams = new HttpParams();
    if (params.start_date) httpParams = httpParams.set('start_date', params.start_date);
    if (params.end_date) httpParams = httpParams.set('end_date', params.end_date);
    if (params.department && params.department !== 'all') httpParams = httpParams.set('department', params.department);
    if (params.employee_id) httpParams = httpParams.set('employee_id', String(params.employee_id));
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.sort_by) httpParams = httpParams.set('sort_by', params.sort_by);
    if (params.sort_order) httpParams = httpParams.set('sort_order', params.sort_order);

    return `${this.apiUrl}/api/reports/export/pdf?${httpParams.toString()}`;
  }

  exportExcelBlob(params: {
    start_date?: string;
    end_date?: string;
    department?: string;
    employee_id?: number;
    search?: string;
    sort_by?: string;
    sort_order?: string;
  }): Observable<Blob> {
    let httpParams = new HttpParams();
    if (params.start_date) httpParams = httpParams.set('start_date', params.start_date);
    if (params.end_date) httpParams = httpParams.set('end_date', params.end_date);
    if (params.department && params.department !== 'all') httpParams = httpParams.set('department', params.department);
    if (params.employee_id) httpParams = httpParams.set('employee_id', String(params.employee_id));
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.sort_by) httpParams = httpParams.set('sort_by', params.sort_by);
    if (params.sort_order) httpParams = httpParams.set('sort_order', params.sort_order);

    return this.http.get(`${this.apiUrl}/api/reports/export/excel`, {
      params: httpParams,
      responseType: 'blob'
    });
  }

  exportPdfHtml(params: {
    start_date?: string;
    end_date?: string;
    department?: string;
    employee_id?: number;
    search?: string;
    sort_by?: string;
    sort_order?: string;
  }): Observable<string> {
    let httpParams = new HttpParams();
    if (params.start_date) httpParams = httpParams.set('start_date', params.start_date);
    if (params.end_date) httpParams = httpParams.set('end_date', params.end_date);
    if (params.department && params.department !== 'all') httpParams = httpParams.set('department', params.department);
    if (params.employee_id) httpParams = httpParams.set('employee_id', String(params.employee_id));
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.sort_by) httpParams = httpParams.set('sort_by', params.sort_by);
    if (params.sort_order) httpParams = httpParams.set('sort_order', params.sort_order);

    return this.http.get(`${this.apiUrl}/api/reports/export/pdf`, {
      params: httpParams,
      responseType: 'text'
    });
  }
}
