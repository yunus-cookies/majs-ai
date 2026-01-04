import { Component } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Customerfield } from './customerfield/customerfield';
import { Firestore, collection, collectionData, doc, docData } from '@angular/fire/firestore';
import { Auth, authState } from '@angular/fire/auth';
import { inject } from '@angular/core';
import { map, Observable, of, switchMap } from 'rxjs';
import { Router } from '@angular/router';

interface Customer {
  caller_id: string;
  called_number: string;
  timestamp: number;
  address: string;
  status: 'ongoing' | 'completed';
  conv_summary: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [Customerfield, AsyncPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private router = inject(Router);

  customers$: Observable<Customer[]>;

  constructor() {
    this.customers$ = authState(this.auth).pipe(
      switchMap((user) => {
        if (user && user.phoneNumber) {
          const twilioNumberDoc = doc(this.firestore, `twilioNumbers/${user.phoneNumber}`);
          return docData(twilioNumberDoc).pipe(
            switchMap((twilioData: any) => {
              if (twilioData && twilioData.twilio_number) {
                const customersCollection = collection(this.firestore, `users/${twilioData.twilio_number}/customers`);
                return collectionData(customersCollection) as Observable<Customer[]>;
              }
              return of([]);
            })
          );
        }
        return of([]);
      }),
      map((customer: Customer[]) => {
        const ongoing = customer.filter((customer) => customer.status === 'ongoing').sort((a, b) => b.timestamp - a.timestamp);
        const completed = customer.filter((customer) => customer.status === 'completed').sort((a, b) => b.timestamp - a.timestamp);
        return [...ongoing, ...completed];
      })
    );
  }

  deleteEntry(entry: any) {}
}
