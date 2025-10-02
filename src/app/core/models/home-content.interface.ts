export interface HomeContent {
  _id?: string;
  page: 'home';
  sections: {
    hero: {
      title: string;
      subtitle: string;
      description: string;
      badgeText: string;
    };
    stats: {
      projects: number;
      clients: number;
      technologies: number;
      experience: number;
    };
    about: {
      title: string;
      description: string;
    };
    contact: {
      title: string;
      description: string;
      email: string;
      phone: string;
      location: string;
    };
  };
  lastUpdatedBy?: string;
  lastUpdatedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  statusCode?: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}