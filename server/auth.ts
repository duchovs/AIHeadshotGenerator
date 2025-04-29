import passport from 'passport';
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import { storage } from './storage';
import { db } from './db';
import { eq } from 'drizzle-orm';
import { users, type User } from '@shared/schema';

// Google OAuth Strategy configuration
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackURL: '/auth/google/callback',
    scope: ['profile', 'email']
  },
  async (accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback) => {
    try {
      // Check if user exists with this Google ID
      const existingUser = await storage.getUserByGoogleId(profile.id);
      
      if (existingUser) {
        // Update user profile in case anything changed
        const updatedUser = await storage.updateUser(existingUser.id, {
          displayName: profile.displayName,
          profilePicture: profile.photos?.[0]?.value
        });
        return done(null, updatedUser || existingUser);
      }
      
      // Create a new user
      const username = `user_${profile.id.substring(0, 8)}`;
      const email = profile.emails && profile.emails[0] ? profile.emails[0].value : '';
      
      const newUser = await storage.createUser({
        username,
        email,
        googleId: profile.id,
        displayName: profile.displayName,
        profilePicture: profile.photos?.[0]?.value
      });
      
      return done(null, newUser);
    } catch (error) {
      return done(error as Error);
    }
  }
));

// Augment the Express session types
declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      email?: string;
      googleId?: string;
      displayName?: string;
      profilePicture?: string;
    }
  }
}

// Serialize user to session
passport.serializeUser((user: Express.User, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user || undefined);
  } catch (error) {
    done(error);
  }
});

export default passport;