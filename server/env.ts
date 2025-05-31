import { z } from 'zod';
import * as dotenv from 'dotenv';

// Load .env file first
dotenv.config();

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string(),
  
  // Existing env vars
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  CLIENT_URL: z.string().default('https://headshot.aismartsolution.ai'),
  
  // Stripe-related env vars
  STRIPE_SECRET_KEY: z.string(),
  STRIPE_PUBLISHABLE_KEY: z.string(),
  STRIPE_WEBHOOK_SECRET: z.string(),
  
  // Stripe price IDs for token packages
  STRIPE_PRICE_10_TOKENS: z.string(),
  STRIPE_PRICE_30_TOKENS: z.string(),
  STRIPE_PRICE_70_TOKENS: z.string(),

  // Resend
  RESEND_API_KEY: z.string(),
  
  // Discord
  DISCORD_WEBHOOK_URL: z.string().url(),

  // Google Auth
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(), // Already used by passport-google-oauth20, ensure it's here
  GOOGLE_CALLBACK_URL: z.string(), // Already used by passport-google-oauth20, ensure it's here

  // JWT Secrets
  JWT_SECRET: z.string(),
  REFRESH_TOKEN_SECRET: z.string(),

  // Base path
  BASE_PATH: z.string(),

  // iOS Client ID
  IOS_CLIENT_ID: z.string(),
});

export const env = envSchema.parse(process.env);
