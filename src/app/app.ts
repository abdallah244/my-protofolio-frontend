import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { LoadingBarComponent } from './shared/components/loading-bar/loading-bar';
import { ThemeToggleComponent } from './shared/components/theme-toggle/theme-toggle';
import { IntroComponent } from './shared/components/intro/intro';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,  
    LoadingBarComponent,
    ThemeToggleComponent,
    IntroComponent
  ],
  template: `
    <app-loading-bar></app-loading-bar>
    <app-theme-toggle></app-theme-toggle>
    <app-intro></app-intro>
    <router-outlet></router-outlet>
  `,
  styleUrls: []
})
export class AppComponent implements OnInit {
  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    this.themeService.startLoading();
  }
}