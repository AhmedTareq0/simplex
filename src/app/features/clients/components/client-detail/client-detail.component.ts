import { Component, input, output, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonComponent, IconComponent, SharedTableComponent, TableColumn, SkeletonLoaderComponent } from '../../../../shared/components';
import { TicketDetailComponent } from '../../../tickets/components/ticket-detail/ticket-detail.component';
import { VisitDetailComponent } from '../../../visits/components/visit-detail/visit-detail.component';
import { Client, ClientService, ClientDetails, PartnerMachine, SupportTicket, Visit } from '../../services/client.service';
import { AuthLocalService } from '../../../../auth/services/auth-local.service';
import { TICKET_STATUS, VISIT_STATUS, PRIORITY } from '@/core/constants/status.constants';

@Component({
  selector: 'app-client-detail',
  standalone: true,
  imports: [
    CommonModule,
    ButtonComponent,
    IconComponent,
    SharedTableComponent,
    SkeletonLoaderComponent,
    TicketDetailComponent,
    VisitDetailComponent
  ],
  templateUrl: './client-detail.component.html',
  styleUrl: './client-detail.component.scss'
})
export class ClientDetailComponent implements OnInit {
  readonly auth = inject(AuthLocalService);
  readonly clientService = inject(ClientService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  
  client = signal<any | null>(null);
  
  close = output<void>();
  edit = output<Client>();

  clientDetails = signal<ClientDetails | null>(null);
  clientMachines = signal<PartnerMachine[]>([]);
  clientTickets = signal<SupportTicket[]>([]);
  clientVisits = signal<Visit[]>([]);
  isLoadingDetails = signal(false);
  isLoadingMachines = signal(false);
  isLoadingTickets = signal(false);
  isLoadingVisits = signal(false);

  // Modal States
  showTicketDetail = signal(false);
  selectedTicket = signal<any>(null);
  showVisitDetail = signal(false);
  selectedVisit = signal<any>(null);

  ticketColumns: TableColumn[] = [
    { field: 'title', header: 'عنوان التذكرة', type: 'text' },
    {
      field: 'status', header: 'الحالة', type: 'badge',
      formatter: (val: string) => TICKET_STATUS.getLabel(val)
    },
    {
      field: 'priority', header: 'الأولوية', type: 'badge',
      formatter: (val: string) => PRIORITY.getLabel(val)
    },
    {
      field: 'created_at', header: 'تاريخ الإنشاء', type: 'text',
      formatter: (val: any) => val ? new Date(val).toLocaleDateString('ar-EG') : '—'
    }
  ];

  visitColumns: TableColumn[] = [
    { field: 'name', header: 'اسم الزيارة', type: 'text' },
    {
      field: 'visit_date', header: 'تاريخ الزيارة', type: 'text',
      formatter: (val: any) => val ? new Date(val).toLocaleDateString('ar-EG') : '—'
    },
    {
      field: 'status', header: 'الحالة', type: 'badge',
      formatter: (val: string) => VISIT_STATUS.getLabel(val)
    }
  ];

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.fetchClient(Number(id));
    }
  }

  fetchClient(id: number) {
    this.isLoadingDetails.set(true);
    this.clientService.getClientDetails(id).subscribe({
      next: (res) => {
        if (res.data) {
          this.client.set(res.data);
          this.clientDetails.set(res.data);
          this.loadClientData();
        }
        this.isLoadingDetails.set(false);
      },
      error: () => this.isLoadingDetails.set(false)
    });
  }

  onBack() {
    this.router.navigate(['/clients']);
  }

  loadClientData() {
    const clientId = this.client()?.id;
    if (!clientId) return;

    this.isLoadingMachines.set(true);
    this.clientService.getClientMachines(clientId).subscribe({
      next: (res) => {
        this.clientMachines.set(res.data?.items || []);
        this.isLoadingMachines.set(false);
      },
      error: () => this.isLoadingMachines.set(false)
    });

    this.isLoadingTickets.set(true);
    this.clientService.getClientTickets(clientId).subscribe({
      next: (res) => {
        this.clientTickets.set(res.data?.items || []);
        this.isLoadingTickets.set(false);
      },
      error: () => this.isLoadingTickets.set(false)
    });

    this.isLoadingVisits.set(true);
    this.clientService.getClientVisits(clientId).subscribe({
      next: (res) => {
        this.clientVisits.set(res.data?.items || []);
        this.isLoadingVisits.set(false);
      },
      error: () => this.isLoadingVisits.set(false)
    });
  }

  onTicketClick(ticket: any) {
    this.selectedTicket.set(ticket);
    this.showTicketDetail.set(true);
  }

  onVisitClick(visit: any) {
    this.selectedVisit.set(visit);
    this.showVisitDetail.set(true);
  }

  handleTicketUpdate() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) this.loadClientData();
  }

  handleVisitUpdate() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) this.loadClientData();
  }
}
