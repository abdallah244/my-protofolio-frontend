import { Routes } from '@angular/router';
import { AdminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register').then((m) => m.RegisterComponent),
  },
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/dashboard/dashboard').then((m) => m.AdminDashboardComponent),
    canActivate: [AdminGuard],
  },
  {
    path: 'admin/content/home',
    loadComponent: () => import('./features/admin/home/admin-home-content').then((m) => m.AdminHomeContentComponent),
    canActivate: [AdminGuard],
  },
  {
    path: 'admin/projects',
    loadComponent: () => import('./features/admin/projects/admin-projects').then((m) => m.AdminProjectsComponent),
    canActivate: [AdminGuard],
  },
  {
    path: 'admin/messages',
    loadComponent: () => import('./features/admin/messages/admin-messages').then((m) => m.AdminMessagesComponent),
    canActivate: [AdminGuard],
  },
  {
    path: 'admin/users',
    loadComponent: () => import('./features/admin/users/admin-users').then((m) => m.AdminUsersComponent),
    canActivate: [AdminGuard],
  },
  {
    path: 'home',
    loadComponent: () => import('./features/user/home/home').then((m) => m.HomeComponent),
  },
  {
    path: 'projects',
    loadComponent: () => import('./features/projects/projects').then((m) => m.ProjectsComponent),
  },
  {
    path: 'about',
    loadComponent: () => import('./features/about/about').then((m) => m.AboutComponent),
  },
  {
    path: 'contact',
    loadComponent: () => import('./features/contact/contact').then((m) => m.ContactComponent),
  },
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '/home',
  },
];