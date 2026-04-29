import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-main-layout-header',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './main-layout-header.component.html',
  styleUrl: './main-layout-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutHeaderComponent {
  readonly searchPlaceholder = input('ابحث في النظام...');
  readonly userName = input('المدير');
  readonly userRole = input('Admin');
  readonly avatarUrl = input('https://ui-avatars.com/api/?name=Admin&background=6ec1e4&color=fff');

  readonly menuClick = output<void>();

  isArabic = signal(true);

  toggleLang() {
    this.isArabic.update(v => !v);
    document.documentElement.setAttribute('dir', this.isArabic() ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', this.isArabic() ? 'ar' : 'en');
  }
}
