import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse, PagedResult } from '../../../core/interfaces/api-response.interface';
import { buildHttpParams } from '../../../core/utils/http-params.util';

export interface VisitEngineer {
  id: number;
  name: string;
  avatar_url: string | null;
}

export interface VisitCustomer {
  id: number;
  name: string;
}

export interface Visit {
  id: number;
  name: string;
  engineer?: VisitEngineer;
  customer?: VisitCustomer;
  status: string;
  stage?: string;
  planned_start?: string;
  planned_end?: string | null;
  deadline?: string | null;
  customer_name?: string;
  engineer_name?: string;
  machine_name?: string;
  visit_date?: string;
  priority?: string;
  notes?: string;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface VisitFilters {
  status?: string;
  from?: string;
  to?: string;
  page?: number;
  page_size?: number;
}

@Injectable({ providedIn: 'root' })
export class VisitsService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  readonly visits = signal<Visit[]>([]);
  readonly isLoading = signal(false);
  readonly total = signal(0);

  loadVisits(filters: VisitFilters = {}, all: boolean = true): void {
    this.isLoading.set(true);

    const params = buildHttpParams({
      page: filters.page,
      pageSize: filters.page_size,
      status: filters.status,
      from: filters.from,
      to: filters.to,
    });

    const endpoint = all ? `${this.base}/api/visits/all` : `${this.base}/api/visits`;

    this.http.get<ApiResponse<PagedResult<Visit>>>(endpoint, { params })
      .subscribe({
        next: (res) => {
          this.visits.set(res.data?.items || []);
          this.total.set(res.data?.total || 0);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        }
      });
  }

  syncVisits(): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.base}/api/visits/sync`, {});
  }

  getVisit(id: number): Observable<ApiResponse<Visit>> {
    return this.http.get<ApiResponse<Visit>>(`${this.base}/api/visits/${id}`);
  }

  createVisit(data: any): Observable<ApiResponse<Visit>> {
    return this.http.post<ApiResponse<Visit>>(`${this.base}/api/visits`, data);
  }

  updateVisit(id: number, data: Partial<Visit>): Observable<ApiResponse<Visit>> {
    return this.http.put<ApiResponse<Visit>>(`${this.base}/api/visits/${id}`, data);
  }
}
