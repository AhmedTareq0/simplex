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
import { SelectModule } from 'primeng/select';

export type SharedSelectOption = Record<string, unknown>;

@Component({
  selector: 'app-shared-select',
  standalone: true,
  imports: [CommonModule, SelectModule, FormsModule],
  templateUrl: './shared-select.component.html',
  styleUrls: ['./shared-select.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SharedSelectComponent),
      multi: true
    }
  ]
})
export class SharedSelectComponent implements ControlValueAccessor {
  @Input() options: SharedSelectOption[] = [];
  @Input() label = '';
  @Input() placeholder = 'Select an option';
  @Input() optionLabel = 'label';
  @Input() optionValue = 'value';
  @Input() filter = false;
  @Input() disabled = false;
  @Input() error = '';
  @Input() hint = '';
  @Input() showClear = true;
  @Input() fluid = true;

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
