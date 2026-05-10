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

export interface TableColumn {
  field: string;
  header: string;
  type?: 'text' | 'number' | 'date' | 'status' | 'badge';
  filterable?: boolean; // إيقاف أو تشغيل الفلتر لهذا العمود
  filterType?: 'text' | 'dropdown' | 'date' | 'boolean';
  filterOptions?: any[];
  placeholder?: string;
  color?: string;
  formatter?: (value: any, row: any) => string;
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
    IconComponent
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
  @Input() emptyMessage: string = 'لا توجد بيانات';

  // Server-side pagination
  @Input() lazy: boolean = false;
  @Input() totalRecords: number = 0;
  @Output() onPageChange = new EventEmitter<{ page: number; rows: number }>();

  // Internal pagination state
  currentPage: number = 1;

  @Input() showView: boolean = true;
  @Input() showEdit: boolean = true;
  @Input() showDelete: boolean = true;
  @Input() customActions: MenuItem[] = [];
  
  @Input() labels: any = {}; // To support the current dashboard passing labels

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

  get filterFields(): string[] { return this.columns.map(c => c.field); }

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
    return Math.ceil(this.totalRecords / this.rows) || 1;
  }

  get pageNumbers(): number[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const pages: number[] = [];
    const delta = 2;
    for (let i = Math.max(1, current - delta); i <= Math.min(total, current + delta); i++) {
      pages.push(i);
    }
    return pages;
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    this.currentPage = page;
    this.onPageChange.emit({ page, rows: this.rows });
  }

  onRowsChange(newRows: number) {
    this.rows = newRows;
    this.currentPage = 1;
    this.onPageChange.emit({ page: 1, rows: newRows });
  }

  onLazyLoad(event: any) {
    const page = Math.floor((event.first ?? 0) / (event.rows ?? this.rows)) + 1;
    this.onPageChange.emit({ page, rows: event.rows ?? this.rows });
  }
  
  getColColor(index: number, isText: boolean): string { return this.colorPalette[index % this.colorPalette.length]; }
  printTable() { window.print(); }
}
