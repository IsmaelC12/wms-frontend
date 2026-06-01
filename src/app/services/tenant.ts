import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TenantService {
  private apiUrl = 'https://erp-production-3ce2.up.railway.app/api/Tenant';

  constructor(private http: HttpClient) {}

  private getHeaders() {
    const token = localStorage.getItem('token');

    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`
      })
    };
  }

  listarSuscriptores(): Observable<any> {
    return this.http.get<any>(this.apiUrl, this.getHeaders());
  }

  crearSuscriptor(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data, this.getHeaders());
  }
}