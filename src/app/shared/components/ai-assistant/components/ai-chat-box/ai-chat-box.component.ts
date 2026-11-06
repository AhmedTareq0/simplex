import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  inject,
  signal,
  computed,
  ViewChild,
  ElementRef,
  AfterViewChecked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../../icon/icon.component';
import { LoadingSpinnerComponent } from '../../../loading-spinner/loading-spinner.component';
import { AiAssistantService } from '../../services/ai-assistant.service';
import { AiChatMessage } from '@/core/interfaces/ai-assistant.interface';

@Component({
  selector: 'app-ai-chat-box',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, LoadingSpinnerComponent],
  templateUrl: './ai-chat-box.component.html',
  styleUrl: './ai-chat-box.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiChatBoxComponent implements AfterViewChecked {
  @Input() isOpen = false;
  @Input() isMinimized = false;

  @Output() closeChat = new EventEmitter<void>();
  @Output() minimizeChat = new EventEmitter<void>();

  @ViewChild('scrollContainer') private scrollContainer?: ElementRef<HTMLDivElement>;

  private readonly aiService = inject(AiAssistantService);

  readonly conversation = this.aiService.activeConversation;
  readonly messages = this.aiService.messages;
  readonly isLoadingMessages = this.aiService.isLoadingMessages;
  readonly isAiThinking = this.aiService.isAiThinking;
  readonly isExpired = this.aiService.isCurrentConversationExpired;
  readonly timeLeftLabel = this.aiService.timeLeftFormatted;

  readonly messageText = signal<string>('');
  readonly pendingFile = signal<File | null>(null);

  private shouldScrollBottom = false;

  ngAfterViewChecked(): void {
    if (this.shouldScrollBottom) {
      this.scrollToBottom();
      this.shouldScrollBottom = false;
    }
  }

  scrollToBottom(): void {
    try {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTop =
          this.scrollContainer.nativeElement.scrollHeight;
      }
    } catch { }
  }

  toggleMinimize(): void {
    this.minimizeChat.emit();
  }

  onClose(): void {
    this.closeChat.emit();
  }

  onEndConversation(): void {
    const conv = this.conversation();
    if (!conv) return;

    if (confirm('هل أنت متأكد من رغبتك في إنهاء هذه الجلسة مع المساعد الذكي؟')) {
      this.aiService.endConversation(conv.id).subscribe();
    }
  }

  onStartNewAfterExpired(): void {
    this.aiService.openNewSessionModal();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.pendingFile.set(input.files[0]);
    }
    input.value = '';
  }

  clearPendingFile(): void {
    this.pendingFile.set(null);
  }

  onSendMessage(): void {
    const text = this.messageText();
    const file = this.pendingFile();

    if (!text.trim() && !file) return;

    this.aiService.sendMessage(text, file || undefined);
    this.messageText.set('');
    this.pendingFile.set(null);
    this.shouldScrollBottom = true;
  }

  isImageAttachment(msg: AiChatMessage): boolean {
    if (!msg.attachment_url) return false;
    if (msg.attachment_type && msg.attachment_type.startsWith('image/')) return true;
    return /\.(jpg|jpeg|png|webp|gif)$/i.test(msg.attachment_url);
  }

  formatMessageTime(timeStr: string): string {
    if (!timeStr) return '';
    try {
      const d = new Date(timeStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }
}
