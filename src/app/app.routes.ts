import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layout/main-layout/main-layout.component').then((m) => m.MainLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/coming-soon.component').then((m) => m.ComingSoonComponent),
      },
      {
        path: 'customer-support',
        loadComponent: () =>
          import('./features/customer-support/coming-soon.component').then(
            (m) => m.ComingSoonComponent,
          ),
      },
      {
        path: 'chat',
        loadComponent: () =>
          import('./features/chat/coming-soon.component').then((m) => m.ComingSoonComponent),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/coming-soon.component').then((m) => m.ComingSoonComponent),
      },
    ],
  },
];
