import { Component, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-filters">
      <div class="chat-filters__header">
        <h3>فلاتر متقدمة</h3>
        <button class="reset-btn" (click)="reset()">إعادة تعيين</button>
      </div>

      <div class="chat-filters__body">
        <div class="filter-group">
          <label>نوع الماكينة</label>
          <select [(ngModel)]="filters().machine_type" (change)="emitChange()">
            <option value="">الكل</option>
            <option value="cnc">CNC</option>
            <option value="laser">Laser</option>
            <option value="plasma">Plasma</option>
            <option value="router">Router</option>
          </select>
        </div>

        <div class="filter-group">
          <label>الحالة</label>
          <select [(ngModel)]="filters().status" (change)="emitChange()">
            <option value="">الكل</option>
            <option value="with_customer_care">مع خدمة العملاء</option>
            <option value="with_engineer">مع المهندس</option>
            <option value="with_ai">مع الذكاء الاصطناعي</option>
            <option value="ended">منتهية</option>
          </select>
        </div>

        <div class="filter-group">
          <label>من تاريخ</label>
          <input type="date" [(ngModel)]="filters().from" (change)="emitChange()">
        </div>

        <div class="filter-group">
          <label>إلى تاريخ</label>
          <input type="date" [(ngModel)]="filters().to" (change)="emitChange()">
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chat-filters {
      padding: var(--space-4);
      background: var(--color-surface);
      border-radius: var(--space-3);
      border: 1px solid var(--color-border);
      margin-bottom: var(--space-4);

      &__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-4);

        h3 {
          margin: 0;
          font-size: var(--text-sm);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }

        .reset-btn {
          background: none;
          border: none;
          color: var(--color-primary);
          font-size: var(--text-xs);
          cursor: pointer;
          padding: 0;
          
          &:hover { text-decoration: underline; }
        }
      }

      &__body {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-3);

        @media (max-width: 640px) {
          grid-template-columns: 1fr;
        }
      }

      .filter-group {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);

        label {
          font-size: var(--text-xs);
          color: var(--color-text-secondary);
        }

        select, input {
          padding: var(--space-2);
          border-radius: var(--space-2);
          border: 1px solid var(--color-border);
          background: var(--color-background);
          font-size: var(--text-xs);
          color: var(--color-text-primary);
          outline: none;

          &:focus { border-color: var(--color-primary); }
        }
      }
    }
  `]
})
export class ChatFiltersComponent {
  filterChange = output<any>();

  filters = signal<any>({
    machine_type: '',
    status: '',
    from: '',
    to: ''
  });

  emitChange() {
    this.filterChange.emit(this.filters());
  }

  reset() {
    this.filters.set({
      machine_type: '',
      status: '',
      from: '',
      to: ''
    });
    this.emitChange();
  }
}
