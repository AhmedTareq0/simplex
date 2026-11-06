import { Component, ChangeDetectionStrategy, inject, signal, computed, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '@/shared/components/icon/icon.component';
import { AiAssistantService } from '@/shared/components/ai-assistant/services/ai-assistant.service';
import { AiNewSessionModalComponent } from '@/shared/components/ai-assistant/components/ai-new-session-modal/ai-new-session-modal.component';
import { AiConversation } from '@/core/interfaces/ai-assistant.interface';

@Component({
  selector: 'app-ai-assistant-page',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, AiNewSessionModalComponent],
  templateUrl: './ai-assistant-page.component.html',
  styleUrl: './ai-assistant-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiAssistantPageComponent implements AfterViewChecked {
  readonly aiService = inject(AiAssistantService);

  @ViewChild('messagesScroll') private messagesScrollContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('fileInput') private fileInputElement?: ElementRef<HTMLInputElement>;

  readonly searchQuery = signal('');
  readonly editingConvId = signal<string | null>(null);
  readonly editingTitle = signal('');

  readonly inputText = signal('');
  readonly selectedFile = signal<File | null>(null);

  readonly conversations = this.aiService.conversations;
  readonly activeConversation = this.aiService.activeConversation;
  readonly messages = this.aiService.messages;
  readonly isLoadingMessages = this.aiService.isLoadingMessages;
  readonly isAiThinking = this.aiService.isAiThinking;
  readonly isExpired = this.aiService.isCurrentConversationExpired;
  readonly timeLeft = this.aiService.timeLeftFormatted;
  readonly isModalOpen = this.aiService.isNewSessionModalOpen;

  readonly filteredConversations = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const list = this.conversations();
    if (!q) return list;
    return list.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.machine_name && c.machine_name.toLowerCase().includes(q)) ||
        (c.last_message && c.last_message.toLowerCase().includes(q))
    );
  });

  private shouldScrollBottom = false;

  ngAfterViewChecked(): void {
    if (this.shouldScrollBottom) {
      this.scrollToBottom();
      this.shouldScrollBottom = false;
    }
  }

  openNewSessionModal(): void {
    this.aiService.openNewSessionModal();
  }

  onModalVisibleChange(v: boolean): void {
    if (!v) {
      this.aiService.closeNewSessionModal();
    }
  }

  selectConversation(conv: AiConversation): void {
    this.aiService.selectConversation(conv);
    this.shouldScrollBottom = true;
  }

  backToList(): void {
    this.aiService.activeConversation.set(null);
  }

  startEditing(conv: AiConversation, event: Event): void {
    event.stopPropagation();
    this.editingConvId.set(conv.id);
    this.editingTitle.set(conv.title);
  }

  saveEditing(convId: string, event?: Event): void {
    if (event) event.stopPropagation();
    const title = this.editingTitle().trim();
    if (title) {
      this.aiService.renameConversation(convId, title);
    }
    this.editingConvId.set(null);
  }

  cancelEditing(event?: Event): void {
    if (event) event.stopPropagation();
    this.editingConvId.set(null);
  }

  deleteConversation(convId: string, event: Event): void {
    event.stopPropagation();
    if (confirm('هل أنت متأكد من رغبتك في حذف هذه المحادثة من سجلك المحلي؟')) {
      this.aiService.deleteConversation(convId);
    }
  }

  endSession(convId: string): void {
    if (confirm('هل تريد إنهاء هذه الجلسة وإغلاقها؟ لن تتمكن من إرسال رسائل جديدة فيها بعد ذلك.')) {
      this.aiService.endConversation(convId).subscribe();
    }
  }

  startNewForSameMachine(machineId?: number, machineName?: string): void {
    if (!machineId) {
      this.openNewSessionModal();
      return;
    }
    this.aiService.startConversation({ id: machineId, name: machineName || `ماكينة #${machineId}` }).subscribe();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile.set(input.files[0]);
    }
  }

  removeFile(): void {
    this.selectedFile.set(null);
    if (this.fileInputElement) {
      this.fileInputElement.nativeElement.value = '';
    }
  }

  sendMessage(): void {
    const text = this.inputText().trim();
    const file = this.selectedFile();

    if (!text && !file) return;

    this.aiService.sendMessage(text, file || undefined);
    this.inputText.set('');
    this.removeFile();
    this.shouldScrollBottom = true;
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  checkIsExpired(expiresAt: string): boolean {
    return this.aiService.checkIsExpired(expiresAt);
  }

  formatTimeLeft(expiresAt: string): string {
    return this.aiService.formatTimeLeft(expiresAt);
  }

  formatTime(isoString: string): string {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }

  private scrollToBottom(): void {
    if (this.messagesScrollContainer) {
      const el = this.messagesScrollContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }
}
