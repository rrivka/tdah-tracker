import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './guards/auth.guard';

/**
 * Rutas. Con hash routing las URLs se ven así: .../tdah-tracker/#/login
 *
 * Cada pantalla se carga solo cuando se necesita (loadComponent): la pantalla de
 * login no descarga el tablero, y viceversa. Así la app abre más rápido.
 */
export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./components/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./components/layout/layout.component').then((m) => m.LayoutComponent),
  },
  { path: '**', redirectTo: '' },
];
