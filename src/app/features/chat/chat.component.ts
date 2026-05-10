import { Component, signal, HostBinding, ViewEncapsulation, ElementRef, inject, AfterViewInit, OnInit, OnDestroy, computed } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { SkeletonLoaderComponent } from '@/shared/components/skeleton-loader/skeleton-loader.component';
import { ChatListComponent } from './components/chat-list/chat-list.component';
import { ChatBoxComponent } from './components/chat-box/chat-box.component';
import { ChatEmptyComponent } from './components/chat-empty/chat-empty.component';
import { ChatService, Conversation, ApiMessage } from './services/chat.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [SkeletonLoaderComponent, ChatListComponent, ChatBoxComponent, ChatEmptyComponent],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ChatComponent implements OnInit, AfterViewInit, OnDestroy {
  @HostBinding('class.chat-page') chatPageClass = true;

  private elementRef = inject(ElementRef);
  private chatService = inject(ChatService);
  private route = inject(ActivatedRoute);
  private readonly destroy$ = new Subject<void>();
  private pendingConversationId = signal<string | null>(null);

  readonly users = signal<any[]>([]);
  readonly userData = signal<any>(null);


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
  readonly isTyping = signal(false);
  private typingTimeout?: ReturnType<typeof setTimeout>;

  ngOnInit() {
    try {
      const raw = localStorage.getItem('user');
      if (raw) this.userData.set(JSON.parse(raw));
    } catch { }

    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const convId = params['conversation'];
      if (convId) {
        this.pendingConversationId.set(convId);
        if (this.users().length > 0) {
          this.checkPendingConversation();
        }
      }
    });

    this.loadConversations();

    this.chatService.newEscalation$
      .pipe(takeUntil(this.destroy$))
      .subscribe((payload) => {
        const exists = this.users().some(u => u.sub === payload.conversation_id);
        if (exists) return;
        this.users.update(prev => [...prev, {
          sub: payload.conversation_id,
          name: payload.customer_name,
          picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(payload.customer_name)}&background=random`,
          status: 'with_customer_care',
          machineId: payload.machine_id,
          machineName: null,
          machineImage: null,
          customerCareName: null,
          engineerName: null,
          escalationReason: payload.escalation_reason,
          createdAt: payload.escalated_at,
          endedAt: null,
        }]);
      });

    this.chatService.statusChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe((payload) => {
        this.users.update(prev =>
          prev.map(u => u.sub === payload.conversation_id
            ? { ...u, status: payload.status }
            : u
          )
        );
      });

    this.chatService.agentJoined$
      .pipe(takeUntil(this.destroy$))
      .subscribe((payload) => {
        if (payload.role === 'engineer') {
          this.users.update(prev =>
            prev.map(u => u.sub === payload.conversation_id
              ? { ...u, engineerName: payload.name }
              : u
            )
          );
        }
      });

    this.chatService.typingIndicator$
      .pipe(takeUntil(this.destroy$))
      .subscribe((payload) => {
        if (
          payload.conversation_id === this.selectedPerson()?.sub &&
          payload.sender_role === 'customer'
        ) {
          clearTimeout(this.typingTimeout);
          this.isTyping.set(true);
          this.typingTimeout = setTimeout(() => this.isTyping.set(false), 3000);
        }
      });

    this.chatService.conversationReopened$
      .pipe(takeUntil(this.destroy$))
      .subscribe((payload) => {
        this.users.update(prev => prev.filter(u => u.sub !== payload.conversation_id));
        if (this.selectedPerson()?.sub === payload.conversation_id) {
          this.selectedPerson.set(null);
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    clearTimeout(this.typingTimeout);
  }

  loadConversations() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.chatService.getConversations().subscribe({
      next: (res) => {
        const mapped = (res.data?.items || []).map((c: any) => this.mapConversation(c));
        this.users.set(mapped);
        this.isLoading.set(false);
        this.checkPendingConversation();
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message ?? 'فشل تحميل المحادثات');
        this.isLoading.set(false);
      },
    });
  }

  private checkPendingConversation() {
    const convId = this.pendingConversationId();
    if (convId) {
      const user = this.users().find(u => u.sub === convId);
      if (user) {
        this.onSelectUser(user);
        this.pendingConversationId.set(null);
      }
    }
  }

  private mapConversation(c: Conversation) {
    return {
      sub: c.conversation_id,
      name: c.customer_name,
      picture: c.customer_profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.customer_name)}&background=random`,
      status: c.status,
      machineId: c.machine?.id ?? c.machine_id,
      machineName: c.machine?.name,
      machineImage: c.machine?.image,
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
