import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-intro',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './intro.html',
  styleUrls: ['./intro.css']
})
export class IntroComponent implements OnInit {
  ngOnInit(): void {
    setTimeout(() => {
      const intro = document.querySelector('.intro-overlay');
      if (intro) {
        intro.remove();
      }
    }, 3500);
  }
}