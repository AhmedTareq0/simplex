import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  inject,
  signal,
  computed,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModalComponent } from '../../../shared-modal/shared-modal.component';
import { ButtonComponent } from '../../../button/button.component';
import { IconComponent } from '../../../icon/icon.component';
import { LoadingSpinnerComponent } from '../../../loading-spinner/loading-spinner.component';
import { MachineService, Machine } from '@/features/machines/services/machine.service';
import { AiAssistantService } from '../../services/ai-assistant.service';

@Component({
  selector: 'app-ai-new-session-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SharedModalComponent,
    ButtonComponent,
    IconComponent,
    LoadingSpinnerComponent,
  ],
  templateUrl: './ai-new-session-modal.component.html',
  styleUrl: './ai-new-session-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiNewSessionModalComponent implements OnInit {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  private readonly machineService = inject(MachineService);
  private readonly aiService = inject(AiAssistantService);

  readonly machines = signal<Machine[]>([]);
  readonly isLoadingMachines = signal<boolean>(false);
  readonly isStarting = signal<boolean>(false);
  readonly searchQuery = signal<string>('');
  readonly selectedMachine = signal<Machine | null>(null);

  readonly filteredMachines = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const list = this.machines();
    if (!q) return list;
    return list.filter(
      (m) =>
        m.name?.toLowerCase().includes(q) ||
        m.display_name?.toLowerCase().includes(q) ||
        m.default_code?.toLowerCase().includes(q) ||
        m.type?.toLowerCase().includes(q)
    );
  });

  ngOnInit(): void {
    this.loadMachines();
  }

  loadMachines(): void {
    this.isLoadingMachines.set(true);
    this.machineService.fetchMachines({ pageSize: 50 }).subscribe({
      next: (items: Machine[]) => {
        this.isLoadingMachines.set(false);
        this.machines.set(items || []);
      },
      error: () => {
        this.isLoadingMachines.set(false);
      },
    });
  }

  selectMachine(m: Machine): void {
    this.selectedMachine.set(m);
  }

  onVisibleChange(v: boolean): void {
    this.visible = v;
    this.visibleChange.emit(v);
  }

  onCancel(): void {
    this.onVisibleChange(false);
  }

  onConfirm(): void {
    const m = this.selectedMachine();
    if (!m) return;

    this.isStarting.set(true);
    this.aiService
      .startConversation({
        id: m.id,
        name: m.name || m.display_name,
        type: m.type,
        image: m.image_url,
      })
      .subscribe({
        next: () => {
          this.isStarting.set(false);
          this.selectedMachine.set(null);
          this.onVisibleChange(false);
        },
        error: () => {
          this.isStarting.set(false);
        },
      });
  }
}
