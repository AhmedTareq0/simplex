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
import { Machine } from '../../services/machine.service';

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

  machine = input.required<Machine>();
  isSubmitting = input<boolean>(false);
  visible = input<boolean>(false);
  
  save = output<FormData>();
  cancel = output<void>();

  editForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    descriptionSale: [''],
    listPrice: [null, Validators.required],
    type: ['Goods', Validators.required]
  });

  selectedImage: File | null = null;
  selectedDocument: File | null = null;
  imagePreview = signal<string | null>(null);

  typeOptions = [
    { label: 'بضائع', value: 'Goods' },
    { label: 'خدمة', value: 'Service' },
    { label: 'مجموعة', value: 'Combo' }
  ];

  ngOnInit() {
    const m = this.machine();
    if (m && m.id !== 0) {
      this.editForm.patchValue({
        name: m.display_name,
        description: m.description,
        descriptionSale: m.description_sale,
        listPrice: m.list_price,
        type: m.type || 'Goods'
      });
      if (m.image_url) {
        this.imagePreview.set(m.image_url);
      }
    } else {
      this.editForm.reset({
        type: 'Goods'
      });
      this.imagePreview.set(null);
    }
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

    formData.append('Name', vals.name);
    formData.append('Description', vals.description || '');
    formData.append('DescriptionSale', vals.descriptionSale || '');
    formData.append('ListPrice', vals.listPrice?.toString() || '0');
    formData.append('Type', vals.type);

    if (this.selectedImage) {
      formData.append('Image', this.selectedImage);
    }

    if (this.selectedDocument) {
      formData.append('Document', this.selectedDocument);
    }

    this.save.emit(formData);
  }
}
