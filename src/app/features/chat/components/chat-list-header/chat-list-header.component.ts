import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat-list-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-list-header.component.html',
  styleUrl: './chat-list-header.component.scss',
})
export class ChatListHeaderComponent {
  @Input() accountPicture = '';
}
