import express, { type Express, type Request, type Response } from 'express';
import stripeRoutes from './routes/stripe';
import { db } from './db';
import { sendModelCompletionEmail } from './resend';
import { eq } from 'drizzle-orm';
import { uploadedPhotos } from '@shared/schema';
import { fileURLToPath } from 'url';
import AdmZip from 'adm-zip';
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { deductTokens, checkTokenBalance } from "./middleware/tokenMiddleware";
import type { TokenRequest } from "./middleware/tokenMiddleware";
import path from "path";
import { getStylePrompt } from './prompts';
import Replicate from "replicate";
import { sendDiscordNotification } from './utils/discord';

// ESM-compatible __dirname and __filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import fs from "fs";
import multer from "multer";
import passport from "./auth";
import {
  insertUploadedPhotoSchema,
  insertModelSchema,
  insertHeadshotSchema,
  trainModelSchema,
  generateHeadshotSchema
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

// Helper middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Not authenticated' });
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
  app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  app.get('/auth/google/callback',
    passport.authenticate('google', {
      successRedirect: '/',
      failureRedirect: '/login'
    })
  );

  // Get current user info
  app.get('/api/auth/user', (req, res) => {
    if (req.isAuthenticated()) {
      sendDiscordNotification(`User ${req.user.displayName} just logged in...`);
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
  app.post('/api/models/train', isAuthenticated, checkTokenBalance(6), async (req: TokenRequest, res: Response) => {
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

      const user = await storage.getUser(req.user?.id || 1);
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
      userId: req.user?.id || 1,
      replicateModelId: new_model?.name || '',
      status: 'training'
      });
      
      if (!req.user?.id) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Deduct 6 tokens for model training
      await deductTokens(
        req.user.id,
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
          destination: 'duchovs/' + model.replicateModelId,
          webhook: `https://${req.get('host')}/api/webhooks/training-complete?modelId=${model.id}`,
          webhook_events_filter: ["completed", "logs"], // 'completed' webhook also contains: 'failed', 'canceled'
          input: {
            steps: 2000,
            lora_rank: 20,
            optimizer: "adamw8bit",
            batch_size: 1,
            resolution: "512,768,1024",
            autocaption: true,
            input_images: `${req.protocol}://${req.get('host')}/api/photos/zip/${user?.id || ''}`,
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
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid training data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to start model training' });
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

  // Get all models for a user
  app.get('/api/models', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const models = await storage.getModelsByUserId(userId);
      res.status(200).json(models);
    } catch (error) {
      console.error('Error fetching models:', error);
      res.status(500).json({ message: 'Failed to fetch models' });
    }
  });

  // Generate a headshot using a trained model
  app.post('/api/headshots/generate', isAuthenticated, checkTokenBalance(1), async (req: TokenRequest, res: Response) => {
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
      if (!req.user?.id) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Deduct 1 token for headshot generation
      await deductTokens(
        req.user.id,
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
      const imageUrl = String(output[0].url()).replace(/^"|"$/g, '');
      console.log(imageUrl)
      // Store the generated headshot
      const headshot = await storage.createHeadshot({
        userId: req.user?.id || 2,
        modelId,
        style,
        imageUrl,
        replicatePredictionId: `prediction_${Date.now()}`,
        prompt: stylePrompt,
        metadata: {},
        favorite: false
      });

      // Save the generated image in user's directory
      const userDir = path.join(generatedDir, req.user ? req.user.id.toString() : 'anonymous');
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
  app.get('/api/examples', async (req: Request, res: Response) => {
    try {
      const headshots = await storage.getExampleHeadshots();
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
      // copy to new table first
      await storage.insertDeletedHeadshot(headshot);
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

  const httpServer = createServer(app);
  return httpServer;
}
