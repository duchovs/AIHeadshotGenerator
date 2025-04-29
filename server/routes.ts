import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import path from "path";
import fs from "fs";
import os from "os";
import multer from "multer";
import axios from "axios";
import passport from "./auth";
import {
  insertUploadedPhotoSchema,
  insertModelSchema,
  insertHeadshotSchema,
  trainModelSchema,
  generateHeadshotSchema
} from "@shared/schema";
import { z } from "zod";

// Configure multer for handling file uploads
const upload = multer({ 
  dest: path.join(os.tmpdir(), 'headshot-ai-uploads'),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Helper middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Not authenticated' });
};

export async function registerRoutes(app: Express): Promise<Server> {
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
  app.post('/api/uploads', isAuthenticated, upload.array('photos', 20), async (req: Request, res: Response) => {
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
  app.get('/api/uploads', async (req: Request, res: Response) => {
    try {
      const userId = 1; // Mock user ID
      const photos = await storage.getUploadedPhotosByUserId(userId);
      res.status(200).json(photos);
    } catch (error) {
      console.error('Error fetching uploads:', error);
      res.status(500).json({ message: 'Failed to fetch uploaded photos' });
    }
  });

  // Delete an uploaded photo
  app.delete('/api/uploads/:id', async (req: Request, res: Response) => {
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
  app.post('/api/models/train', async (req: Request, res: Response) => {
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

      // Create model entry in the database
      const model = await storage.createModel({
        userId: 1, // Mock user ID
        replicateModelId: 'training',
        status: 'training'
      });

      // In a real implementation, this would initiate the training process with Replicate API
      // For now, we'll mock a successful response and set a timeout to update the model status
      
      // Simulate a training job
      setTimeout(async () => {
        await storage.updateModel(model.id, {
          status: 'completed',
          replicateModelId: 'headshot-generator',
          replicateVersionId: 'v1',
          completedAt: new Date()
        });
      }, 10000); // 10 seconds to simulate training

      res.status(200).json({
        id: model.id,
        status: 'training',
        message: 'Model training started'
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
  app.get('/api/models/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid model ID' });
      }

      const model = await storage.getModel(id);
      if (!model) {
        return res.status(404).json({ message: 'Model not found' });
      }

      res.status(200).json(model);
    } catch (error) {
      console.error('Error fetching model:', error);
      res.status(500).json({ message: 'Failed to fetch model information' });
    }
  });

  // Get all models for a user
  app.get('/api/models', async (req: Request, res: Response) => {
    try {
      const userId = 1; // Mock user ID
      const models = await storage.getModelsByUserId(userId);
      res.status(200).json(models);
    } catch (error) {
      console.error('Error fetching models:', error);
      res.status(500).json({ message: 'Failed to fetch models' });
    }
  });

  // Generate a headshot using a trained model
  app.post('/api/headshots/generate', async (req: Request, res: Response) => {
    try {
      const { modelId, style, prompt } = generateHeadshotSchema.parse(req.body);
      
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

      // In a real implementation, this would call the Replicate API to generate the headshot
      // For now, we'll mock a successful response with a generated image URL

      // Generate a random image URL based on style for demo purposes
      const styles = ['corporate', 'casual', 'creative', 'business', 'outdoor', 'studio'];
      const styleIndex = styles.indexOf(style) !== -1 ? styles.indexOf(style) : 0;
      
      // Create a mock Unsplash image URL based on style
      const imageUrls = [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e',
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2',
        'https://images.unsplash.com/photo-1560250097-0b93528c311a',
        'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7',
        'https://images.unsplash.com/photo-1541647376583-8934aaf3448a'
      ];
      
      const imageUrl = `${imageUrls[styleIndex]}?w=800&q=80`;

      // Store the generated headshot
      const headshot = await storage.createHeadshot({
        userId: 1, // Mock user ID
        modelId,
        style,
        imageUrl,
        replicatePredictionId: `prediction_${Date.now()}`,
        prompt: prompt || "",
        metadata: {},
        favorite: false
      });

      res.status(200).json(headshot);
    } catch (error) {
      console.error('Error generating headshot:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid generation data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to generate headshot' });
    }
  });

  // Get all headshots for a user
  app.get('/api/headshots', async (req: Request, res: Response) => {
    try {
      const userId = 1; // Mock user ID
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      const headshots = await storage.getHeadshotsByUserId(userId, limit);
      res.status(200).json(headshots);
    } catch (error) {
      console.error('Error fetching headshots:', error);
      res.status(500).json({ message: 'Failed to fetch headshots' });
    }
  });

  // Get a specific headshot
  app.get('/api/headshots/:id', async (req: Request, res: Response) => {
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

  // Toggle favorite status of a headshot
  app.patch('/api/headshots/:id/favorite', async (req: Request, res: Response) => {
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
  app.delete('/api/headshots/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid headshot ID' });
      }

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
