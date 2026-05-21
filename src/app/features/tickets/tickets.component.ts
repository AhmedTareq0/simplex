import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SharedTableComponent, TableColumn, ButtonComponent } from '../../shared/components';
import { TicketDetailComponent } from './components/ticket-detail/ticket-detail.component';
import { TicketCreateComponent } from './components/ticket-create/ticket-create.component';
import { TicketsService, Ticket } from './services/tickets.service';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';
import { AuthLocalService } from '../../auth/services/auth-local.service';
import { AdminSyncService } from '../../core/services/admin-sync.service';
import {
  TICKET_STATUS_OPTIONS, TICKET_PRIORITY_OPTIONS,
  getStatusLabel, getStatusColor, getPriorityLabel, getPriorityColor,
} from './ticket.constants';

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

  columns: TableColumn[] = [];

  private buildColumns() {
    const baseColumns: TableColumn[] = [
      {
        field: 'customer', header: 'العميل', type: 'text',
        filterable: true, filterType: 'text', placeholder: 'ابحث عن عميل',
      },
      { field: 'machine_name', header: 'الماكينة', type: 'text', filterable: true, filterType: 'text' },
      {
        field: 'status', header: 'الحالة', type: 'badge',
        filterable: true, filterType: 'dropdown',
        filterOptions: TICKET_STATUS_OPTIONS,
        formatter: (value: string) => getStatusLabel(value),
        colorFormatter: (value: string) => getStatusColor(value),
      },
      {
        field: 'priority', header: 'الأولوية', type: 'badge',
        filterable: true, filterType: 'dropdown',
        filterOptions: TICKET_PRIORITY_OPTIONS,
        formatter: (value: string) => getPriorityLabel(value),
        colorFormatter: (value: string) => getPriorityColor(value),
      },
    ];

    if (this.auth.isSuperAdmin()) {
      baseColumns.push({ 
        field: 'customer_care_name', 
        header: 'خدمة العملاء', 
        type: 'text', 
        filterable: true, 
        filterType: 'text' 
      });
    }

    baseColumns.push(
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
      }
    );

    this.columns = baseColumns;
  }

  ngOnInit() {
    this.buildColumns();
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
      customer_name: customer,  
      customer_id: ticket.customer_id || null,
      machine_id: ticket.machine_id,
      machine_name: machineName,
      status: ticket.status,
      visit_date: ticket.visit_date,
      priority: (ticket.priority as any) === 'normal' ? 'medium' : ticket.priority,
      engineer_name: ticket.engineer_name,
      engineer_id: ticket.engineer_id || null,
      customer_care_name: ticket.customer_care_name,
      customer_care_id: (ticket as any).customer_care_id || null,
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
