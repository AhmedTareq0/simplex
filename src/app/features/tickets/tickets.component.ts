import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SharedTableComponent, TableColumn, ButtonComponent } from '../../shared/components';
import { TicketDetailComponent } from './components/ticket-detail/ticket-detail.component';
import { TicketCreateComponent } from './components/ticket-create/ticket-create.component';
import { TicketsService, Ticket } from './services/tickets.service';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';
import { AuthLocalService } from '../../auth/services/auth-local.service';
import { AdminSyncService } from '../../core/services/admin-sync.service';

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [SharedTableComponent, TicketDetailComponent, TicketCreateComponent, SkeletonLoaderComponent, ButtonComponent],
  templateUrl: './tickets.component.html',
  styleUrl: './tickets.component.scss',
})
export class TicketsComponent implements OnInit {
  readonly ticketsService = inject(TicketsService);
  readonly auth = inject(AuthLocalService);
  private readonly syncService = inject(AdminSyncService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  selectedTicket = signal<any>(null);
  showDetail = signal(false);
  showCreate = signal(false);
  showEdit = signal(false);
  editTicket = signal<any>(null);
  isSyncing = this.syncService.isSyncing;
  currentPage = signal(1);
  pageSize = signal(10);

  get isLoading(): boolean { return this.ticketsService.isLoading(); }
  get total(): number { return this.ticketsService.total(); }

  columns: TableColumn[] = [
    {
      field: 'customer', header: 'العميل', type: 'text',
      filterable: true, filterType: 'text', placeholder: 'ابحث عن عميل',
    },
    { field: 'machine_name', header: 'الماكينة', type: 'text', filterable: true, filterType: 'text' },
    {
      field: 'status', header: 'الحالة', type: 'badge',
      filterable: true, filterType: 'dropdown',
      filterOptions: [
        { label: 'مفتوحة', value: 'open' },
        { label: 'قيد التنفيذ', value: 'in_progress' },
        { label: 'محلولة', value: 'resolved' },
        { label: 'مغلقة', value: 'closed' },
        { label: 'منتهية', value: 'solved' },
      ],
      formatter: (value: string) => {
        const val = String(value || '').toLowerCase().trim().replace(/[\s_-]+/g, '_');
        return ({ open: 'مفتوحة', in_progress: 'قيد التنفيذ', resolved: 'محلولة', closed: 'مغلقة', solved: 'منتهية' } as Record<string, string>)[val] || value;
      },
      colorFormatter: (value: string) => {
        const val = String(value || '').toLowerCase().trim().replace(/[\s_-]+/g, '_');
        return ({ open: '#3b82f6', in_progress: '#f59e0b', resolved: '#10b981', closed: '#6b7280', solved: '#8b5cf6' } as Record<string, string>)[val] || '#6b7280';
      }
    },
    {
      field: 'priority', header: 'الأولوية', type: 'badge',
      filterable: true, filterType: 'dropdown',
      filterOptions: [
        { label: 'عالية', value: 'high' },
        { label: 'متوسطة', value: 'medium' },
        { label: 'منخفضة', value: 'low' },
      ],
      formatter: (value: string) => {
        const val = String(value || '').toLowerCase().trim();
        return ({ high: 'عالية', medium: 'متوسطة', normal: 'متوسطة', low: 'منخفضة' } as Record<string, string>)[val] || value;
      },
      colorFormatter: (value: string) => {
        const val = String(value || '').toLowerCase().trim();
        return ({ high: '#ef4444', medium: '#f59e0b', normal: '#f59e0b', low: '#10b981' } as Record<string, string>)[val] || '#6b7280';
      }
    },
    { field: 'engineer_name', header: 'المهندس', type: 'text', filterable: true, filterType: 'text' },
    { field: 'customer_care_name', header: 'خدمة العملاء', type: 'text', filterable: true, filterType: 'text' },
    { field: 'ticket_rating', header: 'التقييم', type: 'rating' },

    {
      field: 'created_at', header: 'تاريخ الإنشاء', type: 'text',
      formatter: (value) => value ? new Date(value).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—',
    },
    {
      field: 'conversation_id',
      header: 'المحادثة',
      type: 'button',
      icon: 'chat',
      linkText: 'فتح المحادثة',
    },
  ];

  ngOnInit() {
    this.loadData();
    this.route.queryParams.subscribe(params => {
      const ticketId = params['id'];
      if (ticketId) {
        this.ticketsService.getTicket(+ticketId).subscribe({
          next: (res) => {
            if (res && res.data) {
              this.onRowClick(this.mapTicket(res.data));
            }
          }
        });
      }
    });
  }

  private loadData() {
    const filters = { page: this.currentPage(), page_size: this.pageSize() };
    this.ticketsService.loadTickets(filters);
  }

  onPageChange(event: { page: number; rows: number }) {
    this.currentPage.set(event.page);
    this.pageSize.set(event.rows);
    const filters = { page: event.page, page_size: event.rows };
    this.ticketsService.loadTickets(filters);
  }

  onSync() {
    this.syncService.syncModule('tickets').subscribe({
      next: (res) => {
        if (res.success) {
          this.loadData();
        }
      }
    });
  }

  onRowClick(ticket: any) {
    this.selectedTicket.set(ticket);
    this.showDetail.set(true);
  }

  onTableAction(event: { type: string; data: any }) {
    if (event.type === 'conversation_id' && event.data.conversation_id) {
      this.router.navigate(['/chat'], { queryParams: { conversation: event.data.conversation_id } });
    }
  }

  onTicketCreated() {
    this.loadData();
  }

  onEditTicket(ticket: any) {
    this.showDetail.set(false);
    this.editTicket.set(ticket);
    this.showEdit.set(true);
  }

  onTicketEditUpdated(updatedTicket: any) {
    this.loadData();
    this.showEdit.set(false);
    this.editTicket.set(null);
  }

  onTicketUpdated(ticket: Ticket) {
    this.ticketsService.tickets.update(list =>
      list.map(t => t.id === ticket.id ? ticket : t)
    );
    this.selectedTicket.set(this.mapTicket(ticket));
  }


  private mapTicket(ticket: Ticket): any {
    const customerMatch = ticket.title.match(/\(([^)]+)\)/);
    const isId = (val: any) => !val || /^\d+$/.test(String(val).trim());

    const customer = ticket.customer_name && !isId(ticket.customer_name)
      ? ticket.customer_name
      : (customerMatch && !isId(customerMatch[1]) ? customerMatch[1] : '—');

    const machineName = ticket.machine_name && !isId(ticket.machine_name)
      ? ticket.machine_name
      : (ticket.machine_id && !isId(ticket.machine_id) ? ticket.machine_id : '—');

    return {
      id: String(ticket.id),
      customer,
      customer_id: ticket.customer_id || null,
      machine_id: ticket.machine_id,
      machine_name: machineName,
      status: ticket.status,
      visit_date: ticket.visit_date,
      priority: (ticket.priority as any) === 'normal' ? 'medium' : ticket.priority,
      engineer_name: ticket.engineer_name,
      engineer_id: ticket.engineer_id || null,
      customer_care_name: ticket.customer_care_name,
      created_at: ticket.created_at,
      conversation_id: ticket.conversation_id,
      description: ticket.description,
      title: ticket.title,
      ticket_rating: (ticket as any).ticket_rating || 0,
      ticket_rating_feedback: (ticket as any).ticket_rating_feedback || '',
    };
  }

  readonly mappedTickets = computed(() =>
    this.ticketsService.tickets().map(ticket => this.mapTicket(ticket))
  );
}
