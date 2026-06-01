import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { SuscriptoresComponent } from './pages/suscriptores/suscriptores';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: Login
  },
  {
    path: 'dashboard',
    component: Dashboard,
    children: [
      {
        path: 'suscriptores',
        component: SuscriptoresComponent
      }
    ]
  },
  {
    path: 'suscriptores',
    redirectTo: 'dashboard/suscriptores'
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];