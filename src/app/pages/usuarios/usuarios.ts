import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, firstValueFrom, timeout } from 'rxjs';

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

  searchTerm = '';
  filtroRol = 'todos';
  filtroEstado = 'todos';

  currentPage = 1;
  pageSize = 6;

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

  // =========================
  // LISTAR USUARIOS
  // =========================

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
          this.currentPage = 1;
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
            this.error = 'No tienes permisos para ver usuarios.';
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

  // =========================
  // MODAL CREAR USUARIO
  // =========================

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

  // =========================
  // CREAR USUARIO
  // =========================

  async crearUsuario(): Promise<void> {
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

  try {
    await firstValueFrom(
      this.userService.crearUsuario(body).pipe(timeout(15000))
    );

    this.formSuccess = 'Usuario creado correctamente.';

    this.limpiarFormulario();
    this.cargarUsuarios();

    setTimeout(() => {
      this.cerrarModalCrear();
      this.cdr.detectChanges();
    }, 1000);

  } catch (error: any) {
    console.error('Error al crear usuario:', error);

    const mensajeApi = this.obtenerMensajeErrorApi(error);

    if (mensajeApi) {
      this.formError = mensajeApi;
    } else if (error?.status === 400) {
      this.formError = 'Revisa los datos ingresados.';
    } else if (error?.status === 401) {
      this.formError = 'Tu sesión ha expirado. Vuelve a iniciar sesión.';
    } else if (error?.status === 403) {
      this.formError = 'No tienes permisos para crear usuarios.';
    } else if (error?.status === 409) {
      this.formError = 'El correo ya está registrado.';
    } else if (error?.name === 'TimeoutError') {
      this.formError = 'La API demoró demasiado en responder.';
    } else if (error?.status === 0) {
      this.formError = 'No se pudo conectar con la API.';
    } else {
      this.formError = 'No se pudo crear el usuario.';
    }

  } finally {
    this.creating = false;
    this.cdr.detectChanges();
  }
}

  // =========================
  // ACTIVAR / DESACTIVAR USUARIO
  // =========================

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

          if (error?.status === 403) {
            this.error = 'No tienes permisos para cambiar el estado del usuario.';
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

  // =========================
  // CONTADORES
  // =========================

  get totalUsuarios(): number {
    return this.usuarios?.length || 0;
  }

  get usuariosActivos(): number {
    return this.usuarios.filter((usuario: Usuario) => usuario.isActive === true).length;
  }

  get usuariosInactivos(): number {
    return this.usuarios.filter((usuario: Usuario) => usuario.isActive === false).length;
  }

  get duenosSistema(): number {
    return this.usuarios.filter((usuario: Usuario) => this.esDuenoSistema(usuario)).length;
  }

  // =========================
  // FILTROS Y PAGINACIÓN
  // =========================

  get usuariosFiltrados(): Usuario[] {
    const texto = this.searchTerm.trim().toLowerCase();

    return this.usuarios.filter((usuario: Usuario) => {
      const nombre = usuario.name?.toLowerCase() || '';
      const email = usuario.email?.toLowerCase() || '';
      const rol = this.obtenerRolUsuario(usuario).toLowerCase();

      const coincideTexto =
        !texto ||
        nombre.includes(texto) ||
        email.includes(texto) ||
        rol.includes(texto);

      const coincideRol =
        this.filtroRol === 'todos' ||
        (this.filtroRol === 'owner' && this.esDuenoSistema(usuario)) ||
        (this.filtroRol === 'usuario' && !this.esDuenoSistema(usuario));

      const coincideEstado =
        this.filtroEstado === 'todos' ||
        (this.filtroEstado === 'activo' && usuario.isActive) ||
        (this.filtroEstado === 'inactivo' && !usuario.isActive);

      return coincideTexto && coincideRol && coincideEstado;
    });
  }

  get usuariosPaginados(): Usuario[] {
    const inicio = (this.currentPage - 1) * this.pageSize;
    const fin = inicio + this.pageSize;

    return this.usuariosFiltrados.slice(inicio, fin);
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.usuariosFiltrados.length / this.pageSize));
  }

  get paginasVisibles(): number[] {
    const paginas: number[] = [];
    const maximo = Math.min(this.totalPaginas, 5);

    for (let i = 1; i <= maximo; i++) {
      paginas.push(i);
    }

    return paginas;
  }

  cambiarPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) {
      return;
    }

    this.currentPage = pagina;
  }

  limpiarFiltros(): void {
    this.searchTerm = '';
    this.filtroRol = 'todos';
    this.filtroEstado = 'todos';
    this.currentPage = 1;
  }

  // =========================
  // UTILIDADES DE USUARIO
  // =========================

  obtenerIniciales(nombre: string): string {
    if (!nombre) {
      return 'US';
    }

    const partes = nombre.trim().split(' ');

    const primera = partes[0]?.charAt(0) || '';
    const segunda = partes[1]?.charAt(0) || '';

    return `${primera}${segunda}`.toUpperCase();
  }

  obtenerRolUsuario(usuario: Usuario): string {
    const user = usuario as any;

    if (this.esDuenoSistema(usuario)) {
      return 'Dueño del sistema';
    }

    return user.roleName || user.role || 'Usuario';
  }

  esDuenoSistema(usuario: Usuario): boolean {
    const user = usuario as any;

    return (
      user.isOwner === true ||
      user.role === 'Dueño del sistema' ||
      user.roleName === 'Dueño del sistema'
    );
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

  // =========================
  // ERRORES API
  // =========================

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
}