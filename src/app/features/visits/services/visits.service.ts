import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse, PagedResult } from '../../../core/interfaces/api-response.interface';
import { buildHttpParams } from '../../../core/utils/http-params.util';
import { AuthLocalService } from '@/auth/services/auth-local.service';

export interface VisitEngineer {
  id: number;
  name: string;
  avatar_url: string | null;
}

export interface VisitCustomer {
  id: number;
  name: string;
}

export interface VisitProduct {
  name: string;
  image_url: string | null;
  description: string;
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
  customer_id?: number;
  engineer_id?: number;
  machine_id?: number;
  machine_name?: string;
  ticket_id?: number;
  visit_date?: string;
  priority?: string;
  notes?: string;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
  engineer_rating?: number;
  engineer_rating_feedback?: string;
  activities?: any[];
  products?: VisitProduct[];
}

export interface VisitFilters {
  status?: string;
  from?: string;
  to?: string;
  page?: number;
  page_size?: number;
}

export interface VisitsResult extends PagedResult<Visit> {
  next_visit?: Visit;
}

@Injectable({ providedIn: 'root' })
export class VisitsService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthLocalService);
  private readonly base = environment.apiUrl;

  readonly visits = signal<Visit[]>([]);
  readonly nextVisit = signal<Visit | null>(null);
  readonly isLoading = signal(false);
  readonly total = signal(0);

  private getVisitsEndpoint(): string {
    return this.auth.hasPermission('visits.view_all')
      ? `${this.base}/api/visits/all`
      : `${this.base}/api/visits`;
  }

  loadVisits(filters: VisitFilters = {}): void {
    this.isLoading.set(true);

    const params = buildHttpParams({
      page: filters.page,
      pageSize: filters.page_size,
      status: filters.status,
      from: filters.from,
      to: filters.to,
    });

    const endpoint = this.getVisitsEndpoint();

    this.http.get<ApiResponse<VisitsResult>>(endpoint, { params })
      .subscribe({
        next: (res) => {
          this.visits.set(res.data?.items || []);
          this.nextVisit.set(res.data?.next_visit || null);
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

  rescheduleVisit(id: number, newDate: string, note?: string): Observable<ApiResponse<Visit>> {
    return this.updateVisit(id, {
      planned_start: newDate,
      notes: note || undefined
    } as any);
  }

  reassignVisit(id: number, engineerId: number): Observable<ApiResponse<Visit>> {
    return this.updateVisit(id, {
      engineer_id: engineerId
    } as any);
  }

  cancelVisit(id: number, reason: string): Observable<ApiResponse<Visit>> {
    return this.updateVisit(id, {
      status: 'cancelled',
      notes: `سبب الإلغاء: ${reason}`
    });
  }

  getVisitActivities(id: number): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.base}/api/visits/${id}/activities`);
  }

  getVisitDetail(id: number): Observable<ApiResponse<Visit>> {
    return this.http.get<ApiResponse<Visit>>(`${this.base}/api/visits/detail?id=${id}`);
  }

  updateVisitStatus(id: number, status: string): Observable<ApiResponse<Visit>> {
    return this.http.put<ApiResponse<Visit>>(`${this.base}/api/visits/status?id=${id}`, { status });
  }

  cancelVisitEngineer(id: number, reason: string): Observable<ApiResponse<Visit>> {
    return this.http.put<ApiResponse<Visit>>(`${this.base}/api/visits/cancel?id=${id}`, { cancellation_reason: reason });
  }


}

export interface TimelineItem {
  id: number;
  type: 'status_change' | 'note' | 'assignment' | 'cancellation' | 'reschedule' | 'sync';
  title: string;
  description?: string;
  user?: string;
  date: string;
  statusFrom?: string;
  statusTo?: string;
}
