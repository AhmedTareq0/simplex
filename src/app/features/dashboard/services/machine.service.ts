import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Machine {
  id: number;
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

export interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class MachineService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getMachines(): Observable<Machine[]> {
    return this.http.get<ApiResponse<Machine[]>>(`${this.apiUrl}/api/machines/all`).pipe(
      map(res => res.data)
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

  updateMachine(id: number, data: FormData): Observable<ApiResponse<Machine>> {
    return this.http.put<ApiResponse<Machine>>(`${this.apiUrl}/api/machines/${id}`, data);
  }
}
