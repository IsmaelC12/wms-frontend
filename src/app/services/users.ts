import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Usuario {
  id: string;
  name: string;
  email: string;
  isOwner: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface CrearUsuarioRequest {
  name: string;
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly apiUrl =
    'https://erps-production.up.railway.app/api/platform/users';

  constructor(private http: HttpClient) {}

  private getHeaders() {
    const token =
      localStorage.getItem('token') ||
      sessionStorage.getItem('token');

    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token ?? ''}`
      })
    };
  }

  listarUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl, this.getHeaders());
  }

  crearUsuario(data: CrearUsuarioRequest): Observable<any> {
    return this.http.post<any>(this.apiUrl, data, this.getHeaders());
  }

  activarUsuario(id: string): Observable<any> {
  return this.http.patch<any>(
    `${this.apiUrl}/${id}/activate`,
    {},
    this.getHeaders()
  );
}

desactivarUsuario(id: string): Observable<any> {
  return this.http.patch<any>(
    `${this.apiUrl}/${id}/deactivate`,
    {},
    this.getHeaders()
  );
}
}