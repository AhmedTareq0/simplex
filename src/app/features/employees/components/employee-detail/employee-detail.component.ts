import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IconComponent, ButtonComponent, SharedTableComponent, TableColumn, SkeletonLoaderComponent } from '../../../../shared/components';
import { TicketDetailComponent } from '../../../tickets/components/ticket-detail/ticket-detail.component';
import { VisitDetailComponent } from '../../../visits/components/visit-detail/visit-detail.component';
import { Employee, EmployeeService, EmployeeDetails, SupportTicket, Visit } from '../../services/employee.service';
import { AuthLocalService } from '../../../../auth/services/auth-local.service';
import { TICKET_STATUS, VISIT_STATUS, PRIORITY } from '@/core/constants/status.constants';

@Component({
  selector: 'app-employee-detail',
  standalone: true,
  imports: [
    CommonModule,
    ButtonComponent,
    IconComponent,
    SharedTableComponent,
    TicketDetailComponent,
    VisitDetailComponent,
    SkeletonLoaderComponent
  ],
  templateUrl: './employee-detail.component.html',
  styleUrl: './employee-detail.component.scss'
})
export class EmployeeDetailComponent implements OnInit {
  readonly auth = inject(AuthLocalService);
  readonly employeeService = inject(EmployeeService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  employee = signal<any | null>(null);
  employeeDetails = signal<EmployeeDetails | null>(null);
  assignedTickets = signal<SupportTicket[]>([]);
  assignedVisits = signal<Visit[]>([]);

  // Modal signals
  selectedTicket = signal<any>(null);
  showTicketDetail = signal(false);

  selectedVisit = signal<any>(null);
  showVisitDetail = signal(false);

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

  isLoadingDetails = signal(false);
  isLoadingTickets = signal(false);
  isLoadingVisits = signal(false);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.fetchEmployee(Number(id));
    }
  }

  fetchEmployee(id: number) {
    this.isLoadingDetails.set(true);
    this.employeeService.getEmployeeDetails(id).subscribe({
      next: (res) => {
        if (res.data) {
          this.employee.set(res.data);
          this.employeeDetails.set(res.data);
          this.loadAssignedData(id);
        }
        this.isLoadingDetails.set(false);
      },
      error: () => this.isLoadingDetails.set(false)
    });
  }

  private loadAssignedData(id: number) {
    const role = this.employeeDetails()?.employee_role;

    if (role !== 'engineer') {
      this.isLoadingTickets.set(true);
      this.employeeService.getEmployeeTickets(id).subscribe({
        next: (res) => {
          this.assignedTickets.set(res.data?.items || []);
          this.isLoadingTickets.set(false);
        },
        error: () => this.isLoadingTickets.set(false)
      });
    }

    if (role !== 'customer_care') {
      this.isLoadingVisits.set(true);
      this.employeeService.getEmployeeVisits(id).subscribe({
        next: (res) => {
          this.assignedVisits.set(res.data?.items || []);
          this.isLoadingVisits.set(false);
        },
        error: () => this.isLoadingVisits.set(false)
      });
    }
  }

  onBack() {
    this.router.navigate(['/employees']);
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
    if (id) this.loadAssignedData(id);
  }

  handleVisitUpdate() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) this.loadAssignedData(id);
  }
}
