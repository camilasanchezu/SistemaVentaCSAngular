import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor() {}

  // Método para verificar si el usuario está autenticado
  isLoggedIn(): boolean {
    // Esta es una verificación simple. Cambia esto según cómo manejes la autenticación
    // Por ejemplo, revisando si existe un token en localStorage
    return !!localStorage.getItem('token');
  }
}
