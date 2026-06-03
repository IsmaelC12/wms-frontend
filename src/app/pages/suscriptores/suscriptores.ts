import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TenantService } from '../../services/tenant';

@Component({
  selector: 'app-suscriptores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './suscriptores.html',
  styleUrl: './suscriptores.css'
})
export class SuscriptoresComponent implements OnInit {
  suscriptores: any[] = [];

  loading = false;
  creating = false;
  showForm = false;

  showPassword = false;
  showConfirmPassword = false;

  error = '';
  success = '';

  form = {
    name: '',
    ruc: '',
    companyName: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  constructor(
    private tenantService: TenantService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarSuscriptores();
  }

  limpiarFormulario(): void {
  this.form = {
    name: '',
    ruc: '',
    companyName: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  this.error = '';
  this.showPassword = false;
  this.showConfirmPassword = false;
  }

  abrirModalCrear(): void {
  this.limpiarFormulario();
  this.showForm = true;
  }

  cerrarModalCrear(): void {
  this.limpiarFormulario();
  this.showForm = false;
  }

  cargarSuscriptores(): void {
    this.loading = true;
    this.error = '';

    this.tenantService.listarSuscriptores().subscribe({
      next: (response) => {
        this.suscriptores = Array.isArray(response) ? response : [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al listar suscriptores:', error);
        this.error = 'No se pudieron cargar los suscriptores.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  crearSuscriptor(): void {
    this.error = '';
    this.success = '';

    if (
      !this.form.name.trim() ||
      !this.form.ruc.trim() ||
      !this.form.companyName.trim() ||
      !this.form.email.trim() ||
      !this.form.password.trim() ||
      !this.form.confirmPassword.trim()
    ) {
      this.error = 'Completa todos los campos.';
      return;
    }

    if (this.form.password !== this.form.confirmPassword) {
      this.error = 'Las contraseñas no coinciden.';
      return;
    }

    const body = {
      name: this.form.name,
      ruc: this.form.ruc,
      companyName: this.form.companyName,
      email: this.form.email,
      password: this.form.password
    };

    this.creating = true;

    this.tenantService.crearSuscriptor(body).subscribe({
      next: () => {
        this.success = 'Suscriptor creado correctamente.';

        this.form = {
          name: '',
          ruc: '',
          companyName: '',
          email: '',
          password: '',
          confirmPassword: ''
        };

        this.creating = false;

        // Esto cierra el modal automáticamente
        this.showForm = false;

        // Esto vuelve a listar para que aparezca al instante
        this.cargarSuscriptores();

        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al crear suscriptor:', error);

        this.error = 'No se pudo crear el suscriptor.';
        this.creating = false;

        this.cdr.detectChanges();
      }
    });
  }
}