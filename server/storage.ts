import { 
  users, 
  uploadedPhotos, 
  models, 
  headshots,
  type User, 
  type InsertUser, 
  type UploadedPhoto, 
  type InsertUploadedPhoto,
  type Model,
  type InsertModel,
  type Headshot,
  type InsertHeadshot
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Upload methods
  getUploadedPhoto(id: number): Promise<UploadedPhoto | undefined>;
  getUploadedPhotosByUserId(userId: number): Promise<UploadedPhoto[]>;
  createUploadedPhoto(photo: InsertUploadedPhoto): Promise<UploadedPhoto>;
  deleteUploadedPhoto(id: number): Promise<boolean>;
  
  // Model methods
  getModel(id: number): Promise<Model | undefined>;
  getModelsByUserId(userId: number): Promise<Model[]>;
  createModel(model: InsertModel): Promise<Model>;
  updateModel(id: number, updates: Partial<Model>): Promise<Model | undefined>;
  
  // Headshot methods
  getHeadshot(id: number): Promise<Headshot | undefined>;
  getHeadshotsByUserId(userId: number, limit?: number): Promise<Headshot[]>;
  getHeadshotsByModelId(modelId: number): Promise<Headshot[]>;
  createHeadshot(headshot: InsertHeadshot): Promise<Headshot>;
  updateHeadshot(id: number, updates: Partial<Headshot>): Promise<Headshot | undefined>;
  deleteHeadshot(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  // Uploaded Photo methods
  async getUploadedPhoto(id: number): Promise<UploadedPhoto | undefined> {
    const [photo] = await db.select().from(uploadedPhotos).where(eq(uploadedPhotos.id, id));
    return photo;
  }
  
  async getUploadedPhotosByUserId(userId: number): Promise<UploadedPhoto[]> {
    return await db.select().from(uploadedPhotos).where(eq(uploadedPhotos.userId, userId));
  }
  
  async createUploadedPhoto(insertPhoto: InsertUploadedPhoto): Promise<UploadedPhoto> {
    const [photo] = await db.insert(uploadedPhotos).values(insertPhoto).returning();
    return photo;
  }
  
  async deleteUploadedPhoto(id: number): Promise<boolean> {
    const result = await db.delete(uploadedPhotos).where(eq(uploadedPhotos.id, id));
    return result.rowCount > 0;
  }
  
  // Model methods
  async getModel(id: number): Promise<Model | undefined> {
    const [model] = await db.select().from(models).where(eq(models.id, id));
    return model;
  }
  
  async getModelsByUserId(userId: number): Promise<Model[]> {
    return await db.select().from(models).where(eq(models.userId, userId));
  }
  
  async createModel(insertModel: InsertModel): Promise<Model> {
    const [model] = await db.insert(models).values(insertModel).returning();
    return model;
  }
  
  async updateModel(id: number, updates: Partial<Model>): Promise<Model | undefined> {
    const [updatedModel] = await db
      .update(models)
      .set(updates)
      .where(eq(models.id, id))
      .returning();
    
    return updatedModel;
  }
  
  // Headshot methods
  async getHeadshot(id: number): Promise<Headshot | undefined> {
    const [headshot] = await db.select().from(headshots).where(eq(headshots.id, id));
    return headshot;
  }
  
  async getHeadshotsByUserId(userId: number, limit?: number): Promise<Headshot[]> {
    let query = db
      .select()
      .from(headshots)
      .where(eq(headshots.userId, userId))
      .orderBy(desc(headshots.createdAt));
    
    if (limit) {
      query = query.limit(limit);
    }
    
    return await query;
  }
  
  async getHeadshotsByModelId(modelId: number): Promise<Headshot[]> {
    return await db
      .select()
      .from(headshots)
      .where(eq(headshots.modelId, modelId))
      .orderBy(desc(headshots.createdAt));
  }
  
  async createHeadshot(insertHeadshot: InsertHeadshot): Promise<Headshot> {
    const [headshot] = await db.insert(headshots).values(insertHeadshot).returning();
    return headshot;
  }
  
  async updateHeadshot(id: number, updates: Partial<Headshot>): Promise<Headshot | undefined> {
    const [updatedHeadshot] = await db
      .update(headshots)
      .set(updates)
      .where(eq(headshots.id, id))
      .returning();
    
    return updatedHeadshot;
  }
  
  async deleteHeadshot(id: number): Promise<boolean> {
    const result = await db.delete(headshots).where(eq(headshots.id, id));
    return result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();
