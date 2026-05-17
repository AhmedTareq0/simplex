import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  forwardRef,
  Input,
  Output
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';

@Component({
  selector: 'app-shared-datepicker',
  standalone: true,
  imports: [CommonModule, DatePickerModule, FormsModule],
  templateUrl: './shared-datepicker.component.html',
  styleUrls: ['./shared-datepicker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SharedDatepickerComponent),
      multi: true
    }
  ]
})
export class SharedDatepickerComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = 'اختر التاريخ';
  @Input() selectionMode: 'single' | 'multiple' | 'range' = 'single';
  @Input() readonlyInput = true;
  @Input() showButtonBar = true;
  @Input() disabled = false;
  @Input() error = '';
  @Input() hint = '';
  @Input() minDate?: Date;
  @Input() maxDate?: Date;

  @Output() valueChange = new EventEmitter<unknown>();

  value: unknown = null;

  private onChange: (value: unknown) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: unknown): void {
    this.value = value;
  }

  registerOnChange(fn: (value: unknown) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onModelChange(value: unknown): void {
    this.value = value;
    this.onChange(value);
    this.onTouched();
    this.valueChange.emit(value);
  }
}
