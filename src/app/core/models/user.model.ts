export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserCredentials {
  email: string;
  password: string;
}

export interface UserRegistration {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
}