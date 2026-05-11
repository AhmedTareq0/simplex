import { Component, input, output, inject, signal, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModalComponent, ButtonComponent } from '../../../../shared/components';
import { Client, ClientService, ClientDetails, PartnerMachine, SupportTicket, Visit } from '../../services/client.service';
import { AuthLocalService } from '../../../../auth/services/auth-local.service';

@Component({
  selector: 'app-client-detail',
  standalone: true,
  imports: [CommonModule, SharedModalComponent, ButtonComponent],
  templateUrl: './client-detail.component.html',
  styleUrl: './client-detail.component.scss'
})
export class ClientDetailComponent implements OnInit, OnChanges {
  readonly auth = inject(AuthLocalService);
  readonly clientService = inject(ClientService);
  
  client = input.required<Client | null>();
  visible = input<boolean>(false);
  
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

  ngOnInit() {
    if (this.visible() && this.client()?.id) {
      this.loadClientData();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['client'] && this.visible() && this.client()?.id) {
      this.loadClientData();
    }
  }

  loadClientData() {
    const clientId = this.client()?.id;
    if (!clientId) return;

    this.isLoadingDetails.set(true);
    this.clientService.getClientDetails(clientId).subscribe({
      next: (res) => {
        this.clientDetails.set(res.data || null);
        this.isLoadingDetails.set(false);
      },
      error: () => this.isLoadingDetails.set(false)
    });

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
}
