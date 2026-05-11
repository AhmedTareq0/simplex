import { Component, input, output, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { 
  SharedModalComponent, 
  SharedInputComponent, 
  IconComponent,
  ButtonComponent
} from '../../../../shared/components';
import { Client } from '../../services/client.service';

@Component({
  selector: 'app-client-edit-modal',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule, 
    SharedModalComponent,
    SharedInputComponent,
    IconComponent,
    ButtonComponent
  ],
  templateUrl: './client-edit-modal.component.html',
  styleUrls: ['./client-edit-modal.component.scss']
})
export class ClientEditModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  client = input.required<Client>();
  visible = input<boolean>(false);
  isSubmitting = input<boolean>(false);

  save = output<FormData>();
  cancel = output<void>();

  editForm!: FormGroup;
  imagePreview = signal<string | null>(null);
  selectedFile: File | null = null;

  ngOnInit() {
    this.initForm();
    if (this.client().image_url) {
      this.imagePreview.set(this.client().image_url);
    }
  }

  private initForm() {
    const c = this.client();
    this.editForm = this.fb.group({
      display_name: [c.display_name || '', Validators.required],
      company_name: [c.company_name || '', Validators.required],
      email: [c.email || '', [Validators.required, Validators.email]],
      phone: [c.phone || '', Validators.required],
      address: [c.address || ''],
      city: [c.city || ''],
      active: [c.active ?? true]
    });
  }

  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => this.imagePreview.set(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  onSubmit() {
    if (this.editForm.invalid) return;

    const formData = new FormData();
    const values = this.editForm.value;
    
    Object.keys(values).forEach(key => {
      formData.append(key, values[key]);
    });

    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    this.save.emit(formData);
  }
}
