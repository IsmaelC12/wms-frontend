import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';

import { Login } from './login';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the 401 message, resets loading, and avoids navigation or token storage', () => {
    component.loginData = {
      email: 'usuario@empresa.com',
      password: 'secreto',
      tenantId: 'tenant-equivocado',
    };

    component.iniciarSesion();

    expect(component.cargando).toBe(true);

    const request = httpMock.expectOne('https://erp-production-3ce2.up.railway.app/api/Auth');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(component.loginData);

    request.flush(
      { message: 'Unauthorized' },
      { status: 401, statusText: 'Unauthorized' }
    );

    expect(component.error).toBe(
      'La empresa seleccionada no corresponde a esta cuenta o los datos son incorrectos.'
    );
    expect(component.cargando).toBe(false);
    expect(router.navigate).not.toHaveBeenCalled();
    expect(localStorage.getItem('token')).toBeNull();
  });
});
