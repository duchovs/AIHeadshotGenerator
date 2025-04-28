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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private uploadedPhotos: Map<number, UploadedPhoto>;
  private models: Map<number, Model>;
  private headshots: Map<number, Headshot>;
  
  private userCurrentId: number;
  private uploadedPhotoCurrentId: number;
  private modelCurrentId: number;
  private headshotCurrentId: number;

  constructor() {
    this.users = new Map();
    this.uploadedPhotos = new Map();
    this.models = new Map();
    this.headshots = new Map();
    
    this.userCurrentId = 1;
    this.uploadedPhotoCurrentId = 1;
    this.modelCurrentId = 1;
    this.headshotCurrentId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Uploaded Photo methods
  async getUploadedPhoto(id: number): Promise<UploadedPhoto | undefined> {
    return this.uploadedPhotos.get(id);
  }
  
  async getUploadedPhotosByUserId(userId: number): Promise<UploadedPhoto[]> {
    return Array.from(this.uploadedPhotos.values()).filter(
      (photo) => photo.userId === userId
    );
  }
  
  async createUploadedPhoto(insertPhoto: InsertUploadedPhoto): Promise<UploadedPhoto> {
    const id = this.uploadedPhotoCurrentId++;
    const now = new Date();
    const photo: UploadedPhoto = { 
      ...insertPhoto, 
      id,
      uploadedAt: now
    };
    this.uploadedPhotos.set(id, photo);
    return photo;
  }
  
  async deleteUploadedPhoto(id: number): Promise<boolean> {
    return this.uploadedPhotos.delete(id);
  }
  
  // Model methods
  async getModel(id: number): Promise<Model | undefined> {
    return this.models.get(id);
  }
  
  async getModelsByUserId(userId: number): Promise<Model[]> {
    return Array.from(this.models.values()).filter(
      (model) => model.userId === userId
    );
  }
  
  async createModel(insertModel: InsertModel): Promise<Model> {
    const id = this.modelCurrentId++;
    const now = new Date();
    const model: Model = {
      ...insertModel,
      id,
      createdAt: now,
      completedAt: null
    };
    this.models.set(id, model);
    return model;
  }
  
  async updateModel(id: number, updates: Partial<Model>): Promise<Model | undefined> {
    const model = this.models.get(id);
    if (!model) return undefined;
    
    const updatedModel = { ...model, ...updates };
    this.models.set(id, updatedModel);
    return updatedModel;
  }
  
  // Headshot methods
  async getHeadshot(id: number): Promise<Headshot | undefined> {
    return this.headshots.get(id);
  }
  
  async getHeadshotsByUserId(userId: number, limit?: number): Promise<Headshot[]> {
    const headshots = Array.from(this.headshots.values())
      .filter((headshot) => headshot.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return limit ? headshots.slice(0, limit) : headshots;
  }
  
  async getHeadshotsByModelId(modelId: number): Promise<Headshot[]> {
    return Array.from(this.headshots.values())
      .filter((headshot) => headshot.modelId === modelId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async createHeadshot(insertHeadshot: InsertHeadshot): Promise<Headshot> {
    const id = this.headshotCurrentId++;
    const now = new Date();
    const headshot: Headshot = {
      ...insertHeadshot,
      id,
      createdAt: now
    };
    this.headshots.set(id, headshot);
    return headshot;
  }
  
  async updateHeadshot(id: number, updates: Partial<Headshot>): Promise<Headshot | undefined> {
    const headshot = this.headshots.get(id);
    if (!headshot) return undefined;
    
    const updatedHeadshot = { ...headshot, ...updates };
    this.headshots.set(id, updatedHeadshot);
    return updatedHeadshot;
  }
  
  async deleteHeadshot(id: number): Promise<boolean> {
    return this.headshots.delete(id);
  }
}

export const storage = new MemStorage();
