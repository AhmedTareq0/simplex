import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/interfaces/api-response.interface';
import { Observable } from 'rxjs';

export interface Client {
  id: number;
  name: string;
  display_name: string;
  email: string;
  phone: string;
  company_name: string;
  address: string;
  city: string;
  active: boolean;
  image_url: string | null;
  total_tickets: number;
  last_purchase?: string;
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

  loadClients(): void {
    this.isLoading.set(true);
    this.http.get<ApiResponse<Client[]>>(`${this.apiUrl}/api/clients/all`)
      .subscribe({
        next: (res) => {
          this.clients.set(res.data || []);
          this.total.set(res.data?.length || 0);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      });
  }

  updateClient(id: number, data: any): Observable<ApiResponse<Client>> {
    return this.http.put<ApiResponse<Client>>(`${this.apiUrl}/api/clients/${id}`, data);
  }

  createClient(data: any): Observable<ApiResponse<Client>> {
    return this.http.post<ApiResponse<Client>>(`${this.apiUrl}/api/clients/create`, data);
  }
}
