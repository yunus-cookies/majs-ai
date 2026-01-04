import { Routes } from '@angular/router';
import { Dashboard } from './dashboard/dashboard';
import { Login } from './login/login';
import { canActivate, redirectLoggedInTo, redirectUnauthorizedTo } from '@angular/fire/auth-guard';

const redirectUnauthorizedToLogin = () => redirectUnauthorizedTo(['login']);
const redirectLoggedInToDashboard = () => redirectLoggedInTo(['dashboard']);

export const routes: Routes = [
  { path: 'login', component: Login, ...canActivate(redirectLoggedInToDashboard) },
  { path: 'dashboard', component: Dashboard, ...canActivate(redirectUnauthorizedToLogin) },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
];
