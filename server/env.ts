import { z } from 'zod';

const envSchema = z.object({
  // Existing env vars
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  
  // Stripe-related env vars
  STRIPE_SECRET_KEY: z.string(),
  STRIPE_PUBLISHABLE_KEY: z.string(),
  STRIPE_WEBHOOK_SECRET: z.string(),
  
  // Stripe price IDs for token packages
  STRIPE_PRICE_10_TOKENS: z.string(),
  STRIPE_PRICE_30_TOKENS: z.string(),
  STRIPE_PRICE_70_TOKENS: z.string(),
});

export const env = envSchema.parse(process.env);
