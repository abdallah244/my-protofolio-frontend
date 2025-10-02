import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../../core/services/theme.service';
import { AuthService, User } from '../../../core/services/auth.service';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './admin-users.html',
  styleUrls: ['./admin-users.css']
})
export class AdminUsersComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  isLoading = true;
  currentTheme: 'dark' | 'light' = 'dark';

  // ✅ متغيرات للـ HTML
  pendingActions = 0;
  totalUsers = 0;
  adminCount = 0;
  activeUsers = 0;
  inactiveUsers = 0;

  currentFilter: string = 'all';
  searchQuery: string = '';
  showAdvancedFilters = false;

  roleFilter: string = '';
  statusFilter: string = '';
  sortBy: string = 'name';
  sortOrder: string = 'asc';

  selectedUser: string | null = null;
  selectedUserDetail: User | null = null;

  // ✅ Pagination
  currentPage = 1;
  totalPages = 1;
  pageSize = 10;
  startIndex = 0;
  endIndex = 0;

  constructor(
    private themeService: ThemeService,
    private authService: AuthService,
    private adminService: AdminService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadUsers();
    this.themeService.currentTheme$.subscribe(theme => {
      this.currentTheme = theme;
    });
  }

  loadUsers() {
    this.isLoading = true;
    this.adminService.getUsers().subscribe({
      next: (users) => {
        this.users = users.map(user => ({
          ...user,
          isActive: user.isActive !== undefined ? user.isActive : true
        }));
        this.updateStats();
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.isLoading = false;
      }
    });
  }

  updateStats() {
    this.totalUsers = this.users.length;
    this.adminCount = this.users.filter(u => u.role === 'admin').length;
    this.activeUsers = this.users.filter(u => u.isActive).length;
    this.inactiveUsers = this.users.filter(u => !u.isActive).length;
    this.pendingActions = this.users.filter(u => !u.isActive).length; // مثال بسيط
  }

  // ✅ فلترة
  filterUsers(type: string) {
    this.currentFilter = type;
    this.applyFilters();
  }

  searchUsers(event: any) {
    this.searchQuery = event.target.value.toLowerCase();
    this.applyFilters();
  }

  toggleAdvancedFilters() {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  applyFilters() {
    let filtered = [...this.users];

    if (this.currentFilter === 'admins') {
      filtered = filtered.filter(u => u.role === 'admin');
    } else if (this.currentFilter === 'active') {
      filtered = filtered.filter(u => u.isActive);
    } else if (this.currentFilter === 'inactive') {
      filtered = filtered.filter(u => !u.isActive);
    }

    if (this.roleFilter) {
      filtered = filtered.filter(u => u.role === this.roleFilter);
    }

    if (this.statusFilter) {
      filtered = filtered.filter(u => this.statusFilter === 'active' ? u.isActive : !u.isActive);
    }

    if (this.searchQuery) {
      filtered = filtered.filter(u =>
        u.name.toLowerCase().includes(this.searchQuery) ||
        u.email.toLowerCase().includes(this.searchQuery)
      );
    }

    filtered.sort((a, b) => {
      let valA: any = a[this.sortBy as keyof User];
      let valB: any = b[this.sortBy as keyof User];

      if (valA < valB) return this.sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return this.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    this.filteredUsers = filtered;
    this.totalPages = Math.ceil(this.filteredUsers.length / this.pageSize);
    this.changePageSize();
  }

  resetFilters() {
    this.roleFilter = '';
    this.statusFilter = '';
    this.sortBy = 'name';
    this.sortOrder = 'asc';
    this.applyFilters();
  }

  // ✅ أكشنات اليوزر
  viewUserDetails(user: User) {
    this.selectedUserDetail = user;
  }

  closeUserDetails() {
    this.selectedUserDetail = null;
  }

  editUser(user: User) {
    console.log('Edit user:', user);
  }

  toggleUserRole(user: User) {
    if (user.role === 'user') {
      this.promoteToAdmin(user._id);
    } else {
      this.demoteToUser(user._id);
    }
  }

  toggleUserStatus(user: User) {
    user.isActive = !user.isActive;
    this.updateStats();
  }

  deleteUser(user: User) {
    if (confirm('Are you sure you want to delete this user?')) {
      this.adminService.deleteUser(user._id).subscribe(() => {
        this.users = this.users.filter(u => u._id !== user._id);
        this.applyFilters();
      });
    }
  }

  // ✅ Pagination
  changePageSize() {
    this.startIndex = (this.currentPage - 1) * this.pageSize;
    this.endIndex = Math.min(this.startIndex + this.pageSize, this.filteredUsers.length);
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.changePageSize();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.changePageSize();
    }
  }

  // ✅ Role APIs
  promoteToAdmin(userId: string) {
    this.adminService.updateUserRole(userId, 'admin').subscribe(updatedUser => {
      const index = this.users.findIndex(u => u._id === userId);
      if (index !== -1) this.users[index] = updatedUser;
      this.applyFilters();
    });
  }

  demoteToUser(userId: string) {
    this.adminService.updateUserRole(userId, 'user').subscribe(updatedUser => {
      const index = this.users.findIndex(u => u._id === userId);
      if (index !== -1) this.users[index] = updatedUser;
      this.applyFilters();
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // ✅ Invite User Dialog (Dummy)
  openInviteDialog() {
    alert('Invite User Dialog (to be implemented)');
  }
}
