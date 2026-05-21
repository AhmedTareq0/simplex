
function normalize(value: string): string {
  return String(value || '').toLowerCase().trim().replace(/[\s_-]+/g, '_');
}

function lookup(map: Record<string, string>, value: string, fallback?: string): string {
  return map[normalize(value)] || fallback || value;
}

function toOptions(labels: Record<string, string>, exclude?: string[]): { label: string; value: string }[] {
  const seen = new Set<string>();
  return Object.entries(labels)
    .filter(([key, label]) => {
      if (exclude?.includes(key)) return false;
      if (seen.has(label)) return false;
      seen.add(label);
      return true;
    })
    .map(([value, label]) => ({ label, value }));
}

// ════════════════════════════════════════════════════════════════════
//  TICKET STATUS
// ════════════════════════════════════════════════════════════════════
const TICKET_STATUS_LABELS: Record<string, string> = {
  open: 'مفتوحة',
  in_progress: 'قيد التنفيذ',
  resolved: 'محلولة',
  closed: 'مغلقة',
  solved: 'منتهية',
  cancelled: 'ملغاة',
};

const TICKET_STATUS_COLORS: Record<string, string> = {
  open: '#3b82f6',
  in_progress: '#f59e0b',
  resolved: '#10b981',
  closed: '#6b7280',
  solved: '#8b5cf6',
  cancelled: '#ef4444',
};

export const TICKET_STATUS = {
  labels: TICKET_STATUS_LABELS,
  colors: TICKET_STATUS_COLORS,
  options: toOptions(TICKET_STATUS_LABELS),
  activeStatuses: ['open', 'in_progress'],
  getLabel: (s: string) => lookup(TICKET_STATUS_LABELS, s),
  getColor: (s: string) => lookup(TICKET_STATUS_COLORS, s, '#6b7280'),
  isActive: (s: string) => ['open', 'in_progress'].includes(normalize(s)),
};

// ════════════════════════════════════════════════════════════════════
//  VISIT STATUS
// ════════════════════════════════════════════════════════════════════
const VISIT_STATUS_LABELS: Record<string, string> = {
  new: 'جديدة',
  scheduled: 'مجدولة',
  in_progress: 'قيد التنفيذ',
  done: 'مكتمل',
  completed: 'مكتمل',
  cancelled: 'ملغى',
};

const VISIT_STATUS_COLORS: Record<string, string> = {
  new: '#8b5cf6',
  scheduled: '#3b82f6',
  in_progress: '#f59e0b',
  done: '#10b981',
  completed: '#10b981',
  cancelled: '#ef4444',
};

export const VISIT_STATUS = {
  labels: VISIT_STATUS_LABELS,
  colors: VISIT_STATUS_COLORS,
  options: toOptions(VISIT_STATUS_LABELS),
  getLabel: (s: string) => lookup(VISIT_STATUS_LABELS, s),
  getColor: (s: string) => lookup(VISIT_STATUS_COLORS, s, '#6b7280'),
};

// ════════════════════════════════════════════════════════════════════
//  PRIORITY (shared between tickets & visits)
// ════════════════════════════════════════════════════════════════════
const PRIORITY_LABELS: Record<string, string> = {
  high: 'عالية',
  medium: 'متوسطة',
  normal: 'متوسطة',
  low: 'منخفضة',
};

const PRIORITY_COLORS: Record<string, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  normal: '#f59e0b',
  low: '#10b981',
};

export const PRIORITY = {
  labels: PRIORITY_LABELS,
  colors: PRIORITY_COLORS,
  options: toOptions(PRIORITY_LABELS, ['normal']),
  getLabel: (p: string) => lookup(PRIORITY_LABELS, p),
  getColor: (p: string) => lookup(PRIORITY_COLORS, p, '#6b7280'),
};
