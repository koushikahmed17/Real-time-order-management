import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key-change-in-production";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET + "-refresh";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    throw new Error("Invalid or expired access token");
  }
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    throw new Error("Invalid or expired refresh token");
  }
};

// Legacy function for backward compatibility
export const generateToken = generateAccessToken;
export const verifyToken = verifyAccessToken;

