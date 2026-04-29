import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthLocalService } from '../services/auth-local.service';
import { ButtonComponent } from '@/shared/components/button/button.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthLocalService);
  private readonly router = inject(Router);

  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly loginMethod = signal<'phone' | 'email'>('phone');
  readonly isPasswordVisible = signal(false);

  readonly loginForm = this.fb.group({
    PhoneNumber: ['', [Validators.required, Validators.pattern(/^01[0-9]{9}$/)]],
    email: [''],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  togglePasswordVisibility() {
    this.isPasswordVisible.update(val => !val);
  }

  setLoginMethod(method: 'phone' | 'email') {
    this.loginMethod.set(method);
    if (method === 'phone') {
      this.loginForm.get('PhoneNumber')?.setValidators([Validators.required, Validators.pattern(/^01[0-9]{9}$/)]);
      this.loginForm.get('email')?.clearValidators();
    } else {
      this.loginForm.get('email')?.setValidators([Validators.required, Validators.email]);
      this.loginForm.get('PhoneNumber')?.clearValidators();
    }
    this.loginForm.get('PhoneNumber')?.updateValueAndValidity();
    this.loginForm.get('email')?.updateValueAndValidity();
    this.errorMessage.set('');
  }

  quickLogin() {
    this.setLoginMethod('phone');
    this.loginForm.patchValue({
      PhoneNumber: '01112223330',
      password: '123456'
    });
    this.onSubmit();
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    const formVal = this.loginForm.value;
    // In a real app, you might pass email or phone based on the selected method
    // Since AuthLocalService currently expects PhoneNumber, we map email to it for mock purposes or pass both
    const PhoneNumber = this.loginMethod() === 'phone' ? formVal.PhoneNumber : formVal.email;
    const password = formVal.password;

    this.authService.login({ PhoneNumber: PhoneNumber as string, password: password as string }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Login failed. Please try again.');
      },
    });
  }
}
