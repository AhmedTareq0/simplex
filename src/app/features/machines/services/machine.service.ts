import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse, PagedResult } from '../../../core/interfaces/api-response.interface';
import { buildHttpParams } from '../../../core/utils/http-params.util';

export interface Machine {
  id: number;
  odooId?: number;
  odoo_id?: number;
  name: string;
  display_name: string;
  default_code: string | null;
  description: string;
  description_sale: string;
  list_price: number;
  category: string;
  category_id?: number;
  type: string;
  product_kind?: string;
  active: boolean;
  free_to_use: number;
  qty_available: number;
  create_date: string;
  write_date: string;
  synced_at: string;
  image_url: string | null;
  document_url: string | null;
  model_number?: string;
  serial_number?: string;
  warranty_period?: number;
  origin_country?: string;
  technical_specs?: string;
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
  category?: string;
  type?: string;
  available?: boolean;
  productKind?: 'machine' | 'spareparts';
}

@Injectable({
  providedIn: 'root'
})
export class MachineService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  readonly machines = signal<Machine[]>([]);
  readonly isLoading = signal(false);
  readonly total = signal(0);

  loadMachines(filters: MachineFilters = {}): void {
    this.fetchMachines(filters).subscribe();
  }

  fetchMachines(filters: MachineFilters = {}): Observable<Machine[]> {
    return this.fetchMachineList(filters, true);
  }

  fetchSpareParts(filters: Omit<MachineFilters, 'productKind'> = {}): Observable<Machine[]> {
    return this.fetchMachineList({ ...filters, productKind: 'spareparts' }, false);
  }

  private fetchMachineList(filters: MachineFilters = {}, updateState: boolean): Observable<Machine[]> {
    if (updateState) this.isLoading.set(true);
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 10;

    const params = buildHttpParams({
      page,
      pageSize,
      search: filters.search,
      category: filters.category,
      type: filters.type,
      available: filters.available,
      productKind: filters.productKind ?? 'machine',
    });

    return this.http.get<ApiResponse<PagedResult<Machine> | Machine[]>>(
      `${this.apiUrl}/api/machines/all`, { params }
    ).pipe(
      map((res) => {
        const data = res.data;
        if (Array.isArray(data)) {
          const start = (page - 1) * pageSize;
          const machines = data.map(m => ({ ...m, odooId: m.odooId ?? m.odoo_id ?? m.id }));
          return {
            machines: machines.slice(start, start + pageSize),
            total: machines.length,
          };
        }

        return {
          machines: (data?.items || []).map(m => ({ ...m, odooId: m.odooId ?? m.odoo_id ?? m.id })),
          total: data?.total || 0,
        };
      }),
      tap({
        next: ({ machines, total }) => {
          if (updateState) {
            this.machines.set(machines);
            this.total.set(total);
            this.isLoading.set(false);
          }
        },
        error: () => {
          if (updateState) this.isLoading.set(false);
        },
      }),
      map(({ machines }) => machines)
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

  createMachine(data: FormData): Observable<ApiResponse<Machine>> {
    return this.http.post<ApiResponse<Machine>>(`${this.apiUrl}/api/machines`, data);
  }

  deleteMachine(odooId: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/api/machines/${odooId}`);
  }
}
