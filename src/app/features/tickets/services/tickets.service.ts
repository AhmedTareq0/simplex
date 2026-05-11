import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse, PagedResult } from '../../../core/interfaces/api-response.interface';
import { buildHttpParams } from '../../../core/utils/http-params.util';

export interface Ticket {
  id: number;
  odoo_id: number;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'solved';
  priority: 'low' | 'medium' | 'high';
  visit_date: string | null;
  machine_id: string;
  conversation_id: string;
  engineer_name: string | null;
  customer_care_name: string;
  created_at: string;
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
  status?: string;
  priority?: string;
  visit_date?: string | null;
}

@Injectable({ providedIn: 'root' })
export class TicketsService {
  private readonly http = inject(HttpClient);
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

    this.http.get<ApiResponse<PagedResult<Ticket>>>(`${this.base}/api/tickets/all`, { params })
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
}
