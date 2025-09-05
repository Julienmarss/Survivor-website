// backend/src/modules/auth/interfaces/user.interface.ts
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

  // Champs spécifiques aux utilisateurs normaux
  age?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  
  // Champs spécifiques aux startups
  companyName?: string;
  legalStatus?: string;
  address?: string;
  phone?: string;
  websiteUrl?: string;
  socialMediaUrl?: string;
  description?: string;
  sector?: string;
  maturity?: string;
  projectStatus?: string;
  needs?: string;
  foundingDate?: Date;
  teamSize?: number;
  
  // Champs spécifiques aux investisseurs
  investorType?: 'angel' | 'venture_capital' | 'private_equity' | 'corporate' | 'government';
  investmentRange?: {
    min: number;
    max: number;
  };
  preferredSectors?: string[];
  preferredStages?: string[];
  portfolioSize?: number;
  investmentExperience?: number; // années d'expérience
  linkedinUrl?: string;
  companyWebsite?: string;
  investmentCriteria?: string;
  geographicalPreferences?: string[];
}

export enum UserRole {
  ADMIN = 'admin',
  STARTUP = 'startup',
  INVESTOR = 'investor',
  USER = 'user', // Changé de VISITOR à USER pour plus de clarté
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
  role: UserRole;
  
  // Champs spécifiques selon le rôle
  age?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  
  // Startup fields
  companyName?: string;
  legalStatus?: string;
  address?: string;
  phone?: string;
  websiteUrl?: string;
  socialMediaUrl?: string;
  description?: string;
  sector?: string;
  maturity?: string;
  projectStatus?: string;
  needs?: string;
  foundingDate?: Date;
  teamSize?: number;
  
  // Investor fields
  investorType?: 'angel' | 'venture_capital' | 'private_equity' | 'corporate' | 'government';
  investmentRange?: {
    min: number;
    max: number;
  };
  preferredSectors?: string[];
  preferredStages?: string[];
  portfolioSize?: number;
  investmentExperience?: number;
  linkedinUrl?: string;
  companyWebsite?: string;
  investmentCriteria?: string;
  geographicalPreferences?: string[];
}