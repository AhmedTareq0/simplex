import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  EventEmitter,
  Input,
  Output,
  TemplateRef
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';

import { AppIconName, IconComponent } from '../icon/icon.component';

export type TableCellType = 'text' | 'number' | 'date' | 'status' | 'badge';
export type TableFilterType = 'text' | 'dropdown';

export interface TableColumn {
  field: string;
  header: string;
  type?: TableCellType;
  filterable?: boolean;
  filterType?: TableFilterType;
  filterOptions?: Array<Record<string, unknown>>;
  placeholder?: string;
  align?: 'start' | 'center' | 'end';
  formatter?: (value: unknown, row: Record<string, unknown>) => string;
}

export interface TableAction {
  id: string;
  label: string;
  description?: string;
  icon?: AppIconName;
  variant?: 'default' | 'danger';
  showIf?: (row: Record<string, unknown>) => boolean;
  command?: (row: Record<string, unknown>) => void;
}

export interface TableLabels {
  total: string;
  searchPlaceholder: string;
  filterTooltip: string;
  printTooltip: string;
  actionsHeader: string;
  view: string;
  edit: string;
  delete: string;
}

const DEFAULT_LABELS: TableLabels = {
  total: 'Total',
  searchPlaceholder: 'Search…',
  filterTooltip: 'Toggle filters',
  printTooltip: 'Print table',
  actionsHeader: 'Actions',
  view: 'View',
  edit: 'Edit',
  delete: 'Delete'
};

@Component({
  selector: 'app-shared-table',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    MenuModule,
    ButtonModule,
    InputTextModule,
    TooltipModule,
    SelectModule,
    FormsModule,
    IconComponent
  ],
  templateUrl: './shared-table.component.html',
  styleUrls: ['./shared-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SharedTableComponent {
  @Input() data: Array<Record<string, unknown>> = [];
  @Input() columns: TableColumn[] = [];
  @Input() title = 'Data Table';
  @Input() showToolbar = true;
  @Input() showSearch = true;
  @Input() showPrint = true;
  @Input() showFilter = true;
  @Input() showActions = true;
  @Input() showPaginator = true;
  @Input() rows = 10;
  @Input() emptyMessage = 'No data available';
  @Input() showView = false;
  @Input() showEdit = false;
  @Input() showDelete = false;
  @Input() labels: Partial<TableLabels> = {};
  @Input() rowActions: TableAction[] = [];
  @Input() size: 'small' | 'normal' | 'large' = 'normal';

  @Output() view = new EventEmitter<Record<string, unknown>>();
  @Output() edit = new EventEmitter<Record<string, unknown>>();
  @Output() delete = new EventEmitter<Record<string, unknown>>();
  @Output() action = new EventEmitter<{ id: string; row: Record<string, unknown> }>();

  @ContentChild('bodyTpl') bodyTemplate?: TemplateRef<unknown>;
  @ContentChild('filterTpl') filterTemplate?: TemplateRef<unknown>;

  isFilterVisible = false;

  get mergedLabels(): TableLabels {
    return { ...DEFAULT_LABELS, ...this.labels };
  }

  get tableStyleClass(): string {
    const sizeClass =
      this.size === 'small'
        ? 'p-datatable-sm'
        : this.size === 'large'
          ? 'p-datatable-lg'
          : '';

    return ['app-shared-table__prime', sizeClass].filter(Boolean).join(' ');
  }

  get filterFields(): string[] {
    return this.columns.map((column) => column.field);
  }

  toggleFilters(): void {
    this.isFilterVisible = !this.isFilterVisible;
  }

  buildActionItems(row: Record<string, unknown>): MenuItem[] {
    if (this.rowActions.length > 0) {
      return this.rowActions
        .filter((action) => (action.showIf ? action.showIf(row) : true))
        .map((action) => ({
          id: action.id,
          label: action.label,
          command: () => {
            action.command?.(row);
            this.action.emit({ id: action.id, row });
          }
        }));
    }

    const items: MenuItem[] = [];

    if (this.showView) {
      items.push({
        id: 'view',
        label: this.mergedLabels.view,
        command: () => this.view.emit(row)
      });
    }

    if (this.showEdit) {
      items.push({
        id: 'edit',
        label: this.mergedLabels.edit,
        command: () => this.edit.emit(row)
      });
    }

    if (this.showDelete) {
      items.push({
        id: 'delete',
        label: this.mergedLabels.delete,
        command: () => this.delete.emit(row)
      });
    }

    return items;
  }

  getActionMeta(id: string): { icon: AppIconName; danger: boolean } {
    switch (id) {
      case 'delete':
        return { icon: 'trash', danger: true };
      case 'edit':
        return { icon: 'pencil', danger: false };
      case 'view':
        return { icon: 'eye', danger: false };
      default:
        return { icon: 'moreVertical', danger: false };
    }
  }

  getCellValue(column: TableColumn, row: Record<string, unknown>): string {
    const value = row[column.field];

    if (column.formatter) {
      return column.formatter(value, row);
    }

    if (value == null) {
      return '—';
    }

    if (column.type === 'date') {
      const date = value instanceof Date ? value : new Date(String(value));
      return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
    }

    return String(value);
  }

  getAlign(column: TableColumn): string {
    switch (column.align) {
      case 'center':
        return 'center';
      case 'end':
        return 'end';
      default:
        return 'start';
    }
  }

  printTable(): void {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }
}
