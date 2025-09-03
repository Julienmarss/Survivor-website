import { Injectable, Logger, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from './repositories/user.repository';
import { IUser, IAuthResponse, ILoginDto, IRegisterDto, UserRole } from './interfaces/user.interface';
import * as admin from 'firebase-admin';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: IRegisterDto): Promise<IAuthResponse> {
    try {
      this.logger.log(`Registering user: ${registerDto.email}`);
      
      const existingUser = await this.userRepository.findByEmail(registerDto.email);
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      const user = await this.userRepository.createUser({
        email: registerDto.email,
        password: registerDto.password,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        role: registerDto.role || UserRole.VISITOR,
      });

      const accessToken = this.generateAccessToken(user);
      this.logger.log(`User registered successfully: ${user.email}`);
      return {
        user: { ...user, password: undefined },
        accessToken,
      };
    } catch (error) {
      this.logger.error('Registration failed:', error);
      throw error;
    }
  }

  async login(loginDto: ILoginDto): Promise<IAuthResponse> {
    try {
      this.logger.log(`Login attempt for: ${loginDto.email}`);
      
      const user = await this.userRepository.findByEmail(loginDto.email);
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      await this.userRepository.updateLastLogin(user.id!);
      const accessToken = this.generateAccessToken(user);

      this.logger.log(`User logged in successfully: ${user.email}`);
      
      return {
        user: { ...user, password: undefined },
        accessToken,
      };
    } catch (error) {
      this.logger.error('Login failed:', error);
      throw error;
    }
  }

  async validateUser(userId: string): Promise<IUser | null> {
    try {
      return await this.userRepository.findById(userId);
    } catch (error) {
      this.logger.error(`Error validating user ${userId}:`, error);
      return null;
    }
  }

  async verifyFirebaseToken(token: string): Promise<IUser | null> {
    try {
      const decodedToken = await this.userRepository.verifyToken(token);
      const user = await this.userRepository.findByUid(decodedToken.uid);
      
      if (user) {
        await this.userRepository.updateLastLogin(user.id!);
      }
      
      return user;
    } catch (error) {
      this.logger.error('Firebase token verification failed:', error);
      throw new UnauthorizedException('Invalid Firebase token');
    }
  }

  async getAllUsers(limit: number = 20, pageToken?: string) {
    try {
      return await this.userRepository.getAllUsers(limit, pageToken);
    } catch (error) {
      this.logger.error('Error getting all users:', error);
      throw error;
    }
  }

  async updateUserRole(userId: string, role: UserRole): Promise<IUser> {
    try {
      return await this.userRepository.updateUser(userId, { role });
    } catch (error) {
      this.logger.error(`Error updating user role ${userId}:`, error);
      throw error;
    }
  }

  private generateAccessToken(user: IUser): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      uid: user.uid,
    };
    
    return this.jwtService.sign(payload);
  }
}
