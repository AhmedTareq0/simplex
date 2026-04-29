import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { SharedTableComponent, TableColumn } from '../../shared/components/shared-table/shared-table.component';

import { summaryCards } from '../../data/dashboard/summary-cards.data';
import { ticketStatusValues, ticketTotal, monthlyTicketsValues, visitsTrendValues } from '../../data/dashboard/chart-values.data';
import { dailyVisits } from '../../data/dashboard/daily-visits.data';
import { topAgents } from '../../data/dashboard/top-agents.data';
import { ticketStatusConfig, monthlyTicketsConfig, visitsTrendConfig } from './chart-config';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule, IconComponent, SharedTableComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  readonly summaryCards = summaryCards;
  readonly dailyVisits: any[] = dailyVisits;
  readonly topAgents = topAgents;

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

  readonly tableLabels = {
    total: 'إجمالي الأيام',
    searchPlaceholder: 'بحث في الزيارات...',
    actionsHeader: 'الإجراءات'
  };

  readonly ticketStatusOptions = {
    ...ticketStatusConfig,
    series: ticketStatusValues,
    plotOptions: {
      pie: {
        donut: {
          ...ticketStatusConfig.plotOptions.pie.donut,
          labels: {
            show: true,
            total: {
              show: true,
              label: 'إجمالي التذاكر',
              formatter: () => String(ticketTotal),
            },
          },
        },
      },
    },
  };

  readonly monthlyTicketsOptions = {
    ...monthlyTicketsConfig,
    series: monthlyTicketsValues,
  };

  readonly visitsTrendOptions = {
    ...visitsTrendConfig,
    series: visitsTrendValues,
  };
}
