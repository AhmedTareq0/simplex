import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/interfaces/api-response.interface';

export interface DashboardSummary {
  tickets: {
    open: number;
    in_progress: number;
    solved: number;
    closed: number;
    cancelled: number;
    total: number;
  };
  visits: {
    pending: number;
    in_progress: number;
    done: number;
    cancelled: number;
    total: number;
  };
}

export interface DailyStatItem {
  date: string;
  tickets: { count: number };
  visits: { count: number };
}

export interface WeeklyStatItem {
  week_start: string;
  week_end: string;
  week_number: number;
  tickets: { count: number };
  visits: { count: number };
}

export interface MonthlyStatItem {
  month: string;
  label: string;
  tickets: { count: number };
  visits: { count: number };
}

export interface EmployeePerformance {
  id: number;
  odoo_user_id: number;
  name: string;
  email: string;
  department: string;
  employee_role: string;
  avatar_url: string;
  solved_tickets: number;
  solved_visits: number;
  avg_ticket_rating: number;
  avg_visit_rating: number;
}

export interface RecentVisit {
  id: number;
  name: string;
  partner_name?: string;
  assigned_user_name?: string;
  stage?: string;
  is_done?: boolean;
  is_cancelled?: boolean;
  create_date?: string;
  planned_start?: string;
  visit_date?: string;
  priority?: string;
  status?: string;
}


export interface DashboardStats {
  summaryCards: any[];
  ticketStatus: number[];
  dailyStats: DailyStatItem[];
  weeklyStats: WeeklyStatItem[];
  monthlyStats: MonthlyStatItem[];
  recentVisits: any[];
  recentVisitsTotal: number;
  topAgents: EmployeePerformance[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getDashboardData(from?: string, to?: string): Observable<DashboardStats> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);

    return forkJoin({
      summary: this.http.get<ApiResponse<DashboardSummary>>(`${this.apiUrl}/api/dashboard/summary`, { params }),
      daily: this.http.get<ApiResponse<{ items: DailyStatItem[]; total: number }>>(`${this.apiUrl}/api/dashboard/daily`, { params: params.set('page_size', '30') }),
      weekly: this.http.get<ApiResponse<WeeklyStatItem[]>>(`${this.apiUrl}/api/dashboard/weekly`, { params }),
      monthly: this.http.get<ApiResponse<MonthlyStatItem[]>>(`${this.apiUrl}/api/dashboard/monthly`, { params }),
      employees: this.http.get<ApiResponse<{ items: EmployeePerformance[]; total: number }>>(`${this.apiUrl}/api/dashboard/employees`, { params: params.set('page_size', '20') }),
      recentVisits: this.http.get<ApiResponse<{ items: RecentVisit[]; total: number }>>(`${this.apiUrl}/api/dashboard/recent-visits`, { params: new HttpParams().set('page_size', '10') }),
    }).pipe(
      map(results => {
        const summary = results.summary.data;
        const daily = results.daily.data?.items || [];
        const weekly = results.weekly.data || [];
        const monthly = results.monthly.data || [];
        const employees = results.employees.data?.items || [];
        const recentVisits = results.recentVisits.data?.items || [];
        const recentVisitsTotal = results.recentVisits.data?.total || 0;

        const summaryCards = [
          {
            title: 'تذاكر مفتوحة',
            value: String(summary?.tickets?.open || 0),
            icon: 'ticket',
            bg: 'rgba(59, 130, 246, 0.1)',
            color: '#3b82f6',
            trend: '',
            change: 'بانتظار بدء العمل عليها'
          },
          {
            title: 'تذاكر قيد التنفيذ',
            value: String(summary?.tickets?.in_progress || 0),
            icon: 'clock',
            bg: 'rgba(245, 158, 11, 0.1)',
            color: '#f59e0b',
            trend: '',
            change: 'تحت المتابعة الفنية'
          },
          {
            title: 'تذاكر مكتملة',
            value: String(summary?.tickets?.solved || 0),
            icon: 'check-circle',
            bg: 'rgba(16, 185, 129, 0.1)',
            color: '#10b981',
            trend: 'up',
            change: 'تم حل المشكلة'
          },
          {
            title: 'تذاكر مغلقة',
            value: String(summary?.tickets?.closed || 0),
            icon: 'lock',
            bg: 'rgba(99, 102, 241, 0.1)',
            color: '#6366f1',
            trend: '',
            change: 'تذاكر منتهية ومغلقة'
          },
          {
            title: 'زيارات جديدة',
            value: String(summary?.visits?.pending || 0),
            icon: 'calendarPlus',
            bg: 'rgba(20, 184, 166, 0.1)',
            color: '#14b8a6',
            trend: '',
            change: 'زيارات مجدولة قادمة'
          },
          {
            title: 'زيارات قيد التنفيذ',
            value: String(summary?.visits?.in_progress || 0),
            icon: 'spinner',
            bg: 'rgba(236, 72, 153, 0.1)',
            color: '#ec4899',
            trend: '',
            change: 'زيارات ميدانية جارية'
          },
          {
            title: 'زيارات مكتملة',
            value: String(summary?.visits?.done || 0),
            icon: 'check',
            bg: 'rgba(34, 197, 94, 0.1)',
            color: '#22c55e',
            trend: 'up',
            change: 'زيارات منتهية بنجاح'
          },
          {
            title: 'زيارات ملغاة',
            value: String(summary?.visits?.cancelled || 0),
            icon: 'xCircle',
            bg: 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444',
            trend: 'down',
            change: 'زيارات تم إلغاؤها'
          }
        ];

        const ticketStatus = [
          summary?.tickets?.open || 0,
          summary?.tickets?.in_progress || 0,
          summary?.tickets?.solved || 0,
          summary?.tickets?.closed || 0
        ];

        const mappedVisits = recentVisits.map(v => ({
          name: v.name || `VIS-${v.id}`,
          customer_name: v.partner_name || (v as any).customer?.name || 'غير محدد',
          engineer_name: v.assigned_user_name || (v as any).engineer?.name || 'غير محدد',
          date: v.planned_start || v.create_date || (v as any).created_at || (v as any).visit_date,
          priority: (v as any).priority || 'normal',
          status: v.is_done ? 'done' : v.is_cancelled ? 'cancelled' : ((v as any).status || v.stage?.toLowerCase()?.includes('progress') ? 'in_progress' : 'new')
        }));

        return {
          summaryCards,
          ticketStatus,
          dailyStats: daily,
          weeklyStats: weekly as WeeklyStatItem[],
          monthlyStats: monthly as MonthlyStatItem[],
          recentVisits: mappedVisits,
          recentVisitsTotal,
          topAgents: employees
        };
      })
    );
  }


  getRecentVisits(page: number, pageSize: number): Observable<{ items: any[]; total: number }> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('page_size', String(pageSize));

    return this.http.get<ApiResponse<{ items: RecentVisit[]; total: number }>>(`${this.apiUrl}/api/dashboard/recent-visits`, { params }).pipe(
      map(res => {
        const items = res.data?.items || [];
        const total = res.data?.total || 0;
        const mapped = items.map(v => ({
          name: v.name || `VIS-${v.id}`,
          customer_name: v.partner_name || (v as any).customer?.name || 'غير محدد',
          engineer_name: v.assigned_user_name || (v as any).engineer?.name || 'غير محدد',
          date: v.planned_start || v.create_date || (v as any).created_at || (v as any).visit_date,
          priority: (v as any).priority || 'normal',
          status: v.is_done ? 'done' : v.is_cancelled ? 'cancelled' : ((v as any).status || v.stage?.toLowerCase()?.includes('progress') ? 'in_progress' : 'new')
        }));
        return { items: mapped, total };
      })
    );
  }


  refreshCache(): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/api/dashboard/refresh`, {});
  }
}
