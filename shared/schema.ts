import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password"),
  email: text("email"),
  googleId: text("google_id").unique(),
  displayName: text("display_name"),
  profilePicture: text("profile_picture"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // Token balance for in-app purchases
  tokens: integer("tokens").default(0).notNull(),
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
  replicateTrainingId: text("replicate_training_id"),
  status: text("status").notNull(), // "training", "completed", "failed", "canceled"
  progress: integer("progress"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const headshots = pgTable("headshots", {
  id: serial("id").primaryKey(), 
  userId: integer("user_id").references(() => users.id),
  modelId: integer("model_id").references(() => models.id),
  style: text("style").notNull(),
  filePath: text("file_path"),
  imageUrl: text("image_url").notNull(),
  replicatePredictionId: text("replicate_prediction_id").notNull(),
  prompt: text("prompt"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  favorite: boolean("favorite").default(false),
});

// Table to store deleted headshots (same schema as headshots)
export const deletedHeadshots = pgTable("deleted_headshots", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  modelId: integer("model_id").references(() => models.id),
  style: text("style").notNull(),
  filePath: text("file_path"),
  imageUrl: text("image_url").notNull(),
  replicatePredictionId: text("replicate_prediction_id").notNull(),
  prompt: text("prompt"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  favorite: boolean("favorite").default(false),
});

// Table to track Stripe payment transactions
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  stripePaymentId: text("stripe_payment_id").notNull().unique(),
  amount: integer("amount").notNull(), // amount in smallest currency unit (e.g., cents)
  currency: text("currency").notNull(),
  status: text("status").notNull(), // e.g. 'pending', 'succeeded', 'failed'
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tokenTransactions = pgTable("token_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(),             // e.g. 'generate_headshot', 'train_model', 'purchase'
  referenceId: integer("reference_id"),             // headshot.id or model.id
  tokens: integer("tokens_delta").notNull(),   // negative for consumption, positive for top-ups
  metadata: jsonb("metadata"),                   // optional freeform (e.g. style, prompt)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const session = pgTable("session", {
  sid: text("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire", { mode: "date" }).notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  googleId: true,
  displayName: true,
  profilePicture: true,
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

export const insertDeletedHeadshotSchema = createInsertSchema(deletedHeadshots).omit({
  id: true,
  createdAt: true,
});

export const generateFormSchema = z.object({
  modelId: z.number(),
  style: z.string(),
  prompt: z.string().optional(),
  gender: z.enum(['male', 'female']),
});

// Types
export type Session = typeof session.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertUploadedPhoto = z.infer<typeof insertUploadedPhotoSchema>;
export type UploadedPhoto = typeof uploadedPhotos.$inferSelect;

export type InsertModel = z.infer<typeof insertModelSchema>;
export type Model = typeof models.$inferSelect;

export type InsertHeadshot = z.infer<typeof insertHeadshotSchema>;
export type Headshot = typeof headshots.$inferSelect;

export type InsertDeletedHeadshot = z.infer<typeof insertDeletedHeadshotSchema>;
export type DeletedHeadshot = typeof deletedHeadshots.$inferSelect;

export type Payment = typeof payments.$inferSelect;

export type GenerateFormValues = z.infer<typeof generateFormSchema>;

// Custom schemas for API requests
export const trainModelSchema = z.object({
  userId: z.number().optional(),
  photoIds: z.array(z.number()),
});

export const generateHeadshotSchema = z.object({
  modelId: z.number(),
  style: z.string(),
  prompt: z.string().optional(),
  gender: z.enum(['male','female']),
});
