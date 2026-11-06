import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './guards/auth.guard';
import { LoginComponent } from './components/login/login.component';
import { LayoutComponent } from './components/layout/layout.component';

/**
 * Rutas. Con hash routing las URLs se ven así: .../tdah-tracker/#/login
 */
export const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: '', component: LayoutComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' },
];
