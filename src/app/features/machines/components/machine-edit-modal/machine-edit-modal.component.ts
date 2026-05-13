import { Component, input, output, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  SharedModalComponent,
  SharedInputComponent,
  SharedSelectComponent,
  IconComponent,
  ButtonComponent
} from '../../../../shared/components';
import { Machine, MachineService, MachineCategory } from '../../services/machine.service';

@Component({
  selector: 'app-machine-edit-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModalComponent,
    SharedInputComponent,
    SharedSelectComponent,
    IconComponent,
    ButtonComponent
  ],
  templateUrl: './machine-edit-modal.component.html',
  styleUrl: './machine-edit-modal.component.scss'
})
export class MachineEditModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly machineService = inject(MachineService);

  machine = input.required<Machine>();
  isSubmitting = input<boolean>(false);
  visible = input<boolean>(false);

  save = output<FormData>();
  cancel = output<void>();

  editForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    categoryId: [null, Validators.required],
    type: ['Goods', Validators.required],
    description: [''],
    description_sale: [''],
    price: [null, [Validators.required, Validators.min(0)]],
    active: [true],
    model_number: [''],
    serial_number: [''],
    warranty_period: [null],
    origin_country: [''],
    technical_specs: ['']
  });

  typeOptions = [
    { label: 'سلعة (Goods)', value: 'Goods' },
    { label: 'خدمة (Service)', value: 'Service' },
    { label: 'استهلاكي (Consumable)', value: 'Consumable' }
  ];

  categories = signal<MachineCategory[]>([]);
  selectedImage: File | null = null;
  selectedDocument: File | null = null;
  imagePreview = signal<string | null>(null);

  ngOnInit() {
    this.loadCategories();
    const m = this.machine();
    if (m && m.id !== 0) {
      this.editForm.patchValue({
        name: m.display_name || m.name,
        description: m.description,
        description_sale: m.description_sale,
        price: m.list_price,
        categoryId: m.category_id ?? null,
        type: m.type || 'product',
        active: m.active ?? true,
        model_number: m.model_number || '',
        serial_number: m.serial_number || '',
        warranty_period: m.warranty_period || null,
        origin_country: m.origin_country || '',
        technical_specs: m.technical_specs || ''
      });
      if (m.image_url) {
        this.imagePreview.set(m.image_url);
      }
    } else {
      this.editForm.reset({
        active: true,
        type: 'Goods'
      });
      this.imagePreview.set(null);
    }
  }

  private loadCategories() {
    this.machineService.getCategories().subscribe(cats => {
      this.categories.set(cats || []);
      this.patchSelectedCategory();
    });
  }

  private patchSelectedCategory() {
    const machine = this.machine();
    if (!machine || machine.id === 0 || this.editForm.value.categoryId) return;

    const machineCategory = this.normalizeCategoryName(machine.category);
    const matchedCategory = this.categories().find(category => {
      const name = this.normalizeCategoryName(category.name);
      const completeName = this.normalizeCategoryName(category.complete_name);
      return name === machineCategory || completeName === machineCategory;
    });

    if (matchedCategory) {
      this.editForm.patchValue({ categoryId: matchedCategory.id });
    }
  }

  private normalizeCategoryName(value: string | null | undefined): string {
    return (value || '').trim().toLowerCase();
  }

  get categoryOptions() {
    return this.categories().map(c => ({ label: c.name, value: c.id }));
  }

  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedImage = file;
      const reader = new FileReader();
      reader.onload = (e) => this.imagePreview.set(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  }

  onDocumentSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedDocument = file;
    }
  }

  onSubmit() {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const formData = new FormData();
    const vals = this.editForm.value;

    formData.append('name', vals.name);
    formData.append('category_id', vals.categoryId.toString());
    formData.append('description', vals.description || '');
    formData.append('description_sale', vals.description_sale || '');
    formData.append('list_price', vals.price.toString());
    formData.append('type', vals.type);
    formData.append('active', vals.active.toString());
    formData.append('model_number', vals.model_number || '');
    formData.append('serial_number', vals.serial_number || '');
    if (vals.warranty_period) formData.append('warranty_period', vals.warranty_period.toString());
    formData.append('origin_country', vals.origin_country || '');
    formData.append('technical_specs', vals.technical_specs || '');

    if (this.selectedImage) {
      formData.append('image', this.selectedImage);
    }

    if (this.selectedDocument) {
      formData.append('document', this.selectedDocument);
    }

    this.save.emit(formData);
  }

  getErrorMessage(controlName: string): string {
    const control = this.editForm.get(controlName);
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'هذا الحقل مطلوب';
    }
    if (control.hasError('min')) {
      return 'القيمة يجب أن تكون أكبر من 0';
    }

    return '';
  }
}
