import {
  Component, output, signal,
  ViewChild, ElementRef, HostListener, CUSTOM_ELEMENTS_SCHEMA
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import 'emoji-picker-element';

export interface SendPayload {
  text: string;
  file?: File;
}

@Component({
  selector: 'app-chat-footer',
  standalone: true,
  imports: [FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './chat-footer.component.html',
  styleUrl: './chat-footer.component.scss',
})
export class ChatFooterComponent {
  readonly send = output<SendPayload>();
  readonly typing = output<void>();

  @ViewChild('inputRef') inputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('fileInputRef') fileInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('emojiPickerRef') emojiPickerRef!: ElementRef;

  messageText = signal('');
  showEmojiPicker = signal(false);
  pendingFile = signal<File | null>(null);
  pendingFilePreview = signal<string | null>(null);

  private typingThrottle?: ReturnType<typeof setTimeout>;

  // Show send button if there's text OR a pending file
  hasContent = () => this.messageText().trim().length > 0 || !!this.pendingFile();

  onTyping() {
    if (this.typingThrottle) return;
    this.typing.emit();
    this.typingThrottle = setTimeout(() => { this.typingThrottle = undefined; }, 2000);
  }

  onSend() {
    const text = this.messageText().trim();
    const file = this.pendingFile();

    if (!text && !file) return;

    // Send both text and file in one payload
    this.send.emit({ text, file: file ?? undefined });

    // Clear state
    this.messageText.set('');
    this.clearPendingFile();
    this.inputRef?.nativeElement.focus();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.pendingFile.set(file);

    // Generate preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => this.pendingFilePreview.set(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      this.pendingFilePreview.set(null);
    }

    input.value = '';
    this.inputRef?.nativeElement.focus();
  }

  clearPendingFile() {
    this.pendingFile.set(null);
    this.pendingFilePreview.set(null);
  }

  toggleEmojiPicker(event: Event) {
    event.stopPropagation();
    this.showEmojiPicker.update(v => !v);
  }

  onEmojiClick(event: Event) {
    const detail = (event as CustomEvent).detail;
    const emoji = detail?.unicode || detail?.emoji?.unicode || '';
    if (emoji) {
      this.messageText.update(t => t + emoji);
      this.inputRef?.nativeElement.focus();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (this.showEmojiPicker()) {
      const target = event.target as HTMLElement;
      const picker = this.emojiPickerRef?.nativeElement;
      if (picker && !picker.contains(target)) {
        this.showEmojiPicker.set(false);
      }
    }
  }
}
