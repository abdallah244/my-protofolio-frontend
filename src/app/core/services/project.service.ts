import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, of, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Project {
  _id?: string;
  title: string;
  description: string;
  shortDescription: string;
  technologies: string[];
  images: { 
    url: string; 
    alt: string;
    isPrimary?: boolean;
  }[];
  liveUrl?: string;
  githubUrl?: string;
  featured: boolean;
  status: 'draft' | 'published';
  section?: 'angular' | 'backend' | 'fullstack';
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private apiUrl = `${environment.apiUrl}/projects`;
  private projectsSubject = new BehaviorSubject<Project[]>([]);
  public projects$ = this.projectsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadProjects();
  }

  private loadProjects(): void {
    this.getProjects().subscribe({
      next: (projects) => {
        console.log('🔄 Projects loaded in service:', projects);
        this.projectsSubject.next(projects);
      },
      error: (error) => console.error('❌ Error loading projects:', error)
    });
  }

  getProjects(): Observable<Project[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(response => {
        console.log('📦 Raw projects API response:', response);
        return this.extractProjectsFromResponse(response);
      }),
      tap(projects => {
        console.log('🎯 Extracted projects:', projects);
        this.projectsSubject.next(projects);
      }),
      catchError(error => {
        console.error('❌ Error in getProjects:', error);
        this.projectsSubject.next([]);
        return of([]);
      })
    );
  }

  getPublishedProjects(): Observable<Project[]> {
    return this.http.get<any>(`${this.apiUrl}?status=published`).pipe(
      map(response => this.extractProjectsFromResponse(response)),
      tap(projects => {
        console.log('📦 Published projects fetched:', projects);
        this.projectsSubject.next(projects);
      }),
      catchError(error => {
        console.error('❌ Error loading published projects:', error);
        return of([]);
      })
    );
  }

  getProject(id: string): Observable<Project> {
    return this.http.get<Project>(`${this.apiUrl}/${id}`).pipe(
      map(response => this.extractProjectFromResponse(response)),
      catchError(error => {
        console.error('❌ Error loading project:', error);
        throw error;
      })
    );
  }

  createProject(project: Project): Observable<Project> {
    return this.http.post<Project>(this.apiUrl, project).pipe(
      map(response => this.extractProjectFromResponse(response)),
      tap(newProject => {
        console.log('✅ Project created successfully:', newProject);
        const currentProjects = this.projectsSubject.value;
        const updatedProjects = [...currentProjects, newProject];
        this.projectsSubject.next(updatedProjects);
      }),
      catchError(error => {
        console.error('❌ Error creating project:', error);
        throw error;
      })
    );
  }

  updateProject(id: string, project: Project): Observable<Project> {
    return this.http.put<Project>(`${this.apiUrl}/${id}`, project).pipe(
      map(response => this.extractProjectFromResponse(response)),
      tap(updatedProject => {
        console.log('✅ Project updated successfully:', updatedProject);
        const currentProjects = this.projectsSubject.value;
        const updatedProjects = currentProjects.map(p => 
          p._id === id ? updatedProject : p
        );
        this.projectsSubject.next(updatedProjects);
      }),
      catchError(error => {
        console.error('❌ Error updating project:', error);
        throw error;
      })
    );
  }

  deleteProject(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        console.log('✅ Project deleted successfully');
        const currentProjects = this.projectsSubject.value;
        const filteredProjects = currentProjects.filter(p => p._id !== id);
        this.projectsSubject.next(filteredProjects);
      }),
      catchError(error => {
        console.error('❌ Error deleting project:', error);
        throw error;
      })
    );
  }

  getFeaturedProjects(): Observable<Project[]> {
    return this.http.get<any>(`${this.apiUrl}/featured`).pipe(
      map(response => this.extractProjectsFromResponse(response)),
      catchError(error => {
        console.error('❌ Error loading featured projects:', error);
        return of([]);
      })
    );
  }

  getProjectsBySection(section: string): Observable<Project[]> {
    return this.http.get<any>(`${this.apiUrl}?section=${section}&status=published`).pipe(
      map(response => this.extractProjectsFromResponse(response)),
      catchError(error => {
        console.error(`❌ Error loading ${section} projects:`, error);
        return of([]);
      })
    );
  }

  // ✅ Improved Response Extraction Methods
  private extractProjectsFromResponse(response: any): Project[] {
    console.log('🔍 extractProjectsFromResponse - Input:', response);
    
    // Case 1: Direct array of projects
    if (Array.isArray(response)) {
      console.log('✅ Case 1: Direct projects array');
      return response.map((project: any) => this.normalizeProject(project));
    }
    
    // Case 2: Response with success and data array
    if (response && response.success && response.data) {
      console.log('✅ Case 2: Success response with data');
      const data = response.data;
      
      if (Array.isArray(data)) {
        return data.map((project: any) => this.normalizeProject(project));
      }
      
      if (data.projects && Array.isArray(data.projects)) {
        return data.projects.map((project: any) => this.normalizeProject(project));
      }
      
      if (data.data && Array.isArray(data.data)) {
        return data.data.map((project: any) => this.normalizeProject(project));
      }
      
      if (data.projectIds && Array.isArray(data.projectIds)) {
        return data.projectIds.map((project: any) => this.normalizeProject(project));
      }
    }
    
    // Case 3: Response with data array
    if (response && response.data) {
      console.log('✅ Case 3: Response with data');
      if (Array.isArray(response.data)) {
        return response.data.map((project: any) => this.normalizeProject(project));
      }
      
      if (response.data.projects && Array.isArray(response.data.projects)) {
        return response.data.projects.map((project: any) => this.normalizeProject(project));
      }
    }
    
    // Case 4: Projects property
    if (response && response.projects && Array.isArray(response.projects)) {
      console.log('✅ Case 4: Projects property');
      return response.projects.map((project: any) => this.normalizeProject(project));
    }
    
    // Case 5: Single project object in data
    if (response && response.data && typeof response.data === 'object' && response.data.title) {
      console.log('✅ Case 5: Single project in data');
      return [this.normalizeProject(response.data)];
    }
    
    // Case 6: Single project object directly
    if (response && typeof response === 'object' && response.title) {
      console.log('✅ Case 6: Single project directly');
      return [this.normalizeProject(response)];
    }
    
    console.warn('❌ Unknown projects response format, returning empty array. Response:', response);
    return [];
  }

  private extractProjectFromResponse(response: any): Project {
    console.log('🔍 extractProjectFromResponse - Input:', response);
    
    // Case 1: Direct project object
    if (response && typeof response === 'object' && response.title) {
      console.log('✅ Case 1: Direct project object');
      return this.normalizeProject(response);
    }
    
    // Case 2: Project in data property
    if (response && response.data && typeof response.data === 'object' && response.data.title) {
      console.log('✅ Case 2: Project in data property');
      return this.normalizeProject(response.data);
    }
    
    // Case 3: Success response with project data
    if (response && response.success && response.data && response.data.title) {
      console.log('✅ Case 3: Success response with project data');
      return this.normalizeProject(response.data);
    }
    
    console.warn('❌ Unknown project response format, returning empty project. Response:', response);
    return this.createEmptyProject();
  }

  private normalizeProject(project: any): Project {
    return {
      _id: project._id || project.id,
      title: project.title || 'Untitled Project',
      description: project.description || '',
      shortDescription: project.shortDescription || project.description?.substring(0, 100) || '',
      technologies: Array.isArray(project.technologies) ? project.technologies : [],
      images: Array.isArray(project.images) ? project.images : [],
      liveUrl: project.liveUrl || '',
      githubUrl: project.githubUrl || '',
      featured: Boolean(project.featured),
      status: project.status === 'published' ? 'published' : 'draft',
      section: project.section || 'fullstack',
      createdBy: project.createdBy,
      createdAt: project.createdAt ? new Date(project.createdAt) : new Date(),
      updatedAt: project.updatedAt ? new Date(project.updatedAt) : new Date()
    };
  }

  private createEmptyProject(): Project {
    return {
      title: '',
      description: '',
      shortDescription: '',
      technologies: [],
      images: [],
      featured: false,
      status: 'draft',
      section: 'fullstack'
    };
  }

  getPrimaryImage(project: Project): string {
    if (!project.images || project.images.length === 0) {
      return 'https://via.placeholder.com/400x250/3B82F6/FFFFFF?text=No+Image';
    }
    
    const primaryImage = project.images.find(img => img.isPrimary);
    if (primaryImage) {
      return primaryImage.url;
    }
    
    return project.images[0].url;
  }

  refreshProjects(): void {
    console.log('🔄 Manually refreshing projects...');
    this.loadProjects();
  }

  // ✅ Helper methods
  isFullStackProject(project: Project): boolean {
    const techString = project.technologies.join(' ').toLowerCase();
    const hasFrontend = techString.includes('angular') || techString.includes('react') || techString.includes('vue');
    const hasBackend = techString.includes('node') || techString.includes('express') || techString.includes('nestjs');
    return hasFrontend && hasBackend;
  }

  determineProjectSection(project: Project): 'angular' | 'backend' | 'fullstack' {
    const techString = project.technologies.join(' ').toLowerCase();
    const hasAngular = techString.includes('angular');
    const hasBackend = techString.includes('node') || techString.includes('express') || techString.includes('nestjs');
    
    if (hasAngular && hasBackend) return 'fullstack';
    if (hasAngular) return 'angular';
    if (hasBackend) return 'backend';
    
    return 'fullstack';
  }

  // ✅ Debug method
  debugServiceState(): void {
    console.log('🔍 ProjectService Debug State:');
    console.log('Current projects:', this.projectsSubject.value);
    console.log('Projects count:', this.projectsSubject.value.length);
    console.log('API URL:', this.apiUrl);
  }
}