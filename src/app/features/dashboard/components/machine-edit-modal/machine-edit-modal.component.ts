import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { Machine } from '../../services/machine.service';

@Component({
  selector: 'app-machine-edit-modal',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule, 
    ButtonModule, 
    InputTextModule, 
    InputNumberModule,
    TextareaModule,
    SelectModule,
    IconComponent
  ],
  templateUrl: './machine-edit-modal.component.html',
  styleUrl: './machine-edit-modal.component.scss'
})
export class MachineEditModalComponent {
  machine = input.required<Machine>();
  save = output<FormData>();
  cancel = output<void>();

  editForm: FormGroup;
  selectedImage: File | null = null;
  selectedDocument: File | null = null;
  imagePreview = signal<string | null>(null);

  typeOptions = [
    { label: 'Goods', value: 'Goods' },
    { label: 'Service', value: 'Service' },
    { label: 'Combo', value: 'Combo' }
  ];

  constructor(private fb: FormBuilder) {
    this.editForm = this.fb.group({
      name: ['', Validators.required],
      categoryId: [null, Validators.required],
      description: [''],
      price: [null, Validators.required]
    });
  }

  ngOnInit() {
    const m = this.machine();
    this.editForm.patchValue({
      name: m.display_name,
      description: m.description,
      price: m.list_price
    });
    if (m.image_url) {
      this.imagePreview.set(m.image_url);
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
    if (this.editForm.invalid) return;

    const formData = new FormData();
    const vals = this.editForm.value;

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
