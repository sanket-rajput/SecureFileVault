import { users, type User, type InsertUser, files, type File, type InsertFile, folders, type Folder, type InsertFolder } from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStorage(userId: number, additionalBytes: number): Promise<User>;
  
  // Folder operations
  createFolder(folder: InsertFolder): Promise<Folder>;
  getFoldersByUserId(userId: number, parentId?: number): Promise<Folder[]>;
  getFolderById(id: number): Promise<Folder | undefined>;
  deleteFolder(id: number): Promise<void>;
  
  // File operations
  createFile(file: InsertFile): Promise<File>;
  getFileById(id: number): Promise<File | undefined>;
  getFilesByUserId(userId: number, folderId?: number): Promise<File[]>;
  getFilesByFolderId(folderId: number): Promise<File[]>;
  getFileByPath(path: string): Promise<File | undefined>;
  deleteFile(id: number): Promise<void>;
  searchFiles(userId: number, query: string): Promise<File[]>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private files: Map<number, File>;
  private folders: Map<number, Folder>;
  private userIdCounter: number;
  private fileIdCounter: number;
  private folderIdCounter: number;
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.files = new Map();
    this.folders = new Map();
    this.userIdCounter = 1;
    this.fileIdCounter = 1;
    this.folderIdCounter = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours in ms
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      storageUsed: 0, 
      storageLimit: 10485760, // 10MB in bytes
      createdAt: now
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserStorage(userId: number, additionalBytes: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    const updatedUser = {
      ...user,
      storageUsed: user.storageUsed + additionalBytes
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  // Folder operations
  async createFolder(folder: InsertFolder): Promise<Folder> {
    const id = this.folderIdCounter++;
    const now = new Date();
    const newFolder: Folder = {
      ...folder,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    this.folders.set(id, newFolder);
    return newFolder;
  }

  async getFoldersByUserId(userId: number, parentId?: number): Promise<Folder[]> {
    return Array.from(this.folders.values()).filter(
      (folder) => folder.userId === userId && 
                 (parentId === undefined ? true : folder.parentId === parentId)
    );
  }

  async getFolderById(id: number): Promise<Folder | undefined> {
    return this.folders.get(id);
  }

  async deleteFolder(id: number): Promise<void> {
    // Delete the folder
    this.folders.delete(id);
    
    // Delete all files in the folder
    const filesToDelete = Array.from(this.files.values())
      .filter(file => file.folderId === id);
    
    for (const file of filesToDelete) {
      this.files.delete(file.id);
    }
    
    // Delete all subfolders recursively
    const subfolders = Array.from(this.folders.values())
      .filter(folder => folder.parentId === id);
    
    for (const subfolder of subfolders) {
      await this.deleteFolder(subfolder.id);
    }
  }

  // File operations
  async createFile(file: InsertFile): Promise<File> {
    const id = this.fileIdCounter++;
    const now = new Date();
    const newFile: File = {
      ...file,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    this.files.set(id, newFile);
    
    // Update user storage usage
    await this.updateUserStorage(file.userId, file.size);
    
    return newFile;
  }

  async getFileById(id: number): Promise<File | undefined> {
    return this.files.get(id);
  }

  async getFilesByUserId(userId: number, folderId?: number): Promise<File[]> {
    return Array.from(this.files.values()).filter(
      (file) => file.userId === userId && 
                (folderId === undefined ? true : file.folderId === folderId)
    );
  }

  async getFilesByFolderId(folderId: number): Promise<File[]> {
    return Array.from(this.files.values()).filter(
      (file) => file.folderId === folderId
    );
  }

  async getFileByPath(path: string): Promise<File | undefined> {
    return Array.from(this.files.values()).find(
      (file) => file.path === path
    );
  }

  async deleteFile(id: number): Promise<void> {
    const file = await this.getFileById(id);
    if (file) {
      // Update user storage usage (negative to reduce)
      await this.updateUserStorage(file.userId, -file.size);
      this.files.delete(id);
    }
  }

  async searchFiles(userId: number, query: string): Promise<File[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.files.values()).filter(
      file => file.userId === userId && file.name.toLowerCase().includes(lowercaseQuery)
    );
  }
}

export const storage = new MemStorage();
