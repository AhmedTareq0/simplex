import { Component, signal, HostBinding, ViewEncapsulation, ElementRef, inject, AfterViewInit, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonLoaderComponent } from '@/shared/components/skeleton-loader/skeleton-loader.component';
import { ChatListComponent } from './components/chat-list/chat-list.component';
import { ChatBoxComponent } from './components/chat-box/chat-box.component';
import { ChatEmptyComponent } from './components/chat-empty/chat-empty.component';
import { ChatService, Conversation, ApiMessage } from './services/chat.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, SkeletonLoaderComponent, ChatListComponent, ChatBoxComponent, ChatEmptyComponent],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ChatComponent implements OnInit, AfterViewInit {
  @HostBinding('class.chat-page') chatPageClass = true;

  private elementRef = inject(ElementRef);
  private chatService = inject(ChatService);

  readonly users = signal<any[]>([]);
  private readonly userData = signal<any>(null);


  readonly currentUserId = computed(() => {
    const empRole = (this.userData()?.employee_role || '').toLowerCase();
    return empRole === 'engineer' ? 'engineer' : 'support';
  });

  readonly accountPicture = computed(() => {
    const name = this.userData()?.name || 'unknown';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6ec1e4&color=fff`;
  });

  selectedPerson = signal<any>(null);
  readonly lastMessages = this.chatService.lastMessages;

  readonly messages = computed(() => {
    const raw = this.chatService.messages();
    const person = this.selectedPerson();
    return raw.map(m => this.mapApiMessage(m, person));
  });

  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly isLoadingMessages = this.chatService.isLoading;
  readonly messagesError = signal('');
  readonly unreadCounts = this.chatService.unreadCounts;

  ngOnInit() {
    try {
      const raw = localStorage.getItem('user');
      if (raw) this.userData.set(JSON.parse(raw));
    } catch { }
    this.loadConversations();

    this.chatService.newEscalation$.subscribe((payload) => {
      const exists = this.users().some(u => u.sub === payload.conversation_id);
      if (exists) return;
      this.users.update(prev => [...prev, {
        sub: payload.conversation_id,
        name: payload.customer_name,
        picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(payload.customer_name)}&background=random`,
        status: 'with_customer_care',
        machineId: payload.machine_id,
        customerCareName: null,
        engineerName: null,
        escalationReason: payload.escalation_reason,
        createdAt: payload.escalated_at,
        endedAt: null,
      }]);
    });
  }

  loadConversations() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.chatService.getConversations().subscribe({
      next: (res) => {
        const mapped = (res.data || []).map((c: Conversation) => this.mapConversation(c));
        this.users.set(mapped);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message ?? 'فشل تحميل المحادثات');
        this.isLoading.set(false);
      },
    });
  }

  private mapConversation(c: Conversation) {
    return {
      sub: c.conversation_id,
      name: c.customer_name,
      picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(c.customer_name)}&background=random`,
      status: c.status,
      machineId: c.machine_id,
      customerCareName: c.customer_care_name,
      engineerName: c.engineer_name,
      escalationReason: c.escalation_reason,
      createdAt: c.created_at,
      endedAt: c.ended_at,
    };
  }

  ngAfterViewInit() {
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
    this.messagesError.set('');
    this.chatService.loadMessages(user.sub);
    this.chatService.markRead(user.sub);
  }

  private mapApiMessage(m: ApiMessage, user: any): any {
    const role = m.role?.toLowerCase() || '';

    if (role === 'system') {
      return {
        senderId: 'system',
        text: m.content,
        createdAt: m.timestamp,
        type: 'system',
        role: 'system',
      };
    }

    let senderId = role;
    if (role === 'customer_care') senderId = 'support';
    else if (role === 'engineer') senderId = 'engineer';
    else if (role === 'customer') senderId = user?.sub || 'customer';
    else if (role === 'ai') senderId = 'ai';

    const isFile = !!m.attachment_url;
    return {
      senderId,
      text: isFile ? m.attachment_url : m.content,
      createdAt: m.timestamp,
      type: isFile ? 'file' : 'text',
      role: m.role,
      attachmentType: m.attachment_type,
    };
  }
}
