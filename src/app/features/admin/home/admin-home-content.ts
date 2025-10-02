import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  FormArray,
  FormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AdminService, Project, Skill } from '../../../core/services/admin.service';
import { ContentService } from '../../../core/services/content.service';
import { ProjectService } from '../../../core/services/project.service';
import { HomeContent } from '../../../core/models/home-content.interface';

@Component({
  selector: 'app-admin-home-content',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './admin-home-content.html',
  styleUrls: ['./admin-home-content.css'],
})
export class AdminHomeContentComponent implements OnInit, OnDestroy {
  homeForm: FormGroup;
  skillsForm: FormGroup;
  featuredProjectsForm: FormGroup;
  projectForm: FormGroup;

  isLoading = false;
  isSaving = false;
  saveMessage = '';
  saveType: 'success' | 'error' = 'success';

  skills: Skill[] = [];
  allProjects: Project[] = [];
  showAddProjectModal = false;
  isUploadingImage = false;
  projectImagePreview: string | null = null;
  projectTechnologies: string[] = [];
  newTechnology: string = '';

  @ViewChild('imageInput') imageInput!: ElementRef<HTMLInputElement>;

  private contentSubscription!: Subscription;
  private projectsSubscription!: Subscription;
  private skillsSubscription!: Subscription;

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private contentService: ContentService,
    private projectService: ProjectService,
    private router: Router
  ) {
    this.homeForm = this.createHomeForm();
    this.skillsForm = this.createSkillsForm();
    this.featuredProjectsForm = this.createFeaturedProjectsForm();
    this.projectForm = this.createProjectForm();
  }

  ngOnInit(): void {
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.unsubscribeAll();
  }

  private createHomeForm(): FormGroup {
    return this.fb.group({
      // Hero Section
      heroTitle: ['', [Validators.required, Validators.minLength(2)]],
      heroSubtitle: ['', [Validators.required, Validators.minLength(2)]],
      heroDescription: ['', [Validators.required, Validators.minLength(10)]],
      heroBadge: ['', [Validators.required, Validators.minLength(2)]],

      // Stats Section
      statsProjects: [0, [Validators.required, Validators.min(0)]],
      statsClients: [0, [Validators.required, Validators.min(0)]],
      statsTechnologies: [0, [Validators.required, Validators.min(0)]],
      statsExperience: [0, [Validators.required, Validators.min(0)]],

      // About Section
      aboutTitle: ['', [Validators.required, Validators.minLength(2)]],
      aboutDescription: ['', [Validators.required, Validators.minLength(10)]],

      // Contact Section
      contactTitle: ['', [Validators.required, Validators.minLength(2)]],
      contactDescription: ['', [Validators.required, Validators.minLength(10)]],
      contactEmail: ['', [Validators.required, Validators.email]],
      contactPhone: ['', [Validators.required, Validators.minLength(5)]],
      contactLocation: ['', [Validators.required, Validators.minLength(2)]],
    });
  }

  private createSkillsForm(): FormGroup {
    return this.fb.group({
      skills: this.fb.array([]),
    });
  }

  private createFeaturedProjectsForm(): FormGroup {
    return this.fb.group({
      featuredProjects: this.fb.array([]),
    });
  }

  private createProjectForm(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      shortDescription: ['', [Validators.required, Validators.minLength(5)]],
      technologies: [[]],
      liveUrl: [''],
      githubUrl: [''],
      featured: [false],
      status: ['published', Validators.required],
    });
  }

  private loadInitialData(): void {
    this.isLoading = true;

    // Load home content first
    this.adminService.getHomeContent().subscribe({
      next: (response: any) => {
        console.log('Home content response:', response);
        this.populateHomeForm(response);
        this.isLoading = false;

        // Load skills and projects after home content
        this.loadSkills();
        this.loadProjects();
      },
      error: (error) => {
        console.error('Error loading home content:', error);
        this.isLoading = false;
        this.showMessage('Error loading home content', 'error');

        // Try to load skills and projects even if home content fails
        this.loadSkills();
        this.loadProjects();
      },
    });
  }

  private loadSkills(): void {
    this.adminService.getSkills().subscribe({
      next: (skills: any) => {
        console.log('Skills response:', skills);
        this.skills = this.extractSkills(skills);
        this.populateSkillsForm();
      },
      error: (error) => {
        console.error('Error loading skills:', error);
        this.skills = [];
        this.populateSkillsForm();
      },
    });
  }

  private loadProjects(): void {
    this.adminService.getProjects().subscribe({
      next: (projects: any) => {
        console.log('Projects response:', projects);
        this.allProjects = this.extractProjects(projects);
        this.initializeFeaturedProjectsForm();
      },
      error: (error) => {
        console.error('Error loading projects:', error);
        this.allProjects = [];
        this.initializeFeaturedProjectsForm();
      },
    });
  }

  private unsubscribeAll(): void {
    if (this.contentSubscription) {
      this.contentSubscription.unsubscribe();
    }
    if (this.projectsSubscription) {
      this.projectsSubscription.unsubscribe();
    }
    if (this.skillsSubscription) {
      this.skillsSubscription.unsubscribe();
    }
  }

  get skillsArray(): FormArray {
    return this.skillsForm.get('skills') as FormArray;
  }

  get featuredProjectsArray(): FormArray {
    return this.featuredProjectsForm.get('featuredProjects') as FormArray;
  }

  private extractSkills(response: any): Skill[] {
    console.log('Extracting skills from:', response);

    if (Array.isArray(response)) {
      return response;
    }
    if (response?.data && Array.isArray(response.data)) {
      return response.data;
    }
    if (response?.success && Array.isArray(response.data)) {
      return response.data;
    }
    if (response?.skills && Array.isArray(response.skills)) {
      return response.skills;
    }
    return [];
  }

  private extractProjects(response: any): Project[] {
    console.log('Extracting projects from:', response);

    if (Array.isArray(response)) {
      return response;
    }
    if (response?.data && Array.isArray(response.data)) {
      return response.data;
    }
    if (response?.projects && Array.isArray(response.projects)) {
      return response.projects;
    }
    return [];
  }

  private populateHomeForm(content: any): void {
    console.log('Populating home form with:', content);

    // Extract sections from different response formats
    let sections = content.sections;

    if (!sections && content.data?.sections) {
      sections = content.data.sections;
    }

    if (!sections && content.data?.content?.sections) {
      sections = content.data.content.sections;
    }

    if (!sections && content.content?.sections) {
      sections = content.content.sections;
    }

    if (!sections) {
      console.warn('No sections found in response, using default values');
      sections = this.getDefaultSections();
    }

    const hero = sections.hero || {};
    const stats = sections.stats || {};
    const about = sections.about || {};
    const contact = sections.contact || {};

    this.homeForm.patchValue({
      heroTitle: hero.title || 'Crafting Digital Experiences That Matter',
      heroSubtitle: hero.subtitle || 'Full Stack Developer',
      heroDescription:
        hero.description ||
        'Transforming ideas into innovative web solutions. Specialized in modern technologies and user-centered design with 3+ years of experience.',
      heroBadge: hero.badgeText || hero.badge || 'Full Stack Developer',
      statsProjects: stats.projects || 25,
      statsClients: stats.clients || 15,
      statsTechnologies: stats.technologies || 50,
      statsExperience: stats.experience || 3,
      aboutTitle: about.title || 'About Me',
      aboutDescription:
        about.description ||
        'Passionate full-stack developer with 3+ years of experience in modern web technologies. I create digital experiences that are not only functional but also delightful to use.',
      contactTitle: contact.title || "Let's Work Together",
      contactDescription: contact.description || 'Ready to start your next project?',
      contactEmail: contact.email || 'contact@quantumdev.com',
      contactPhone: contact.phone || '+1 (555) 123-4567',
      contactLocation: contact.location || 'Cairo, Egypt',
    });
  }

  private getDefaultSections(): any {
    return {
      hero: {
        title: 'Crafting Digital Experiences That Matter',
        subtitle: 'Full Stack Developer',
        description: 'Transforming ideas into innovative web solutions.',
        badgeText: 'Full Stack Developer',
      },
      stats: {
        projects: 25,
        clients: 15,
        technologies: 50,
        experience: 3,
      },
      about: {
        title: 'About Me',
        description: 'Passionate full-stack developer with experience.',
      },
      contact: {
        title: "Let's Work Together",
        description: 'Ready to start your next project?',
        email: 'contact@quantumdev.com',
        phone: '+1 (555) 123-4567',
        location: 'Cairo, Egypt',
      },
    };
  }

  private populateSkillsForm(): void {
    this.skillsArray.clear();

    this.skills.forEach((skill) => {
      this.skillsArray.push(
        this.fb.group({
          _id: [skill._id || ''],
          name: [skill.name || '', [Validators.required, Validators.minLength(2)]],
          icon: [skill.icon || '', [Validators.required, Validators.minLength(2)]],
          level: [skill.level || 0, [Validators.required, Validators.min(0), Validators.max(100)]],
          category: [skill.category || 'frontend', Validators.required],
          order: [skill.order || 0],
          isActive: [skill.isActive !== undefined ? skill.isActive : true],
        })
      );
    });

    // Add empty skill if no skills exist
    if (this.skills.length === 0) {
      this.addNewSkill();
    }
  }

  private initializeFeaturedProjectsForm(): void {
    this.featuredProjectsArray.clear();

    // Create 6 slots for featured projects
    for (let i = 0; i < 6; i++) {
      this.featuredProjectsArray.push(
        this.fb.group({
          projectId: [''],
        })
      );
    }

    this.loadFeaturedProjects();
  }

  private loadFeaturedProjects(): void {
    this.adminService.getFeaturedProjects().subscribe({
      next: (response: any) => {
        console.log('Featured projects response:', response);
        const projectIds = this.extractProjectIds(response);

        if (projectIds.length > 0) {
          projectIds.forEach((projectId, index) => {
            if (index < this.featuredProjectsArray.length) {
              this.featuredProjectsArray.at(index).patchValue({
                projectId: projectId,
              });
            }
          });
        }
      },
      error: (error) => {
        console.error('Error loading featured projects:', error);
      },
    });
  }

  private extractProjectIds(response: any): string[] {
    if (Array.isArray(response)) {
      return response.map((p) => p._id || p.id).filter(Boolean);
    }
    if (response?.data && Array.isArray(response.data)) {
      return response.data.map((p: any) => p._id || p.id).filter(Boolean);
    }
    if (response?.projectIds && Array.isArray(response.projectIds)) {
      return response.projectIds;
    }
    if (response?.data?.projectIds && Array.isArray(response.data.projectIds)) {
      return response.data.projectIds;
    }
    return [];
  }

  // ✅ Public Methods
  addNewSkill(): void {
    this.skillsArray.push(
      this.fb.group({
        _id: [''],
        name: ['', [Validators.required, Validators.minLength(2)]],
        icon: ['fas fa-code', [Validators.required, Validators.minLength(2)]],
        level: [50, [Validators.required, Validators.min(0), Validators.max(100)]],
        category: ['frontend', Validators.required],
        order: [this.skillsArray.length],
        isActive: [true],
      })
    );
  }

  removeSkill(index: number): void {
    const skill = this.skillsArray.at(index);
    const skillId = skill.get('_id')?.value;

    if (skillId) {
      if (confirm('Are you sure you want to delete this skill?')) {
        this.adminService.deleteSkill(skillId).subscribe({
          next: () => {
            this.skillsArray.removeAt(index);
            this.showMessage('Skill deleted successfully!', 'success');
            this.refreshSkills();
          },
          error: (error) => {
            console.error('Error deleting skill:', error);
            this.showMessage('Error deleting skill: ' + error.message, 'error');
          },
        });
      }
    } else {
      this.skillsArray.removeAt(index);
      this.showMessage('Skill removed from form!', 'success');
    }
  }

  getSelectedProject(index: number): Project | null {
    const projectId = this.featuredProjectsArray.at(index).get('projectId')?.value;
    if (!projectId) return null;

    return this.allProjects.find((project) => project._id === projectId) || null;
  }

  deleteProject(projectId: string): void {
    if (confirm('Are you sure you want to delete this project?')) {
      this.adminService.deleteProject(projectId).subscribe({
        next: () => {
          this.showMessage('Project deleted successfully!', 'success');
          this.refreshProjects();
        },
        error: (error) => {
          console.error('Error deleting project:', error);
          this.showMessage('Error deleting project: ' + error.message, 'error');
        },
      });
    }
  }

  addTechnology(): void {
    if (
      this.newTechnology.trim() &&
      !this.projectTechnologies.includes(this.newTechnology.trim())
    ) {
      this.projectTechnologies.push(this.newTechnology.trim());
      this.newTechnology = '';
    }
  }

  removeTechnology(index: number): void {
    this.projectTechnologies.splice(index, 1);
  }

  openAddProjectModal(): void {
    this.showAddProjectModal = true;
    this.projectForm.reset({
      title: '',
      description: '',
      shortDescription: '',
      liveUrl: '',
      githubUrl: '',
      featured: false,
      status: 'published',
    });
    this.projectTechnologies = [];
    this.projectImagePreview = null;
    this.saveMessage = '';
  }

  closeAddProjectModal(): void {
    this.showAddProjectModal = false;
  }

  triggerImageUpload(): void {
    if (this.imageInput?.nativeElement) {
      this.imageInput.nativeElement.click();
    }
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

  onSubmitHome(): void {
    if (this.homeForm.valid) {
      this.isSaving = true;
      const formData = this.homeForm.value;

      const homeContent = {
        sections: {
          hero: {
            title: formData.heroTitle,
            subtitle: formData.heroSubtitle,
            description: formData.heroDescription,
            badgeText: formData.heroBadge,
          },
          stats: {
            projects: formData.statsProjects,
            clients: formData.statsClients,
            technologies: formData.statsTechnologies,
            experience: formData.statsExperience,
          },
          about: {
            title: formData.aboutTitle,
            description: formData.aboutDescription,
          },
          contact: {
            title: formData.contactTitle,
            description: formData.contactDescription,
            email: formData.contactEmail,
            phone: formData.contactPhone,
            location: formData.contactLocation,
          },
        },
      };

      console.log('Saving home content:', homeContent);

      this.adminService.updateHomeContent(homeContent).subscribe({
        next: (response: any) => {
          this.isSaving = false;
          this.showMessage('Home content updated successfully!', 'success');
          // Force refresh after 2 seconds to see the changes
          setTimeout(() => {
            this.refreshHomeContent();
          }, 2000);
        },
        error: (error) => {
          this.isSaving = false;
          console.error('Error details:', error);
          this.showMessage(
            'Error updating home content: ' + (error.error?.message || error.message),
            'error'
          );
        },
      });
    } else {
      this.markFormGroupTouched(this.homeForm);
      this.showMessage('Please fill all required fields correctly', 'error');
    }
  }

  onSaveSkills(): void {
    if (this.skillsForm.valid) {
      this.isSaving = true;
      const skillsData = this.skillsForm.value.skills;

      // Create array of save promises
      const savePromises = skillsData.map((skill: any, index: number) => {
        const skillId = this.skillsArray.at(index).get('_id')?.value;

        if (skillId) {
          // Update existing skill
          return this.adminService.updateSkill(skillId, skill).toPromise();
        } else {
          // Create new skill
          return this.adminService.createSkill(skill).toPromise();
        }
      });

      // Execute all promises
      Promise.all(savePromises)
        .then((results) => {
          this.isSaving = false;
          this.showMessage(`Skills saved successfully! (${results.length} skills)`, 'success');
          // Refresh skills after save
          setTimeout(() => {
            this.refreshSkills();
          }, 2000);
        })
        .catch((error) => {
          this.isSaving = false;
          console.error('Error saving skills:', error);
          this.showMessage(
            'Error saving skills: ' + (error.error?.message || error.message),
            'error'
          );
        });
    } else {
      this.markFormGroupTouched(this.skillsForm);
      this.showMessage('Please fill all skill fields correctly', 'error');
    }
  }

  onSaveFeaturedProjects(): void {
    const featuredProjects = this.featuredProjectsForm.value.featuredProjects
      .filter((item: any) => item.projectId)
      .map((item: any) => item.projectId);

    if (featuredProjects.length === 0) {
      this.showMessage('Please select at least one project', 'error');
      return;
    }

    this.isSaving = true;

    this.adminService.saveFeaturedProjects(featuredProjects).subscribe({
      next: (response: any) => {
        this.isSaving = false;
        this.showMessage(
          `Featured projects saved successfully! (${featuredProjects.length} projects)`,
          'success'
        );
        // Refresh featured projects after save
        setTimeout(() => {
          this.refreshFeaturedProjects();
        }, 2000);
      },
      error: (error) => {
        this.isSaving = false;
        console.error('Error saving featured projects:', error);
        this.showMessage(
          'Error saving featured projects: ' + (error.error?.message || error.message),
          'error'
        );
      },
    });
  }

  onSubmitProject(): void {
    if (this.projectForm.valid) {
      this.isSaving = true;

      const projectData = {
        ...this.projectForm.value,
        technologies: this.projectTechnologies,
        images: this.projectImagePreview
          ? [
              {
                url: this.projectImagePreview,
                alt: this.projectForm.value.title,
                isPrimary: true,
              },
            ]
          : [],
      };

      console.log('Creating project:', projectData);

      this.adminService.createProject(projectData).subscribe({
        next: (newProject: any) => {
          this.isSaving = false;
          this.showMessage('Project created successfully!', 'success');
          this.showAddProjectModal = false;

          // Refresh projects list
          setTimeout(() => {
            this.refreshProjects();
            this.refreshFeaturedProjects();
          }, 2000);
        },
        error: (error) => {
          this.isSaving = false;
          console.error('Error creating project:', error);
          this.showMessage(
            'Error creating project: ' + (error.error?.message || error.message),
            'error'
          );
        },
      });
    } else {
      this.markFormGroupTouched(this.projectForm);
      this.showMessage('Please fill all required fields correctly', 'error');
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  private showMessage(message: string, type: 'success' | 'error'): void {
    this.saveMessage = message;
    this.saveType = type;

    setTimeout(
      () => {
        this.saveMessage = '';
      },
      type === 'success' ? 5000 : 8000
    );
  }

  // ✅ Refresh methods
  refreshHomeContent(): void {
    this.isLoading = true;
    this.adminService.getHomeContent().subscribe({
      next: (response: any) => {
        this.populateHomeForm(response);
        this.isLoading = false;
        this.showMessage('Home content refreshed!', 'success');
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error refreshing home content:', error);
        this.showMessage(
          'Error refreshing home content: ' + (error.error?.message || error.message),
          'error'
        );
      },
    });
  }

  refreshSkills(): void {
    this.isLoading = true;
    this.adminService.getSkills().subscribe({
      next: (skills: any) => {
        this.skills = this.extractSkills(skills);
        this.populateSkillsForm();
        this.isLoading = false;
        this.showMessage('Skills refreshed!', 'success');
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error refreshing skills:', error);
        this.showMessage(
          'Error refreshing skills: ' + (error.error?.message || error.message),
          'error'
        );
      },
    });
  }
  refreshProjects(): void {
    this.isLoading = true;
    this.adminService.getProjects().subscribe({
      next: (projects: any) => {
        this.allProjects = this.extractProjects(projects);
        this.initializeFeaturedProjectsForm();
        this.isLoading = false;
        this.showMessage('Projects refreshed!', 'success');
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error refreshing projects:', error);
        this.showMessage(
          'Error refreshing projects: ' + (error.error?.message || error.message),
          'error'
        );
      },
    });
  }
  refreshFeaturedProjects(): void {
    this.isLoading = true;
    this.adminService.getFeaturedProjects().subscribe({
      next: (response: any) => {
        const projectIds = this.extractProjectIds(response);
        this.featuredProjectsArray.clear();
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error refreshing featured projects:', error);
        this.showMessage(
          'Error refreshing featured projects: ' + (error.error?.message || error.message),
          'error'
        );
      },
    });
  }
previewChanges(): void {
    this.router.navigate(['/']);
  }
  goToAdminDashboard(): void {
    this.router.navigate(['/admin']);
  }
}