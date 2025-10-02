import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ContactMessage {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface ContactResponse {
  success: boolean;
  message: string;
  data?: {
    _id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    status: string;
    createdAt: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private apiUrl = `${environment.apiUrl}/contact`;

  constructor(private http: HttpClient) {}

  sendMessage(messageData: ContactMessage): Observable<ContactResponse> {
    return this.http.post<ContactResponse>(`${this.apiUrl}/send`, messageData);
  }

  // Admin methods - FIXED: استخدام الـ admin routes الصحيحة
  getMessages(page: number = 1, limit: number = 10, status?: string): Observable<any> {
    let url = `${environment.apiUrl}/admin/messages?page=${page}&limit=${limit}`;
    if (status && status !== 'all') {
      url += `&status=${status}`;
    }
    return this.http.get<any>(url);
  }

  getMessage(id: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/admin/messages/${id}`);
  }

  updateMessage(id: string, updateData: any): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/admin/messages/${id}/status`, updateData);
  }

  deleteMessage(id: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/admin/messages/${id}`);
  }

  getMessageStats(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/admin/messages/stats/overview`);
  }
}