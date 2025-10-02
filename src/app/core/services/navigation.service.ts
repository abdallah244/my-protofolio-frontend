import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  component: string;
}

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getNavigation(): Observable<NavigationItem[]> {
    return this.http.get<NavigationItem[]>(`${this.apiUrl}/navigation`);
  }

  getNavigationItemById(id: string): Observable<NavigationItem> {
    return this.http.get<NavigationItem>(`${this.apiUrl}/navigation/${id}`);
  }
}