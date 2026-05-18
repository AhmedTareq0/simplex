export type AppRole = 'superadmin' | 'customer_support' | 'engineer';

export type Permission =
  | 'dashboard.view'
  | 'reports.view'
  | 'machines.view'
  | 'machines.manage'
  | 'tickets.view_all'
  | 'tickets.view_cc'
  | 'tickets.view_engineer'
  | 'tickets.create'
  | 'tickets.update'
  | 'tickets.delete'
  | 'visits.view_all'
  | 'visits.view_own'
  | 'visits.create'
  | 'visits.update'
  | 'users.manage'
  | 'chat.cc'
  | 'chat.engineer'
  | 'chat.delete'
  | 'sync.manage'
  | 'notifications.view'
  | 'settings.view'
  | 'calendar.view';

export const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  superadmin: [
    'dashboard.view',
    'reports.view',
    'machines.view',
    'machines.manage',
    'tickets.view_all',
    'tickets.create',
    'tickets.update',
    'tickets.delete',
    'visits.view_all',
    'visits.create',
    'visits.update',
    'users.manage',
    'chat.cc',
    'chat.engineer',
    'chat.delete',
    'sync.manage',
    'notifications.view',
    'settings.view',
    'calendar.view',
  ],
  customer_support: [
    'tickets.view_cc',
    'chat.cc',
    'notifications.view',
    'settings.view',
  ],
  engineer: [
    'visits.view_own',
    'chat.engineer',
    'notifications.view',
    'settings.view',
  ],
};
