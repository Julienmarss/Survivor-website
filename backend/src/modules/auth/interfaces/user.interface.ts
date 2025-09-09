// backend/src/modules/auth/interfaces/user.interface.ts - Version étendue
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
  
  // ✅ AJOUT : Champs spécifiques aux étudiants
  school?: string;
  level?: string; // Niveau d'études (Bac +1, +2, etc.)
  field?: string; // Domaine d'études
  motivation?: string;
  interests?: string[]; // Centres d'intérêt
  
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
  investmentExperience?: number;
  linkedinUrl?: string;
  companyWebsite?: string;
  investmentCriteria?: string;
  geographicalPreferences?: string[];
}

export enum UserRole {
  ADMIN = 'admin',
  STARTUP = 'startup',
  INVESTOR = 'investor',
  USER = 'user', // Pour les étudiants et autres utilisateurs
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
  
  // ✅ Student fields
  school?: string;
  level?: string;
  field?: string;
  motivation?: string;
  interests?: string[];
  
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