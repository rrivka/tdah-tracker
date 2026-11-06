import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Solo deja pasar si hay sesión. Si no, manda al login. */
export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.ready;
  return auth.user() ? true : router.createUrlTree(['/login']);
};

/** Para la página de login: si YA hay sesión, manda directo a la app. */
export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.ready;
  return auth.user() ? router.createUrlTree(['/']) : true;
};
