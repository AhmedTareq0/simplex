import { Component, inject, signal, OnInit } from '@angular/core';
import { SharedTableComponent, TableColumn } from '../../shared/components/shared-table/shared-table.component';
import { TicketDetailComponent } from './components/ticket-detail/ticket-detail.component';
import { TicketsService, Ticket } from './services/tickets.service';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [SharedTableComponent, TicketDetailComponent, SkeletonLoaderComponent],
  templateUrl: './tickets.component.html',
  styleUrl: './tickets.component.scss',
})
export class TicketsComponent implements OnInit {
  readonly ticketsService = inject(TicketsService);

  selectedTicket = signal<any>(null);
  showDetail = signal(false);
  currentPage = signal(1);
  pageSize = signal(10);

  get isLoading(): boolean { return this.ticketsService.isLoading(); }
  get total(): number { return this.ticketsService.total(); }

  columns: TableColumn[] = [
    {
      field: 'customer', header: 'العميل', type: 'text',
      filterable: true, filterType: 'text', placeholder: 'ابحث عن عميل',
    },
    { field: 'machine_id', header: 'الماكينة', type: 'text', filterable: true, filterType: 'text' },
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
      formatter: (value: string) => ({ open: 'مفتوحة', in_progress: 'قيد التنفيذ', resolved: 'محلولة', closed: 'مغلقة', solved: 'منتهية' } as Record<string, string>)[value] || value,
    },
    {
      field: 'priority', header: 'الأولوية', type: 'badge',
      filterable: true, filterType: 'dropdown',
      filterOptions: [
        { label: 'عالية', value: 'high' },
        { label: 'متوسطة', value: 'medium' },
        { label: 'منخفضة', value: 'low' },
      ],
      formatter: (value: string) => ({ high: 'عالية', medium: 'متوسطة', low: 'منخفضة' } as Record<string, string>)[value] || value,
    },
    { field: 'engineer_name', header: 'المهندس', type: 'text', filterable: true, filterType: 'text' },
    { field: 'customer_care_name', header: 'خدمة العملاء', type: 'text', filterable: true, filterType: 'text' },
    {
      field: 'visit_date', header: 'تاريخ الزيارة', type: 'text',
      formatter: (value) => value ? new Date(value).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—',
    },
    {
      field: 'created_at', header: 'تاريخ الإنشاء', type: 'text',
      formatter: (value) => value ? new Date(value).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—',
    },
  ];

  ngOnInit() {
    this.ticketsService.loadTickets({ page: 1, page_size: this.pageSize() });
  }

  onPageChange(event: { page: number; rows: number }) {
    this.currentPage.set(event.page);
    this.pageSize.set(event.rows);
    this.ticketsService.loadTickets({ page: event.page, page_size: event.rows });
  }

  onRowClick(ticket: any) {
    this.selectedTicket.set(ticket);
    this.showDetail.set(true);
  }

  onTicketUpdated(ticket: Ticket) {
    this.ticketsService.tickets.update(list =>
      list.map(t => t.id === ticket.id ? ticket : t)
    );
    this.selectedTicket.set(this.mapTicket(ticket));
  }

  onTicketDeleted(id: string) {
    this.ticketsService.tickets.update(list => list.filter((t: any) => String(t.id) !== id));
    this.showDetail.set(false);
    this.selectedTicket.set(null);
  }

  private mapTicket(ticket: Ticket): any {
    const customerMatch = ticket.title.match(/\(([^)]+)\)/);
    const customer = customerMatch ? customerMatch[1] : '—';

    return {
      id: String(ticket.id),
      customer,
      machine_id: ticket.machine_id,
      status: ticket.status,
      visit_date: ticket.visit_date,
      priority: ticket.priority,
      engineer_name: ticket.engineer_name,
      customer_care_name: ticket.customer_care_name,
      created_at: ticket.created_at,
      conversation_id: ticket.conversation_id,
      description: ticket.description,
      title: ticket.title,
    };
  }

  get mappedTickets(): any[] {
    return this.ticketsService.tickets().map(ticket => this.mapTicket(ticket));
  }
}
