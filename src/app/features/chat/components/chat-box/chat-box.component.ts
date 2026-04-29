import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatHeaderComponent } from '../chat-header/chat-header.component';
import { ChatMessagesComponent } from '../chat-messages/chat-messages.component';

@Component({
  selector: 'app-chat-box',
  standalone: true,
  imports: [CommonModule, ChatHeaderComponent, ChatMessagesComponent],
  templateUrl: './chat-box.component.html',
  styleUrl: './chat-box.component.scss',
})
export class ChatBoxComponent {
  @Input() person: any;
  @Input() messages: any[] = [];
  @Input() currentUserId = '';
  @Input() isOnline = false;
  @Input() users: any[] = [];
}
