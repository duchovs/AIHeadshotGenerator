import express, { Request, Response } from 'express';
import type { TokenRequest } from '../middleware/tokenMiddleware';
import { stripe, STRIPE_PRICE_CONFIGS, getTokensForPriceId, constructWebhookEvent } from '../stripe';
import { db } from '../db';
import { payments, users } from '../../shared/schema';
import { addTokens } from '../middleware/tokenMiddleware';
import { z } from 'zod';

const envSchema = z.object({
  CLIENT_URL: z.string(),
  STRIPE_WEBHOOK_SECRET: z.string(),
});

const env = envSchema.parse(process.env);
import { eq } from 'drizzle-orm';

const router = express.Router();

// Middleware to ensure user is authenticated
const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Not authenticated' });
};

// Get available token packages
router.get('/packages', (_req, res) => {
  res.json(Object.values(STRIPE_PRICE_CONFIGS));
});

// Create a Stripe Checkout Session
router.post('/create-checkout-session', isAuthenticated, async (req: TokenRequest, res) => {
  try {
    const { priceId } = req.body;
    
    if (!priceId) {
      return res.status(400).json({ error: 'Price ID is required' });
    }

    const tokens = getTokensForPriceId(priceId);
    if (!tokens) {
      return res.status(400).json({ error: 'Invalid price ID' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.CLIENT_URL}/payment/cancel`,
      metadata: {
        userId: req.user.id.toString(),
        tokens: tokens.toString(),
      },
    });

    // Save the payment session
    await db.insert(payments).values({
      userId: req.user.id,
      stripePaymentId: session.id,
      amount: session.amount_total ?? 0,
      currency: session.currency ?? 'usd',
      status: 'pending',
      metadata: {
        tokens,
        priceId,
        sessionId: session.id,
      },
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Get user's token balance
router.get('/balance', isAuthenticated, async (req: any, res) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.user.id),
      columns: { tokens: true }
    });

    res.json({ balance: user?.tokens ?? 0 });
  } catch (error) {
    console.error('Error fetching token balance:', error);
    res.status(500).json({ error: 'Failed to fetch token balance' });
  }
});

export default router;
