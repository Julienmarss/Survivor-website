import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private users: { email: string; password: string }[] = [];

  constructor(private readonly jwtService: JwtService) {}

  async register(email: string, password: string) {
    const hashed = await bcrypt.hash(password, 10);
    this.users.push({ email, password: hashed });
    return { message: 'User registered' };
  }

  async login(email: string, password: string) {
    const user = this.users.find((u) => u.email === email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = { sub: email };
    return { access_token: this.jwtService.sign(payload) };
  }
}
