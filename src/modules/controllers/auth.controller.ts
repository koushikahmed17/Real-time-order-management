import { Request, Response } from "express";
import { asyncHandler } from "../../utils";
import { AuthService } from "../services/auth.service";

const authService = new AuthService();

export class AuthController {
  register = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);

    // Set access token in cookie
    res.cookie("accessToken", result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    // Set refresh token in cookie
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
    });
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body);

    // Set access token in cookie
    res.cookie("accessToken", result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    // Set refresh token in cookie
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      success: true,
      message: "Login successful",
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
    });
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.json({
      success: true,
      message: "Logged out successfully",
    });
  });

  getProfile = asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.getProfile(req.user!.id);
    res.json({
      success: true,
      data: {
        user,
      },
    });
  });
}
