import type { AppIconName } from '../../shared/components/icon/icon.component';

export interface SummaryCard {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: AppIconName;
  color: string;
  bg: string;
}

export const summaryCards: SummaryCard[] = [
  {
    title: 'العملاء النشطين',
    value: '1,248',
    change: '+12%',
    trend: 'up',
    icon: 'users',
    color: 'var(--color-primary-600)',
    bg: 'var(--color-primary-50)',
  },
  {
    title: 'الشاتات المفتوحة',
    value: '36',
    change: '-5%',
    trend: 'down',
    icon: 'chat',
    color: 'var(--color-accent-600)',
    bg: 'var(--color-accent-50)',
  },
  {
    title: 'الزيارات اليوم',
    value: '84',
    change: '+8%',
    trend: 'up',
    icon: 'table',
    color: 'var(--color-info)',
    bg: '#f0f9ff',
  },
  {
    title: 'معدل الرضا',
    value: '94.2%',
    change: '+2.1%',
    trend: 'up',
    icon: 'cog',
    color: 'var(--color-warning)',
    bg: '#fffbeb',
  },
];
