import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';  
import { ThemeService } from '../../../core/services/theme.service';
import { AuthService } from '../../../core/services/auth.service';
import { AdminService, Message } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-messages',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './admin-messages.html',
  styleUrls: ['./admin-messages.css']
})
export class AdminMessagesComponent implements OnInit {
  messages: Message[] = [];
  filteredMessages: Message[] = [];
  isLoading = true;
  currentTheme: 'dark' | 'light' = 'dark';

  // Counters
  totalCount: number = 0;
  unreadCount: number = 0;

  // Filters + Search
  currentFilter: 'all' | 'unread' | 'read' = 'all';
  searchQuery: string = '';

  // Pagination
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;

  // UI State
  selectedMessage: string | null = null;
  showReplyForm: string | null = null;
  replyMessage: string = '';

  constructor(
    private themeService: ThemeService,
    private authService: AuthService,
    private adminService: AdminService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadMessages();
    this.themeService.currentTheme$.subscribe(theme => {
      this.currentTheme = theme;
    });
  }

  loadMessages() {
    this.isLoading = true;
    console.log('🔄 Loading messages from API...');
    
    this.adminService.getAllMessages().subscribe({
      next: (response: any) => {
        console.log('📥 API Response:', response);
        
        let messages: Message[] = [];
        
        // FIXED: معالجة الـ response بشكل صحيح بدون type errors
        if (Array.isArray(response)) {
          messages = response;
        } else if (response && typeof response === 'object') {
          // Handle different response formats
          if (Array.isArray((response as any).data)) {
            messages = (response as any).data;
          } else if (Array.isArray((response as any).messages)) {
            messages = (response as any).messages;
          } else if (Array.isArray(response)) {
            messages = response;
          } else if ((response as any).success && Array.isArray((response as any).data)) {
            messages = (response as any).data;
          }
        }
        
        console.log('✅ Processed messages:', messages);
        this.messages = messages;
        this.totalCount = this.messages.length;
        this.unreadCount = this.messages.filter(m => !m.isRead).length;
        this.isLoading = false;
        this.updateFilteredMessages();
      },
      error: (error) => {
        console.error('❌ Error loading messages:', error);
        console.error('Error details:', error.message, error.status);
        this.isLoading = false;
        
        this.messages = [];
        this.totalCount = 0;
        this.unreadCount = 0;
        this.updateFilteredMessages();
        
        alert('Failed to load messages. Check console for details.');
      }
    });
  }

  updateFilteredMessages() {
    let result = [...this.messages];

    // Filter
    if (this.currentFilter === 'unread') {
      result = result.filter(m => !m.isRead);
    } else if (this.currentFilter === 'read') {
      result = result.filter(m => m.isRead);
    }

    // Search
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q) ||
        m.message.toLowerCase().includes(q)
      );
    }

    // Sort by date (newest first)
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Pagination
    this.totalPages = Math.max(1, Math.ceil(result.length / this.pageSize));
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;

    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.filteredMessages = result.slice(start, end);
  }

  filterMessages(filter: 'all' | 'unread' | 'read') {
    this.currentFilter = filter;
    this.currentPage = 1;
    this.updateFilteredMessages();
  }

  searchMessages(event: any) {
    this.searchQuery = event.target.value;
    this.currentPage = 1;
    this.updateFilteredMessages();
  }

  sortMessages(event: any) {
    const value = event.target.value;
    if (value === 'newest') {
      this.messages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      this.messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    this.updateFilteredMessages();
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updateFilteredMessages();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updateFilteredMessages();
    }
  }

 markAsRead(messageId: string) {
  this.adminService.updateMessageStatus(messageId, 'read').subscribe({
    next: (updatedMessage) => {
      console.log('✅ Message marked as read:', updatedMessage);
      
      const index = this.messages.findIndex(m => m._id === messageId);
      if (index !== -1) {
        // FIXED: تحديث كل الحقول المطلوبة
        this.messages[index].isRead = true;
        this.messages[index].status = 'read';
        
        this.unreadCount = this.messages.filter(m => !m.isRead).length;
        this.updateFilteredMessages();
        
        console.log('🔄 UI updated - isRead:', this.messages[index].isRead);
      }
    },
    error: (error) => {
      console.error('❌ Error updating message:', error);
      // Update locally if API fails
      const index = this.messages.findIndex(m => m._id === messageId);
      if (index !== -1) {
        this.messages[index].isRead = true;
        this.messages[index].status = 'read';
        this.unreadCount = this.messages.filter(m => !m.isRead).length;
        this.updateFilteredMessages();
      }
    }
  });
}

  markAsUnread(messageId: string) {
    this.adminService.updateMessageStatus(messageId, 'unread').subscribe({
      next: (updatedMessage) => {
        const index = this.messages.findIndex(m => m._id === messageId);
        if (index !== -1) {
          this.messages[index] = updatedMessage;
          this.unreadCount = this.messages.filter(m => !m.isRead).length;
          this.updateFilteredMessages();
        }
      },
      error: (error) => {
        console.error('❌ Error updating message:', error);
      }
    });
  }

  deleteMessage(messageId: string) {
    if (confirm('Are you sure you want to delete this message?')) {
      this.adminService.deleteMessage(messageId).subscribe({
        next: () => {
          this.messages = this.messages.filter(m => m._id !== messageId);
          this.totalCount = this.messages.length;
          this.unreadCount = this.messages.filter(m => !m.isRead).length;
          this.updateFilteredMessages();
        },
        error: (error) => {
          console.error('❌ Error deleting message:', error);
          // Remove locally if API fails
          this.messages = this.messages.filter(m => m._id !== messageId);
          this.totalCount = this.messages.length;
          this.unreadCount = this.messages.filter(m => !m.isRead).length;
          this.updateFilteredMessages();
        }
      });
    }
  }

  viewMessageDetails(message: Message) {
  this.selectedMessage = this.selectedMessage === message._id ? null : message._id;
  
  // FIXED: Mark as read when viewing details فقط لو مش مقروءة
  if (!message.isRead) {
    console.log('👀 Viewing unread message, marking as read...');
    this.markAsRead(message._id);
  } else {
    console.log('👀 Viewing already read message');
  }
}

  toggleReplyForm(messageId: string) {
    this.showReplyForm = this.showReplyForm === messageId ? null : messageId;
    this.replyMessage = '';
  }

  sendReply(message: Message) {
    if (!this.replyMessage.trim()) {
      alert('Please enter a reply message');
      return;
    }

    console.log('📤 Sending reply to:', message.email);
    console.log('Reply message:', this.replyMessage);

    alert(`Reply sent to ${message.email}`);
    
    this.showReplyForm = null;
    this.replyMessage = '';

    this.adminService.updateMessageStatus(message._id, 'responded', this.replyMessage).subscribe({
      next: (updatedMessage) => {
        const index = this.messages.findIndex(m => m._id === message._id);
        if (index !== -1) {
          this.messages[index] = updatedMessage;
          this.updateFilteredMessages();
        }
      },
      error: (error) => {
        console.error('❌ Error updating message status:', error);
      }
    });
  }

  getMessagePreview(message: string): string {
    return message.length > 150 ? message.substring(0, 150) + '...' : message;
  }

  refreshMessages() {
    this.loadMessages();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}