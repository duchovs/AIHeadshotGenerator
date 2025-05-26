import 'express-session'; // Import this to ensure session types are also available if needed

declare global {
  namespace Express {
    export interface User {
      id: number;
      username: string;
      tokens: number;
      email?: string;
      googleId?: string;
      displayName?: string;
      profilePicture?: string;
      // Add any other custom properties your User object might have
    }
  }
}

// If you're using express-session, you might also want to augment the SessionData:
declare module 'express-session' {
  interface SessionData {
    passport?: {
      user?: Express.User; // Or a more specific user type if you have one for sessions
    };
    // Add other session properties if any
  }
}
