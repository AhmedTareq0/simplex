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
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-shared-input',
  standalone: true,
  imports: [CommonModule, InputTextModule, FormsModule],
  templateUrl: './shared-input.component.html',
  styleUrls: ['./shared-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SharedInputComponent),
      multi: true
    }
  ]
})
export class SharedInputComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() type = 'text';
  @Input() disabled = false;
  @Input() error = '';
  @Input() hint = '';
  @Input() icon = '';

  @Output() valueChange = new EventEmitter<string>();

  value: string = '';

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onModelChange(value: string): void {
    this.value = value;
    this.onChange(value);
    this.onTouched();
    this.valueChange.emit(value);
  }
}
