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
  pageSize = signal(20);

  get isLoading(): boolean { return this.ticketsService.isLoading(); }
  get total(): number { return this.ticketsService.total(); }

  columns: TableColumn[] = [
    {
      field: 'customer', header: 'العميل', type: 'text',
      filterable: true, filterType: 'text', placeholder: 'ابحث عن عميل',
    },
    { field: 'machine_id', header: 'المكنة', type: 'text', filterable: true, filterType: 'text' },
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
      formatter: (v: string) => ({ open: 'مفتوحة', in_progress: 'قيد التنفيذ', resolved: 'محلولة', closed: 'مغلقة', solved: 'منتهية' } as Record<string, string>)[v] || v,
    },
    {
      field: 'priority', header: 'الأولوية', type: 'badge',
      filterable: true, filterType: 'dropdown',
      filterOptions: [
        { label: 'عالية', value: 'high' },
        { label: 'متوسطة', value: 'medium' },
        { label: 'منخفضة', value: 'low' },
      ],
      formatter: (v: string) => ({ high: 'عالية', medium: 'متوسطة', low: 'منخفضة' } as Record<string, string>)[v] || v,
    },
    { field: 'engineer_name', header: 'المهندس', type: 'text', filterable: true, filterType: 'text' },
    { field: 'customer_care_name', header: 'خدمة العملاء', type: 'text', filterable: true, filterType: 'text' },
    {
      field: 'visit_date', header: 'تاريخ الزيارة', type: 'text',
      formatter: (v) => v ? new Date(v).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—',
    },
    {
      field: 'created_at', header: 'تاريخ الإنشاء', type: 'text',
      formatter: (v) => v ? new Date(v).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—',
    },
  ];

  ngOnInit() {
    this.ticketsService.loadTickets({ page: 1, page_size: this.pageSize() });
  }

  onPageChange(event: { page: number; rows: number }) {
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

  private mapTicket(t: Ticket): any {
    // Extract customer name from title (format: "Support — Machine Name (Customer Name)")
    const customerMatch = t.title.match(/\(([^)]+)\)/);
    const customer = customerMatch ? customerMatch[1] : '—';

    return {
      id: String(t.id),
      customer: customer,
      machine_id: t.machine_id,
      status: t.status,
      visit_date: t.visit_date,
      priority: t.priority,
      engineer_name: t.engineer_name,
      customer_care_name: t.customer_care_name,
      created_at: t.created_at,
      conversation_id: t.conversation_id,
      description: t.description,
      title: t.title,
    };
  }

  get mappedTickets(): any[] {
    return this.ticketsService.tickets().map(t => this.mapTicket(t));
  }
}
