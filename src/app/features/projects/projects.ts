import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle';
import { ProjectService, Project } from '../../../app/core/services/project.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, RouterModule, ThemeToggleComponent],
  templateUrl: './projects.html',
  styleUrls: ['./projects.css']
})
export class ProjectsComponent implements OnInit, OnDestroy {
  currentTheme: 'dark' | 'light' = 'dark';
  allProjects: Project[] = []; // كل المشاريع المنشورة
  filteredProjects: Project[] = []; // المشاريع بعد التصفية
  activeFilter: string = 'all';
  isLoading: boolean = true;

  // الفلاتر المعدلة - تم إزالة First Project
  filters = [
    { id: 'all', label: 'All Projects', icon: 'fas fa-layer-group' },
    { id: 'backend', label: 'Backend', icon: 'fas fa-server' },
    { id: 'angular', label: 'Angular', icon: 'fab fa-angular' },
    { id: 'fullstack', label: 'Full Stack', icon: 'fas fa-code' }
  ];

  private projectsSubscription!: Subscription;

  constructor(
    private themeService: ThemeService,
    private projectService: ProjectService
  ) {}

  ngOnInit(): void {
    this.themeService.currentTheme$.subscribe(theme => {
      this.currentTheme = theme;
    });

    this.loadPublishedProjects(); // جلب المشاريع المنشورة فقط
    
    // الاشتراك في تحديثات المشاريع
    this.projectsSubscription = this.projectService.projects$.subscribe(
      (projects: Project[]) => {
        console.log('Projects updated in service:', projects);
        // تصفية المشاريع المنشورة فقط لعرضها في صفحة Projects
        this.allProjects = projects.filter(project => project.status === 'published');
        this.filteredProjects = this.allProjects;
        this.applyFilter(this.activeFilter); // إعادة تطبيق الفلتر
        this.isLoading = false;
      }
    );
  }

  ngOnDestroy(): void {
    if (this.projectsSubscription) {
      this.projectsSubscription.unsubscribe();
    }
  }

  private loadPublishedProjects(): void {
    this.isLoading = true;
    this.projectService.getPublishedProjects().subscribe({
      next: (projects: Project[]) => {
        console.log('Published projects loaded:', projects);
        this.allProjects = projects;
        this.filteredProjects = this.allProjects;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading published projects:', error);
        this.isLoading = false;
        this.loadSampleProjects();
      }
    });
  }

  // تطبيق الفلتر بناء على التصنيف الجديد
  applyFilter(filterId: string): void {
    this.activeFilter = filterId;
    
    if (filterId === 'all') {
      this.filteredProjects = this.allProjects;
    } else {
      this.filteredProjects = this.allProjects.filter(project => {
        const techString = project.technologies.join(' ').toLowerCase();
        
        switch (filterId) {
          case 'backend':
            return techString.includes('node') || 
                   techString.includes('express') || 
                   techString.includes('nestjs') ||
                   techString.includes('mongodb') ||
                   techString.includes('postgresql') ||
                   techString.includes('mysql');

          case 'angular':
            return techString.includes('angular') || 
                   techString.includes('typescript');

          case 'fullstack':
            return (techString.includes('angular') || techString.includes('react') || techString.includes('vue')) &&
                   (techString.includes('node') || techString.includes('express') || techString.includes('nestjs'));

          default:
            return true;
        }
      });
    }
    
    console.log('Filtered projects:', this.filteredProjects);
  }

  // دالة جديدة لحساب عدد المشاريع لكل فلتر
  getFilterCount(filterId: string): number {
    switch (filterId) {
      case 'all':
        return this.allProjects.length;
      
      case 'backend':
        return this.allProjects.filter(p => {
          const techString = p.technologies.join(' ').toLowerCase();
          return techString.includes('node') || 
                 techString.includes('express') || 
                 techString.includes('nestjs') ||
                 techString.includes('mongodb') ||
                 techString.includes('postgresql') ||
                 techString.includes('mysql');
        }).length;
      
      case 'angular':
        return this.allProjects.filter(p => {
          const techString = p.technologies.join(' ').toLowerCase();
          return techString.includes('angular') || techString.includes('typescript');
        }).length;
      
      case 'fullstack':
        return this.allProjects.filter(p => this.isFullStackProject(p)).length;
      
      default:
        return 0;
    }
  }

  getPrimaryImage(project: Project): string {
    return this.projectService.getPrimaryImage(project);
  }

  openUrl(url: string | undefined): void {
    if (url) {
      window.open(url, '_blank');
    }
  }

  // دالة مساعدة للحصول على أيقونة التكنولوجيا
  getTechIcon(tech: string): string {
    const techLower = tech.toLowerCase();
    if (techLower.includes('angular')) return 'fab fa-angular';
    if (techLower.includes('react')) return 'fab fa-react';
    if (techLower.includes('vue')) return 'fab fa-vuejs';
    if (techLower.includes('node')) return 'fab fa-node-js';
    if (techLower.includes('express')) return 'fas fa-bolt';
    if (techLower.includes('mongodb')) return 'fas fa-database';
    if (techLower.includes('postgresql')) return 'fas fa-database';
    if (techLower.includes('mysql')) return 'fas fa-database';
    if (techLower.includes('typescript')) return 'fas fa-code';
    if (techLower.includes('javascript')) return 'fab fa-js-square';
    if (techLower.includes('html')) return 'fab fa-html5';
    if (techLower.includes('css')) return 'fab fa-css3-alt';
    if (techLower.includes('sass')) return 'fab fa-sass';
    if (techLower.includes('bootstrap')) return 'fab fa-bootstrap';
    if (techLower.includes('tailwind')) return 'fas fa-wind';
    return 'fas fa-code';
  }

  // دالة جديدة للحصول على لون الخلفية بناء على التكنولوجيا
  getTechColor(tech: string): string {
    const techLower = tech.toLowerCase();
    if (techLower.includes('angular')) return '#dd0031';
    if (techLower.includes('react')) return '#61dafb';
    if (techLower.includes('vue')) return '#42b883';
    if (techLower.includes('node')) return '#339933';
    if (techLower.includes('express')) return '#000000';
    if (techLower.includes('mongodb')) return '#47a248';
    if (techLower.includes('postgresql')) return '#336791';
    if (techLower.includes('mysql')) return '#4479a1';
    if (techLower.includes('typescript')) return '#3178c6';
    if (techLower.includes('javascript')) return '#f7df1e';
    return '#6b7280';
  }

  private loadSampleProjects(): void {
    console.log('Loading sample projects for projects page...');
    this.allProjects = [
      {
        _id: '1',
        title: 'E-Commerce Platform - Full Stack',
        description: 'Full-stack e-commerce solution with modern UI, secure payments, and admin dashboard.',
        shortDescription: 'E-commerce platform with secure payments and admin dashboard',
        technologies: ['Angular', 'Node.js', 'Express', 'MongoDB', 'Stripe', 'JWT'],
        images: [
          { url: 'https://via.placeholder.com/400x250/3B82F6/FFFFFF?text=E-Commerce+Full+Stack', alt: 'E-Commerce Project' }
        ],
        liveUrl: 'https://example.com',
        githubUrl: 'https://github.com/example',
        featured: true,
        status: 'published',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: '2',
        title: 'REST API Backend System',
        description: 'Scalable REST API backend with authentication, authorization, and database management.',
        shortDescription: 'REST API backend with authentication and database',
        technologies: ['Node.js', 'Express', 'MongoDB', 'JWT', 'Redis', 'Docker'],
        images: [
          { url: 'https://via.placeholder.com/400x250/10B981/FFFFFF?text=Backend+API', alt: 'Backend API Project' }
        ],
        liveUrl: 'https://api.example.com',
        githubUrl: 'https://github.com/example/api',
        featured: false,
        status: 'published',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: '3',
        title: 'Angular Admin Dashboard',
        description: 'Modern admin dashboard built with Angular, featuring charts, tables, and user management.',
        shortDescription: 'Admin dashboard with charts and user management',
        technologies: ['Angular', 'TypeScript', 'RxJS', 'Chart.js', 'Bootstrap'],
        images: [
          { url: 'https://via.placeholder.com/400x250/EF4444/FFFFFF?text=Angular+Dashboard', alt: 'Angular Dashboard' }
        ],
        liveUrl: 'https://admin.example.com',
        githubUrl: 'https://github.com/example/admin',
        featured: true,
        status: 'published',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: '4',
        title: 'Task Management App - Full Stack',
        description: 'Collaborative task management application with real-time updates and team features.',
        shortDescription: 'Task management with real-time team collaboration',
        technologies: ['Angular', 'Node.js', 'Socket.io', 'MongoDB', 'JWT'],
        images: [
          { url: 'https://via.placeholder.com/400x250/8B5CF6/FFFFFF?text=Task+App+Full+Stack', alt: 'Task App' }
        ],
        liveUrl: 'https://tasks.example.com',
        githubUrl: 'https://github.com/example/tasks',
        featured: false,
        status: 'published',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    this.filteredProjects = this.allProjects;
    this.isLoading = false;
  }

  refreshProjects(): void {
    this.loadPublishedProjects();
  }

  // دالة جديدة للحصول على عدد المشاريع بعد التصفية
  getFilteredProjectsCount(): number {
    return this.filteredProjects.length;
  }

  // دالة جديدة للحصول على عدد كل المشاريع
  getAllProjectsCount(): number {
    return this.allProjects.length;
  }

  // دالة جديدة للتحقق إذا كان المشروع Full Stack
  isFullStackProject(project: Project): boolean {
    const techString = project.technologies.join(' ').toLowerCase();
    const hasFrontend = techString.includes('angular') || techString.includes('react') || techString.includes('vue');
    const hasBackend = techString.includes('node') || techString.includes('express') || techString.includes('nestjs');
    return hasFrontend && hasBackend;
  }
}