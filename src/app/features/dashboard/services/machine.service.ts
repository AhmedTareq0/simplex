import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/interfaces/api-response.interface';

export interface Machine {
  id: number;
  odooId: number;
  name: string;
  display_name: string;
  description: string;
  description_sale: string;
  list_price: number;
  category: string;
  type: string;
  active: boolean;
  create_date: string;
  write_date: string;
  synced_at: string;
  image_url: string | null;
  document_url: string | null;
}

export interface MachineCategory {
  id: number;
  name: string;
  complete_name: string;
  parent_id: number | null;
}

export interface MachineFilters {
  page?: number;
  pageSize?: number;
  search?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MachineService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getMachines(filters: MachineFilters = {}): Observable<Machine[]> {
    let params = new HttpParams()
      .set('page', (filters.page ?? 1).toString())
      .set('pageSize', (filters.pageSize ?? 20).toString());
    if (filters.search) params = params.set('search', filters.search);

    return this.http.get<ApiResponse<{ items: Machine[]; total: number; page: number; pageSize: number }>>(
      `${this.apiUrl}/api/machines`, { params }
    ).pipe(
      map(res => res.data?.items || [])
    );
  }

  getCategories(): Observable<MachineCategory[]> {
    return this.http.get<ApiResponse<MachineCategory[]>>(`${this.apiUrl}/api/machines/categories`).pipe(
      map(res => res.data)
    );
  }

  syncMachines(): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/api/machines/sync`, {});
  }

  updateMachine(odooId: number, data: FormData): Observable<ApiResponse<Machine>> {
    return this.http.put<ApiResponse<Machine>>(`${this.apiUrl}/api/machines/${odooId}`, data);
  }
}
