import jwt from 'jsonwebtoken';
import { env } from '../env'; // Assuming your env.ts exports JWT_SECRET and REFRESH_TOKEN_SECRET
import { User } from '@shared/schema'; // Assuming User type is available

// Ensure environment variables are set
if (!env.JWT_SECRET || !env.REFRESH_TOKEN_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET or REFRESH_TOKEN_SECRET is not defined in the environment variables.');
  process.exit(1);
}

const JWT_SECRET = env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = env.REFRESH_TOKEN_SECRET;

// Consider making these configurable via env vars as well
export const JWT_EXPIRATION = '1h'; // Access token expiration (e.g., 1 hour)
const REFRESH_TOKEN_EXPIRATION = '7d'; // Refresh token expiration (e.g., 7 days)

export interface JwtPayload {
  id: number;
  email: string;
  // Add any other essential, non-sensitive user data you want in the payload
}

export const generateAccessToken = (user: Express.User): string => {
  const payload: JwtPayload = {
    id: user.id,
    email: user.email || '', // Ensure email is present, or handle appropriately
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
};

export const generateRefreshToken = (user: Express.User): string => {
  const payload: JwtPayload = {
    id: user.id,
    email: user.email || '',
  };
  // Refresh tokens typically have a longer expiration time
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRATION });
};

export const verifyAccessToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    console.error('Invalid access token:', error);
    return null;
  }
};

export const verifyRefreshToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET) as JwtPayload;
  } catch (error) {
    console.error('Invalid refresh token:', error);
    return null;
  }
};
