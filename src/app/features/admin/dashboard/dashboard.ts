import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ThemeService } from '../../../core/services/theme.service';
import { AuthService } from '../../../core/services/auth.service';
import { AdminService, DashboardStats, Message } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})



export class AdminDashboardComponent implements OnInit {
  currentTheme: 'dark' | 'light' = 'dark';
  stats: DashboardStats | null = null;
  recentMessages: Message[] = [];
  activeTab: string = 'dashboard';
  isLoading: boolean = true;

  constructor(
    private themeService: ThemeService,
    private authService: AuthService,
    private adminService: AdminService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.themeService.currentTheme$.subscribe(theme => {
      this.currentTheme = theme;
    });

    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    
    this.adminService.getDashboardStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.loadRecentMessages();
      },
      error: (error) => {
        console.error('Failed to load dashboard stats:', error);
        this.isLoading = false;
      }
    });
  }

  loadRecentMessages(): void {
    this.adminService.getMessages(1, 5).subscribe({
      next: (response) => {
        this.recentMessages = response.messages;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load messages:', error);
        this.isLoading = false;
      }
    });
  }

  switchTab(tab: string): void {
    this.activeTab = tab;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  markAsRead(message: Message): void {
    this.adminService.updateMessageStatus(message._id, 'read').subscribe({
      next: (updatedMessage) => {
        const index = this.recentMessages.findIndex(m => m._id === message._id);
        if (index !== -1) {
          this.recentMessages[index] = updatedMessage;
        }
      },
      error: (error) => {
        console.error('Failed to update message:', error);
      }
    });
  }
}