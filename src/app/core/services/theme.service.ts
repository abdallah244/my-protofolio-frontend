import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private currentTheme = new BehaviorSubject<'dark' | 'light'>('dark');
  public currentTheme$ = this.currentTheme.asObservable();

  private loadingProgress = new BehaviorSubject<number>(0);
  public loadingProgress$ = this.loadingProgress.asObservable();

  constructor() {
    this.loadThemeFromStorage();
  }

  toggleTheme(): void {
    const newTheme = this.currentTheme.value === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  setTheme(theme: 'dark' | 'light'): void {
    this.currentTheme.next(theme);
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }

  private loadThemeFromStorage(): void {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light';
    if (savedTheme) {
      this.setTheme(savedTheme);
    }
  }

  // Loading methods
  startLoading(): void {
    this.loadingProgress.next(0);
    this.simulateLoading();
  }

  completeLoading(): void {
    this.loadingProgress.next(100);
    setTimeout(() => {
      this.loadingProgress.next(0);
    }, 500);
  }

  setProgress(progress: number): void {
    this.loadingProgress.next(Math.min(100, Math.max(0, progress)));
  }

  private simulateLoading(): void {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => this.completeLoading(), 300);
      }
      this.setProgress(progress);
    }, 200);
  }
}