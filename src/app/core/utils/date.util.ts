
export function formatArabicDateTime(val: string | Date | null | undefined): string {
  if (!val) return 'غير محدد';
  const date = val instanceof Date ? val : new Date(val);
  if (isNaN(date.getTime())) return String(val);

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}/${mm}/${dd}`;

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'م' : 'ص';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const timeStr = `${hours}:${minutes} ${ampm}`;

  return `${dateStr}\n${timeStr}`;
}

export function formatDateShort(date: string | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateLong(date: string | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatDateTime(date: string | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('ar-EG', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}
