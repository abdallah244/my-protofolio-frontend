import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle';
import { SkillService, Skill } from '../../core/services/skill.service';

interface Education {
  degree: string;
  institution: string;
  period: string;
  description: string;
  achievements: string[];
  image?: string;
}

interface Certification {
  name: string;
  issuer: string;
  date: string;
  credentialId?: string;
  description: string;
  image: string;
  skills: string[];
}

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink, ThemeToggleComponent],
  templateUrl: './about.html',
  styleUrls: ['./about.css']
})
export class AboutComponent implements OnInit {
  currentTheme: 'dark' | 'light' = 'dark';
  skills: Skill[] = [];
  
  // Modal state
  selectedCertification: Certification | null = null;
  selectedEducation: Education | null = null;
  isCertModalOpen = false;
  isEduModalOpen = false;
  
  personalInfo = {
    name: 'Abdallah Hany',
    title: 'Full Stack Developer',
    bio: 'Passionate full-stack developer with expertise in creating modern web applications. I love turning complex problems into simple, beautiful designs.',
    detailedBio: `I am Abdullah Hany a Software Engineer specialized and completed my studies in Full Stack Web Development with a focus on the Angular track.
Throughout my journey, I gained extensive knowledge in various technologies and best practices of writing clean, efficient code.
I also have one year of experience in the field.
I proudly earned my Graduation Certificate from ADA Academy with Distinction, ranking first in my cohort and maintaining a performance above 90% in all study months`,
    image: 'https://media.licdn.com/dms/image/v2/D4E03AQHadsUHcJ4WMA/profile-displayphoto-crop_800_800/B4EZkO9Ss4IwAM-/0/1756892575632?e=1761782400&v=beta&t=JpQy_4R5vy3nXyT6CtmfoZpVhKF82Z33FPz8H-gqjTM',
    email: 'abdallahhfares@gmail.com',
    phone: '+20 1142402039',
    location: 'Ismalia, Egypt'
  };

  stats = [
    { number: '7+', label: 'Projects Completed', icon: 'fas fa-project-diagram' },
    { number: '1+', label: 'Years Experience', icon: 'fas fa-calendar-alt' },
    { number: '0+', label: 'Happy Clients', icon: 'fas fa-smile' },
    { number: '18+', label: 'Technologies Used', icon: 'fas fa-tools' }
  ];

  services = [
    {
      icon: 'fas fa-code',
      title: 'Web Development',
      description: 'Building full-stack web applications using modern technologies like Angular and Node.js'
    },
    {
      icon: 'fas fa-mobile-alt',
      title: 'Web Apps',
      description: 'Developing hybrid Web applications using Angular and Ionic Framework'
    },
    {
      icon: 'fas fa-database',
      title: 'Database Design',
      description: 'Designing and managing databases with MongoDB'
    },
    {
      icon: 'fas fa-cloud',
      title: 'Cloud Services',
      description: 'Deploying and managing applications on cloud platforms like AWS and Google Cloud'
    }
  ];

  education: Education[] = [
    {
      degree: 'Fall Stack Web Development (Angular Track, Node.js)',
      institution: 'ADA Academy',
      period: '2025 - 2025',
      description: 'Graduated top of the class, with excellence in learning web fundamentals.',
      achievements: [
        'Achieved First Rank in the cohort for five consecutive months, consistently maintaining an average above 90%.',
        'Demonstrated strong skills in web fundamentals, full stack development, and problem-solving with a focus on building scalable solutions.',
        'Recognized for dedication, adaptability, and commitment to continuous learning throughout the program.',
        'Acknowledged for proactive collaboration, creativity, and contributing innovative ideas to enhance projects.'
      ],
      image: 'https://copilot.microsoft.com/th/id/BCO.1693c9b0-02dc-416a-a371-88a836a80841.png'
    }
  ];

  certifications: Certification[] = [
    {
      name: 'Certified Angular Developer',
      issuer: 'ADA Academy',
      date: '2025',
      credentialId: 'fsw-angular-2025',
      description: 'Advanced certification demonstrating expertise in Angular framework, including advanced concepts like RxJS, and performance optimization.',
      image: 'https://copilot.microsoft.com/th/id/BCO.1693c9b0-02dc-416a-a371-88a836a80841.png',
      skills: ['Angular', 'TypeScript', 'RxJS', 'MongoDB', 'Performance Optimization']
    }
  ];

  skillLevels = {
    programming: [
      { name: 'JavaScript', level: 75, icon: 'fab fa-js-square' },
      { name: 'TypeScript', level: 79, icon: 'fas fa-code' },
      { name: 'HTML', level: 91, icon: 'fa-brands fa-html5' },
      { name: 'CSS', level: 86, icon: 'fa-brands fa-css3-alt' },
      { name: 'SCSS', level: 76, icon: 'fa-brands fa-bootstrap' }
      
    ],
    frontend: [
      { name: 'Angular', level: 85, icon: 'fab fa-angular' },
      { name: 'BOOTSTRAP', level: 85, icon: 'fa-brands fa-bootstrap' },
      { name: 'Tailwand CSS', level: 88, icon: 'fa-solid fa-wind' },
      { name: 'RxJS', level: 68, icon: 'fas fa-bolt' },
      { name: 'Three.js', level: 76, icon: 'fa-solid fa-cube' }
    ],
    backend: [
      { name: 'Node.js', level: 72, icon: 'fab fa-node-js' },
      { name: 'Express.js', level: 88, icon: 'fas fa-server' },
      { name: 'MongoDB', level: 87, icon: 'fas fa-database' },
      
    ],
    tools: [
      { name: 'Git', level: 74, icon: 'fab fa-git-alt' },
      { name: 'Github', level: 72, icon: 'fa-brands fa-github' },
      { name: 'Cloudinary', level: 58, icon: 'fa-solid fa-cloud' },
      { name: 'Postman', level: 77, icon: 'fas fa-envelope' },
            { name: 'Multer', level: 57, icon: 'fa-solid fa-upload' }
    ]
  };

  constructor(
    private themeService: ThemeService,
    private skillService: SkillService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.themeService.currentTheme$.subscribe(theme => {
      this.currentTheme = theme;
    });

    this.loadSkills();
  }

  private loadSkills(): void {
    this.skillService.getSkills().subscribe({
      next: (skills: Skill[]) => {
        this.skills = skills.filter(s => s.isActive);
      },
      error: (error) => {
        console.error('Error loading skills:', error);
        this.skills = this.getDefaultSkills();
      }
    });
  }

  private getDefaultSkills(): Skill[] {
    return [
      { name: 'Angular', icon: 'fab fa-angular', level: 95, category: 'frontend', order: 1, isActive: true },
      { name: 'TypeScript', icon: 'fas fa-code', level: 92, category: 'frontend', order: 2, isActive: true },
      { name: 'React', icon: 'fab fa-react', level: 88, category: 'frontend', order: 3, isActive: true },
      { name: 'Node.js', icon: 'fab fa-node-js', level: 90, category: 'backend', order: 4, isActive: true },
      { name: 'Express.js', icon: 'fas fa-server', level: 85, category: 'backend', order: 5, isActive: true },
      { name: 'MongoDB', icon: 'fas fa-database', level: 87, category: 'database', order: 6, isActive: true },
      { name: 'PostgreSQL', icon: 'fas fa-database', level: 82, category: 'database', order: 7, isActive: true },
      { name: 'Docker', icon: 'fab fa-docker', level: 80, category: 'tool', order: 8, isActive: true },
      { name: 'AWS', icon: 'fab fa-aws', level: 75, category: 'tool', order: 9, isActive: true }
    ];
  }

  getSkillsByCategory(category: string): Skill[] {
    return this.skills.filter(skill => skill.category === category);
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

  getSkillLevels(category: keyof typeof this.skillLevels) {
    return this.skillLevels[category];
  }

  // Modal Methods
  openCertModal(cert: Certification): void {
    this.selectedCertification = cert;
    this.isCertModalOpen = true;
  }

  openEduModal(edu: Education): void {
    this.selectedEducation = edu;
    this.isEduModalOpen = true;
  }

  closeCertModal(): void {
    this.isCertModalOpen = false;
    this.selectedCertification = null;
  }

  closeEduModal(): void {
    this.isEduModalOpen = false;
    this.selectedEducation = null;
  }
}
