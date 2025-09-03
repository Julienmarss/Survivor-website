export interface IUser {
  id?: string;
  uid?: string;
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  isEmailVerified?: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  STARTUP = 'startup',
  INVESTOR = 'investor',
  VISITOR = 'visitor'
}

export interface IAuthResponse {
  user: IUser;
  accessToken: string;
  refreshToken?: string;
}

export interface ILoginDto {
  email: string;
  password: string;
}

export interface IRegisterDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
}