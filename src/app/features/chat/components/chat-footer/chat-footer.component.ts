import {
  Component, EventEmitter, Output, signal,
  ViewChild, ElementRef, HostListener, CUSTOM_ELEMENTS_SCHEMA
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import 'emoji-picker-element';

@Component({
  selector: 'app-chat-footer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './chat-footer.component.html',
  styleUrl: './chat-footer.component.scss',
})
export class ChatFooterComponent {
  @Output() sendMessage = new EventEmitter<string>();
  @Output() sendFile = new EventEmitter<File>();

  @ViewChild('inputRef') inputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('emojiPickerRef') emojiPickerRef!: ElementRef;

  messageText = signal('');
  showEmojiPicker = signal(false);

  hasText(): boolean {
    return this.messageText().trim().length > 0;
  }

  onSend() {
    const text = this.messageText().trim();
    if (text) {
      this.sendMessage.emit(text);
      this.messageText.set('');
      this.inputRef?.nativeElement.focus();
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.sendFile.emit(input.files[0]);
      input.value = '';
    }
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
