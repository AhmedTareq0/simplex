export interface Activity {
  id: number;
  user: string;
  action: string;
  target: string;
  time: string;
  status: 'completed' | 'pending' | 'open';
}

export const recentActivities: Activity[] = [
  { id: 1, user: 'أحمد سامي', action: 'فتح شات مع', target: 'عميل #2048', time: 'منذ 3 دقائق', status: 'open' },
  { id: 2, user: 'منى خالد', action: 'أغلقت زيارة', target: 'زيارة #1092', time: 'منذ 12 دقيقة', status: 'completed' },
  { id: 3, user: 'خالد Omar', action: 'رد على تذكرة', target: 'تذكرة #552', time: 'منذ 25 دقيقة', status: 'completed' },
  { id: 4, user: 'سارة نبيل', action: 'بدأت زيارة جديدة', target: 'عميل #1890', time: 'منذ 42 دقيقة', status: 'pending' },
  { id: 5, user: 'أحمد سامي', action: 'حل مشكلة', target: 'تذكرة #540', time: 'منذ ساعة', status: 'completed' },
];
