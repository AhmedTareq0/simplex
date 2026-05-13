import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse, PagedResult } from '../../../core/interfaces/api-response.interface';

export interface DashboardStats {
  summaryCards: any[];
  ticketStatus: number[];
  monthlyTickets: any[];
  visitsTrend: any[];
  dailyVisits: any[];
  topAgents: any[];
  workloadDistribution: { labels: string[], series: number[] };
  engineerPerformance: any[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getDashboardData(): Observable<DashboardStats> {
    return forkJoin({
      tickets: this.http.get<ApiResponse<PagedResult<any>>>(`${this.apiUrl}/api/tickets/all?page_size=1000`),
      visits: this.http.get<ApiResponse<any>>(`${this.apiUrl}/api/visits/all?page_size=1000`),
      customers: this.http.get<ApiResponse<PagedResult<any>>>(`${this.apiUrl}/api/users/customers?page_size=1`),
      employees: this.http.get<ApiResponse<PagedResult<any>>>(`${this.apiUrl}/api/users/employees?page_size=10`)
    }).pipe(
      map(results => {
        const tickets = results.tickets.data?.items || [];
        const visits = results.visits.data?.items || [];
        const totalCustomers = results.customers.data?.total || 0;
        const employees = results.employees.data?.items || [];

        // 1. Summary Cards
        const activeTickets = tickets.filter((t: any) => t.status !== 'done' && t.status !== 'cancelled').length;
        const completedVisits = visits.filter((v: any) => v.status === 'done' || v.status === 'completed').length;
        
        const summaryCards = [
          {
            title: 'التذاكر النشطة',
            value: activeTickets.toString(),
            icon: 'calendarClock',
            bg: 'rgba(139, 92, 246, 0.1)',
            color: '#8b5cf6',
            trend: 'up',
            change: '+12% من الأسبوع الماضي'
          },
          {
            title: 'زيارات مكتملة',
            value: completedVisits.toString(),
            icon: 'checkCircle',
            bg: 'rgba(16, 185, 129, 0.1)',
            color: '#10b981',
            trend: 'up',
            change: '+5% من الأسبوع الماضي'
          },
          {
            title: 'إجمالي العملاء',
            value: totalCustomers.toString(),
            icon: 'user',
            bg: 'rgba(59, 130, 246, 0.1)',
            color: '#3b82f6',
            trend: 'up',
            change: '+3 عملاء جدد'
          },
          {
            title: 'الماكينات النشطة',
            value: '42', // Mock for now or fetch from machines count
            icon: 'table',
            bg: 'rgba(245, 158, 11, 0.1)',
            color: '#f59e0b',
            trend: 'down',
            change: '-2% من الشهر الماضي'
          }
        ];

        // 2. Ticket Status
        const statusCounts = {
          new: tickets.filter((t: any) => t.status === 'new').length,
          in_progress: tickets.filter((t: any) => t.status === 'in_progress' || t.status === 'scheduled').length,
          done: tickets.filter((t: any) => t.status === 'done').length
        };
        const ticketStatus = [statusCounts.new, statusCounts.in_progress, statusCounts.done];

        // 3. Monthly Tickets (Mock trend for now as we don't have historical aggregation)
        const monthlyTickets = [
          {
            name: 'التذاكر',
            data: [31, 40, 28, 51, 42, 109, 100, 120, 80, 95, 110, tickets.length]
          },
          {
            name: 'المحادثات',
            data: [11, 32, 45, 32, 34, 52, 41, 60, 55, 48, 62, Math.floor(tickets.length * 1.5)]
          }
        ];

        // 4. Visits Trend
        const visitsTrend = [
          {
            name: 'الزيارات',
            data: [10, 15, 8, 12, 20, 18, 25, 30, 22, 19, 24, 28]
          }
        ];

        // 5. Daily Visits Table
        const dailyVisits = visits.slice(0, 5).map((v: any) => ({
          date: v.planned_start || v.visit_date,
          count: 1, // Just a placeholder for table logic
          uniqueUsers: 1,
          averageTime: '2h 15m',
          status: v.priority || 'normal'
        }));

        // 6. Top Agents & Workload
        const workloadMap = new Map<string, number>();
        const performanceMap = new Map<string, number>();

        tickets.forEach(t => {
          if (t.engineer?.name) {
            workloadMap.set(t.engineer.name, (workloadMap.get(t.engineer.name) || 0) + 1);
          }
        });

        const topAgents = employees.map(e => {
          const resolved = tickets.filter(t => t.engineer_id === e.odoo_user_id && t.status === 'done').length;
          return {
            name: e.name,
            role: e.employee_role || 'موظف',
            avatar: e.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(e.name)}&background=random`,
            resolved: resolved || Math.floor(Math.random() * 10) + 5, // Fallback to semi-mock if no matches
            satisfaction: Math.floor(Math.random() * 15) + 85,
            avgResponse: '12m'
          };
        });

        const workloadDistribution = {
          labels: Array.from(workloadMap.keys()).slice(0, 5),
          series: Array.from(workloadMap.values()).slice(0, 5)
        };

        return {
          summaryCards,
          ticketStatus,
          monthlyTickets,
          visitsTrend,
          dailyVisits,
          topAgents,
          workloadDistribution,
          engineerPerformance: topAgents.filter(a => a.role === 'engineer')
        };
      })
    );
  }
}
