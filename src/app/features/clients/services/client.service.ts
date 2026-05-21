import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ApiResponse, PagedResult } from '../../../core/interfaces/api-response.interface';
import { buildHttpParams } from '../../../core/utils/http-params.util';
import { Observable, map, tap } from 'rxjs';

export interface Client {
  id: number;
  odoo_user_id: number;
  partner_id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  avatar_url: string | null;
  created_at: string;
  last_login_at: string | null;
}

export interface ClientFilters {
  page?: number;
  page_size?: number;
  search?: string;
}

export interface ClientDetails {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  total_machines: number;
  total_tickets: number;
  total_visits: number;
  avatar_url: string | null;
  created_at: string;
  last_login_at: string | null;
}

export interface PartnerMachine {
  id: number;
  name: string;
  order_reference: string;
  category: string;
  image_url: string | null;
  price: number;
  currency: string;
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
export class ClientService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  readonly clients = signal<Client[]>([]);
  readonly isLoading = signal(false);
  readonly total = signal(0);

  loadClients(filters: ClientFilters = {}): void {
    this.fetchClients(filters).subscribe();
  }

  fetchClients(filters: ClientFilters = {}): Observable<Client[]> {
    this.isLoading.set(true);

    const params = buildHttpParams({
      page: filters.page,
      pageSize: filters.page_size,
      search: filters.search,
    });

    return this.http.get<ApiResponse<PagedResult<Client>>>(
      `${this.apiUrl}/api/users/customers`, { params }
    ).pipe(
      tap({
        next: (res) => {
          this.clients.set(res.data?.items || []);
          this.total.set(res.data?.total || 0);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      }),
      map(() => this.clients())
    );
  }

  getClientDetails(id: number): Observable<ApiResponse<ClientDetails>> {
    return this.http.get<ApiResponse<ClientDetails>>(`${this.apiUrl}/api/users/${id}/details`);
  }

  getClientMachines(userId: number, page = 1, pageSize = 10): Observable<ApiResponse<PagedResult<PartnerMachine>>> {
    const params = buildHttpParams({ page, pageSize });
    return this.http.get<ApiResponse<PagedResult<PartnerMachine>>>(
      `${this.apiUrl}/api/users/${userId}/machines`, { params }
    );
  }

  getClientTickets(id: number, page = 1, pageSize = 10): Observable<ApiResponse<PagedResult<SupportTicket>>> {
    const params = buildHttpParams({ page, pageSize });
    return this.http.get<ApiResponse<PagedResult<SupportTicket>>>(
      `${this.apiUrl}/api/users/${id}/tickets`, { params }
    );
  }

  getClientVisits(id: number, page = 1, pageSize = 10): Observable<ApiResponse<PagedResult<Visit>>> {
    const params = buildHttpParams({ page, pageSize });
    return this.http.get<ApiResponse<PagedResult<Visit>>>(
      `${this.apiUrl}/api/users/${id}/visits`, { params }
    );
  }
}
