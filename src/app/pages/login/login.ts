import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, timeout } from 'rxjs';

interface ApiError {
  message?: string;
}

interface LoginResponse {
  accessToken?: string;
  token?: string;
  data?: {
    accessToken?: string;
    token?: string;
  };
  isSuccess?: boolean;
  message?: string;
  errors?: ApiError[];
  statusCode?: number;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnInit {
  private readonly loginUrl =
    'https://erps-production.up.railway.app/api/platform/auth/login';

  mostrarPassword = false;
  recordar = false;
  cargando = false;
  error = '';

  loginData = {
    email: '',
    password: ''
  };

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.recordar = !!localStorage.getItem('token');
  }

  iniciarSesion(): void {
    if (this.cargando) {
      return;
    }

    this.error = '';

    if (!this.loginData.email.trim() || !this.loginData.password) {
      this.error = 'Ingresa tu correo y contraseña';
      return;
    }

    this.cargando = true;

    const body = {
      email: this.loginData.email.trim(),
      password: this.loginData.password
    };

    this.http
      .post<LoginResponse>(this.loginUrl, body)
      .pipe(
        timeout(8000),
        finalize(() => {
          this.cargando = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response) => {
          if (response?.isSuccess === false) {
            this.error =
              response.errors?.[0]?.message ||
              response.message ||
              'No se pudo iniciar sesión';

            return;
          }

          const token = this.obtenerToken(response);

          if (!token) {
            this.error = 'No se pudo iniciar sesión';
            return;
          }

          this.guardarToken(token);

          this.router.navigate(['/dashboard']);
        },

        error: (error: unknown) => {
          if (this.esTimeoutError(error)) {
            this.error = 'El servidor está demorando demasiado';
            return;
          }

          if (error instanceof HttpErrorResponse) {
            this.error = this.obtenerMensajeErrorApi(error);
            return;
          }

          this.error = 'Error al iniciar sesión';
        }
      });
  }

  private guardarToken(token: string): void {
    if (this.recordar) {
      localStorage.setItem('token', token);
      sessionStorage.removeItem('token');
      return;
    }

    sessionStorage.setItem('token', token);
    localStorage.removeItem('token');
  }

  private obtenerToken(
    response: LoginResponse | null | undefined
  ): string | null {
    return (
      response?.token ||
      response?.accessToken ||
      response?.data?.token ||
      response?.data?.accessToken ||
      null
    );
  }

  private obtenerMensajeErrorApi(error: HttpErrorResponse): string {
    const apiError = error.error;

    if (apiError?.errors?.length && apiError.errors[0]?.message) {
      return apiError.errors[0].message;
    }

    if (apiError?.message) {
      return apiError.message;
    }

    if (typeof apiError === 'string') {
      return apiError;
    }

    if (error.status === 401) {
      return 'Credenciales inválidas';
    }

    if (error.status === 404) {
      return 'Recurso no encontrado';
    }

    if (error.status === 0) {
      return 'No se pudo conectar con el servidor';
    }

    return 'Error al iniciar sesión';
  }

  private esTimeoutError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      error.name === 'TimeoutError'
    );
  }
}