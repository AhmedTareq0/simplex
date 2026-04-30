import { Component, signal, HostBinding, ViewEncapsulation, ElementRef, inject, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatListComponent } from './components/chat-list/chat-list.component';
import { ChatBoxComponent } from './components/chat-box/chat-box.component';
import { ChatEmptyComponent } from './components/chat-empty/chat-empty.component';

// Mock data for demo
const MOCK_USERS = [
  {
    sub: 'user1',
    name: 'Ahmed Ali',
    picture: 'https://ui-avatars.com/api/?name=Ahmed+Ali&background=random',
  },
  {
    sub: 'user2',
    name: 'Sara Mohamed',
    picture: 'https://ui-avatars.com/api/?name=Sara+Mohamed&background=random',
  },
  {
    sub: 'user3',
    name: 'Omar Khaled',
    picture: 'https://ui-avatars.com/api/?name=Omar+Khaled&background=random',
  },
];

const DEMO_MESSAGES: Record<string, any[]> = {
  user1: [
    {
      senderId: 'user1',
      text: 'Hey! How are you doing today?',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
      type: 'text',
    },
    {
      senderId: 'admin',
      text: 'I am doing great! Just working on the new chat feature.',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1.8),
      type: 'text',
    },
    {
      senderId: 'user1',
      text: 'That sounds awesome! Let me know if you need help.',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1.5),
      type: 'text',
      replyTo: {
        text: 'I am doing great! Just working on the new chat feature.',
      },
    },
    {
      senderId: 'admin',
      text: 'Thanks! I will keep you posted.',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1),
      type: 'text',
    },
    {
      senderId: 'user1',
      text: 'This message was deleted by mistake',
      createdAt: new Date(Date.now() - 1000 * 60 * 30),
      type: 'text',
      isDeleted: true,
    },
    {
      senderId: 'admin',
      text: 'Haha no worries!',
      createdAt: new Date(Date.now() - 1000 * 60 * 25),
      type: 'text',
    },
  ],
  user2: [
    {
      senderId: 'user2',
      text: 'Hello there! Are we still on for the meeting?',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
      type: 'text',
    },
    {
      senderId: 'admin',
      text: 'Yes, 3 PM works for me.',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4.5),
      type: 'text',
    },
    {
      senderId: 'user2',
      text: 'Perfect, see you then!',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
      type: 'text',
    },
    {
      senderId: 'admin',
      text: 'Looking forward to it.',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
      type: 'text',
      isDeleted: true,
    },
  ],
  user3: [
    {
      senderId: 'user3',
      text: 'Did you check the latest designs?',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8),
      type: 'text',
    },
    {
      senderId: 'admin',
      text: 'Not yet, will check soon.',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 7.5),
      type: 'text',
    },
    {
      senderId: 'user3',
      text: 'They look amazing!',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
      type: 'text',
      replyTo: {
        text: 'Not yet, will check soon.',
      },
    },
  ],
};

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, ChatListComponent, ChatBoxComponent, ChatEmptyComponent],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ChatComponent implements AfterViewInit {
  @HostBinding('class.chat-page') chatPageClass = true;

  private elementRef = inject(ElementRef);

  readonly users = signal(MOCK_USERS);
  readonly currentUserId = 'admin';
  readonly accountPicture = 'https://ui-avatars.com/api/?name=Admin&background=6ec1e4&color=fff';

  selectedPerson = signal<any>(null);
  messages = signal<any[]>([]);
  lastMessages = signal<Record<string, any>>({});

  ngAfterViewInit() {
    // Build lastMessages from demo data
    const lm: Record<string, any> = {};
    for (const [userId, msgs] of Object.entries(DEMO_MESSAGES)) {
      if (msgs.length > 0) lm[userId] = msgs[msgs.length - 1];
    }
    this.lastMessages.set(lm);

    // Find the parent layout-content__inner element and add a class to it
    let parent = this.elementRef.nativeElement.parentElement;
    while (parent) {
      if (parent.classList && parent.classList.contains('layout-content__inner')) {
        parent.classList.add('chat-page-active');
        break;
      }
      parent = parent.parentElement;
    }
  }

  onSelectUser(user: any) {
    this.selectedPerson.set(user);
    const msgs = DEMO_MESSAGES[user.sub] || [];
    this.messages.set(msgs);
  }
}
