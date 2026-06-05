import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, timeout } from 'rxjs';

import { UserService, Usuario } from '../../services/users';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css'
})
export class Usuarios implements OnInit {
  usuarios: Usuario[] = [];

  loading = false;
  creating = false;
  showForm = false;

  showPassword = false;
  showConfirmPassword = false;

  updatingUserId: string | null = null;

  error = '';
  formError = '';
  formSuccess = '';

  form = {
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  constructor(
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.loading = true;
    this.error = '';

    this.userService
      .listarUsuarios()
      .pipe(
        timeout(15000),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response) => {
          this.usuarios = Array.isArray(response) ? response : [];
        },

        error: (error) => {
          console.error('Error al listar usuarios:', error);

          const mensajeApi = this.obtenerMensajeErrorApi(error);

          if (mensajeApi) {
            this.error = mensajeApi;
            return;
          }

          if (error?.status === 401) {
            this.error = 'Tu sesión ha expirado. Vuelve a iniciar sesión.';
            return;
          }
          if (error?.status === 403) {
          this.formError = 'No tienes permisos para crear usuarios.';
          return;
          }

          if (error?.name === 'TimeoutError') {
            this.error = 'La API demoró demasiado en responder.';
            return;
          }

          this.error = 'No se pudieron cargar los usuarios.';
        }
      });
  }

  abrirModalCrear(): void {
    this.limpiarFormulario();
    this.formError = '';
    this.formSuccess = '';
    this.showForm = true;
  }

  cerrarModalCrear(): void {
    this.showForm = false;
    this.limpiarFormulario();
    this.formError = '';
    this.formSuccess = '';
  }

  limpiarFormulario(): void {
    this.form = {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    };

    this.showPassword = false;
    this.showConfirmPassword = false;
  }

  crearUsuario(): void {
    this.formError = '';
    this.formSuccess = '';

    if (
      !this.form.name.trim() ||
      !this.form.email.trim() ||
      !this.form.password ||
      !this.form.confirmPassword
    ) {
      this.formError = 'Completa todos los campos.';
      return;
    }

    if (this.form.password !== this.form.confirmPassword) {
      this.formError = 'Las contraseñas no coinciden.';
      return;
    }

    const body = {
      name: this.form.name.trim(),
      email: this.form.email.trim(),
      password: this.form.password
    };

    this.creating = true;

    this.userService
      .crearUsuario(body)
      .pipe(
        timeout(15000),
        finalize(() => {
          this.creating = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.formSuccess = 'Usuario creado correctamente.';

          this.limpiarFormulario();
          this.cargarUsuarios();
          this.cdr.detectChanges();

          setTimeout(() => {
            this.cerrarModalCrear();
            this.cdr.detectChanges();
          }, 1200);
        },

        error: (error) => {
          console.error('Error al crear usuario:', error);

          const mensajeApi = this.obtenerMensajeErrorApi(error);

          if (mensajeApi) {
            this.formError = mensajeApi;
            return;
          }

          if (error?.status === 401) {
            this.formError = 'Tu sesión ha expirado. Vuelve a iniciar sesión.';
            return;
          }

          if (error?.name === 'TimeoutError') {
            this.formError = 'La API demoró demasiado en responder.';
            return;
          }

          this.formError = 'No se pudo crear el usuario.';
        }
      });
  }

  cambiarEstadoUsuario(usuario: Usuario): void {
    if (this.updatingUserId === usuario.id) {
      return;
    }

    this.error = '';
    this.updatingUserId = usuario.id;

    const nuevoEstado = !usuario.isActive;

    const solicitud = usuario.isActive
      ? this.userService.desactivarUsuario(usuario.id)
      : this.userService.activarUsuario(usuario.id);

    solicitud
      .pipe(
        timeout(15000),
        finalize(() => {
          this.updatingUserId = null;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          usuario.isActive = nuevoEstado;
          this.cdr.detectChanges();
        },

        error: (error) => {
          console.error('Error al cambiar estado del usuario:', error);

          const mensajeApi = this.obtenerMensajeErrorApi(error);

          if (mensajeApi) {
            this.error = mensajeApi;
            return;
          }

          if (error?.status === 401) {
            this.error = 'Tu sesión ha expirado. Vuelve a iniciar sesión.';
            return;
          }

          if (error?.name === 'TimeoutError') {
            this.error = 'La API demoró demasiado en responder.';
            return;
          }

          this.error = usuario.isActive
            ? 'No se pudo desactivar el usuario.'
            : 'No se pudo activar el usuario.';
        }
      });
  }

  private obtenerMensajeErrorApi(error: any): string | null {
    const apiError = error?.error;

    if (!apiError) {
      return null;
    }

    if (typeof apiError === 'string') {
      return apiError;
    }

    if (Array.isArray(apiError) && apiError.length > 0) {
      return apiError[0]?.message || null;
    }

    if (apiError?.message) {
      return apiError.message;
    }

    if (apiError?.errors?.length && apiError.errors[0]?.message) {
      return apiError.errors[0].message;
    }

    return null;
  }

  formatearFecha(fecha: string): string {
    if (!fecha) {
      return 'Sin fecha';
    }

    return new Date(fecha).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}