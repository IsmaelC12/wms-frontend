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
  data?: {
    accessToken?: string;
    token?: string;
  };
  isSuccess?: boolean;
  message?: string;
  errors?: ApiError[];
  statusCode?: number;
  token?: string;
}

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  private readonly loginUrl = 'https://erp-production-3ce2.up.railway.app/api/Auth';

  mostrarPassword = false;
  recordar = false;
  cargando = false;
  error = '';
  empresaDropdownAbierto = false;

  empresas = [
    {
      nombre: 'Amir Corporation',
      tenantId: '429269b3-b25c-44b6-a82a-132684c30483'
    },
    {
      nombre: 'Ismael Corporation',
      tenantId: 'f3c485a3-b265-4952-8690-8ab6a9be0423'
    }
  ];

  loginData = {
    email: '',
    password: '',
    tenantId: ''
  };

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const emailGuardado = localStorage.getItem('recordarEmail');

    if (emailGuardado) {
      this.loginData.email = emailGuardado;
      this.recordar = true;
    }
  }

  seleccionarEmpresa(tenantId: string) {
    this.loginData.tenantId = tenantId;
    this.empresaDropdownAbierto = false;
    this.error = '';
  }

  obtenerNombreEmpresaSeleccionada(): string {
    const empresa = this.empresas.find(e => e.tenantId === this.loginData.tenantId);
    return empresa ? empresa.nombre : 'Selecciona una empresa';
  }

  iniciarSesion() {
    if (this.cargando) {
      return;
    }

    this.error = '';

    if (!this.loginData.tenantId) {
      this.error = 'Selecciona una empresa';
      return;
    }

    if (!this.loginData.email || !this.loginData.password) {
      this.error = 'Ingresa tu correo y contraseña';
      return;
    }

    this.cargando = true;
    this.empresaDropdownAbierto = false;

    const body = {
      email: this.loginData.email.trim(),
      password: this.loginData.password,
      tenantId: this.loginData.tenantId
    };

    this.http.post<LoginResponse>(this.loginUrl, body)
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

          localStorage.setItem('token', token);
          localStorage.setItem('tenantId', body.tenantId);
          localStorage.setItem('email', body.email);

          if (this.recordar) {
            localStorage.setItem('recordarEmail', body.email);
          } else {
            localStorage.removeItem('recordarEmail');
          }

          this.router.navigate(['/dashboard']);
        },

        error: (error: unknown) => {
          if (this.esTimeoutError(error)) {
            this.error = 'El servidor está demorando demasiado';
            this.cdr.detectChanges();
            return;
          }

          if (error instanceof HttpErrorResponse) {
            this.error = this.obtenerMensajeErrorApi(error);
            this.cdr.detectChanges();
            return;
          }

          this.error = 'Error al iniciar sesión';
          this.cdr.detectChanges();
        }
      });
  }

  private obtenerToken(response: LoginResponse | null | undefined): string | null {
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