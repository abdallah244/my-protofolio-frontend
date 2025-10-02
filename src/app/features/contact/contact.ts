import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ThemeService } from '../../core/services/theme.service';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle';
import { ContactService, ContactMessage } from '../../core/services/contact.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ThemeToggleComponent],
  templateUrl: './contact.html',
  styleUrls: ['./contact.css']
})
export class ContactComponent implements OnInit {
  currentTheme: 'dark' | 'light' = 'dark';
  contactForm: FormGroup;
  isSubmitting = false;
  submitMessage = '';
  submitType: 'success' | 'error' = 'success';

  contactInfo = [
    { icon: 'fas fa-envelope', label: 'Email', value: 'abdallahhfares@gmail.com', link: 'mailto:abdallahhfares@gmail.com' },
    { icon: 'fas fa-phone', label: 'Phone', value: '+20 1142402039', link: 'tel:+201142402039' },
    { icon: 'fas fa-map-marker-alt', label: 'Location', value: 'Ismailia, Egypt', link: 'https://maps.google.com/?q=Ismailia,Egypt' }
  ];

  socialLinks = [
    { icon: 'fab fa-github', label: 'GitHub', url: 'https://github.com/abdallahhfares' },
    { icon: 'fab fa-linkedin', label: 'LinkedIn', url: 'https://linkedin.com/in/abdallahhfares' },
  ];

  constructor(
    private themeService: ThemeService,
    private fb: FormBuilder,
    private contactService: ContactService
  ) {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', [Validators.required]],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit(): void {
    this.themeService.currentTheme$.subscribe(theme => {
      this.currentTheme = theme;
    });
  }

  onSubmit(): void {
    if (this.contactForm.valid) {
      this.isSubmitting = true;
      this.submitMessage = '';
      
      const messageData: ContactMessage = {
        name: this.contactForm.value.name,
        email: this.contactForm.value.email,
        subject: this.contactForm.value.subject,
        message: this.contactForm.value.message
      };

      console.log('📤 Sending message:', messageData);

      this.contactService.sendMessage(messageData).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          
          if (response.success) {
            this.submitType = 'success';
            this.submitMessage = response.message || 'Message sent successfully! We will get back to you soon.';
            this.contactForm.reset();
            
            // Reset success message after 5 seconds
            setTimeout(() => {
              this.submitMessage = '';
            }, 5000);
          } else {
            this.submitType = 'error';
            this.submitMessage = response.message || 'Failed to send message. Please try again.';
          }
        },
        error: (error) => {
          this.isSubmitting = false;
          this.submitType = 'error';
          
          console.error('❌ Error sending message:', error);
          
          // Handle different error types
          if (error.message.includes('Validation Error')) {
            this.submitMessage = error.message;
          } else if (error.message.includes('already exists')) {
            this.submitMessage = 'You have already sent a message with this subject. Please use a different subject.';
          } else if (error.message.includes('Network Error') || error.message.includes('Failed to fetch')) {
            this.submitMessage = 'Network error. Please check your internet connection and try again.';
          } else {
            this.submitMessage = error.message || 'Failed to send message. Please try again later.';
          }
          
          // Reset error message after 8 seconds
          setTimeout(() => {
            this.submitMessage = '';
          }, 8000);
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      this.markFormGroupTouched(this.contactForm);
      this.submitType = 'error';
      this.submitMessage = 'Please fill all required fields correctly.';
      
      setTimeout(() => {
        this.submitMessage = '';
      }, 5000);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  openLink(url: string): void {
    window.open(url, '_blank');
  }

  // Helper methods for template
  getFieldError(fieldName: string): string {
    const field = this.contactForm.get(fieldName);
    if (field?.touched && field?.invalid) {
      if (field?.errors?.['required']) {
        return 'This field is required';
      }
      if (field?.errors?.['email']) {
        return 'Please enter a valid email address';
      }
      if (field?.errors?.['minlength']) {
        const requiredLength = field.errors?.['minlength']?.requiredLength;
        return `Minimum ${requiredLength} characters required`;
      }
    }
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.contactForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }
}