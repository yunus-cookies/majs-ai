import { Component, inject, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { updateDoc, doc, Firestore } from '@angular/fire/firestore';

@Component({
  selector: 'app-customerfield',
  imports: [MatIconModule],
  templateUrl: './customerfield.html',
  styleUrl: './customerfield.css',
})
export class Customerfield {
  readonly callerId = input.required<string>();
  readonly calledNumber = input.required<string>();
  readonly callSummary = input.required<string>();
  readonly status = input.required<string>();
  readonly address = input<string>();
  private firestore = inject(Firestore);

  completeOrder() {
    const docRef = doc(this.firestore, `users/${this.calledNumber()}/customers/${this.callerId()}`);
    updateDoc(docRef, {
      status: 'completed',
    });
  }
}
