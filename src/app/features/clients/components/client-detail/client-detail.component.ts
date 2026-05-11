import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModalComponent, IconComponent, ButtonComponent } from '../../../../shared/components';
import { Client } from '../../services/client.service';
import { AuthLocalService } from '../../../../auth/services/auth-local.service';

@Component({
  selector: 'app-client-detail',
  standalone: true,
  imports: [CommonModule, SharedModalComponent, IconComponent, ButtonComponent],
  templateUrl: './client-detail.component.html',
  styleUrl: './client-detail.component.scss'
})
export class ClientDetailComponent {
  readonly auth = inject(AuthLocalService);
  
  client = input.required<Client | null>();
  visible = input<boolean>(false);
  
  close = output<void>();
  edit = output<Client>();
}
