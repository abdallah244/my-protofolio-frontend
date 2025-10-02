import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Skill {
  _id?: string;
  name: string;
  icon: string;
  level: number;
  category: 'frontend' | 'backend' | 'database' | 'language' | 'tool';
  order: number;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SkillService {
  private apiUrl = `${environment.apiUrl}/skills`;

  constructor(private http: HttpClient) {}

  getSkills(): Observable<Skill[]> {
    return this.http.get<Skill[]>(this.apiUrl);
  }

  getSkill(id: string): Observable<Skill> {
    return this.http.get<Skill>(`${this.apiUrl}/${id}`);
  }

  createSkill(skill: Skill): Observable<Skill> {
    return this.http.post<Skill>(this.apiUrl, skill);
  }

  updateSkill(id: string, skill: Skill): Observable<Skill> {
    return this.http.put<Skill>(`${this.apiUrl}/${id}`, skill);
  }

  deleteSkill(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  getSkillsByCategory(category: string): Observable<Skill[]> {
    return this.http.get<Skill[]>(`${this.apiUrl}?category=${category}`);
  }
}