import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  paso: 'login' | 'empresa' = 'login';

  mostrarPassword = false;
  recordar = false;
  cargando = false;
  error = '';

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

  private loginUrl = 'https://erp-production-3ce2.up.railway.app/api/Auth';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit() {
    const emailGuardado = localStorage.getItem('recordarEmail');

    if (emailGuardado) {
      this.loginData.email = emailGuardado;
      this.recordar = true;
    }
  }

  continuar() {
    this.error = '';

    if (!this.loginData.email || !this.loginData.password) {
      this.error = 'Ingresa tu correo y contraseña';
      return;
    }

    this.paso = 'empresa';
  }

  iniciarSesion() {
    this.error = '';

    if (!this.loginData.tenantId) {
      this.error = 'Selecciona una empresa';
      return;
    }

    this.cargando = true;

    console.log('Body enviado:', this.loginData);

    this.http.post<any>(this.loginUrl, this.loginData).subscribe({
      next: (response) => {
        this.cargando = false;

        console.log('Login correcto:', response);

        const token = response.token || response.data?.token;

        if (token) {
          localStorage.setItem('token', token);
        }

        localStorage.setItem('tenantId', this.loginData.tenantId);
        localStorage.setItem('email', this.loginData.email);

        if (this.recordar) {
          localStorage.setItem('recordarEmail', this.loginData.email);
        } else {
          localStorage.removeItem('recordarEmail');
        }

        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.cargando = false;

        console.error('Error completo:', error);

        this.error = error.error?.message || 'Correo, contraseña o empresa incorrectos';
      }
    });
  }

  volverLogin() {
    this.paso = 'login';
    this.error = '';
    this.loginData.tenantId = '';
  }
}