import { Component, model, input, output, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '@/shared/components/icon/icon.component';
import { SharedModalComponent } from '@/shared/components/shared-modal/shared-modal.component';
import { MachineService, Machine } from '@/features/machines/services/machine.service';

@Component({
  selector: 'app-request-visit-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, SharedModalComponent],
  templateUrl: './request-visit-modal.component.html',
  styleUrl: './request-visit-modal.component.scss'
})
export class RequestVisitModalComponent {
  private readonly machineService = inject(MachineService);

  // model() = signal input مع two-way binding تلقائي [(visible)]
  readonly visible = model(false);
  readonly isSubmitting = input(false);

  readonly submitted = output<any>();

  // Available machines loaded from API (free_to_use > 0)
  readonly availableMachines = signal<Machine[]>([]);
  readonly isMachinesLoading = signal(false);
  readonly selectedProductIds = signal<number[]>([]);

  // Search and pagination for machines
  readonly machineSearchQuery = signal('');
  readonly displayedMachinesLimit = signal(4);
  readonly MACHINES_PAGE_SIZE = 4;

  // Form Signals
  readonly visitType = signal<'maintenance' | 'installation'>('maintenance');
  readonly maintenanceType = signal('');
  readonly visitPriority = signal('low');
  readonly visitDescription = signal('');

  readonly priorityOptions = [
    { label: 'منخفضة', value: 'low' },
    { label: 'متوسطة', value: 'medium' },
    { label: 'عالية', value: 'high' },
  ];

  readonly visitTypeOptions = [
    { label: 'صيانة (Maintenance)', value: 'maintenance' },
    { label: 'تركيب (Installation)', value: 'installation' }
  ];

  readonly maintenanceTypeOptions = [
    { label: 'ميكانيكا (Mechanical)', value: 'mechanical' },
    { label: 'كهرباء (Electrical)', value: 'electrical' },
    { label: 'تشغيل (Operating)', value: 'operating' },
    { label: 'دورية (Periodic)', value: 'periodic' }
  ];

  readonly installationSubTypes = [
    { label: 'غير راوتر (Non-router)', value: 'non_router' },
    { label: 'تجميع (Assembly)', value: 'assembly' },
    { label: 'فايبر ليزر (Fiber Laser G, N, P)', value: 'fiber_laser_gnp' },
    { label: 'فايبر ليزر (Fiber Laser H)', value: 'fiber_laser_h' },
    { label: 'مكبس تناية ومقص (Press Brake & Shearing)', value: 'press_brake_shearing' },
    { label: 'مخرطة (Lathe)', value: 'lathe' }
  ];

  // Crew Requirements Signals
  readonly isCrewEnabled = signal(false);
  readonly crewRequirements = signal<{ type: string; count: number }[]>([]);

  readonly crewTypeOptions = [
    { label: 'كهرباء (Electrical)', value: 'electrical' },
    { label: 'ميكانيكا (Mechanical)', value: 'mechanical' },
    { label: 'تشغيل (Operating)', value: 'operating' },
    // { label: 'برمجة (Programming)', value: 'programming' }
  ];

  // Validation Touched flags
  readonly maintenanceTypeTouched = signal(false);
  readonly visitDescriptionTouched = signal(false);

  readonly maintenanceTypeError = computed(() => {
    if (!this.maintenanceTypeTouched()) return '';
    if (!this.maintenanceType()) return this.visitType() === 'maintenance' ? 'نوع الصيانة مطلوب' : 'نوع الماكينة مطلوب';
    return '';
  });

  readonly visitDescriptionError = computed(() => {
    if (!this.visitDescriptionTouched()) return '';
    const val = this.visitDescription().trim();
    if (!val) return 'وصف المشكلة مطلوب';
    if (val.length < 10) return 'يجب أن يكون الوصف 10 أحرف على الأقل';
    return '';
  });

  readonly crewRequirementError = computed(() => {
    if (!this.isCrewEnabled()) return '';
    const crew = this.crewRequirements();
    if (crew.length === 0) return 'يجب إضافة تخصص واحد على الأقل عند تفعيل الطاقم';
    if (crew.some(item => !item.type || item.count < 1)) return 'برجاء استكمال بيانات جميع التخصصات المطلوبة';
    return '';
  });

  readonly isVisitFormValid = computed(() => {
    if (!this.maintenanceType()) return false;
    const descVal = this.visitDescription().trim();
    if (!descVal || descVal.length < 10) return false;

    if (this.isCrewEnabled()) {
      const crew = this.crewRequirements();
      if (crew.length === 0) return false;
      if (crew.some(item => !item.type || item.count < 1)) return false;
    }

    return true;
  });

  getAvailableCrewTypes(currentIndex: number) {
    const selectedTypesInOtherRows = this.crewRequirements()
      .filter((_, idx) => idx !== currentIndex)
      .map(item => item.type);

    return this.crewTypeOptions.filter(opt => !selectedTypesInOtherRows.includes(opt.value));
  }

  toggleCrewEnabled(enabled: boolean): void {
    this.isCrewEnabled.set(enabled);
    if (enabled && this.crewRequirements().length === 0) {
      this.addCrewRequirement();
    }
  }

  addCrewRequirement(): void {
    const selectedTypes = this.crewRequirements().map(item => item.type);
    const available = this.crewTypeOptions.find(opt => !selectedTypes.includes(opt.value));
    if (available) {
      this.crewRequirements.update(list => [...list, { type: available.value, count: 1 }]);
    }
  }

  removeCrewRequirement(index: number): void {
    this.crewRequirements.update(list => list.filter((_, i) => i !== index));
  }

  updateCrewCount(index: number, delta: number): void {
    this.crewRequirements.update(list => {
      return list.map((item, i) => {
        if (i === index) {
          const newCount = Math.max(1, item.count + delta);
          return { ...item, count: newCount };
        }
        return item;
      });
    });
  }

  onCrewCountInputChange(index: number, val: any): void {
    const parsed = Math.max(1, parseInt(String(val), 10) || 1);
    this.crewRequirements.update(list => {
      return list.map((item, i) => {
        if (i === index) {
          return { ...item, count: parsed };
        }
        return item;
      });
    });
  }

  onCrewTypeChange(index: number, newType: string): void {
    this.crewRequirements.update(list => {
      return list.map((item, i) => {
        if (i === index) {
          return { ...item, type: newType };
        }
        return item;
      });
    });
  }

  // Filtered and limited machines based on search query
  readonly filteredMachines = computed(() => {
    const query = this.machineSearchQuery().toLowerCase().trim();
    const machines = this.availableMachines();

    if (!query) return machines;

    return machines.filter(machine =>
      machine.display_name.toLowerCase().includes(query) ||
      (machine.default_code && machine.default_code.toLowerCase().includes(query))
    );
  });

  readonly displayedMachines = computed(() => {
    return this.filteredMachines().slice(0, this.displayedMachinesLimit());
  });

  readonly hasMoreMachines = computed(() => {
    return this.filteredMachines().length > this.displayedMachinesLimit();
  });

  constructor() {
    // effect يشتغل صح دلوقتي لأن visible بقى signal حقيقي
    effect(() => {
      if (this.visible()) {
        this.resetForm();
        this.loadAvailableMachines();
      }
    });
  }

  private loadAvailableMachines(): void {
    this.isMachinesLoading.set(true);
    this.machineService.fetchSpareParts({ available: true, pageSize: 100 }).subscribe({
      next: (machines) => {
        this.availableMachines.set(machines);
        this.isMachinesLoading.set(false);
      },
      error: () => this.isMachinesLoading.set(false),
    });
  }

  toggleProduct(id: number): void {
    this.selectedProductIds.update(ids =>
      ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]
    );
  }

  isProductSelected(id: number): boolean {
    return this.selectedProductIds().includes(id);
  }

  resetForm(): void {
    this.visitType.set('maintenance');
    this.maintenanceType.set('');
    this.visitPriority.set('low');
    this.visitDescription.set('');
    this.maintenanceTypeTouched.set(false);
    this.visitDescriptionTouched.set(false);
    this.selectedProductIds.set([]);
    this.machineSearchQuery.set('');
    this.displayedMachinesLimit.set(this.MACHINES_PAGE_SIZE);
    this.isCrewEnabled.set(false);
    this.crewRequirements.set([]);
  }

  loadMoreMachines(): void {
    this.displayedMachinesLimit.update(limit => limit + this.MACHINES_PAGE_SIZE);
  }

  onMachineSearchChange(query: string): void {
    this.machineSearchQuery.set(query);
    this.displayedMachinesLimit.set(this.MACHINES_PAGE_SIZE); // Reset limit when searching
  }

  setVisitType(type: string): void {
    if (this.visitType() !== type) {
      this.visitType.set(type as 'maintenance' | 'installation');
      this.maintenanceType.set('');
      this.maintenanceTypeTouched.set(false);
    }
  }

  setMaintenanceType(type: string): void {
    this.maintenanceType.set(type);
    this.maintenanceTypeTouched.set(true);
  }

  close(): void {
    this.visible.set(false);
  }

  submit(): void {
    this.maintenanceTypeTouched.set(true);
    this.visitDescriptionTouched.set(true);

    if (!this.isVisitFormValid()) return;

    const payload: any = {
      visit_type: this.visitType(),
      maintenance_type: this.maintenanceType(),
      priority: this.visitPriority(),
      description: this.visitDescription().trim()
    };

    if (this.isCrewEnabled()) {
      payload.crew_requirements = this.crewRequirements().map(item => ({
        skill: item.type,
        count: item.count
      }));
    }

    const ids = this.selectedProductIds();
    if (ids.length > 0) {
      payload.product_ids = ids;
    }

    this.submitted.emit(payload);
  }
}
