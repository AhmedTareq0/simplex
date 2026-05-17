import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';

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
        canActivate: [permissionGuard],
        data: { permission: 'dashboard.view' },
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },

      {
        path: 'reports',
        canActivate: [permissionGuard],
        data: { permission: 'reports.view' },
        loadComponent: () =>
          import('./features/dashboard/reports/reports.component').then((m) => m.ReportsComponent),
      },
      {
        path: 'machines',
        canActivate: [permissionGuard],
        data: { permission: 'machines.view' },
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
        canActivate: [permissionGuard],
        data: { permission: 'users.manage' },
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
        canActivate: [permissionGuard],
        data: { permission: 'users.manage' },
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
        canActivate: [permissionGuard],
        data: { permission: 'settings.view' },
        loadComponent: () =>
          import('./features/settings/profile-settings.component').then((m) => m.ProfileSettingsComponent),
      },
      {
        path: 'notifications',
        canActivate: [permissionGuard],
        data: { permission: 'notifications.view' },
        loadComponent: () =>
          import('./features/notifications/notifications.component').then((m) => m.NotificationsComponent),
      },
    ],
  },
];
