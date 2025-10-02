import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unknown error occurred!';
      
      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = `Client Error: ${error.error.message}`;
      } else {
        // Server-side error
        errorMessage = error.error?.error || error.error?.message || error.message || `Server Error: ${error.status}`;
        
        // Handle specific HTTP status codes
        switch (error.status) {
          case 400:
            errorMessage = error.error?.details ? 
              `Validation Error: ${error.error.details.join(', ')}` : 
              error.error?.error || 'Bad Request';
            break;
          
          case 401:
            errorMessage = 'Unauthorized - Please login again';
            authService.logout();
            router.navigate(['/login']);
            break;
          
          case 403:
            errorMessage = 'Access Forbidden';
            router.navigate(['/home']);
            break;
          
          case 404:
            errorMessage = error.error?.error || 'Resource not found';
            break;
          
          case 500:
            errorMessage = 'Internal Server Error';
            break;
        }
      }

      // Log error for debugging
      console.error('HTTP Error:', {
        url: req.url,
        status: error.status,
        message: errorMessage,
        error: error.error
      });

      return throwError(() => new Error(errorMessage));
    })
  );
};