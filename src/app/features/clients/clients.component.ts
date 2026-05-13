import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SharedTableComponent, TableColumn } from '../../shared/components';
import { ClientService, Client } from './services/client.service';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';
import { AuthLocalService } from '../../auth/services/auth-local.service';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [
    CommonModule,
    SharedTableComponent,
    SkeletonLoaderComponent
  ],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientsComponent implements OnInit {
  readonly clientService = inject(ClientService);
  readonly auth = inject(AuthLocalService);
  private readonly router = inject(Router);

  currentPage = signal(1);
  pageSize = signal(10);

  get isLoading(): boolean { return this.clientService.isLoading(); }
  get total(): number { return this.clientService.total(); }
  get clients(): Client[] { return this.clientService.clients(); }

  columns: TableColumn[] = [
    { field: 'avatar_url', header: 'الصورة', type: 'image' },
    { field: 'name', header: 'اسم العميل', type: 'text', filterable: true },
    { field: 'email', header: 'البريد الإلكتروني', type: 'text' },
    { field: 'phone', header: 'رقم الهاتف', type: 'text', formatter: (value: string | null) => value || '—' },
  ];

  ngOnInit() {
    this.clientService.loadClients({ page: 1, page_size: this.pageSize() });
  }

  onRowClick(client: Client) {
    this.router.navigate(['/clients', client.id]);
  }

  onPageChange(event: { page: number; rows: number }) {
    this.currentPage.set(event.page);
    this.pageSize.set(event.rows);
    this.clientService.loadClients({ page: event.page, page_size: event.rows });
  }
}
