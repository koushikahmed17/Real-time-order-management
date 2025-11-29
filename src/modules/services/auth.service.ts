import bcrypt from "bcrypt";
import prisma from "../../prisma/client";
import { AppError } from "../../utils/errorHandler";
import {
  generateAccessToken,
  generateRefreshToken,
  TokenPayload,
} from "../../utils/jwt";
import { Role } from "@prisma/client";

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  role?: Role;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  async register(data: RegisterData): Promise<AuthResponse> {
    const { name, email, password, phone, address, role } = data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError("User with this email already exists", 409);
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: phone || null,
        address: address || null,
        role: role || Role.CUSTOMER,
      },
    });

    // Generate tokens
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return {
      accessToken,
      refreshToken,
    };
  }

  async login(data: LoginData): Promise<AuthResponse> {
    const { email, password } = data;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new AppError("Invalid email or password", 401);
    }

    // Generate tokens
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return {
      accessToken,
      refreshToken,
    };
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  }
}
