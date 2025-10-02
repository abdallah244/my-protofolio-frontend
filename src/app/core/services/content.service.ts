import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, of, map, forkJoin } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HomeContent } from '../models/home-content.interface';
import { Project } from './project.service';

@Injectable({
  providedIn: 'root'
})
export class ContentService {
  private apiUrl = `${environment.apiUrl}`;
  private homeContentSubject = new BehaviorSubject<HomeContent | null>(null);
  private skillsSubject = new BehaviorSubject<any[]>([]);
  private featuredProjectsSubject = new BehaviorSubject<Project[]>([]);
  
  public homeContent$ = this.homeContentSubject.asObservable();
  public skills$ = this.skillsSubject.asObservable();
  public featuredProjects$ = this.featuredProjectsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadInitialData();
  }

  private loadInitialData(): void {
    console.log('🔄 Loading initial data from API...');
    
    // Load all data in parallel
    forkJoin({
      homeContent: this.loadHomeContentFromAPI(),
      skills: this.loadSkillsFromAPI(),
      featuredProjects: this.loadFeaturedProjectsFromAPI()
    }).subscribe({
      next: (results) => {
        console.log('✅ All initial data loaded successfully');
        console.log('Home Content:', results.homeContent);
        console.log('Skills count:', results.skills.length);
        console.log('Featured Projects count:', results.featuredProjects.length);
        
        this.homeContentSubject.next(results.homeContent);
        this.skillsSubject.next(results.skills);
        this.featuredProjectsSubject.next(results.featuredProjects);
      },
      error: (error) => {
        console.error('❌ Error loading initial data:', error);
        this.loadFallbackData();
      }
    });
  }

  private loadHomeContentFromAPI(): Observable<HomeContent> {
    console.log('📥 Loading home content from API...');
    
    return this.http.get<any>(`${this.apiUrl}/content/home`).pipe(
      tap(response => {
        console.log('📦 Raw home content API response:', response);
        console.log('📦 Response type:', typeof response);
        console.log('📦 Is array:', Array.isArray(response));
      }),
      map(response => {
        const content = this.extractContentFromResponse(response);
        console.log('🎯 Extracted home content:', content);
        return content;
      }),
      catchError(error => {
        console.error('❌ API Error loading home content:', error);
        console.log('🔄 Using default home content');
        return of(this.createDefaultContent());
      })
    );
  }

  private loadSkillsFromAPI(): Observable<any[]> {
    console.log('📥 Loading skills from API...');
    
    return this.http.get<any>(`${this.apiUrl}/skills`).pipe(
      tap(response => console.log('📦 Raw skills API response:', response)),
      map(response => {
        const skills = this.extractSkillsFromResponse(response);
        console.log('🎯 Extracted skills:', skills);
        return skills;
      }),
      catchError(error => {
        console.error('❌ API Error loading skills:', error);
        console.log('🔄 Using default skills');
        return of(this.createDefaultSkills());
      })
    );
  }

  private loadFeaturedProjectsFromAPI(): Observable<Project[]> {
    console.log('📥 Loading featured projects from API...');
    
    return this.http.get<any>(`${this.apiUrl}/projects/featured`).pipe(
      tap(response => console.log('📦 Raw featured projects API response:', response)),
      map(response => {
        const projects = this.extractProjectsFromResponse(response);
        console.log('🎯 Extracted featured projects:', projects);
        return projects;
      }),
      catchError(error => {
        console.error('❌ API Error loading featured projects:', error);
        console.log('🔄 Using empty featured projects');
        return of([]);
      })
    );
  }

  private loadFallbackData(): void {
    console.log('🔄 Loading fallback data...');
    const defaultContent = this.createDefaultContent();
    const defaultSkills = this.createDefaultSkills();
    
    this.homeContentSubject.next(defaultContent);
    this.skillsSubject.next(defaultSkills);
    this.featuredProjectsSubject.next([]);
    
    console.log('✅ Fallback data loaded');
  }

  // ✅ Improved Content Extraction with better debugging
  private extractContentFromResponse(response: any): HomeContent {
    console.log('🔍 extractContentFromResponse - Input:', response);
    
    // Case 1: Direct HomeContent object with sections
    if (response && typeof response === 'object' && response.sections) {
      console.log('✅ Case 1: Direct HomeContent object with sections');
      return {
        page: 'home',
        sections: response.sections,
        lastUpdatedBy: response.lastUpdatedBy,
        lastUpdatedAt: response.updatedAt || response.lastUpdatedAt,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt
      };
    }
    
    // Case 2: Response with success and data
    if (response && typeof response === 'object' && response.success && response.data) {
      console.log('✅ Case 2: Success response with data');
      const data = response.data;
      
      // Check for nested content structure
      if (data.content && data.content.sections) {
        console.log('✅ Case 2a: Nested content.sections');
        return {
          page: 'home',
          sections: data.content.sections,
          lastUpdatedBy: data.lastUpdatedBy,
          lastUpdatedAt: data.updatedAt || data.lastUpdatedAt,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        };
      }
      
      // Check for direct sections in data
      if (data.sections) {
        console.log('✅ Case 2b: Direct sections in data');
        return {
          page: 'home',
          sections: data.sections,
          lastUpdatedBy: data.lastUpdatedBy,
          lastUpdatedAt: data.updatedAt || data.lastUpdatedAt,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        };
      }
    }
    
    // Case 3: Response with data property containing sections
    if (response && typeof response === 'object' && response.data) {
      console.log('✅ Case 3: Response with data property');
      const data = response.data;
      
      if (data.sections) {
        console.log('✅ Case 3a: Sections in response.data');
        return {
          page: 'home',
          sections: data.sections,
          lastUpdatedBy: data.lastUpdatedBy,
          lastUpdatedAt: data.updatedAt || data.lastUpdatedAt,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        };
      }
      
      if (data.content && data.content.sections) {
        console.log('✅ Case 3b: Nested content.sections in response.data');
        return {
          page: 'home',
          sections: data.content.sections,
          lastUpdatedBy: data.lastUpdatedBy,
          lastUpdatedAt: data.updatedAt || data.lastUpdatedAt,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        };
      }
    }
    
    // Case 4: Check if response itself has the structure we need
    if (response && typeof response === 'object') {
      console.log('🔍 Case 4: Checking response structure');
      console.log('Response keys:', Object.keys(response));
      
      // Look for any nested sections
      const sections = this.findSectionsInObject(response);
      if (sections) {
        console.log('✅ Case 4a: Found sections in nested structure');
        return {
          page: 'home',
          sections: sections,
          lastUpdatedBy: response.lastUpdatedBy || response.data?.lastUpdatedBy,
          lastUpdatedAt: response.updatedAt || response.data?.updatedAt,
          createdAt: response.createdAt || response.data?.createdAt,
          updatedAt: response.updatedAt || response.data?.updatedAt
        };
      }
    }
    
    console.warn('❌ Unknown response format, using default content. Response:', response);
    return this.createDefaultContent();
  }

  // Helper method to recursively find sections in object
  private findSectionsInObject(obj: any): any {
    if (!obj || typeof obj !== 'object') return null;
    
    // Check if current object has sections
    if (obj.sections && typeof obj.sections === 'object') {
      return obj.sections;
    }
    
    // Check if current object has content with sections
    if (obj.content && obj.content.sections && typeof obj.content.sections === 'object') {
      return obj.content.sections;
    }
    
    // Recursively check nested objects
    for (const key in obj) {
      if (obj.hasOwnProperty(key) && typeof obj[key] === 'object') {
        const sections = this.findSectionsInObject(obj[key]);
        if (sections) return sections;
      }
    }
    
    return null;
  }

  private extractSkillsFromResponse(response: any): any[] {
    console.log('🔍 extractSkillsFromResponse - Input:', response);
    
    // Case 1: Direct array
    if (Array.isArray(response)) {
      console.log('✅ Case 1: Direct skills array');
      return response;
    }
    
    // Case 2: Response with success and data array
    if (response && response.success && response.data) {
      console.log('✅ Case 2: Success response with data');
      if (Array.isArray(response.data)) {
        return response.data;
      }
      if (response.data.skills && Array.isArray(response.data.skills)) {
        return response.data.skills;
      }
      if (response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
    }
    
    // Case 3: Response with data array
    if (response && response.data) {
      console.log('✅ Case 3: Response with data');
      if (Array.isArray(response.data)) {
        return response.data;
      }
      if (response.data.skills && Array.isArray(response.data.skills)) {
        return response.data.skills;
      }
    }
    
    // Case 4: Skills property
    if (response && response.skills && Array.isArray(response.skills)) {
      console.log('✅ Case 4: Skills property');
      return response.skills;
    }
    
    console.warn('❌ Unknown skills response format, using default skills. Response:', response);
    return this.createDefaultSkills();
  }

  private extractProjectsFromResponse(response: any): Project[] {
    console.log('🔍 extractProjectsFromResponse - Input:', response);
    
    // Case 1: Direct array
    if (Array.isArray(response)) {
      console.log('✅ Case 1: Direct projects array');
      return response;
    }
    
    // Case 2: Response with success and data
    if (response && response.success && response.data) {
      console.log('✅ Case 2: Success response with data');
      if (Array.isArray(response.data)) {
        return response.data;
      }
      if (response.data.projects && Array.isArray(response.data.projects)) {
        return response.data.projects;
      }
      if (response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      if (response.data.projectIds && Array.isArray(response.data.projectIds)) {
        return response.data.projectIds.map((project: any) => ({
          ...project,
          _id: project._id || project.id
        }));
      }
    }
    
    // Case 3: Response with data
    if (response && response.data) {
      console.log('✅ Case 3: Response with data');
      if (Array.isArray(response.data)) {
        return response.data;
      }
      if (response.data.projects && Array.isArray(response.data.projects)) {
        return response.data.projects;
      }
    }
    
    // Case 4: Projects property
    if (response && response.projects && Array.isArray(response.projects)) {
      console.log('✅ Case 4: Projects property');
      return response.projects;
    }
    
    console.warn('❌ Unknown projects response format, using empty array. Response:', response);
    return [];
  }

  private createDefaultContent(): HomeContent {
    console.log('🔄 Creating default home content');
    return {
      page: 'home',
      sections: {
        hero: {
          title: 'Crafting Digital Experiences That Matter',
          subtitle: 'Full Stack Developer',
          description: 'Transforming ideas into innovative web solutions. Specialized in modern technologies and user-centered design with 3+ years of experience.',
          badgeText: 'Full Stack Developer'
        },
        stats: {
          projects: 25,
          clients: 15,
          technologies: 50,
          experience: 3
        },
        about: {
          title: 'About Me',
          description: 'Passionate full-stack developer with 3+ years of experience in modern web technologies. I create digital experiences that are not only functional but also delightful to use. Specialized in Angular, React, Node.js, and cloud technologies.'
        },
        contact: {
          title: 'Let\'s Work Together',
          description: 'Ready to start your next project?',
          email: 'contact@quantumdev.com',
          phone: '+1 (555) 123-4567',
          location: 'Cairo, Egypt'
        }
      },
      lastUpdatedAt: new Date()
    };
  }

  private createDefaultSkills(): any[] {
    console.log('🔄 Creating default skills');
    return [
      { 
        _id: '1', 
        name: 'Angular', 
        icon: 'fab fa-angular', 
        level: 90, 
        category: 'frontend', 
        order: 1, 
        isActive: true 
      },
      { 
        _id: '2', 
        name: 'React', 
        icon: 'fab fa-react', 
        level: 85, 
        category: 'frontend', 
        order: 2, 
        isActive: true 
      },
      { 
        _id: '3', 
        name: 'Node.js', 
        icon: 'fab fa-node-js', 
        level: 88, 
        category: 'backend', 
        order: 3, 
        isActive: true 
      },
      { 
        _id: '4', 
        name: 'TypeScript', 
        icon: 'fas fa-code', 
        level: 92, 
        category: 'language', 
        order: 4, 
        isActive: true 
      },
      { 
        _id: '5', 
        name: 'MongoDB', 
        icon: 'fas fa-database', 
        level: 80, 
        category: 'database', 
        order: 5, 
        isActive: true 
      }
    ];
  }

  // ✅ Public API methods
  loadHomeContent(): Observable<HomeContent> {
    console.log('🔄 Public: Loading home content');
    return this.loadHomeContentFromAPI().pipe(
      tap(content => {
        this.homeContentSubject.next(content);
        console.log('✅ Home content updated in service');
      })
    );
  }

  loadSkills(): Observable<any[]> {
    console.log('🔄 Public: Loading skills');
    return this.loadSkillsFromAPI().pipe(
      tap(skills => {
        this.skillsSubject.next(skills);
        console.log('✅ Skills updated in service');
      })
    );
  }

  loadFeaturedProjects(): Observable<Project[]> {
    console.log('🔄 Public: Loading featured projects');
    return this.loadFeaturedProjectsFromAPI().pipe(
      tap(projects => {
        this.featuredProjectsSubject.next(projects);
        console.log('✅ Featured projects updated in service');
      })
    );
  }

  refreshHomeContent(): Observable<HomeContent> {
    console.log('🔄 Manual refresh: Home content');
    return this.loadHomeContent();
  }

  refreshSkills(): Observable<any[]> {
    console.log('🔄 Manual refresh: Skills');
    return this.loadSkills();
  }

  refreshFeaturedProjects(): Observable<Project[]> {
    console.log('🔄 Manual refresh: Featured projects');
    return this.loadFeaturedProjects();
  }

  refreshAll(): Observable<{homeContent: HomeContent, skills: any[], featuredProjects: Project[]}> {
    console.log('🔄 Refreshing all data...');
    
    return forkJoin({
      homeContent: this.loadHomeContent(),
      skills: this.loadSkills(),
      featuredProjects: this.loadFeaturedProjects()
    }).pipe(
      tap(results => {
        console.log('✅ All data refreshed successfully');
      })
    );
  }

  // ✅ Force update methods for immediate UI updates
  updateHomeContentImmediately(content: HomeContent): void {
    console.log('⚡ Immediate home content update');
    this.homeContentSubject.next(content);
  }

  updateSkillsImmediately(skills: any[]): void {
    console.log('⚡ Immediate skills update');
    this.skillsSubject.next(skills);
  }

  updateFeaturedProjectsImmediately(projects: Project[]): void {
    console.log('⚡ Immediate featured projects update');
    this.featuredProjectsSubject.next(projects);
  }

  // Getters for current values
  getCurrentHomeContent(): HomeContent | null {
    return this.homeContentSubject.value;
  }

  getCurrentSkills(): any[] {
    return this.skillsSubject.value;
  }

  getCurrentFeaturedProjects(): Project[] {
    return this.featuredProjectsSubject.value;
  }

  hasData(): boolean {
    return !!this.homeContentSubject.value;
  }

  // ✅ Debug method to check service state
  debugServiceState(): void {
    console.log('🔍 ContentService Debug State:');
    console.log('Home Content:', this.homeContentSubject.value);
    console.log('Skills count:', this.skillsSubject.value?.length);
    console.log('Featured Projects count:', this.featuredProjectsSubject.value?.length);
    console.log('API URL:', this.apiUrl);
  }
}