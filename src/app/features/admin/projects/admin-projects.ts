import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { ThemeService } from '../../../core/services/theme.service';
import { AuthService } from '../../../core/services/auth.service';
import { AdminService, Project } from '../../../core/services/admin.service';
import { ProjectService } from '../../../core/services/project.service';

@Component({
  selector: 'app-admin-projects',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, FormsModule],
  templateUrl: './admin-projects.html',
  styleUrls: ['./admin-projects.css']
})
export class AdminProjectsComponent implements OnInit {
  currentTheme: 'dark' | 'light' = 'dark';
  allProjects: Project[] = []; // كل المشاريع (منشورة ومعلقة)
  filteredProjects: Project[] = []; // المشاريع بعد التصفية
  isLoading = true;
  showAddProjectModal = false;
  isUploadingImage = false;
  projectImagePreview: string | null = null;
  projectTechnologies: string[] = [];
  newTechnology: string = '';
  saveMessage = '';
  isSaving = false;

  // ✅ إضافة السيكشن للمشروع
  projectSections = [
    { value: 'angular', label: 'Angular Projects', icon: 'fab fa-angular' },
    { value: 'backend', label: 'Backend Projects', icon: 'fas fa-server' },
    { value: 'fullstack', label: 'Full Stack Projects', icon: 'fas fa-layer-group' }
  ];

  projectForm: FormGroup;

  @ViewChild('imageInput') imageInput!: ElementRef<HTMLInputElement>;

  constructor(
    private themeService: ThemeService,
    private authService: AuthService,
    private adminService: AdminService,
    private projectService: ProjectService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.projectForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      shortDescription: ['', [Validators.required, Validators.minLength(5)]],
      technologies: [[]],
      section: ['fullstack', Validators.required], // ✅ إضافة حقل السيكشن
      liveUrl: [''],
      githubUrl: [''],
      featured: [false],
      status: ['draft', Validators.required] // الافتراضي draft للإدارة
    });
  }

  ngOnInit() {
    this.loadAllProjects(); // جلب كل المشاريع (منشورة ومعلقة)
    this.themeService.currentTheme$.subscribe(theme => {
      this.currentTheme = theme;
    });

    // ✅ الاشتراك في تحديثات المشاريع من السيرفيس
    this.projectService.projects$.subscribe(projects => {
      console.log('🔄 Projects updated from service:', projects);
      this.allProjects = projects;
      this.filteredProjects = this.allProjects;
      this.isLoading = false;
    });
  }

  loadAllProjects() {
    this.isLoading = true;
    this.adminService.getProjects().subscribe({
      next: (projects) => {
        console.log('✅ All projects loaded for admin:', projects);
        this.allProjects = projects;
        this.filteredProjects = this.allProjects;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error loading all projects:', error);
        this.isLoading = false;
        this.saveMessage = 'Error loading projects: ' + error.message;
        setTimeout(() => { this.saveMessage = ''; }, 5000);
      }
    });
  }

  openAddProjectModal(): void {
    this.showAddProjectModal = true;
    this.projectForm.reset({
      title: '',
      description: '',
      shortDescription: '',
      technologies: [],
      section: 'fullstack', // ✅ قيمة افتراضية
      liveUrl: '',
      githubUrl: '',
      featured: false,
      status: 'draft'
    });
    this.projectTechnologies = [];
    this.projectImagePreview = null;
    this.saveMessage = '';
  }

  closeAddProjectModal(): void {
    this.showAddProjectModal = false;
  }

  triggerImageUpload(): void {
    this.imageInput.nativeElement.click();
  }

  onImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.isUploadingImage = true;

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.projectImagePreview = e.target.result;
        this.isUploadingImage = false;
      };
      reader.readAsDataURL(file);
    }
  }

  addTechnology(): void {
    if (this.newTechnology.trim() && !this.projectTechnologies.includes(this.newTechnology.trim())) {
      this.projectTechnologies.push(this.newTechnology.trim());
      this.newTechnology = '';
    }
  }

  removeTechnology(index: number): void {
    this.projectTechnologies.splice(index, 1);
  }

  onSubmitProject(): void {
    if (this.projectForm.valid) {
      this.isSaving = true;
      
      // ✅ تحديد السيكشن تلقائياً إذا لم يتم اختياره
      let section = this.projectForm.value.section;
      if (!section) {
        const tempProject: Project = {
          title: this.projectForm.value.title,
          description: this.projectForm.value.description,
          shortDescription: this.projectForm.value.shortDescription,
          technologies: this.projectTechnologies,
          images: [],
          featured: this.projectForm.value.featured,
          status: this.projectForm.value.status
        };
        section = this.projectService.determineProjectSection(tempProject);
      }

      const projectData = {
        ...this.projectForm.value,
        technologies: this.projectTechnologies,
        section: section, // ✅ إضافة السيكشن
        images: this.projectImagePreview
          ? [
              {
                url: this.projectImagePreview,
                alt: this.projectForm.value.title,
                isPrimary: true
              }
            ]
          : []
      };

      console.log('📤 Creating project:', projectData);

      this.adminService.createProject(projectData).subscribe({
        next: (newProject) => {
          console.log('✅ Project created successfully:', newProject);
          this.isSaving = false;
          this.showAddProjectModal = false;
          this.saveMessage = 'Project created successfully!';
          
          // ✅ إعادة تحميل المشاريع من السيرفيس
          this.projectService.refreshProjects();
          
          setTimeout(() => {
            this.saveMessage = '';
          }, 3000);
        },
        error: (error) => {
          console.error('❌ Error creating project:', error);
          this.isSaving = false;
          this.saveMessage =
            'Error creating project: ' + (error.error?.error || error.message);
          setTimeout(() => {
            this.saveMessage = '';
          }, 5000);
        }
      });
    } else {
      this.markFormGroupTouched(this.projectForm);
      this.saveMessage = 'Please fill all required fields correctly';
      setTimeout(() => {
        this.saveMessage = '';
      }, 3000);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  deleteProject(projectId: string): void {
    if (confirm('Are you sure you want to delete this project?')) {
      this.adminService.deleteProject(projectId).subscribe({
        next: () => {
          this.saveMessage = 'Project deleted successfully!';
          // ✅ إعادة تحميل المشاريع من السيرفيس
          this.projectService.refreshProjects();
          setTimeout(() => {
            this.saveMessage = '';
          }, 3000);
        },
        error: (error) => {
          console.error('❌ Error deleting project:', error);
          this.saveMessage =
            'Error deleting project: ' +
            (error.error?.error || error.message);
          setTimeout(() => {
            this.saveMessage = '';
          }, 5000);
        }
      });
    }
  }

  toggleProjectStatus(project: Project): void {
    const newStatus = project.status === 'published' ? 'draft' : 'published';
    const updatedProject = { ...project, status: newStatus };

    this.adminService.updateProject(project._id!, updatedProject).subscribe({
      next: () => {
        this.saveMessage = `Project ${
          newStatus === 'published' ? 'published' : 'drafted'
        } successfully!`;
        // ✅ إعادة تحميل المشاريع من السيرفيس
        this.projectService.refreshProjects();
        setTimeout(() => {
          this.saveMessage = '';
        }, 3000);
      },
      error: (error) => {
        console.error('❌ Error updating project status:', error);
        this.saveMessage =
          'Error updating project: ' +
          (error.error?.error || error.message);
        setTimeout(() => {
          this.saveMessage = '';
        }, 5000);
      }
    });
  }

  toggleFeaturedStatus(project: Project): void {
    const newFeaturedStatus = !project.featured;
    const updatedProject = { ...project, featured: newFeaturedStatus };

    this.adminService.updateProject(project._id!, updatedProject).subscribe({
      next: () => {
        this.saveMessage = `Project ${
          newFeaturedStatus ? 'added to' : 'removed from'
        } featured!`;
        // ✅ إعادة تحميل المشاريع من السيرفيس
        this.projectService.refreshProjects();
        setTimeout(() => {
          this.saveMessage = '';
        }, 3000);
      },
      error: (error) => {
        console.error('❌ Error updating featured status:', error);
        this.saveMessage =
          'Error updating project: ' +
          (error.error?.error || error.message);
        setTimeout(() => {
          this.saveMessage = '';
        }, 5000);
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getPrimaryImage(project: Project): string {
    return this.projectService.getPrimaryImage(project);
  }

  // ✅ دالة جديدة للحصول على أيقونة السيكشن
  getSectionIcon(section: string): string {
    const sectionObj = this.projectSections.find(s => s.value === section);
    return sectionObj ? sectionObj.icon : 'fas fa-folder';
  }

  // ✅ دالة جديدة للحصول على لون السيكشن
  getSectionColor(section: string): string {
    switch (section) {
      case 'angular': return '#dd0031';
      case 'backend': return '#10b981';
      case 'fullstack': return '#8b5cf6';
      default: return '#6b7280';
    }
  }

  // ✅ دالة جديدة لتصفية المشاريع حسب السيكشن
  filterProjectsBySection(section: string): void {
    if (section === 'all') {
      this.filteredProjects = this.allProjects;
    } else {
      this.filteredProjects = this.allProjects.filter(project => project.section === section);
    }
  }

  // ✅ دالة جديدة للحصول على إحصائيات المشاريع
  getProjectsStats(): any {
    const total = this.allProjects.length;
    const published = this.allProjects.filter(p => p.status === 'published').length;
    const draft = this.allProjects.filter(p => p.status === 'draft').length;
    const featured = this.allProjects.filter(p => p.featured === true).length;
    const angular = this.allProjects.filter(p => p.section === 'angular').length;
    const backend = this.allProjects.filter(p => p.section === 'backend').length;
    const fullstack = this.allProjects.filter(p => p.section === 'fullstack').length;

    return { total, published, draft, featured, angular, backend, fullstack };
  }

  // ✅ دالة جديدة لنسخ رابط المشروع
  copyProjectLink(projectId: string): void {
    const link = `${window.location.origin}/projects/${projectId}`;
    navigator.clipboard.writeText(link).then(() => {
      this.saveMessage = 'Project link copied to clipboard!';
      setTimeout(() => { this.saveMessage = ''; }, 2000);
    });
  }
}