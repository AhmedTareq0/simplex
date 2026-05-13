import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadChildren: () => import('./auth/auth.routes').then((m) => m.authRoutes),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/main-layout/main-layout.component').then((m) => m.MainLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },

      {
        path: 'reports',
        loadComponent: () =>
          import('./features/dashboard/reports/reports.component').then((m) => m.ReportsComponent),
      },
      {
        path: 'machines',
        loadComponent: () =>
          import('./features/machines/machines.component').then((m) => m.MachinesComponent),
      },
      {
        path: 'tickets',
        loadComponent: () =>
          import('./features/tickets/tickets.component').then(
            (m) => m.TicketsComponent,
          ),
      },
      {
        path: 'visits',
        loadComponent: () =>
          import('./features/visits/visits.component').then((m) => m.VisitsComponent),
      },
      {
        path: 'chat',
        loadComponent: () =>
          import('./features/chat/chat.component').then((m) => m.ChatComponent),
      },
      {
        path: 'employees',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/employees/employees.component').then((m) => m.EmployeesComponent),
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./features/employees/components/employee-detail/employee-detail.component').then(
                (m) => m.EmployeeDetailComponent
              ),
          },
        ],
      },
      {
        path: 'clients',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/clients/clients.component').then((m) => m.ClientsComponent),
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./features/clients/components/client-detail/client-detail.component').then(
                (m) => m.ClientDetailComponent
              ),
          },
        ],
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/profile-settings.component').then((m) => m.ProfileSettingsComponent),
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./features/notifications/notifications.component').then((m) => m.NotificationsComponent),
      },
    ],
  },
];
