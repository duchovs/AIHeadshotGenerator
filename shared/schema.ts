import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const uploadedPhotos = pgTable("uploaded_photos", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  filename: text("filename").notNull(),
  fileSize: integer("file_size").notNull(),
  path: text("path").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const models = pgTable("models", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  replicateModelId: text("replicate_model_id").notNull(),
  replicateVersionId: text("replicate_version_id"),
  status: text("status").notNull(), // "training", "completed", "failed"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const headshots = pgTable("headshots", {
  id: serial("id").primaryKey(), 
  userId: integer("user_id").references(() => users.id),
  modelId: integer("model_id").references(() => models.id),
  style: text("style").notNull(),
  imageUrl: text("image_url").notNull(),
  replicatePredictionId: text("replicate_prediction_id").notNull(),
  prompt: text("prompt"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  favorite: boolean("favorite").default(false),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertUploadedPhotoSchema = createInsertSchema(uploadedPhotos).omit({
  id: true,
  uploadedAt: true,
});

export const insertModelSchema = createInsertSchema(models).omit({
  id: true, 
  createdAt: true,
  completedAt: true,
});

export const insertHeadshotSchema = createInsertSchema(headshots).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertUploadedPhoto = z.infer<typeof insertUploadedPhotoSchema>;
export type UploadedPhoto = typeof uploadedPhotos.$inferSelect;

export type InsertModel = z.infer<typeof insertModelSchema>;
export type Model = typeof models.$inferSelect;

export type InsertHeadshot = z.infer<typeof insertHeadshotSchema>;
export type Headshot = typeof headshots.$inferSelect;

// Custom schemas for API requests
export const trainModelSchema = z.object({
  userId: z.number().optional(),
  photoIds: z.array(z.number()),
});

export const generateHeadshotSchema = z.object({
  modelId: z.number(),
  style: z.string(),
  prompt: z.string().optional(),
});
