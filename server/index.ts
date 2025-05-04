import * as dotenv from 'dotenv';
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import session from "express-session";
import passport from "./auth";
import pgSession from "connect-pg-simple";
import { pool, db } from "./db";
import { stripe } from './stripe';
import { eq } from 'drizzle-orm';
import { addTokens } from './middleware/tokenMiddleware';
import { payments } from '../shared/schema';

const app = express();

// Handle Stripe webhook route before body parsing middleware
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'] as string | undefined;
  if (!sig) {
    return res.status(400).json({ error: 'No signature header' });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const userId = parseInt(session.metadata.userId);
      const tokens = parseInt(session.metadata.tokens);
      
      if (!userId || !tokens) {
        console.error('Invalid session metadata:', session.metadata);
        return res.status(400).json({ error: 'Invalid session metadata' });
      }

      // Find the payment record
      const payment = await db.query.payments.findFirst({
        where: eq(payments.stripePaymentId, session.id)
      });

      if (!payment) {
        console.error('Payment not found for session:', session.id);
        return res.status(400).json({ error: 'Payment not found' });
      }

      // Check if payment was already processed
      if (payment.status === 'succeeded') {
        console.log('Payment already processed:', session.id);
        return res.json({ received: true });
      }

      try {
        // Add tokens to user's balance - we already have userId and tokens from session metadata

        // Use a transaction to ensure both the token addition and payment status update are atomic
        await db.transaction(async (tx) => {
          // Add tokens to user's balance and record the transaction
          await addTokens(
            payment.userId,
            tokens,
            'purchase',
            payment.id,
            { stripeSessionId: session.id }
          );

          // Update payment status
          await tx
            .update(payments)
            .set({ status: 'succeeded' })
            .where(eq(payments.id, payment.id));
        });

        console.log(`Successfully added ${tokens} tokens to user ${payment.userId}`);
      } catch (error) {
        console.error('Error processing payment:', error);
        return res.status(500).json({ error: 'Failed to process payment' });
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook error' });
  }
});

// Body parsing middleware for all other routes
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session middleware
const PgSessionStore = pgSession(session);
app.use(session({
  store: new PgSessionStore({
    pool,
    tableName: 'session'
  }),
  secret: process.env.SESSION_SECRET || 'headshot-ai-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    secure: process.env.NODE_ENV === 'production' && process.env.FORCE_SECURE_COOKIE === 'true'
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
