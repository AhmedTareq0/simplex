export interface DailyVisit {
  [key: string]: unknown;
  date: string;
  count: number;
  uniqueUsers: number;
  averageTime: string;
  status: 'high' | 'normal' | 'low';
}

export const dailyVisits: DailyVisit[] = [
  { date: '2026-04-29', count: 1250, uniqueUsers: 850, averageTime: '05:20', status: 'high' },
  { date: '2026-04-28', count: 1100, uniqueUsers: 720, averageTime: '04:45', status: 'normal' },
  { date: '2026-04-27', count: 950, uniqueUsers: 680, averageTime: '04:10', status: 'normal' },
  { date: '2026-04-26', count: 1400, uniqueUsers: 980, averageTime: '06:15', status: 'high' },
  { date: '2026-04-25', count: 800, uniqueUsers: 550, averageTime: '03:50', status: 'low' },
  { date: '2026-04-24', count: 1150, uniqueUsers: 790, averageTime: '05:00', status: 'normal' },
  { date: '2026-04-23', count: 1300, uniqueUsers: 900, averageTime: '05:40', status: 'high' },
  { date: '2026-04-22', count: 1050, uniqueUsers: 710, averageTime: '04:30', status: 'normal' },
  { date: '2026-04-21', count: 900, uniqueUsers: 600, averageTime: '04:00', status: 'normal' },
  { date: '2026-04-20', count: 1550, uniqueUsers: 1100, averageTime: '07:10', status: 'high' },
];
