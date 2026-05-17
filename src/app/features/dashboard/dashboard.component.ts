import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { IconComponent, SharedTableComponent, TableColumn, ButtonComponent, SharedDatepickerComponent } from '../../shared/components';
import { FormsModule } from '@angular/forms';

import { DashboardService } from './services/dashboard.service';
import { AdminSyncService } from '../../core/services/admin-sync.service';
import { Subscription, interval } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';
import { ticketStatusConfig, monthlyTicketsConfig, visitsTrendConfig } from './chart-config';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, NgApexchartsModule, IconComponent, SharedTableComponent, ButtonComponent, SharedDatepickerComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly syncService = inject(AdminSyncService);
  
  readonly summaryCards = signal<any[]>([]);
  readonly dailyVisits = signal<any[]>([]);
  readonly topAgents = signal<any[]>([]);
  readonly isLoading = signal(true);
  readonly rangeDates = signal<Date[] | null>(null);

  private dataSubscription?: Subscription;

  readonly visitColumns: TableColumn[] = [
    { field: 'date', header: 'التاريخ', type: 'date', filterable: true },
    { field: 'count', header: 'عدد الزيارات', type: 'number' },
    { field: 'uniqueUsers', header: 'زوار فريدون', type: 'number' },
    { field: 'averageTime', header: 'متوسط الوقت', type: 'text' },
    {
      field: 'status',
      header: 'الحالة',
      type: 'badge',
      formatter: (val: string) => {
        switch (val) {
          case 'high': return 'مرتفع';
          case 'normal': return 'طبيعي';
          case 'low': return 'منخفض';
          default: return String(val);
        }
      }
    }
  ];

  readonly agentColumns: TableColumn[] = [
    { field: 'name', header: 'الموظف', type: 'text' },
    { field: 'role', header: 'الدور / القسم', type: 'badge' },
    { field: 'resolved', header: 'تذاكر محلولة', type: 'number' },
    { field: 'satisfaction', header: 'نسبة الرضا', type: 'text', formatter: (val: any) => `${val}%` }
  ];

  readonly tableLabels = {
    total: 'إجمالي السجلات',
    searchPlaceholder: 'بحث في البيانات...',
    actionsHeader: 'تعديل'
  };

  readonly ticketStatusOptions = signal<any>({
    ...ticketStatusConfig,
    series: [0, 0, 0],
    plotOptions: {
      pie: {
        donut: {
          ...ticketStatusConfig.plotOptions.pie.donut,
          labels: {
            show: true,
            total: {
              show: true,
              label: 'إجمالي التذاكر',
              formatter: (w: any) => {
                const sum = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
                return String(sum);
              },
            },
          },
        },
      },
    },
  });

  readonly monthlyTicketsOptions = signal<any>({
    ...monthlyTicketsConfig,
    series: [],
  });

  readonly visitsTrendOptions = signal<any>({
    ...visitsTrendConfig,
    series: [],
  });

  readonly isSyncing = this.syncService.isSyncing;

  ngOnInit() {
    this.startAutoRefresh();
  }

  onSyncAll() {
    this.syncService.syncAll().subscribe({
      next: () => this.refreshData(),
      error: () => {}
    });
  }

  private refreshData() {
    this.isLoading.set(true);
    this.dashboardService.getDashboardData().subscribe({
      next: (data) => {
        this.summaryCards.set(data.summaryCards);
        this.dailyVisits.set(data.dailyVisits);
        this.topAgents.set(data.topAgents);
        this.ticketStatusOptions.update(prev => ({ ...prev, series: data.ticketStatus }));
        this.monthlyTicketsOptions.update(prev => ({ ...prev, series: data.monthlyTickets }));
        this.visitsTrendOptions.update(prev => ({ ...prev, series: data.visitsTrend }));
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  private startAutoRefresh() {
    this.dataSubscription = interval(60000) // Refresh every 60 seconds
      .pipe(
        startWith(0),
        switchMap(() => {
          this.isLoading.set(true);
          return this.dashboardService.getDashboardData();
        })
      )
      .subscribe({
        next: (data) => {
          this.summaryCards.set(data.summaryCards);
          this.dailyVisits.set(data.dailyVisits);
          this.topAgents.set(data.topAgents);
          
          this.ticketStatusOptions.update(prev => ({ ...prev, series: data.ticketStatus }));
          this.monthlyTicketsOptions.update(prev => ({ ...prev, series: data.monthlyTickets }));
          this.visitsTrendOptions.update(prev => ({ ...prev, series: data.visitsTrend }));
          
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      });
  }

  ngOnDestroy() {
    this.dataSubscription?.unsubscribe();
  }
}
