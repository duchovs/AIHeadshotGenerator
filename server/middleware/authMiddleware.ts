import { type Request, type Response, type NextFunction } from 'express';
import passport from '../auth'; // Assuming passport is exported from auth.ts

// Helper middleware to check if user is authenticated (supports JWT and session)
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('jwt', { session: false }, (err: any, jwtUser: Express.User | false, info: any) => {
    if (err) {
      console.error('JWT Authentication Strategy Error:', err);
      return res.status(500).json({ message: 'Authentication error.' });
    }

    if (jwtUser) {
      req.user = jwtUser;
      return next();
    }

    // If JWT authentication failed, try session-based authentication
    if (req.isAuthenticated && req.isAuthenticated()) {
      return next();
    }

    // If both JWT and session authentication failed
    let finalMessage = 'Unauthorized. No valid session or token provided.';
    // Use specific JWT error if a token was attempted but failed (e.g., expired, invalid signature)
    // Exclude 'No auth token' because that means no JWT was present, and session also failed.
    if (info && info.message && info.message !== 'No auth token') {
        finalMessage = `Unauthorized: ${info.message}`;
    }
    return res.status(401).json({ error: finalMessage });

  })(req, res, next);
};
