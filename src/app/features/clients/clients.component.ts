import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedTableComponent, TableColumn, ButtonComponent } from '../../shared/components';
import { ClientService, Client } from './services/client.service';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';
import { AuthLocalService } from '../../auth/services/auth-local.service';
import { ClientEditModalComponent } from './components/client-edit-modal/client-edit-modal.component';
import { ClientDetailComponent } from './components/client-detail/client-detail.component';
import { ApiResponse } from '../../core/interfaces/api-response.interface';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [
    CommonModule, 
    SharedTableComponent, 
    SkeletonLoaderComponent, 
    ButtonComponent,
    ClientEditModalComponent,
    ClientDetailComponent
  ],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientsComponent implements OnInit {
  readonly clientService = inject(ClientService);
  readonly auth = inject(AuthLocalService);

  selectedClient = signal<Client | null>(null);
  showEditModal = signal(false);
  showDetailModal = signal(false);
  isSubmitting = signal(false);

  get isLoading(): boolean { return this.clientService.isLoading(); }
  get clients(): Client[] { return this.clientService.clients(); }

  columns: TableColumn[] = [
    { field: 'image_url', header: 'الصورة', type: 'image' },
    { field: 'display_name', header: 'اسم العميل', type: 'text', filterable: true },
    { field: 'company_name', header: 'الشركة', type: 'text' },
    { field: 'email', header: 'البريد الإلكتروني', type: 'text' },
    { field: 'phone', header: 'رقم الهاتف', type: 'text' },
    { field: 'city', header: 'المدينة', type: 'text' },
    { 
      field: 'total_tickets', 
      header: 'التذاكر', 
      type: 'badge',
      color: '#3b82f6'
    }
  ];

  ngOnInit() {
    this.clientService.loadClients();
  }

  onAdd() {
    this.selectedClient.set({ id: 0 } as Client);
    this.showEditModal.set(true);
    this.showDetailModal.set(false);
  }

  onEdit(client: Client) {
    this.selectedClient.set(client);
    this.showEditModal.set(true);
    this.showDetailModal.set(false);
  }

  onRowClick(client: Client) {
    this.selectedClient.set(client);
    this.showDetailModal.set(true);
    this.showEditModal.set(false);
  }

  handleSaveClient(formData: FormData) {
    const client = this.selectedClient();
    if (!client) return;

    this.isSubmitting.set(true);
    const observable = client.id === 0 
      ? this.clientService.createClient(formData)
      : this.clientService.updateClient(client.id, formData);

    observable.subscribe({
      next: (res: ApiResponse<Client>) => {
        this.isSubmitting.set(false);
        if (res.success) {
          this.showEditModal.set(false);
          this.selectedClient.set(null);
          this.clientService.loadClients();
        }
      },
      error: () => this.isSubmitting.set(false)
    });
  }
}
