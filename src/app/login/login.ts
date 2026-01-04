import { Component, inject, OnInit } from '@angular/core';
import { Auth, RecaptchaVerifier } from '@angular/fire/auth';
import { FormsModule } from '@angular/forms';
import { ConfirmationResult, signInWithPhoneNumber, UserCredential } from 'firebase/auth';
import { FirebaseError } from '@angular/fire/app';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  private auth = inject(Auth);
  recaptchaVerifier!: RecaptchaVerifier;

  phoneNumber!: string;
  verificationCode!: string;
  public user: any;
  confirmationResult!: ConfirmationResult;
  errorMessage!: string;
  private router = inject(Router);

  constructor() {
    this.auth.languageCode = 'da';
  }

  ngOnInit() {
    this.recaptchaVerifier = new RecaptchaVerifier(this.auth, 'recaptcha-container', { size: 'invisible' });
    this.recaptchaVerifier.render();

    this.auth.onAuthStateChanged((user) => {
      if (user) {
        this.user = user;
        console.log('User is logged in', this.user);
        this.router.navigate(['/dashboard']);
      }
    });
  }

  getOTP() {
    const appVerifier = this.recaptchaVerifier;
    if (!this.phoneNumber || this.phoneNumber.length !== 8 || !this.phoneNumber.match(/^[0-9]{8}$/)) {
      this.errorMessage = 'Invalid phone number. Please enter a valid 8 digit phone number.';
      return;
    }
    const num = `+45${this.phoneNumber}`;

    signInWithPhoneNumber(this.auth, num, appVerifier)
      .then((confirmationResult) => {
        this.confirmationResult = confirmationResult;
        console.log('OTP sent', confirmationResult);
      })
      .catch((error) => {
        console.error('Error sending SMS', error);
        // Reset. Try again.
        this.recaptchaVerifier.clear();
        this.recaptchaVerifier = new RecaptchaVerifier(this.auth, 'recaptcha-container', { size: 'invisible' });
        this.recaptchaVerifier.render();
      });
  }

  verifyOTP() {
    this.confirmationResult
      .confirm(this.verificationCode)
      .then((userCredential: UserCredential) => {
        this.user = userCredential.user;
        console.log('User signed in', this.user);
        this.router.navigate(['/dashboard']);
      })
      .catch((error: FirebaseError) => {
        console.error('Error verifying OTP', error);
      });
  }
}
