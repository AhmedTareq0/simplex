import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventApi, EventClickArg } from '@fullcalendar/core';
import interactionPlugin from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import arLocale from '@fullcalendar/core/locales/ar';

import { SharedSelectComponent } from '../../shared/components/shared-select/shared-select.component';
import { SharedModalComponent } from '../../shared/components/shared-modal/shared-modal.component';

import { TicketsService } from '../tickets/services/tickets.service';
import { VisitsService } from '../visits/services/visits.service';
import { EmployeeService } from '../employees/services/employee.service';
import { ClientService } from '../clients/services/client.service';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    CommonModule,
    FullCalendarModule,
    FormsModule,
    SharedSelectComponent,
    SharedModalComponent
  ],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarComponent implements OnInit {
  private router = inject(Router);
  private ticketsService = inject(TicketsService);
  private visitsService = inject(VisitsService);
  private employeeService = inject(EmployeeService);
  private clientService = inject(ClientService);

  // Filters State
  selectedCustomerSupport = signal<string | null>(null);
  selectedEngineer = signal<string | null>(null);
  selectedClient = signal<string | null>(null);
  selectedEventType = signal<string | null>(null);

  eventTypes = [
    { label: 'الكل', value: null },
    { label: 'تذاكر (Tickets)', value: 'ticket' },
    { label: 'زيارات (Visits)', value: 'visit' }
  ];

  // Dialog State
  isDialogOpen = signal(false);
  selectedEventData = signal<any>(null);

  dir = document.dir || 'rtl';

  // Extract from Services
  tickets = this.ticketsService.tickets;
  visits = this.visitsService.visits;
  employees = this.employeeService.employees;
  clientsData = this.clientService.clients;

  // Dropdown Options
  csAgentsOptions = computed(() => {
    const agents = this.employees().filter(e => e.employee_role === 'customer_care');
    return [{ label: 'الكل', value: null }, ...agents.map(a => ({ label: a.name, value: a.name }))];
  });

  engineersOptions = computed(() => {
    const engs = this.employees().filter(e => e.employee_role === 'engineer' || e.department === 'Maintenance');
    return [{ label: 'الكل', value: null }, ...engs.map(a => ({ label: a.name, value: a.name }))];
  });

  clientsOptions = computed(() => {
    return [{ label: 'الكل', value: null }, ...this.clientsData().map(c => ({ label: c.name, value: c.name }))];
  });

  // Filter Change Handlers for Seamless UX
  onEventTypeChange(type: string | null) {
    this.selectedEventType.set(type);
    if (type === 'ticket') {
      this.selectedEngineer.set(null);
    } else if (type === 'visit') {
      this.selectedCustomerSupport.set(null);
    }
  }

  onCustomerSupportChange(agent: string | null) {
    this.selectedCustomerSupport.set(agent);
    if (agent) {
      this.selectedEngineer.set(null);
      this.selectedEventType.set('ticket');
    }
  }

  onEngineerChange(engineer: string | null) {
    this.selectedEngineer.set(engineer);
    if (engineer) {
      this.selectedCustomerSupport.set(null);
      this.selectedEventType.set('visit');
    }
  }

  // Combine & Map to FullCalendar Events
  events = computed(() => {
    const ticketEvents = this.tickets().map(t => {
      const customerMatch = t.title ? t.title.match(/\(([^)]+)\)/) : null;
      const customer = customerMatch ? customerMatch[1] : 'غير محدد';
      
      return {
        id: `ticket_${t.id}`,
        title: t.title || 'تذكرة بدون عنوان',
        start: t.visit_date || t.created_at,
        color: '#ef4444', // Red for tickets
        extendedProps: {
          type: 'ticket',
          realId: t.id,
          client: customer,
          status: t.status,
          customerSupportName: t.customer_care_name || null,
          engineerName: null,
          clientName: customer !== 'غير محدد' ? customer : null
        }
      };
    });

    const visitEvents = this.visits().map(v => ({
      id: `visit_${v.id}`,
      title: v.name || 'زيارة',
      start: v.planned_start || v.visit_date || v.created_at,
      end: v.planned_end || undefined,
      color: '#10b981', // Emerald for visits
      extendedProps: {
        type: 'visit',
        realId: v.id,
        client: v.customer?.name || v.customer_name || 'غير محدد',
        status: v.status,
        customerSupportName: null,
        engineerName: v.engineer?.name || v.engineer_name || null,
        clientName: v.customer?.name || v.customer_name || null
      }
    }));

    return [...ticketEvents, ...visitEvents];
  });

  filteredEvents = computed(() => {
    let current = this.events();

    // 1. Filter by Event Type
    if (this.selectedEventType()) {
      current = current.filter(e => e.extendedProps.type === this.selectedEventType());
    }

    // 2. Filter Tickets by Customer Support (and hide visits since CS agents only handle tickets)
    if (this.selectedCustomerSupport()) {
      current = current.filter(e =>
        e.extendedProps.type === 'ticket' &&
        (e.extendedProps as any).customerSupportName === this.selectedCustomerSupport()
      );
    }

    // 3. Filter Visits by Engineer (and hide tickets since engineers only handle visits)
    if (this.selectedEngineer()) {
      current = current.filter(e =>
        e.extendedProps.type === 'visit' &&
        (e.extendedProps as any).engineerName === this.selectedEngineer()
      );
    }

    // 4. Filter by Client (For both)
    if (this.selectedClient()) {
      current = current.filter(e => (e.extendedProps as any).clientName === this.selectedClient());
    }

    return current;
  });

  calendarOptions = computed<CalendarOptions>(() => ({
    plugins: [interactionPlugin, dayGridPlugin, timeGridPlugin, listPlugin],
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
    },
    locale: this.dir === 'rtl' ? arLocale : undefined,
    initialView: 'dayGridMonth',
    weekends: true,
    selectMirror: true,
    dayMaxEvents: true,
    height: 'auto',
    events: this.filteredEvents(),
    eventClick: this.handleEventClick.bind(this),
    datesSet: this.handleDatesSet.bind(this),
  }));

  ngOnInit() {
    this.ticketsService.loadTickets({ page: 1, page_size: 200 });
    this.visitsService.loadVisits({ page: 1, page_size: 200 });
    this.employeeService.loadEmployees({ page: 1, page_size: 200 });
    this.clientService.loadClients({ page: 1, page_size: 200 });
  }

  handleEventClick(clickInfo: EventClickArg) {
    const event = clickInfo.event;
    this.selectedEventData.set({
      id: event.extendedProps['realId'],
      title: event.title,
      type: event.extendedProps['type'],
      client: event.extendedProps['client'],
      status: event.extendedProps['status'],
    });
    this.isDialogOpen.set(true);
  }

  handleDatesSet(arg: any) {
    // const from = arg.startStr;
    // const to = arg.endStr;
  }

  goToDetails() {
    const data = this.selectedEventData();
    if (data?.type === 'ticket') {
      this.router.navigate(['/tickets'], { queryParams: { id: data.id } });
    } else if (data?.type === 'visit') {
      this.router.navigate(['/visits'], { queryParams: { id: data.id } });
    }
    this.isDialogOpen.set(false);
  }
}
