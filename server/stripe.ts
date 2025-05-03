import Stripe from 'stripe';
import { z } from 'zod';

// Load environment variables first
import * as dotenv from 'dotenv';
dotenv.config();

const envSchema = z.object({
  STRIPE_SECRET_KEY: z.string(),
  STRIPE_PRICE_10_TOKENS: z.string(),
  STRIPE_PRICE_30_TOKENS: z.string(),
  STRIPE_PRICE_70_TOKENS: z.string(),
});

const env = envSchema.parse(process.env);

// Initialize Stripe with your secret key
export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-04-30.basil',
});

// Token package configurations
export const STRIPE_PRICE_CONFIGS = {
  SMALL: {
    priceId: env.STRIPE_PRICE_10_TOKENS,
    tokens: 10,
    amount: 1000, // $10.00
  },
  MEDIUM: {
    priceId: env.STRIPE_PRICE_30_TOKENS,
    tokens: 30,
    amount: 2500, // $25.00
  },
  LARGE: {
    priceId: env.STRIPE_PRICE_70_TOKENS,
    tokens: 70,
    amount: 5000, // $50.00
  },
} as const;

// Helper to get tokens for a price ID
export function getTokensForPriceId(priceId: string): number | null {
  const config = Object.values(STRIPE_PRICE_CONFIGS).find(
    (config) => config.priceId === priceId
  );
  return config?.tokens ?? null;
}

// Webhook signature verification
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
) {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    webhookSecret
  );
}
