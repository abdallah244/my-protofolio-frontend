import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { ThemeService } from '../../../core/services/theme.service';
import { AuthService } from '../../../core/services/auth.service';
import { NavigationService, NavigationItem } from '../../../core/services/navigation.service';
import { ContentService } from '../../../core/services/content.service';
import { ProjectService, Project } from '../../../core/services/project.service';
import { ThemeToggleComponent } from '../../../shared/components/theme-toggle/theme-toggle';

interface Skill {
  _id?: string;
  name: string;
  icon: string;
  level: number;
  category: string;
  order: number;
  isActive: boolean;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink,
    ThemeToggleComponent
  ],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  isLoading = true;
  currentTheme: 'dark' | 'light' = 'dark';
  isNavbarScrolled = false;
  activeSection = 'home';
  user: any = null;
  navItems: NavigationItem[] = [];
  homeContent: any = null;
  featuredProjects: Project[] = [];
  skills: Skill[] = [];
  
  private contentSubscription!: Subscription;
  private projectSubscription!: Subscription;
  private skillsSubscription!: Subscription;
  private featuredProjectsSubscription!: Subscription;
  private autoRefreshSubscription!: Subscription;

  constructor(
    private themeService: ThemeService,
    private authService: AuthService,
    private navigationService: NavigationService,
    private contentService: ContentService,
    private projectService: ProjectService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadNavigation();
    this.loadUserData();
    this.setupTheme();
    this.setupContentSubscriptions();
    this.loadInitialData();
    this.setupAutoRefresh();
  }

  ngOnDestroy(): void {
    this.unsubscribeAll();
  }

  private unsubscribeAll(): void {
    if (this.contentSubscription) {
      this.contentSubscription.unsubscribe();
    }
    if (this.projectSubscription) {
      this.projectSubscription.unsubscribe();
    }
    if (this.skillsSubscription) {
      this.skillsSubscription.unsubscribe();
    }
    if (this.featuredProjectsSubscription) {
      this.featuredProjectsSubscription.unsubscribe();
    }
    if (this.autoRefreshSubscription) {
      this.autoRefreshSubscription.unsubscribe();
    }
  }

  private setupContentSubscriptions(): void {
    // Subscribe to home content changes
    this.contentSubscription = this.contentService.homeContent$.subscribe(
      (content: any) => {
        console.log('🏠 Home content updated:', content);
        if (content) {
          this.homeContent = content;
          this.isLoading = false;
        } else {
          console.log('⚠️ No home content received, loading default');
          this.loadDefaultContent();
        }
      }
    );

    // Subscribe to featured projects changes
    this.featuredProjectsSubscription = this.contentService.featuredProjects$.subscribe({
      next: (projects: Project[]) => {
        console.log('⭐ Featured projects updated:', projects?.length);
        this.featuredProjects = projects || [];
        if (this.featuredProjects.length === 0) {
          this.loadPublishedProjectsAsFallback();
        }
      },
      error: (error) => {
        console.error('❌ Error loading featured projects:', error);
        this.featuredProjects = [];
        this.loadPublishedProjectsAsFallback();
      }
    });

    // Subscribe to skills changes
    this.skillsSubscription = this.contentService.skills$.subscribe({
      next: (skills: Skill[]) => {
        console.log('💪 Skills updated:', skills?.length);
        this.skills = skills?.filter(s => s.isActive) || [];
      },
      error: (error) => {
        console.error('❌ Error loading skills:', error);
        this.skills = this.getDefaultSkills();
      }
    });
  }

  private loadInitialData(): void {
    this.isLoading = true;
    
    // Force refresh all data on component initialization
    this.contentService.refreshAll().subscribe({
      next: (data) => {
        console.log('✅ All data loaded successfully');
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error loading initial data:', error);
        this.loadDefaultData();
        this.isLoading = false;
      }
    });
  }

  private loadDefaultData(): void {
    console.log('🔄 Loading default data...');
    
    if (!this.homeContent) {
      this.loadDefaultContent();
    }
    
    if (this.featuredProjects.length === 0) {
      this.loadPublishedProjectsAsFallback();
    }
    
    if (this.skills.length === 0) {
      this.skills = this.getDefaultSkills();
    }
  }

  private loadDefaultContent(): void {
    this.homeContent = {
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
          description: 'Passionate full-stack developer with 3+ years of experience in modern web technologies. I create digital experiences that are not only functional but also delightful to use.'
        },
        contact: {
          title: 'Let\'s Work Together',
          description: 'Ready to start your next project?',
          email: 'contact@quantumdev.com',
          phone: '+1 (555) 123-4567',
          location: 'Cairo, Egypt'
        }
      }
    };
  }

  private getDefaultSkills(): Skill[] {
    return [
      {
        name: 'Angular',
        icon: 'fab fa-angular',
        level: 90,
        category: 'frontend',
        order: 1,
        isActive: true
      },
      {
        name: 'React',
        icon: 'fab fa-react',
        level: 85,
        category: 'frontend',
        order: 2,
        isActive: true
      },
      {
        name: 'Node.js',
        icon: 'fab fa-node-js',
        level: 88,
        category: 'backend',
        order: 3,
        isActive: true
      },
      {
        name: 'TypeScript',
        icon: 'fas fa-code',
        level: 92,
        category: 'language',
        order: 4,
        isActive: true
      }
    ];
  }

  private loadPublishedProjectsAsFallback(): void {
    this.projectService.getPublishedProjects().subscribe({
      next: (response: any) => {
        console.log('📁 Loading published projects as fallback');
        
        let projects: Project[] = [];
        
        if (Array.isArray(response)) {
          projects = response;
        } else if (response && Array.isArray(response.data)) {
          projects = response.data;
        } else if (response && Array.isArray(response.projects)) {
          projects = response.projects;
        } else if (response && response.success && Array.isArray(response.data)) {
          projects = response.data;
        }
        
        // Take only featured projects or first 3 projects
        this.featuredProjects = projects
          .filter(project => project.featured === true)
          .slice(0, 3);
          
        if (this.featuredProjects.length === 0) {
          this.featuredProjects = projects.slice(0, 3);
        }
      },
      error: (error) => {
        console.error('❌ Error loading published projects:', error);
        this.featuredProjects = this.getSampleProjects();
      }
    });
  }

  private getSampleProjects(): Project[] {
    return [
      {
        _id: '1',
        title: 'Sample Project 1',
        description: 'This is a sample project description',
        shortDescription: 'Sample project short description',
        technologies: ['Angular', 'Node.js'],
        images: [
          { url: 'https://via.placeholder.com/400x250/3B82F6/FFFFFF?text=Project+1', alt: 'Project 1' }
        ],
        featured: true,
        status: 'published',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: '2',
        title: 'Sample Project 2',
        description: 'Another sample project description',
        shortDescription: 'Another sample project',
        technologies: ['React', 'MongoDB'],
        images: [
          { url: 'https://via.placeholder.com/400x250/10B981/FFFFFF?text=Project+2', alt: 'Project 2' }
        ],
        featured: true,
        status: 'published',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  private setupAutoRefresh(): void {
    this.autoRefreshSubscription = interval(30000).subscribe(() => {
      if (!this.isLoading) {
        console.log('🔄 Auto-refreshing data...');
        this.contentService.refreshHomeContent().subscribe();
        this.contentService.refreshFeaturedProjects().subscribe();
        this.contentService.refreshSkills().subscribe();
      }
    });
  }

  private loadNavigation(): void {
    this.navItems = [
      { id: 'home', label: 'Home', icon: 'fas fa-home', path: '/home', component: 'HomeComponent' },
      { id: 'projects', label: 'Projects', icon: 'fas fa-briefcase', path: '/projects', component: 'ProjectsComponent' },
      { id: 'about', label: 'About', icon: 'fas fa-user', path: '/about', component: 'AboutComponent' },
      { id: 'contact', label: 'Contact', icon: 'fas fa-envelope', path: '/contact', component: 'ContactComponent' }
    ];
  }

  private loadUserData(): void {
    this.user = this.authService.getCurrentUser();
  }

  private setupTheme(): void {
    this.themeService.currentTheme$.subscribe(theme => {
      this.currentTheme = theme;
    });
  }

  // ✅ Public method to manually refresh data
  refreshData(): void {
    this.isLoading = true;
    console.log('🔄 Manual refresh triggered');
    
    this.contentService.refreshAll().subscribe({
      next: () => {
        this.isLoading = false;
        console.log('✅ Data refreshed manually');
      },
      error: (error) => {
        this.isLoading = false;
        console.error('❌ Error refreshing data:', error);
      }
    });
  }

  getPrimaryImage(project: Project): string {
    return this.projectService.getPrimaryImage(project);
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isNavbarScrolled = window.scrollY > 50;
    this.updateActiveSection();
  }

  updateActiveSection() {
    const sections = this.navItems.map(item => item.id);
    const scrollPosition = window.scrollY + 100;

    for (const section of sections) {
      const element = document.getElementById(section);
      if (element) {
        const offsetTop = element.offsetTop;
        const offsetBottom = offsetTop + element.offsetHeight;

        if (scrollPosition >= offsetTop && scrollPosition < offsetBottom) {
          this.activeSection = section;
          break;
        }
      }
    }
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  openProjectUrl(url: string | undefined): void {
    if (url) {
      window.open(url, '_blank');
    }
  }

  hasContent(): boolean {
    return this.homeContent !== null && 
           this.homeContent.sections !== undefined &&
           this.homeContent.sections.hero !== undefined &&
           this.homeContent.sections.hero.title !== '';
  }

  getSkillsByCategory(category: string): Skill[] {
    return this.skills.filter(skill => skill.category === category);
  }

  isProjectFeatured(project: Project): boolean {
    return project.featured === true;
  }

  // ✅ New method to check if data is loading
  getLoadingStatus(): string {
    if (this.isLoading) return 'Loading...';
    if (!this.hasContent()) return 'No content available';
    return 'Ready';
  }
}