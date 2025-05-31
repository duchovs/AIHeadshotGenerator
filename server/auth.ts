import passport from 'passport';
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import { storage } from './storage';
import { db } from './db';
import { eq } from 'drizzle-orm';
import { users, type User } from '@shared/schema';
import { sendDiscordNotification } from './utils/discord';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import { generateAccessToken, generateRefreshToken, JwtPayload, JWT_EXPIRATION } from './utils/jwt';
import { env } from './env'; // For GOOGLE_CLIENT_ID

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

// Helper to transform database User to Express.User (strips null values)
export const sanitizeUser = (user: User): Express.User => ({
  id: user.id,
  username: user.username,
  tokens: user.tokens ?? 0, // Add tokens, defaulting to 0 if null/undefined
  email: user.email || undefined,
  googleId: user.googleId || undefined,
  displayName: user.displayName || undefined,
  profilePicture: user.profilePicture || undefined
});

// Google OAuth Strategy configuration
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback',
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
        return done(null, sanitizeUser(updatedUser || existingUser));
      }
      
      // Create a new user
      const username = profile.displayName.replace(/\s+/g, '_').toLowerCase();
      const email = profile.emails && profile.emails[0] ? profile.emails[0].value : '';
      
      const newUser = await storage.createUser({
        username,
        email,
        googleId: profile.id,
        displayName: profile.displayName,
        profilePicture: profile.photos?.[0]?.value
      });
      
      // Send Discord notification
      await sendDiscordNotification(`New user signed up: ${profile.displayName} (${email})`);

      return done(null, sanitizeUser(newUser));
    } catch (error) {
      return done(error as Error);
    }
  }
));

// Serialize user to session
passport.serializeUser((user: Express.User, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user ? sanitizeUser(user) : null);
  } catch (error) {
    done(error);
  }
});

// JWT Strategy Options
const jwtOptions: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: env.JWT_SECRET, // From your .env file
};

// JWT Strategy for protecting routes
passport.use(new JwtStrategy(jwtOptions, async (payload: JwtPayload, done) => {
  try {
    // The payload contains the decoded JWT payload (e.g., user ID, email)
    // You can use this to find the user in your database
    const user = await storage.getUser(payload.id);

    if (user) {
      const sanitized = sanitizeUser(user);
      return done(null, sanitized); // Attach sanitized user to req.user
    }
    return done(null, false); // User not found
  } catch (error) {
    return done(error, false);
  }
}));

export default passport;

// Function to handle Google Sign-In from mobile, verify token, and issue JWTs
export const handleGoogleMobileAuth = async (googleIdToken: string): Promise<{ accessToken: string; refreshToken: string; user: Express.User; expiresIn: number } | null> => {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: googleIdToken,
      audience: env.IOS_CLIENT_ID, // Specify the CLIENT_ID of the app that accesses the backend
    });
    const payload: TokenPayload | undefined = ticket.getPayload();

    if (!payload || !payload.sub || !payload.email) {
      console.error('Invalid Google ID token payload:', payload);
      return null;
    }

    let user = await storage.getUserByGoogleId(payload.sub);

    if (user) {
      // Optionally update user details if they've changed in Google profile
      const updatedFields: Partial<User> = {};
      if (payload.name && user.displayName !== payload.name) {
        updatedFields.displayName = payload.name;
      }
      if (payload.picture && user.profilePicture !== payload.picture) {
        updatedFields.profilePicture = payload.picture;
      }
      if (Object.keys(updatedFields).length > 0) {
        const updatedUser = await storage.updateUser(user.id, updatedFields);
        user = updatedUser || user; // Use updated user if successful
      }
    } else {
      // Create a new user if they don't exist
      const username = payload.name ? payload.name.replace(/\s+/g, '_').toLowerCase() : payload.email.split('@')[0];
      const newUserInput = {
        username,
        email: payload.email,
        googleId: payload.sub,
        displayName: payload.name || '',
        profilePicture: payload.picture || '',
        tokens: 0, // Default initial tokens
      };
      user = await storage.createUser(newUserInput);
      await sendDiscordNotification(`New user (mobile) signed up: ${user.displayName} (${user.email})`);
    }

    const sanitizedAppUser = sanitizeUser(user);
    const accessToken = generateAccessToken(sanitizedAppUser);
    const refreshToken = generateRefreshToken(sanitizedAppUser);

    return {
      accessToken,
      refreshToken,
      user: sanitizedAppUser,
      expiresIn: JWT_EXPIRATION,
    };

  } catch (error) {
    console.error('Error verifying Google ID token or processing user:', error);
    return null;
  }
};