import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse, PagedResult } from '../../../core/interfaces/api-response.interface';
import { buildHttpParams } from '../../../core/utils/http-params.util';
import { AuthLocalService } from '@/auth/services/auth-local.service';

export interface Ticket {
  id: number;
  odoo_id: number;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'solved';
  priority: 'low' | 'medium' | 'high';
  visit_date: string | null;
  machine_id: string;
  conversation_id: string | null;
  engineer_name: string | null;
  customer_care_name: string | null;
  odoo_task_id: number | null;
  created_at: string;
  customer_id?: number | null;
  engineer_id?: number | null;
  ticket_rating?: number;
  ticket_rating_feedback?: string;
  customer_name?: string;
  machine_name?: string;
}

export interface TicketFilters {
  status?: string;
  priority?: string;
  from?: string;
  to?: string;
  page?: number;
  page_size?: number;
}

export interface UpdateTicketPayload {
  title?: string;
  status?: string;
  priority?: string;
  visit_date?: string | null;
  engineer_id?: number | null;
}

export interface CreateTicketPayload {
  customer_id: number;
  title: string;
  priority: 'low' | 'medium' | 'high';
  machine_id?: number | string;
  engineer_id?: number | null;
}

export interface SyncResult {
  synced_count: number;
  synced_at: string;
}

@Injectable({ providedIn: 'root' })
export class TicketsService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthLocalService);
  private readonly base = environment.apiUrl;

  readonly tickets = signal<Ticket[]>([]);
  readonly isLoading = signal(false);
  readonly total = signal(0);
  readonly currentPage = signal(1);
  readonly totalPages = signal(1);

  loadTickets(filters: TicketFilters = {}): void {
    this.isLoading.set(true);

    const params = buildHttpParams({
      page: filters.page,
      pageSize: filters.page_size,
      status: filters.status,
      priority: filters.priority,
      from: filters.from,
      to: filters.to,
    });

    this.http.get<ApiResponse<PagedResult<Ticket>>>(this.getTicketsEndpoint(), { params })
      .subscribe({
        next: (res) => {
          this.tickets.set(res.data?.items || []);
          this.total.set(res.data?.total || 0);
          this.currentPage.set(res.data?.page || 1);
          this.totalPages.set(res.data?.total_pages || 1);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  getTicket(id: number): Observable<any> {
    return this.http.get<any>(`${this.base}/api/tickets/${id}`);
  }

  updateTicket(id: number, payload: UpdateTicketPayload): Observable<any> {
    return this.http.put<any>(`${this.base}/api/tickets/${id}`, payload);
  }

  deleteTicket(id: number): Observable<any> {
    return this.http.delete<any>(`${this.base}/api/tickets/${id}`);
  }

  resolveTicket(id: number, notes?: string): Observable<any> {
    return this.http.put<any>(`${this.base}/api/tickets/${id}/resolve`, { notes: notes || null });
  }

  cancelTicket(id: number, reason?: string): Observable<any> {
    return this.http.put<any>(`${this.base}/api/tickets/${id}/cancel`, { reason: reason || null });
  }

  createTicket(payload: CreateTicketPayload): Observable<ApiResponse<Ticket>> {
    return this.http.post<ApiResponse<Ticket>>(`${this.base}/api/tickets`, payload).pipe(
      tap(() => this.loadTickets({ page: this.currentPage(), page_size: 10 }))
    );
  }

  syncTickets(): Observable<ApiResponse<SyncResult>> {
    return this.http.post<ApiResponse<SyncResult>>(`${this.base}/api/tickets/sync`, {});
  }

  loadMyTickets(filters: TicketFilters = {}): void {
    this.isLoading.set(true);

    const params = buildHttpParams({
      page: filters.page,
      pageSize: filters.page_size,
      status: filters.status,
      priority: filters.priority,
      from: filters.from,
      to: filters.to,
    });

    this.http.get<ApiResponse<PagedResult<Ticket>>>(`${this.base}/api/tickets/customer-care`, { params })
      .subscribe({
        next: (res) => {
          this.tickets.set(res.data?.items || []);
          this.total.set(res.data?.total || 0);
          this.currentPage.set(res.data?.page || 1);
          this.totalPages.set(res.data?.total_pages || 1);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  private getTicketsEndpoint(): string {
    if (this.auth.hasPermission('tickets.view_all')) {
      return `${this.base}/api/tickets/all`;
    }
    if (this.auth.hasPermission('tickets.view_cc')) {
      return `${this.base}/api/tickets/customer-care`;
    }
    return `${this.base}/api/tickets/engineer`;
  }
}
