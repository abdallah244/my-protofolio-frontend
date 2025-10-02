import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-loading-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-bar.html',
  styleUrls: ['./loading-bar.css']
})
export class LoadingBarComponent implements OnInit {
  progress = 0;
  isVisible = false;

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    this.themeService.loadingProgress$.subscribe(progress => {
      this.progress = progress;
      this.isVisible = progress > 0 && progress < 100;
    });
  }
}