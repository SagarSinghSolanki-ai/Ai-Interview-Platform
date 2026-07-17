import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/api-error.js';

interface TokenPayload {
  id: string;
  email: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  // Generate Access Token (short-lived: 15 minutes)
  private static generateAccessToken(user: { id: string; email: string }): string {
    return jwt.sign({ id: user.id, email: user.email }, env.JWT_SECRET, {
      expiresIn: '15m',
    });
  }

  // Generate Refresh Token (long-lived: 7 days)
  private static generateRefreshToken(user: { id: string }): string {
    return jwt.sign({ id: user.id }, env.JWT_SECRET, {
      expiresIn: '7d',
    });
  }

  // Register a new user
  public static async register(name: string, email: string, password: string) {
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new ApiError(400, 'An account with this email already exists');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
      },
    });

    const tokens = this.generateAuthTokens(newUser);
    
    // Save refresh token to user model
    await prisma.user.update({
      where: { id: newUser.id },
      data: { refreshToken: tokens.refreshToken },
    });

    return {
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        createdAt: newUser.createdAt,
      },
      tokens,
    };
  }

  // Login an existing user
  public static async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const tokens = this.generateAuthTokens(user);

    // Save refresh token in database
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
      tokens,
    };
  }

  // Generate fresh tokens pair
  private static generateAuthTokens(user: { id: string; email: string }): AuthTokens {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);
    return { accessToken, refreshToken };
  }

  // Rotate tokens using a valid refresh token
  public static async refresh(token: string) {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string };
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      // Verify user exists and token matches database record
      if (!user || user.refreshToken !== token) {
        throw new ApiError(401, 'Invalid refresh token');
      }

      // Generate new token pair
      const tokens = this.generateAuthTokens(user);

      // Save new refresh token
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: tokens.refreshToken },
      });

      return tokens;
    } catch (error) {
      throw new ApiError(401, 'Invalid or expired refresh token');
    }
  }

  // Terminate session on logout
  public static async logout(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  // Retrieve current user info
  public static async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new ApiError(404, 'User profile not found');
    }

    return user;
  }
}
