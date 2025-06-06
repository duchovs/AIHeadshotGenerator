import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import stripeRoutes from './routes/stripe';
import { isAuthenticated } from './middleware/authMiddleware';
import { db } from './db';
import { sendModelCompletionEmail } from './resend';
import { eq, desc } from 'drizzle-orm';
import { uploadedPhotos } from '@shared/schema';
import { fileURLToPath } from 'url';
import AdmZip from 'adm-zip';
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { env } from './env'; // For STRIPE_PRICE_IDs and other env vars
import { deductTokens, checkTokenBalance, addTokens } from "./middleware/tokenMiddleware";
import type { TokenRequest } from "./middleware/tokenMiddleware";
import path from "path";
import { getStylePrompt } from './prompts';
import Replicate from "replicate";
import cors from 'cors';
import { sendDiscordNotification } from './utils/discord';

// ESM-compatible __dirname and __filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import fs from "fs";
import multer from "multer";
import passport, { handleGoogleMobileAuth, sanitizeUser } from "./auth";
import { generateAccessToken, verifyRefreshToken, JWT_EXPIRATION } from './utils/jwt';
import jwt from 'jsonwebtoken';
import {
  insertUploadedPhotoSchema,
  insertModelSchema,
  insertHeadshotSchema,
  trainModelSchema,
  generateHeadshotSchema,
  models, // Added import for models schema
  tokenTransactions, // Import for tokenTransactions schema
  type InsertDeletedHeadshot, // Added InsertDeletedHeadshot type
  type Json // Added Json type
} from "@shared/schema";
import { z } from "zod";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Configure multer for handling file uploads
// Create data directories for secure file storage
const dataDir = path.join(__dirname, '../data');
const uploadDir = path.join(dataDir, 'uploads');
const generatedDir = path.join(dataDir, 'generated');
fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(generatedDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, _file, cb) => {
      // Create user-specific directory
      const userId = req.user ? req.user.id.toString() : 'anonymous';
      const userDir = path.join(uploadDir, userId);
      fs.mkdirSync(userDir, { recursive: true });
      cb(null, userDir);
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
      cb(null, `${uniqueSuffix}-${file.originalname}`);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});


// Helper middleware to check if user is authenticated via JWT
export const authenticateJWT = (req: Request, res: Response, next: any) => {
  passport.authenticate('jwt', { session: false }, (err: any, user: Express.User | false, info: any) => {
    if (err) {
      console.error('JWT Authentication Error:', err);
      return res.status(500).json({ message: 'Internal server error during authentication.' });
    }
    if (!user) {
      // info might contain details like 'No auth token' or 'jwt expired'
      const message = info?.message || 'Unauthorized. Invalid or missing token.';
      console.warn('JWT Authentication Failed:', message, info);
      return res.status(401).json({ message });
    }
    req.user = user; // Forward the user to the next middleware/handler
    return next();
  })(req, res, next);
};

// Middleware to check if user owns the model
const isModelOwner = async (req: Request, res: Response, next: any) => {
  
  // Get the modelId from request body
  const { modelId } = req.body;
  
  if (!modelId) {
    return res.status(400).json({ error: 'No Model ID' });
  }
  
  try {
    // Query the database to check if the model belongs to the user
    const model = await db.query.models.findFirst({
      where: eq(models.id, modelId),
      columns: { userId: true }
    });
    
    // If model doesn't exist or doesn't belong to the current user
    if (!model || model.userId !== req.user?.id) {
      return res.status(403).json({ error: 'You do not have permission to use this model' });
    }
    
    // If all checks pass, proceed to the next middleware/route handler
    next();
  } catch (error) {
    console.error('Error checking model ownership:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper middleware to check for admin API key
const isAdmin = (req: Request, res: Response, next: any) => {
  console.log('Admin auth check - Headers:', JSON.stringify(req.headers));
  
  const authHeader = req.headers.authorization;
  const adminApiKey = process.env.ADMIN_API_KEY;
  
  if (!adminApiKey) {
    console.error('ADMIN_API_KEY not configured in environment variables');
    return res.status(500).json({ error: 'Server not configured for admin access' });
  }
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    console.log(`Admin auth check - Comparing token: ${token.substring(0, 10)}... with configured key: ${adminApiKey.substring(0, 10)}...`);
    
    if (token === adminApiKey) {
      console.log('Admin auth check - Authentication successful');
      // Add a mock user to the request for token deduction
      (req as any).user = { id: 1 }; // Use admin user ID
      return next();
    }
  }
  
  console.log('Admin auth check - Authentication failed');
  return res.status(401).json({ error: 'Unauthorized' });
};

// Backup polling mechanism in case webhook fails
async function pollTrainingStatus(trainingId: string, modelId: number): Promise<any> {
  let status = null;
  let retryCount = 0;
  const maxRetries = 120; // 1 hour maximum polling (30s * 120)

  while (retryCount < maxRetries) {
    const response = await replicate.trainings.get(trainingId);
    status = response.status;
    // Check if model is already updated (webhook might have succeeded)
    const model = await storage.getModel(modelId);
    if (!model) {
      throw new Error('Model not found');
    }
    if (model.status === 'completed' || model.status === 'failed' || model.status === 'canceled') {
      console.log('Model already updated by webhook');
      return response;
    }

    if (status === 'succeeded' || status === 'failed' || status === 'canceled') {
      // Return response immediately for any terminal state
      // Token refunds and model updates are handled by webhook
      return response;
    }

    retryCount++;
    // Wait for 30 seconds before polling again
    await new Promise(resolve => setTimeout(resolve, 30000));
  }

  // If we reach here, polling timed out
  console.error('Polling timed out after 1 hour');
  await storage.updateModel(modelId, {
    status: 'failed',
    completedAt: new Date(),
    error: 'Training status polling timed out after 1 hour'
  });
  return { status: 'failed', error: 'Polling timeout' };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // CORS Configuration
  const corsOptions = {
    origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
      // Replace with your frontend's actual origin(s) for production
      // For development, you can allow specific localhost ports or all origins (not recommended for production)
      const allowedOrigins = [
        'http://localhost:8081', // Common React dev port
        'http://10.10.100.65:8081', // Common Vite dev port
        'http://192.168.1.196:8081',
        // Add your frontend's deployed URL here for production
      ];
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.warn(`CORS: Request from origin ${origin} blocked.`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Specify allowed methods
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'], // Specify allowed headers
    credentials: true, // Important if your frontend needs to send cookies or Authorization headers
    optionsSuccessStatus: 200 // For legacy browser compatibility
  };

  // Example of applying CORS to a specific OPTIONS pre-flight request for all routes
  // This can be useful if you want to handle OPTIONS globally then apply more specific CORS for other methods
  // app.options('*', cors(corsOptions)); // Enable pre-flight across-the-board.

  // Apply CORS globally to all routes (if you want to allow all configured origins for all paths)
  // For path-specific CORS, apply `cors(corsOptions)` to individual routes or routers.
  // Example: app.use(cors(corsOptions)); // This would enable CORS for all routes based on corsOptions

  // Configure body parser to accept larger payloads
  app.use(express.json({limit: '50mb'}));
  app.use(express.urlencoded({limit: '50mb', extended: true}));
  // Webhook endpoint for Replicate training completion
  app.post('/api/webhooks/training-complete', async (req, res) => {
    const training = req.body;
    
    // Extract percentage from logs, but only from most recent lines
    let progress = 0;
    if (training.logs) {
      // Get only the last 20 lines (or fewer if there are less than 20)
      const logLines = training.logs.split('\n');
      const recentLines = logLines.slice(Math.max(0, logLines.length - 20));
      
      // Process only these recent lines
      for (const line of recentLines) {
        if (line.includes('flux_train_replicate')) {
          const match = line.match(/(\d+)%/);
          if (match) {
            progress = parseInt(match[1], 10);
            break;
          }
        }
      }
    }

    try {
      // Extract model ID from the training metadata or custom field
      const parsed = new URL(training.webhook);
      const modelIdParam = parsed.searchParams.get('modelId');
      if (!modelIdParam) {
        throw new Error('Missing modelId in webhook URL');
      }
      const modelId = parseInt(modelIdParam, 10);

      // Get the model to find the user for refund
      const model = await storage.getModel(modelId);
      if (!model) {
        throw new Error('Model not found');
      }

      // update progress in models table
      await storage.updateModel(modelId, {
        progress: progress
      });

      switch (training.status) {
        // DO NOT CHANGE case 'succeeded':
        case 'succeeded':
          const trainingId = model.replicateTrainingId;
          if (!trainingId) {
            throw new Error('Training ID not found');
          }
          const response = await replicate.trainings.get(trainingId);
          await storage.updateModel(modelId, {
            status: 'completed',
            replicateVersionId: response.output?.version,
            completedAt: new Date()
          });
          // Get user email and send completion notification
          const completedUser = await storage.getUser(model.userId || 0);
          if (completedUser?.email) {
            await sendModelCompletionEmail(completedUser.email, modelId);
          }
          break;

        case 'failed':
        case 'canceled':
          // Refund the tokens
          const failedUser = await storage.getUser(model.userId || 0);
          if (failedUser) {
            await storage.updateUser(failedUser.id, {
              tokens: (failedUser.tokens || 0) + 6 // Refund training cost
            });
          }
          
          await storage.updateModel(modelId, {
            status: training.status,
            completedAt: new Date(),
            error: training.status === 'canceled' 
              ? 'Training was canceled - tokens refunded'
              : `Training failed: ${training.error ? String(training.error) : 'Unknown error'} - tokens refunded`
          });
          break;
      }

      res.status(200).json({ message: 'Webhook processed successfully' });
    } catch (error) {
      console.error('Error processing training webhook:', error);
      res.status(500).json({ error: 'Error processing webhook' });
    }
  });

  // Stripe routes
  app.use('/api/stripe', stripeRoutes);
  // Auth routes

  // Mobile Google Sign-In (JWT based)
  app.post('/api/auth/google/mobile', async (req: Request, res: Response) => {
    const { googleIdToken } = req.body;

    if (!googleIdToken || typeof googleIdToken !== 'string') {
      return res.status(400).json({ message: 'Google ID token is required.' });
    }

    try {
      const authResult = await handleGoogleMobileAuth(googleIdToken);
      if (authResult) {
        res.json({
          message: 'Authentication successful.',
          accessToken: authResult.accessToken,
          refreshToken: authResult.refreshToken,
          user: authResult.user,
          expiresIn: authResult.expiresIn, // Add expiresIn here
        });
      } else {
        res.status(401).json({ message: 'Authentication failed. Invalid Google ID token or user processing error.' });
      }
    } catch (error) {
      console.error('Error in /api/auth/google/mobile:', error);
      res.status(500).json({ message: 'Internal server error during mobile authentication.' });
    }
  });

  // JWT Refresh Token Endpoint
  app.post('/api/auth/refresh', async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken || typeof refreshToken !== 'string') {
      return res.status(400).json({ message: 'Refresh token is required.' });
    }

    try {
      const decoded = verifyRefreshToken(refreshToken);
      if (!decoded || !decoded.id) {
        return res.status(401).json({ message: 'Invalid or expired refresh token.' });
      }

      // Optional: Check if user still exists and is active in DB
      const user = await storage.getUser(decoded.id);
      if (!user) {
        return res.status(401).json({ message: 'User not found for refresh token.' });
      }

      const sanitizedUser = sanitizeUser(user); // We need Express.User type for generateAccessToken
      const newAccessToken = generateAccessToken(sanitizedUser);

      res.json({
        accessToken: newAccessToken,
        message: 'Access token refreshed successfully.',
        expiresIn: JWT_EXPIRATION,
      });
    } catch (error) {
      console.error('Error in /api/auth/refresh:', error);
      // Differentiate between verification errors and other errors if needed
      if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({ message: 'Invalid or expired refresh token.' });
      }
      res.status(500).json({ message: 'Internal server error during token refresh.' });
    }
  });

  app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  app.get('/auth/google/callback',
    passport.authenticate('google', {
      successRedirect: '/upload',
      failureRedirect: '/login'
    })
  );

  // Get current user info
  app.get('/api/auth/user', (req, res) => {
    if (req.isAuthenticated()) {
      if (req.user.id !== 5) sendDiscordNotification(`User ${req.user.displayName} just logged in...`);
      res.json({
        isAuthenticated: true,
        user: req.user
      });
    } else {
      res.json({
        isAuthenticated: false,
        user: null
      });
    }
  });

  // Logout route
  app.get('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ message: 'Error logging out' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });
  // API routes for photo uploads
  app.get('/api/photos/zip/:userId', async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId;
      const userPhotos = await db.query.uploadedPhotos.findMany({
        where: eq(uploadedPhotos.userId, parseInt(userId))
      });

      if (!userPhotos.length) {
        return res.status(404).json({ error: 'No photos found for user' });
      }

      const zip = new AdmZip();
      
      for (const photo of userPhotos) {
        zip.addLocalFile(photo.path);
      }

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename=photos.zip`);
      
      const zipBuffer = zip.toBuffer();
      res.send(zipBuffer);
    } catch (error) {
      console.error('Error creating zip:', error);
      res.status(500).json({ error: 'Failed to create zip file' });
    }
  });

  app.post('/api/uploads', isAuthenticated, (req, res, next) => {
    //console.log('Request headers:', req.headers);
    //console.log('Request body:', req.body);
    upload.array('photos', 20)(req, res, (err) => {
      if (err) {
        console.error('Multer error: Too many photos', err);
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  }, async (req: Request, res: Response) => {
    try {
      if (!req.files || !Array.isArray(req.files)) {
        return res.status(400).json({ message: 'No files uploaded' });
      }

      const uploadedFiles = [];

      for (const file of req.files) {
        // Use zod schema to validate input
        const photoData = insertUploadedPhotoSchema.parse({
          userId: req.user?.id || 1,
          filename: file.originalname,
          fileSize: file.size,
          path: file.path
        });

        const uploadedPhoto = await storage.createUploadedPhoto(photoData);
        uploadedFiles.push(uploadedPhoto);
      }

      res.status(200).json(uploadedFiles);
    } catch (error) {
      console.error('Upload error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid upload data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to upload photos' });
    }
  });

  // Get all uploaded photos
  app.get('/api/uploads', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id || 1;
      const photos = await storage.getUploadedPhotosByUserId(userId);
      res.status(200).json(photos);
    } catch (error) {
      console.error('Error fetching uploads:', error);
      res.status(500).json({ message: 'Failed to fetch uploaded photos' });
    }
  });

  // Delete an uploaded photo
  // Mobile In-App Purchase Endpoint for Tokens
  app.post('/api/tokens/purchase/mobile', authenticateJWT, async (req: Request, res: Response) => {
    // Ensure req.user is populated by authenticateJWT
    if (!req.user || typeof req.user.id !== 'number') {
      return res.status(401).json({ message: 'Unauthorized. User not found in token.' });
    }

    const { paymentToken, packageId, provider } = req.body;

    // Basic validation
    if (!paymentToken || !packageId || !provider) {
      return res.status(400).json({ message: 'Missing paymentToken, packageId, or provider.' });
    }

    // TODO: Implement actual payment verification with Apple/Google Pay SDKs/APIs
    // This is a placeholder for payment verification logic.
    // In a real implementation, you would send the paymentToken to Apple/Google for verification.
    // For now, we'll assume payment is successful if a token is provided.
    console.log(`Received mobile purchase request: User ID ${req.user.id}, Package ID ${packageId}, Provider ${provider}`);
    const MOCK_PAYMENT_VERIFIED = true; // Placeholder

    if (!MOCK_PAYMENT_VERIFIED) {
      return res.status(402).json({ message: 'Payment verification failed.' });
    }

    // Determine tokens to add based on packageId
    // This should align with your STRIPE_PRICE_CONFIGS or a new mobile package config
    let tokensToAdd = 0;
    switch (packageId) {
      case env.STRIPE_PRICE_10_TOKENS: // Assuming packageId might be the Stripe Price ID or a mobile-specific one
        tokensToAdd = 10;
        break;
      case env.STRIPE_PRICE_30_TOKENS:
        tokensToAdd = 30;
        break;
      case env.STRIPE_PRICE_70_TOKENS:
        tokensToAdd = 70;
        break;
      // Add more cases for mobile-specific packages if they differ
      default:
        return res.status(400).json({ message: 'Invalid packageId.' });
    }

    try {
      await addTokens(req.user.id, tokensToAdd, 'mobile_purchase', packageId);
      const updatedUser = await storage.getUser(req.user.id);
      res.json({
        message: 'Tokens purchased successfully.',
        tokensAdded: tokensToAdd,
        newBalance: updatedUser?.tokens ?? req.user.tokens, // Use updated balance if available
        user: sanitizeUser(updatedUser!) // Send back updated user
      });
    } catch (error) {
      console.error('Error adding tokens after mobile purchase:', error);
      res.status(500).json({ message: 'Failed to update token balance after purchase.' });
    }
  });

  // Secure file serving endpoints
  const serveSecureFile = async (req: Request, res: Response, filePath: string, ownerId: number) => {
    // Check if user owns the file
    if (!req.user || req.user.id !== ownerId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Serve the file
    res.sendFile(filePath);
  };

  // Serve uploaded photo previews
  app.get('/api/uploads/:id/preview', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const photoId = parseInt(req.params.id);
      if (isNaN(photoId)) {
        return res.status(400).json({ message: 'Invalid photo ID' });
      }

      const photo = await storage.getUploadedPhoto(photoId);
      if (!photo || !photo.path) {
        return res.status(404).json({ message: 'Photo not found' });
      }

      if (!photo.path || typeof photo.userId !== 'number') {
        return res.status(500).json({ message: 'Photo data is incomplete or invalid' });
      }
      await serveSecureFile(req, res, photo.path, photo.userId);
    } catch (error) {
      console.error('Error serving photo:', error);
      res.status(500).json({ message: 'Failed to serve photo' });
    }
  });

  // Serve generated headshots
  app.get('/api/headshots/:id/image', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const headshotId = parseInt(req.params.id);
      if (isNaN(headshotId)) {
        return res.status(400).json({ message: 'Invalid headshot ID' });
      }

      const headshot = await storage.getHeadshot(headshotId);
      if (!headshot) {
        return res.status(404).json({ message: 'Headshot not found' });
      }

      const file_path = headshot.filePath;

      if (!file_path || typeof headshot.userId !== 'number') {
        return res.status(500).json({ message: 'Headshot data is incomplete or invalid' });
      }
      await serveSecureFile(req, res, file_path, headshot.userId);
    } catch (error) {
      console.error('Error serving headshot:', error);
      res.status(500).json({ message: 'Failed to serve headshot' });
    }
  });

  app.delete('/api/uploads/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }

      const photo = await storage.getUploadedPhoto(id);
      if (!photo) {
        return res.status(404).json({ message: 'Photo not found' });
      }

      // Delete file from filesystem
      try {
        fs.unlinkSync(photo.path);
      } catch (err) {
        console.error('Error deleting file:', err);
      }

      await storage.deleteUploadedPhoto(id);
      res.status(200).json({ message: 'Photo deleted successfully' });
    } catch (error) {
      console.error('Error deleting photo:', error);
      res.status(500).json({ message: 'Failed to delete photo' });
    }
  });

  // Train a model using Replicate API
  // NOTE: For TokenRequest to work seamlessly, the global Express.User type should be augmented to include 'tokens: number'.
  app.post('/api/models/train', isAuthenticated, checkTokenBalance(6), async (req: Request, res: Response) => {
    const tokenReq = req as TokenRequest; // Cast to TokenRequest for internal use
    try {
      const { photoIds } = trainModelSchema.parse(req.body);
      
      if (!process.env.REPLICATE_API_TOKEN) {
        return res.status(500).json({ message: 'Replicate API token not configured' });
      }

      // Get uploaded photos
      const photos = await Promise.all(
        photoIds.map(id => storage.getUploadedPhoto(id))
      );
      
      const validPhotos = photos.filter(photo => photo !== undefined) as typeof photos[0][];
      
      if (validPhotos.length === 0) {
        return res.status(400).json({ message: 'No valid photos provided' });
      }

      if (!tokenReq.user) {
        return res.status(401).json({ error: 'Unauthorized - user not found in token request' });
      }
      // Use tokenReq.user.id which is asserted to exist and be of the correct type by isAuthenticated and TokenRequest structure
      const user = await storage.getUser(tokenReq.user.id);
      let new_model;

      // get model if already created
      const username = user?.username?.toString() || '';
      console.log('checking for model created for:', username);
      
      try {
        new_model = await replicate.models.get('duchovs', username);
        console.log('model exists:', new_model.name);
      } catch (getError: any) {
        console.log('get model error details:', {
          error: getError,
          status: getError.status,
          response: getError.response,
          responseStatus: getError.response?.status,
          message: getError.message
        });
        
        // Check both error.status and error.response.status for 404
        if (getError.status === 404 || getError.response?.status === 404) {
          // model does not exist, so create it
          console.log('model not found... creating new model for:', username);
          new_model = await replicate.models.create('duchovs', username, {
            visibility: 'private' as 'private',
            hardware: 'gpu-a100-large'
          });
          console.log('new model created:', new_model.name);
        } else {
          throw new Error(`Failed to get/create model: ${getError.message}`);
        }
      }

      // Create model entry in the database
      const model = await storage.createModel({
      userId: tokenReq.user.id, // tokenReq.user is checked by isAuthenticated and preceding 'if (!tokenReq.user)'
      replicateModelId: new_model?.name || '',
      status: 'training'
      });
      
      if (!tokenReq.user) { // Check if tokenReq.user itself is defined
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Deduct 6 tokens for model training
      await deductTokens(
        tokenReq.user.id, // Use id from tokenReq.user
        6,
        'train_model',
        model.id,
        { action: 'train' }
      );

      // Initialize training process
      const training = await replicate.trainings.create(
        "ostris",
        "flux-dev-lora-trainer",
        "c6e78d2501e8088876e99ef21e4460d0dc121af7a4b786b9a4c2d75c620e300d",
        {
          // create a model on Replicate that will be the destination for the trained version.
          destination: 'duchovs/' + model.replicateModelId as `${string}/${string}`, // Asserting format for Replicate API
          webhook: `https://${req.get('host')}/api/webhooks/training-complete?modelId=${model.id}`,
          webhook_events_filter: ["completed", "logs"], // 'completed' webhook also contains: 'failed', 'canceled'
          input: {
            steps: 2000,
            lora_rank: 20,
            optimizer: "adamw8bit",
            batch_size: 1,
            resolution: "512,768,1024",
            autocaption: true,
            input_images: `${req.protocol}://${req.get('host')}/api/photos/zip/${tokenReq.user.id}`, // user is checked, id is number
            trigger_word: "TOK",
            learning_rate: 0.0004,
            wandb_project: "flux_train_replicate",
            wandb_save_interval: 100,
            caption_dropout_rate: 0.05,
            cache_latents_to_disk: false,
            wandb_sample_interval: 100,
            gradient_checkpointing: false
          },
        }
      );
      
      // send immediate response and start background polling as backup
      res.status(200).json({ id: model.id, status: 'training', message: 'Model training started' });
      void storage.updateModel(model.id, {
        replicateTrainingId: training.id
      });
      void pollTrainingStatus(training.id, model.id).then(response => {
        if (response.status === 'failed') {
          console.error('Training failed:', response.error);
          
          // Refund tokens if user exists and tokens were deducted
          if (tokenReq.user) {
            try {
              void addTokens(
                tokenReq.user.id,
                6, // Refund the 6 tokens that were deducted
                'training_failed_refund',
                undefined,
                { error: response.error || 'Unknown error occurred during training' }
              );
              console.log(`Refunded 6 tokens to user ${tokenReq.user.id} due to training failure`);
            } catch (refundError) {
              console.error('Failed to refund tokens:', refundError);
              // Continue with error response even if refund fails
            }
          }
          
          // Update the model with the failure status and error
          void storage.updateModel(model.id, {
            status: 'failed',
            completedAt: new Date(),
            error: String(response.error) || 'Unknown error occurred during training'
          });
        }
      }).catch(err => {
        console.error('Polling error:', err);
        // Update model with error on polling failure
        void storage.updateModel(model.id, {
          status: 'failed',
          completedAt: new Date(),
          error: 'Failed to check training status: ' + String(err)
        });
      });
    } catch (error) {
      console.error('Error training model:', error);
      
      // Refund tokens if user exists and tokens were deducted
      if (tokenReq.user) {
        try {
          await addTokens(
            tokenReq.user.id,
            6, // Refund the 6 tokens that were deducted
            'training_failed_refund',
            undefined,
            { error: error instanceof Error ? error.message : String(error) }
          );
          console.log(`Refunded 6 tokens to user ${tokenReq.user.id} due to training failure`);
        } catch (refundError) {
          console.error('Failed to refund tokens:', refundError);
          // Continue with error response even if refund fails
        }
      }
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid training data', 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ 
        message: 'Failed to start model training',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  });

  // Get model training status
  app.get('/api/models/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Prevent caching
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid model ID' });
      }

      const model = await storage.getModel(id);
      if (!model) {
        return res.status(404).json({ message: 'Model not found' });
      }
      
      // Always include status and message
      const response = {
        ...model,
        message: model.status === 'failed' ? (model.error || 'Training failed') : 
                model.status === 'training' ? 'Model is training...' : 
                model.status === 'completed' ? 'Training completed successfully' : undefined
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Error fetching model:', error);
      res.status(500).json({ message: 'Failed to fetch model information' });
    }
  });

  // Get all token transactions for a user
  app.get('/api/tokens/transactions/:id', cors(corsOptions), isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Validate userId
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      // Check if the requesting user has permission to access these transactions
      if (!req.user || req.user.id !== userId) {
        return res.status(403).json({ message: 'Unauthorized to access these transactions' });
      }
      
      // Query the database for all transactions for this user
      const transactions = await db.query.tokenTransactions.findMany({
        where: eq(tokenTransactions.userId, userId),
        orderBy: [desc(tokenTransactions.createdAt)]
      });
      
      res.status(200).json(transactions);
    } catch (error) {
      console.error('Error fetching token transactions:', error);
      res.status(500).json({ message: 'Failed to fetch token transactions' });
    }
  });

  // Get all models for a user
  app.get('/api/models', cors(corsOptions), isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user || typeof req.user.id !== 'number') {
        return res.status(401).json({ message: 'Unauthorized or user ID missing' });
      }
      const userId = req.user.id;
      const models = await storage.getModelsByUserId(userId);
      res.status(200).json(models);
    } catch (error) {
      console.error('Error fetching models:', error);
      res.status(500).json({ message: 'Failed to fetch models' });
    }
  });

  // Generate a headshot using a trained model
  // NOTE: For TokenRequest to work seamlessly, the global Express.User type should be augmented to include 'tokens: number'.
  app.post('/api/headshots/generate', isAuthenticated, isModelOwner, checkTokenBalance(1), async (req: Request, res: Response) => {
    const tokenReq = req as TokenRequest; // Cast to TokenRequest for internal use
    try {
      const { modelId, style, prompt, gender } = generateHeadshotSchema.parse(req.body);
      
      if (!process.env.REPLICATE_API_TOKEN) {
        return res.status(500).json({ message: 'Replicate API token not configured' });
      }

      const model = await storage.getModel(modelId);
      if (!model) {
        return res.status(404).json({ message: 'Model not found' });
      }

      if (model.status !== 'completed') {
        return res.status(400).json({ message: 'Model is not ready for generation' });
      }

      // Get the base style prompt
      const stylePrompt = getStylePrompt(style, gender, prompt);
      
      console.log('Final prompt:', stylePrompt);

      const modelIdentifier = `duchovs/${model.replicateModelId}:${model.replicateVersionId}` as const;
      console.log('Using model:', modelIdentifier);
      if (!tokenReq.user) { // Check if tokenReq.user itself is defined
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Deduct 1 token for headshot generation
      if (!tokenReq.user) { // Explicit check before accessing tokenReq.user.id
        return res.status(401).json({ error: 'Unauthorized - user session error before deducting tokens' });
      }
      await deductTokens(
        tokenReq.user.id, // Use id from tokenReq.user
        1,
        'generate_headshot',
        undefined,
        { style, gender, prompt }
      );

      const output = await replicate.run(
        modelIdentifier,
        {
          input: {
            prompt: stylePrompt,
            model: "dev",
            go_fast: false,
            lora_scale: 1,
            megapixels: "1",
            num_outputs: 1,
            aspect_ratio: "1:1",
            output_format: "png",
            guidance_scale: 3,
            output_quality: 80,
            prompt_strength: 0.8,
            extra_lora_scale: 1,
            num_inference_steps: 28
          }
        }
      );

      // imageUrl on replicate is temporary for an hour so we need to download the image
      const replicateOutput = output as any[]; // Assuming output is an array
      if (!replicateOutput || replicateOutput.length === 0 || typeof replicateOutput[0]?.url !== 'function') {
        console.error('Invalid output from Replicate:', output);
        return res.status(500).json({ message: 'Failed to get image URL from generation service' });
      }
      const imageUrl = String(replicateOutput[0].url()).replace(/^"|"$/g, '');
      console.log(imageUrl)
      // Store the generated headshot
      if (!tokenReq.user) { // Explicit check before accessing tokenReq.user.id
        return res.status(401).json({ error: 'Unauthorized - user session error before creating headshot' });
      }
      const headshot = await storage.createHeadshot({
        userId: tokenReq.user.id, // tokenReq.user is checked
        modelId,
        style,
        imageUrl,
        replicatePredictionId: `prediction_${Date.now()}`,
        prompt: stylePrompt,
        metadata: {},
        favorite: false,
        gender,
      });

      // Save the generated image in user's directory
      const userDir = path.join(generatedDir, tokenReq.user ? tokenReq.user.id.toString() : 'anonymous');
      fs.mkdirSync(userDir, { recursive: true });
      const imgFilename = `headshot_${headshot.id || Date.now()}.png`;
      const imgPath = path.join(userDir, imgFilename);
      
      // Download the image data
      const response = await fetch(imageUrl);
      const imageBuffer = await response.arrayBuffer();
      fs.writeFileSync(imgPath, Buffer.from(imageBuffer));

      // Update the headshot with the file path
      const updatedHeadshot = await storage.updateHeadshot(headshot.id, {
        imageUrl: imageUrl,
        filePath: imgPath
      });

      res.status(200).json(updatedHeadshot);
    }
     catch (error) {
      console.error('Error generating headshot:', error);

      // Refund 1 token on failure
      const userId = req.user?.id;
      if (userId) {
        const user = await storage.getUser(userId);
        if (user) {
          await storage.updateUser(user.id, {
            tokens: (user.tokens || 0) + 1 // Refund 1 token for failed generation
          });
        }
      }

      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid generation data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to generate headshot - token refunded' });
    }
  });

  // Get all headshots for a user
  app.get('/api/headshots', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id || 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      const headshots = await storage.getHeadshotsByUserId(userId, limit);
      res.status(200).json(headshots);
    } catch (error) {
      console.error('Error fetching headshots:', error);
      res.status(500).json({ message: 'Failed to fetch headshots' });
    }
  });

  // Admin endpoint for generating headshots (uses API key authentication)
  app.post('/api/admin/headshots/generate', isAdmin, async (req: Request, res: Response) => {
    try {
      const { modelId, style, prompt, gender } = generateHeadshotSchema.parse(req.body);
      
      if (!process.env.REPLICATE_API_TOKEN) {
        return res.status(500).json({ message: 'Replicate API token not configured' });
      }

      // For admin requests, let's log the model ID and attempt to find it
      console.log(`Admin API - Looking for model ID: ${modelId}`);
      
      // Try to find the requested model
      let modelToUse = await storage.getModel(modelId);
      
      // Log the model details if found
      if (modelToUse) {
        console.log(`Admin API - Found model: ${JSON.stringify({
          id: modelToUse.id,
          status: modelToUse.status,
          replicateModelId: modelToUse.replicateModelId,
          replicateVersionId: modelToUse.replicateVersionId
        })}`);
      } else {
        console.log(`Admin API - Model with ID ${modelId} not found`);
      }
      
      // If model not found or not completed, use a hardcoded default model for admin requests
      if (!modelToUse || modelToUse.status !== 'completed') {
        console.log(`Admin API - Model ${modelId} not found or not ready, using hardcoded default model`);
        
        // Create a mock model with known working values
        modelToUse = {
          id: 999, // Mock ID
          userId: 1,
          replicateModelId: 'headshot-generator',
          replicateVersionId: 'a927b6c9c7a8dc2c10f7e6f0d5a4545c7c999363def37d2e8d32d134962f0987',
          status: 'completed',
          createdAt: new Date(),
          completedAt: new Date(),
          replicateTrainingId: '',
          progress: 100,
          error: null
        };
        
        console.log(`Admin API - Using hardcoded default model`);
      }

      // Get the base style prompt
      const stylePrompt = getStylePrompt(style, gender, prompt);
      
      console.log('Admin API - Final prompt:', stylePrompt);

      const modelIdentifier = `duchovs/${modelToUse.replicateModelId}:${modelToUse.replicateVersionId}` as const;
      console.log('Admin API - Using model:', modelIdentifier);
      
      // Note: For admin API, we don't deduct tokens
      
      const output = await replicate.run(
        modelIdentifier,
        {
          input: {
            prompt: stylePrompt,
            model: "dev",
            go_fast: false,
            lora_scale: 1,
            megapixels: "1",
            num_outputs: 1,
            aspect_ratio: "1:1",
            output_format: "png",
            guidance_scale: 3,
            output_quality: 80,
            prompt_strength: 0.8,
            extra_lora_scale: 1,
            num_inference_steps: 28
          }
        }
      );

      if (!output || !Array.isArray(output) || output.length === 0) {
        console.log('Admin API - No valid output from Replicate:', output);
        
        // For testing purposes, return a mock image URL from a public image hosting service
        const mockImageUrl = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1000&auto=format&fit=crop";
        console.log('Admin API - Using mock image URL:', mockImageUrl);
        return res.json({ imageUrl: mockImageUrl });
      }

      // Return the generated image URL
      const imageUrl = output[0];
      console.log('Admin API - Generated image URL:', imageUrl);
      console.log('Admin API - Full output:', JSON.stringify(output));
      res.json({ imageUrl });
    } catch (error) {
      console.error('Error generating headshot:', error);
      res.status(500).json({ message: 'Failed to generate headshot' });
    }
  });

  // Get a specific headshot
  app.get('/api/headshots/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid headshot ID' });
      }

      const headshot = await storage.getHeadshot(id);
      if (!headshot) {
        return res.status(404).json({ message: 'Headshot not found' });
      }

      res.status(200).json(headshot);
    } catch (error) {
      console.error('Error fetching headshot:', error);
      res.status(500).json({ message: 'Failed to fetch headshot' });
    }
  });

  // Get all example headshots
  app.get('/api/examples', cors(corsOptions), async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const headshots = await storage.getExampleHeadshots(limit);
      res.status(200).json(headshots);
    } catch (error) {
      console.error('Error fetching example headshots:', error);
      res.status(500).json({ message: 'Failed to fetch example headshots' });
    }
  });
  
  // Get example headshots
  app.get('/api/examples/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid headshot ID' });
      }

      const headshot = await storage.getExampleHeadshot(id);
      if (!headshot) {
        return res.status(404).json({ message: 'Headshot not found' });
      }

      res.status(200).json(headshot);
    } catch (error) {
      console.error('Error fetching headshot:', error);
      res.status(500).json({ message: 'Failed to fetch headshot' });
    }
  });

  // Toggle favorite status of a headshot
  app.patch('/api/headshots/:id/favorite', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid headshot ID' });
      }

      const headshot = await storage.getHeadshot(id);
      if (!headshot) {
        return res.status(404).json({ message: 'Headshot not found' });
      }

      const updatedHeadshot = await storage.updateHeadshot(id, {
        favorite: !headshot.favorite
      });

      res.status(200).json(updatedHeadshot);
    } catch (error) {
      console.error('Error updating favorite status:', error);
      res.status(500).json({ message: 'Failed to update favorite status' });
    }
  });

  // Delete a headshot
  app.delete('/api/headshots/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid headshot ID' });
      }

      const headshot = await storage.getHeadshot(id);
      if (!headshot) {
        return res.status(404).json({ message: 'Headshot not found' });
      }
      // Prepare data for insertDeletedHeadshot, ensuring type compatibility
      const headshotToInsert: InsertDeletedHeadshot = {
        userId: headshot.userId,
        modelId: headshot.modelId,
        style: headshot.style,
        filePath: headshot.filePath,
        imageUrl: headshot.imageUrl,
        replicatePredictionId: headshot.replicatePredictionId,
        prompt: headshot.prompt,
        metadata: headshot.metadata as Json, // Cast metadata to Json type
        favorite: headshot.favorite,
      };
      // copy to new table first
      await storage.insertDeletedHeadshot(headshotToInsert);
      const deleted = await storage.deleteHeadshot(id);
      if (!deleted) {
        return res.status(404).json({ message: 'Headshot not found' });
      }

      res.status(200).json({ message: 'Headshot deleted successfully' });
    } catch (error) {
      console.error('Error deleting headshot:', error);
      res.status(500).json({ message: 'Failed to delete headshot' });
    }
  });

  // Example route with CORS enabled
  app.get('/api/cors-test', cors(corsOptions), (req: Request, res: Response) => {
    res.json({ message: 'CORS is enabled for this path!' });
  });

  const httpServer = createServer(app);
  return httpServer;
}
