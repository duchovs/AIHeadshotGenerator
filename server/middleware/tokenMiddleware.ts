import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { tokenTransactions, users, type User } from '../../shared/schema';
import { eq } from 'drizzle-orm';

export interface TokenRequest extends Request {
  user?: {
    id: number;
    username: string;
    tokens: number;
  };
}

export function checkTokenBalance(requiredTokens: number) {
  return async (req: TokenRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      // Get current user's token balance
      const user = await db.query.users.findFirst({
        where: eq(users.id, req.user.id),
        columns: { tokens: true }
      });

      if (!user || user.tokens < requiredTokens) {
        return res.status(402).json({
          error: 'Insufficient tokens',
          required: requiredTokens,
          current: user?.tokens ?? 0
        });
      }

      next();
    } catch (error) {
      console.error('Error checking token balance:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

export async function deductTokens(
  userId: number,
  tokenAmount: number,
  type: string,
  referenceId?: number,
  metadata?: Record<string, any>
) {
  return await db.transaction(async (tx) => {
    // Deduct tokens from user balance
    const currentUser = await tx.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { tokens: true }
    });

    await tx
      .update(users)
      .set({ tokens: (currentUser?.tokens ?? 0) - tokenAmount })
      .where(eq(users.id, userId));


    // Record the transaction
    await tx.insert(tokenTransactions).values({
      userId,
      type,
      referenceId,
      tokens: -tokenAmount,
      metadata
    });
  });
}

export async function addTokens(
  userId: number,
  tokenAmount: number,
  type: string,
  referenceId?: number,
  metadata?: Record<string, any>
) {
  return await db.transaction(async (tx) => {
    // Add tokens to user balance
    const user = await tx.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { tokens: true }
    });

    await tx
      .update(users)
      .set({ tokens: (user?.tokens ?? 0) + tokenAmount })
      .where(eq(users.id, userId));

    // Record the transaction
    await tx.insert(tokenTransactions).values({
      userId,
      type,
      referenceId,
      tokens: tokenAmount,
      metadata
    });
  });
}
