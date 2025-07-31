import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatFormField, MatLabel, MatError } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatDatepicker, MatDatepickerInput, MatDatepickerToggle } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { CalendarService, TimeSlot, Appointment } from '../../services/calendar.service';

@Component({
  selector: 'app-booking',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    MatFormField,
    MatLabel,
    MatError,
    MatInput,
    MatButton,
    MatIcon,
    MatDatepicker,
    MatDatepickerInput,
    MatDatepickerToggle,
    MatNativeDateModule,
    MatRadioGroup,
    MatRadioButton
  ],
  templateUrl: './booking.component.html',
  styleUrl: './booking.component.scss'
})
export class BookingComponent implements OnInit {
  bookingForm: FormGroup;
  availableSlots: TimeSlot[] = [];
  selectedDate: Date | null = null;
  isLoading = false;
  minDate = new Date();

  constructor(
    private fb: FormBuilder,
    private calendarService: CalendarService,
    private snackBar: MatSnackBar
  ) {
    this.bookingForm = this.fb.group({
      selectedDate: ['', Validators.required],
      selectedTimeSlot: ['', Validators.required],
      clientName: ['', [Validators.required, Validators.minLength(2)]],
      clientEmail: ['', [Validators.required, Validators.email]],
      description: ['']
    });
  }

  ngOnInit(): void {
    // Écouter les changements de date
    this.bookingForm.get('selectedDate')?.valueChanges.subscribe(date => {
      if (date) {
        this.selectedDate = date;
        this.loadAvailableSlots(date);
        // Réinitialiser la sélection du créneau
        this.bookingForm.get('selectedTimeSlot')?.setValue('');
      }
    });
  }

  loadAvailableSlots(date: Date): void {
    this.isLoading = true;
    this.calendarService.getAvailableTimeSlots(date).subscribe({
      next: (slots) => {
        this.availableSlots = slots.filter(slot => slot.available);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des créneaux:', error);
        this.isLoading = false;
        this.snackBar.open('Erreur lors du chargement des créneaux', 'Fermer', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  onSubmit(): void {
    if (this.bookingForm.valid && this.selectedDate) {
      this.isLoading = true;
      
      const formValue = this.bookingForm.value;
      const selectedSlot = formValue.selectedTimeSlot;
      
      // Créer les dates de début et fin
      const startTime = this.parseTimeSlot(selectedSlot.start);
      const endTime = this.parseTimeSlot(selectedSlot.end);
      
      const startDate = new Date(this.selectedDate);
      startDate.setHours(startTime.hours, startTime.minutes, 0, 0);
      
      const endDate = new Date(this.selectedDate);
      endDate.setHours(endTime.hours, endTime.minutes, 0, 0);

      const newAppointment: Omit<Appointment, 'id'> = {
        title: `Rendez-vous ${formValue.clientName}`,
        start: startDate,
        end: endDate,
        clientName: formValue.clientName,
        clientEmail: formValue.clientEmail,
        description: formValue.description || 'Rendez-vous réservé en ligne',
        status: 'pending'
      };

      this.calendarService.addAppointment(newAppointment).subscribe({
        next: (appointment) => {
          this.isLoading = false;
          this.snackBar.open('Rendez-vous réservé avec succès !', 'Fermer', {
            duration: 5000,
            panelClass: ['success-snackbar']
          });
          this.resetForm();
        },
        error: (error) => {
          console.error('Erreur lors de la réservation:', error);
          this.isLoading = false;
          this.snackBar.open('Erreur lors de la réservation', 'Fermer', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private parseTimeSlot(timeString: string): { hours: number; minutes: number } {
    const [hours, minutes] = timeString.split(':').map(num => parseInt(num, 10));
    return { hours, minutes };
  }

  private markFormGroupTouched(): void {
    Object.keys(this.bookingForm.controls).forEach(key => {
      const control = this.bookingForm.get(key);
      control?.markAsTouched();
    });
  }

  resetForm(): void {
    this.bookingForm.reset();
    this.selectedDate = null;
    this.availableSlots = [];
  }

  // Filtrer les dates (pas de weekend par exemple)
  dateFilter = (date: Date | null): boolean => {
    if (!date) return false;
    const day = date.getDay();
    // Bloquer les weekends (0 = dimanche, 6 = samedi)
    return day !== 0 && day !== 6;
  };

  // Vérifier si le formulaire a des erreurs
  hasError(controlName: string, errorName: string): boolean {
    const control = this.bookingForm.get(controlName);
    return !!(control?.hasError(errorName) && control?.touched);
  }

  // Obtenir le message d'erreur
  getErrorMessage(controlName: string): string {
    const control = this.bookingForm.get(controlName);
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Ce champ est requis';
    }
    if (control.hasError('email')) {
      return 'Email invalide';
    }
    if (control.hasError('minlength')) {
      return 'Minimum 2 caractères requis';
    }
    return '';
  }
}
