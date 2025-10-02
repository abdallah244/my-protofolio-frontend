import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HomeContent } from '../models/home-content.interface';
import { ContentService } from './content.service';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface DashboardStats {
  users: {
    total: number;
    admins: number;
    regular: number;
  };
  projects: {
    total: number;
    published: number;
    draft: number;
    featured: number;
  };
  messages: {
    total: number;
    unread: number;
    read: number;
  };
  skills: {
    total: number;
  };
  recentActivity: any[];
}

export interface Message {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  response?: string;
  respondedBy?: any;
  respondedAt?: Date;
  isRead: boolean;
  createdAt: Date;
}

export interface Content {
  page: string;
  content: any;
  lastUpdatedBy: any;
  updatedAt: Date;
}

export interface Project {
  _id?: string;
  title: string;
  description: string;
  shortDescription: string;
  technologies: string[];
  images: Array<{
    url: string;
    alt: string;
    isPrimary?: boolean;
  }>;
  liveUrl?: string;
  githubUrl?: string;
  featured: boolean;
  status: 'draft' | 'published';
  section?: 'angular' | 'backend' | 'fullstack';
  createdBy?: any; 
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Skill {
  _id?: string;
  name: string;
  icon: string;
  level: number;
  category: 'frontend' | 'backend' | 'database' | 'language' | 'tool';
  order: number;
  isActive: boolean;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient, private contentService: ContentService) {}

  getHomeContent(): Observable<any> {
    console.log('📥 Admin: Loading home content...');
    
    return this.http.get<any>(`${this.apiUrl}/admin/content/home`).pipe(
      tap(response => {
        console.log('📦 Admin Home Content Response:', response);
      }),
      map(response => {
        // Handle different response formats
        if (response.data) {
          return response.data;
        }
        return response;
      })
    );
  }

  getPublicHomeContent(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/content/home`);
  }

  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<any>(`${this.apiUrl}/admin/dashboard`).pipe(
      map(response => {
        if (response.data) {
          return response.data;
        }
        return response || {
          users: { total: 0, admins: 0, regular: 0 },
          projects: { total: 0, published: 0, draft: 0, featured: 0 },
          messages: { total: 0, unread: 0, read: 0 },
          skills: { total: 0 },
          recentActivity: []
        };
      })
    );
  }

  getMessages(page: number = 1, limit: number = 10, status?: string): Observable<any> {
    let url = `${this.apiUrl}/admin/messages?page=${page}&limit=${limit}`;
    if (status) {
      url += `&status=${status}`;
    }
    return this.http.get<any>(url).pipe(
      map(response => {
        const data = response.data || response;
        return {
          messages: data.messages || data,
          total: data.total || 0,
          page: data.page || page,
          limit: data.limit || limit,
          totalPages: data.totalPages || Math.ceil((data.total || 0) / limit)
        };
      })
    );
  }

  
getAllMessages(): Observable<Message[]> {
  return this.http.get<any>(`${this.apiUrl}/admin/messages/all`).pipe(
    map(response => {
      console.log('📥 Raw API Response from /all:', response);
      
      // Handle response from the new endpoint
      if (response.success && response.data) {
        console.log('✅ Found messages in response.data:', response.data.length);
        return response.data;
      }
      
      // If response is direct array
      if (Array.isArray(response)) {
        console.log('✅ Response is direct array:', response.length);
        return response;
      }
      
      console.warn('⚠️ Unknown response format:', response);
      return [];
    })
  );
}
  getRecentMessages(limit: number = 5): Observable<Message[]> {
    return this.http.get<any>(`${this.apiUrl}/admin/messages?limit=${limit}`).pipe(
      map(response => {
        const data = response.data || response;
        const messages = data.messages || data;
        return Array.isArray(messages) ? messages.slice(0, limit) : [];
      })
    );
  }

  updateMessageStatus(id: string, status: string, response?: string): Observable<Message> {
    return this.http.put<any>(`${this.apiUrl}/admin/messages/${id}/status`, {
      status,
      response,
    }).pipe(
      map(res => res.data || res)
    );
  }

  deleteMessage(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/messages/${id}`);
  }

  getContent(page: string): Observable<Content> {
    return this.http.get<any>(`${this.apiUrl}/admin/content/${page}`).pipe(
      map(response => response.data || response)
    );
  }

  updateContent(page: string, content: any): Observable<Content> {
    console.log('📤 Updating content for page:', page, content);
    
    return this.http.put<any>(`${this.apiUrl}/admin/content/${page}`, { content }).pipe(
      tap(response => {
        console.log('✅ Content update response:', response);
      }),
      map(response => {
        // Refresh the content service
        this.contentService.refreshHomeContent().subscribe();
        return response.data || response;
      })
    );
  }

  getProjects(): Observable<Project[]> {
    return this.http.get<any>(`${this.apiUrl}/admin/projects`).pipe(
      map(response => {
        const data = response.data || response;
        return this.extractProjectsFromResponse(data);
      })
    );
  }

  getProject(id: string): Observable<Project> {
    return this.http.get<any>(`${this.apiUrl}/admin/projects/${id}`).pipe(
      map(response => response.data || response)
    );
  }

  updateProject(id: string, projectData: any): Observable<Project> {
    console.log('📤 Updating project:', id, projectData);
    
    return this.http.put<any>(`${this.apiUrl}/admin/projects/${id}`, projectData).pipe(
      tap(response => {
        console.log('✅ Project update response:', response);
      }),
      map(response => {
        this.contentService.refreshFeaturedProjects().subscribe();
        return response.data || response;
      })
    );
  }

  createProject(projectData: any): Observable<Project> {
    console.log('📤 Creating project:', projectData);
    
    return this.http.post<any>(`${this.apiUrl}/admin/projects`, projectData).pipe(
      tap(response => {
        console.log('✅ Project create response:', response);
      }),
      map(response => {
        this.contentService.refreshFeaturedProjects().subscribe();
        return response.data || response;
      })
    );
  }

  deleteProject(id: string): Observable<any> {
    console.log('🗑️ Deleting project:', id);
    
    return this.http.delete<any>(`${this.apiUrl}/admin/projects/${id}`).pipe(
      map(response => {
        this.contentService.refreshFeaturedProjects().subscribe();
        return response.data || response;
      })
    );
  }

  uploadImage(imageFile: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', imageFile);
    return this.http.post(`${this.apiUrl}/admin/upload`, formData);
  }

  getUsers(): Observable<User[]> {
    return this.http.get<any>(`${this.apiUrl}/admin/users`).pipe(
      map(response => {
        const data = response.data || response;
        return this.extractUsersFromResponse(data);
      })
    );
  }

  getUser(id: string): Observable<User> {
    return this.http.get<any>(`${this.apiUrl}/admin/users/${id}`).pipe(
      map(response => response.data || response)
    );
  }

  updateUserRole(userId: string, role: string): Observable<User> {
    return this.http.put<any>(`${this.apiUrl}/admin/users/${userId}/role`, { role }).pipe(
      map(response => response.data || response)
    );
  }

  updateUserStatus(userId: string, isActive: boolean): Observable<User> {
    return this.http.put<any>(`${this.apiUrl}/admin/users/${userId}/status`, { isActive }).pipe(
      map(response => response.data || response)
    );
  }

  deleteUser(userId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/users/${userId}`);
  }

  updateHomeContent(content: any): Observable<any> {
    console.log('📤 Admin: Updating home content...', content);
    
    return this.http.put<any>(`${this.apiUrl}/admin/content/home`, { content }).pipe(
      tap(response => {
        console.log('✅ Admin: Home content update response:', response);
      }),
      map(response => {
        // Force refresh the content service
        this.contentService.refreshHomeContent().subscribe();
        return response.data || response;
      })
    );
  }

  getSkills(): Observable<Skill[]> {
    return this.http.get<any>(`${this.apiUrl}/skills`).pipe(
      map(response => {
        const data = response.data || response;
        return this.extractSkillsFromResponse(data);
      })
    );
  }

  getSkill(id: string): Observable<Skill> {
    return this.http.get<any>(`${this.apiUrl}/skills/${id}`).pipe(
      map(response => response.data || response)
    );
  }

  createSkill(skillData: any): Observable<Skill> {
    const data = {
      name: skillData.name,
      icon: skillData.icon,
      level: Number(skillData.level),
      category: skillData.category,
      order: Number(skillData.order) || 0,
      isActive: skillData.isActive !== undefined ? skillData.isActive : true,
    };

    console.log('📤 Creating skill:', data);

    return this.http.post<any>(`${this.apiUrl}/skills`, data).pipe(
      tap(response => {
        console.log('✅ Skill create response:', response);
      }),
      map(response => {
        this.contentService.refreshSkills().subscribe();
        return response.data || response;
      })
    );
  }

  updateSkill(id: string, skillData: any): Observable<Skill> {
    const data: any = {};

    if (skillData.name) data.name = skillData.name;
    if (skillData.icon) data.icon = skillData.icon;
    if (skillData.level !== undefined) data.level = Number(skillData.level);
    if (skillData.category) data.category = skillData.category;
    if (skillData.order !== undefined) data.order = Number(skillData.order);
    if (skillData.isActive !== undefined) data.isActive = skillData.isActive;

    console.log('📤 Updating skill:', id, data);

    return this.http.put<any>(`${this.apiUrl}/skills/${id}`, data).pipe(
      tap(response => {
        console.log('✅ Skill update response:', response);
      }),
      map(response => {
        this.contentService.refreshSkills().subscribe();
        return response.data || response;
      })
    );
  }

  deleteSkill(id: string): Observable<any> {
    console.log('🗑️ Deleting skill:', id);
    
    return this.http.delete<any>(`${this.apiUrl}/skills/${id}`).pipe(
      map(response => {
        this.contentService.refreshSkills().subscribe();
        return response.data || response;
      })
    );
  }

  getSkillsByCategory(category: string): Observable<Skill[]> {
    return this.http.get<any>(`${this.apiUrl}/skills?category=${category}`).pipe(
      map(response => {
        const data = response.data || response;
        return this.extractSkillsFromResponse(data);
      })
    );
  }

  getFeaturedProjects(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/admin/featured-projects`).pipe(
      map(response => response.data || response)
    );
  }

  saveFeaturedProjects(projectIds: string[]): Observable<any> {
    console.log('📤 Saving featured projects:', projectIds);
    
    return this.http.post<any>(`${this.apiUrl}/admin/featured-projects`, { projectIds }).pipe(
      tap(response => {
        console.log('✅ Featured projects save response:', response);
      }),
      map(response => {
        this.contentService.refreshFeaturedProjects().subscribe();
        return response.data || response;
      })
    );
  }

  getContactMessages(page: number = 1, limit: number = 10, status?: string): Observable<any> {
    let url = `${this.apiUrl}/admin/messages?page=${page}&limit=${limit}`;
    if (status && status !== 'all') {
      url += `&status=${status}`;
    }
    return this.http.get<any>(url);
  }

  getContactMessage(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/admin/messages/${id}`);
  }

  updateContactMessage(id: string, updateData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/admin/messages/${id}/status`, updateData);
  }

  deleteContactMessage(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/admin/messages/${id}`);
  }

  getContactStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/admin/messages/stats/overview`);
  }

  // Helper methods
  private extractSkillsFromResponse(response: any): Skill[] {
    if (Array.isArray(response)) {
      return response;
    }
    if (response && response.success && response.data) {
      if (Array.isArray(response.data)) {
        return response.data;
      }
      if (response.data.skills && Array.isArray(response.data.skills)) {
        return response.data.skills;
      }
    }
    if (response && response.data) {
      if (Array.isArray(response.data)) {
        return response.data;
      }
    }
    if (response && response.skills && Array.isArray(response.skills)) {
      return response.skills;
    }
    return [];
  }

  private extractProjectsFromResponse(response: any): Project[] {
    if (Array.isArray(response)) {
      return response;
    }
    if (response && response.success && response.data) {
      if (Array.isArray(response.data)) {
        return response.data;
      }
      if (response.data.projects && Array.isArray(response.data.projects)) {
        return response.data.projects;
      }
    }
    if (response && response.data) {
      if (Array.isArray(response.data)) {
        return response.data;
      }
    }
    if (response && response.projects && Array.isArray(response.projects)) {
      return response.projects;
    }
    return [];
  }

  private extractUsersFromResponse(response: any): User[] {
    if (Array.isArray(response)) {
      return response;
    }
    if (response && response.success && response.data) {
      if (Array.isArray(response.data)) {
        return response.data;
      }
      if (response.data.users && Array.isArray(response.data.users)) {
        return response.data.users;
      }
    }
    if (response && response.data) {
      if (Array.isArray(response.data)) {
        return response.data;
      }
    }
    if (response && response.users && Array.isArray(response.users)) {
      return response.users;
    }
    return [];
  }
}