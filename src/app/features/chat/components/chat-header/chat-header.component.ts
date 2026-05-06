import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../../../shared/components';

@Component({
  selector: 'app-chat-header',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './chat-header.component.html',
  styleUrl: './chat-header.component.scss',
})
export class ChatHeaderComponent {
  @Input() person: any;
  @Input() isOnline = false;
  @Input() isTyping = false;
  @Input() conversationId = '';
  @Input() status = '';

  showMenu = signal(false);

  toggleMenu(): void {
    this.showMenu.update(v => !v);
  }
}
