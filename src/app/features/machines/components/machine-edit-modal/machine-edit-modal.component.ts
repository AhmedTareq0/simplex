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
    description: [''],
    price: [null, Validators.required]
  });

  categories = signal<MachineCategory[]>([]);
  selectedImage: File | null = null;
  selectedDocument: File | null = null;
  imagePreview = signal<string | null>(null);

  ngOnInit() {
    this.loadCategories();
    const m = this.machine();
    if (m && m.id !== 0) {
      this.editForm.patchValue({
        name: m.display_name,
        description: m.description,
        price: m.list_price,
        categoryId: m.category_id ?? null
      });
      if (m.image_url) {
        this.imagePreview.set(m.image_url);
      }
    } else {
      this.editForm.reset();
      this.imagePreview.set(null);
    }
  }

  private loadCategories() {
    this.machineService.getCategories().subscribe(cats => {
      this.categories.set(cats);
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

    // Keys matching API_FRONTEND_DOCS.md exactly
    formData.append('Name', vals.name);
    formData.append('CategoryId', vals.categoryId.toString());
    formData.append('Description', vals.description || '');
    formData.append('Price', vals.price.toString());

    if (this.selectedImage) {
      formData.append('Image', this.selectedImage);
    }

    if (this.selectedDocument) {
      formData.append('Document', this.selectedDocument);
    }

    this.save.emit(formData);
  }
}
