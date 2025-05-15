import { 
  users, 
  uploadedPhotos, 
  models, 
  headshots,
  exampleHeadshots,
  deletedHeadshots,
  type User, 
  type InsertUser, 
  type UploadedPhoto, 
  type InsertUploadedPhoto,
  type Model,
  type InsertModel,
  type Headshot,
  type DeletedHeadshot,
  type InsertHeadshot,
  type InsertDeletedHeadshot,
  type ExampleHeadshot,
  type InsertExampleHeadshot,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  
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

  insertDeletedHeadshot(insertDeletedHeadshot: InsertDeletedHeadshot): Promise<DeletedHeadshot>;
  
  // Example Headshot methods
  getExampleHeadshot(id: number): Promise<ExampleHeadshot | undefined>;
  createExampleHeadshot(headshot: Headshot): Promise<ExampleHeadshot>;
  deleteExampleHeadshot(id: number): Promise<boolean>;
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

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
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
    return result.rowCount ? result.rowCount > 0 : false;
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
    if (limit) {
      return await db
        .select()
        .from(headshots)
        .where(eq(headshots.userId, userId))
        .orderBy(desc(headshots.createdAt))
        .limit(limit);
    } else {
      return await db
        .select()
        .from(headshots)
        .where(eq(headshots.userId, userId))
        .orderBy(desc(headshots.createdAt));
    }
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

  async deleteHeadshot(id: number): Promise<boolean> {
    const result = await db.delete(headshots).where(eq(headshots.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async insertDeletedHeadshot(insertDeletedHeadshot: InsertDeletedHeadshot): Promise<DeletedHeadshot> {
    const [deletedHeadshot] = await db.insert(deletedHeadshots).values(insertDeletedHeadshot).returning();
    return deletedHeadshot;
  }
  async updateHeadshot(id: number, updates: Partial<Headshot>): Promise<Headshot | undefined> {
    const [updatedHeadshot] = await db
      .update(headshots)
      .set(updates)
      .where(eq(headshots.id, id))
      .returning();
    
    return updatedHeadshot;
  }
  
  async getExampleHeadshot(id: number): Promise<ExampleHeadshot | undefined> {
    const [exampleHeadshot] = await db.select().from(exampleHeadshots).where(eq(exampleHeadshots.id, id));
    return exampleHeadshot;
  }

  async getExampleHeadshots(): Promise<ExampleHeadshot[]> {
    return await db.select().from(exampleHeadshots);
  }

  async createExampleHeadshot(headshot: Headshot): Promise<ExampleHeadshot> {
    // Insert the relevant fields from the headshot into exampleHeadshots
    const [exampleHeadshot] = await db.insert(exampleHeadshots).values({
      style: headshot.style,
      filePath: headshot.filePath!, // filePath is optional in headshots, required in exampleHeadshots
      imageUrl: headshot.imageUrl,
      prompt: headshot.prompt,
      headshotId: headshot.id,
    }).returning();
    return exampleHeadshot;
  }

  async deleteExampleHeadshot(id: number): Promise<boolean> {
    const result = await db.delete(exampleHeadshots).where(eq(exampleHeadshots.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
}

export const storage = new DatabaseStorage();