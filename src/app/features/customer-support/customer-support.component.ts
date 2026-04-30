import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedTableComponent, TableColumn } from '../../shared/components/shared-table/shared-table.component';
import {
  CustomerSupportCreateComponent,
  CreateUserData,
} from './components/customer-support-create/customer-support-create.component';
import {
  CustomerSupportDetailComponent,
  DetailUserData,
} from './components/customer-support-detail/customer-support-detail.component';

interface Client {
  id: string;
  name: string;
  machine: string;
  status: 'active' | 'inactive' | 'maintenance';
  visitDate: string;
  priority: 'low' | 'medium' | 'high';
  lastMessage?: string;
}

@Component({
  selector: 'app-customer-support',
  standalone: true,
  imports: [CommonModule, SharedTableComponent, CustomerSupportCreateComponent, CustomerSupportDetailComponent],
  templateUrl: './customer-support.component.html',
  styleUrl: './customer-support.component.scss',
})
export class CustomerSupportComponent {
  showCreateModal = signal(false);
  showDetailModal = signal(false);
  isEditing = signal(false);
  selectedClient = signal<Client | null>(null);
  isEditMode = signal(false);
  editData = signal<CreateUserData | null>(null);

  clients = signal<Client[]>([
    { id: '1', name: 'أحمد علي', machine: 'مكنة A-001', status: 'active', visitDate: '2026-04-30', priority: 'high' },
    { id: '2', name: 'محمد خالد', machine: 'مكنة B-002', status: 'inactive', visitDate: '2026-05-01', priority: 'medium' },
    { id: '3', name: 'سمير حسن', machine: 'مكنة C-003', status: 'maintenance', visitDate: '2026-05-02', priority: 'low' },
    { id: '4', name: 'ياسر محمود', machine: 'مكنة A-004', status: 'active', visitDate: '2026-05-03', priority: 'high' },
    { id: '5', name: 'خالد عبدالله', machine: 'مكنة B-005', status: 'active', visitDate: '2026-05-04', priority: 'medium' },
  ]);

  columns: TableColumn[] = [
    { field: 'name', header: 'الاسم', type: 'text' },
    { field: 'machine', header: 'المكنة', type: 'text' },
    { field: 'visitDate', header: 'تاريخ الزيارة', type: 'text' },
    { field: 'priority', header: 'الأولوية', type: 'text' },
    { field: 'status', header: 'الحالة', type: 'status' },
  ];

  openCreateModal() {
    this.isEditMode.set(false);
    this.editData.set(null);
    this.showCreateModal.set(true);
  }

  closeCreateModal() {
    this.showCreateModal.set(false);
    this.isEditMode.set(false);
    this.editData.set(null);
  }

  onCreateUser(data: CreateUserData) {
    const newId = (this.clients().length + 1).toString();
    this.clients.update((list) => [
      ...list,
      {
        id: newId,
        name: data.name,
        machine: data.machine,
        status: data.status,
        visitDate: new Date().toISOString().split('T')[0],
        priority: 'medium',
      },
    ]);
    this.closeCreateModal();
  }

  onUpdateUserFromCreate(data: CreateUserData) {
    if (data.id) {
      this.clients.update((list) =>
        list.map((u) => (u.id === data.id ? { ...u, ...data } : u))
      );
    }
    this.closeCreateModal();
  }

  onEditFromDetail(client: Client) {
    this.editData.set({
      id: client.id,
      name: client.name,
      machine: client.machine,
      status: client.status,
      visitDate: client.visitDate,
      priority: client.priority,
    });
    this.isEditMode.set(true);
    this.showCreateModal.set(true);
  }

  onRowClick(client: Client) {
    this.selectedClient.set(client);
    this.isEditing.set(false);
    this.showDetailModal.set(true);
  }

  onEditClient(client: Client) {
    this.editData.set({
      id: client.id,
      name: client.name,
      machine: client.machine,
      status: client.status,
      visitDate: client.visitDate,
      priority: client.priority,
    });
    this.isEditMode.set(true);
    this.showCreateModal.set(true);
  }

  closeDetailModal() {
    this.showDetailModal.set(false);
    this.selectedClient.set(null);
    this.isEditing.set(false);
  }

  onEditModeChange(editing: boolean) {
    this.isEditing.set(editing);
  }

  onUpdateUser(data: DetailUserData) {
    this.clients.update((list) =>
      list.map((u) => (u.id === data.id ? { ...u, ...data } : u))
    );
  }

  onDeleteUserById(id: string) {
    this.clients.update((list) => list.filter((u) => u.id !== id));
    this.closeDetailModal();
  }

  onDeleteUser(user: Client) {
    this.clients.update((list) => list.filter((u) => u.id !== user.id));
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      active: 'نشط',
      inactive: 'غير نشط',
      maintenance: 'صيانة',
    };
    return map[status] || status;
  }

  getStatusColor(status: string): string {
    const map: Record<string, string> = {
      active: 'var(--color-success)',
      inactive: 'var(--color-danger)',
      maintenance: 'var(--color-warning)',
    };
    return map[status] || 'var(--color-text-secondary)';
  }

  getPriorityLabel(priority: string): string {
    const map: Record<string, string> = {
      high: 'عالية',
      medium: 'متوسطة',
      low: 'منخفضة',
    };
    return map[priority] || priority;
  }

  getPriorityColor(priority: string): string {
    const map: Record<string, string> = {
      high: 'var(--color-danger)',
      medium: 'var(--color-warning)',
      low: 'var(--color-success)',
    };
    return map[priority] || 'var(--color-text-secondary)';
  }
}
