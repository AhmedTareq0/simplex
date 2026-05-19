import { Component, Input, ContentChild, TemplateRef, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { MenuModule } from 'primeng/menu';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { MenuItem } from 'primeng/api';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';
import { RatingModule } from 'primeng/rating';

export interface TableColumn {
  field: string;
  header: string;
  type?: 'text' | 'number' | 'date' | 'status' | 'badge' | 'image' | 'link' | 'button' | 'rating';
  filterable?: boolean;
  filterType?: 'text' | 'dropdown' | 'date' | 'boolean';
  filterOptions?: any[];
  placeholder?: string;
  color?: string;
  icon?: string;
  linkText?: string;
  formatter?: (value: any, row: any) => string;
  colorFormatter?: (value: any, row: any) => string;
}

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
    IconComponent,
    RatingModule
  ],
  templateUrl: './shared-table.component.html',
  styleUrls: ['./shared-table.component.scss']
})
export class SharedTableComponent {
  @Input() data: any[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() title: string = 'جدول البيانات';
  @Input() showToolbar: boolean = true;
  @Input() showSearch: boolean = true;
  @Input() showPrint: boolean = true;
  @Input() showFilter: boolean = true;
  @Input() showActions: boolean = true;
  @Input() showPaginator: boolean = true;
  @Input() rows: number = 10;
  @Input() currentPage: number = 1;
  @Input() emptyMessage: string = 'لا توجد بيانات';

  @Input() lazy: boolean = false;
  @Input() totalRecords: number = 0;
  @Input() showSync: boolean = false;
  @Input() isSyncing: boolean = false;
  @Output() onSync = new EventEmitter<void>();
  @Output() onPageChange = new EventEmitter<{ page: number; rows: number }>();

  @Input() showView: boolean = true;
  @Input() showEdit: boolean = true;
  @Input() showDelete: boolean = true;
  @Input() customActions: MenuItem[] = [];
  @Input() labels: any = {};

  @Output() onView = new EventEmitter<any>();
  @Output() onEdit = new EventEmitter<any>();
  @Output() onDelete = new EventEmitter<any>();
  @Output() onAction = new EventEmitter<{ type: string, data: any }>();
  @Output() onRowClick = new EventEmitter<any>();

  @ContentChild('bodyTpl') bodyTemplate!: TemplateRef<any>;
  @ContentChild('filterTpl') filterTemplate!: TemplateRef<any>;

  public isFilterVisible: boolean = false;
  private selectedRow: any;
  private readonly colorPalette = ['#2563eb', '#4f46e5', '#7c3aed', '#db2777', '#059669', '#d97706'];
  private activeMenu: any;

  get filterFields(): string[] { return this.columns.map(column => column.field); }

  toggleFilters() {
    this.isFilterVisible = !this.isFilterVisible;
  }

  get actionItems(): MenuItem[] {
    if (this.customActions && this.customActions.length > 0) {
      return this.customActions
        .filter(action => {
          const actionAny = action as any;
          if (typeof actionAny.showIf === 'function') {
            return actionAny.showIf(this.selectedRow);
          }
          return action.visible !== false;
        })
        .map(action => ({
          ...action,
          command: () => {
            if (action.command) action.command({ item: action });
            this.onAction.emit({ type: action.id || action.label || 'custom', data: this.selectedRow });
          }
        }));
    }

    const items: MenuItem[] = [];
    if (this.showView) items.push({ id: 'view', label: 'عرض التفاصيل', command: () => this.onView.emit(this.selectedRow) });
    if (this.showEdit) items.push({ id: 'edit', label: 'تعديل السجل', command: () => this.onEdit.emit(this.selectedRow) });
    if (this.showDelete) items.push({ id: 'delete', label: 'حذف السجل', command: () => this.onDelete.emit(this.selectedRow) });
    return items;
  }

  get isOnlyEdit(): boolean {
    return this.showEdit && !this.showView && !this.showDelete && (!this.customActions || this.customActions.length === 0);
  }

  getSubtext(item: MenuItem): string {
    if (item.id === 'view') return 'رؤية كافة تفاصيل البيانات';
    if (item.id === 'edit') return 'تعديل بيانات هذا السجل';
    if (item.id === 'delete') return 'حذف السجل بشكل نهائي';
    return item['description'] || 'إجراء إضافي على السجل';
  }

  setSelectedRow(row: any) { this.selectedRow = row; }

  closeActiveMenu() {
    if (this.activeMenu) {
      this.activeMenu.hide();
      this.activeMenu = null;
    }
  }

  setActiveMenu(menu: any) {
    this.closeActiveMenu();
    this.activeMenu = menu;
  }

  onMenuHide() {
    this.activeMenu = null;
  }

  get totalPages(): number {
    return Math.ceil(this.totalRecords / Number(this.rows || 10)) || 1;
  }

  get pageNumbers(): number[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const pages: number[] = [];
    const delta = 2;
    for (let page = Math.max(1, current - delta); page <= Math.min(total, current + delta); page++) {
      pages.push(page);
    }
    return pages;
  }

  goToPage(page: number) {
    const nextPage = Number(page);
    const nextRows = Number(this.rows || 10);
    if (nextPage < 1 || nextPage > this.totalPages || nextPage === this.currentPage) return;
    this.currentPage = nextPage;
    this.onPageChange.emit({ page: nextPage, rows: nextRows });
  }

  onRowsChange(newRows: number) {
    this.rows = Number(newRows || 10);
    this.currentPage = 1;
    this.onPageChange.emit({ page: 1, rows: this.rows });
  }

  onLazyLoad(event: any) {
    const rows = Number(event.rows ?? this.rows ?? 10);
    const page = Math.floor((event.first ?? 0) / rows) + 1;
    this.currentPage = page;
    this.rows = rows;
    this.onPageChange.emit({ page, rows });
  }

  isLtrField(column: TableColumn): boolean {
    return ['phone', 'mobile', 'telephone'].includes(column.field);
  }

  getColColor(index: number, _isText: boolean): string { return this.colorPalette[index % this.colorPalette.length]; }
  printTable() { window.print(); }
}
