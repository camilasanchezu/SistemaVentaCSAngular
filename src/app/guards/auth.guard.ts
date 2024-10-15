import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../Services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    // Aquí verificamos si el usuario está autenticado
    const isAuthenticated = this.authService.isLoggedIn();

    if (isAuthenticated) {
      // Si el usuario está autenticado, se permite el acceso a la ruta
      return true;
    } else {
      // Si el usuario no está autenticado, lo redirigimos a la página de login
      return this.router.createUrlTree(['/login']);
    }
  }
}
