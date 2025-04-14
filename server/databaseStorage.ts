import { users, type User, type InsertUser, files, type File, type InsertFile, folders, type Folder, type InsertFolder } from "@shared/schema";
import connectPg from "connect-pg-simple";
import session from "express-session";
import { db, pool } from "./db";
import { eq, and, like, or, desc, isNull, sql } from "drizzle-orm";
import { IStorage } from "./storage";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool,
      createTableIfMissing: true
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const now = new Date();
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        storageUsed: 0, 
        storageLimit: 10485760, // 10MB in bytes
        createdAt: now
      })
      .returning();
    
    return user;
  }

  async updateUserStorage(userId: number, additionalBytes: number): Promise<User> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    
    if (!user) throw new Error(`User with ID ${userId} not found`);
    
    const [updatedUser] = await db
      .update(users)
      .set({
        storageUsed: user.storageUsed + additionalBytes,
      })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }

  async createFolder(folder: InsertFolder): Promise<Folder> {
    const now = new Date();
    const [newFolder] = await db
      .insert(folders)
      .values({
        ...folder,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    
    return newFolder;
  }

  async getFoldersByUserId(userId: number, parentId?: number): Promise<Folder[]> {
    if (parentId !== undefined) {
      return await db
        .select()
        .from(folders)
        .where(
          and(
            eq(folders.userId, userId),
            eq(folders.parentId, parentId)
          )
        )
        .orderBy(desc(folders.createdAt));
    } else {
      return await db
        .select()
        .from(folders)
        .where(eq(folders.userId, userId))
        .orderBy(desc(folders.createdAt));
    }
  }

  async getFolderById(id: number): Promise<Folder | undefined> {
    const [folder] = await db
      .select()
      .from(folders)
      .where(eq(folders.id, id));
    
    return folder;
  }

  async deleteFolder(id: number): Promise<void> {
    // Delete all files in this folder
    const folderFiles = await this.getFilesByFolderId(id);
    for (const file of folderFiles) {
      await this.deleteFile(file.id);
    }
    
    // Delete all subfolders recursively
    const childFolders = await db
      .select()
      .from(folders)
      .where(eq(folders.parentId, id));
    
    for (const childFolder of childFolders) {
      await this.deleteFolder(childFolder.id);
    }
    
    await db.delete(folders).where(eq(folders.id, id));
  }

  async createFile(file: InsertFile): Promise<File> {
    const now = new Date();
    const [newFile] = await db
      .insert(files)
      .values({
        ...file,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    
    // Update user storage usage
    await this.updateUserStorage(file.userId, file.size);
    
    return newFile;
  }

  async getFileById(id: number): Promise<File | undefined> {
    const [file] = await db
      .select()
      .from(files)
      .where(eq(files.id, id));
    
    return file;
  }

  async getFilesByUserId(userId: number, folderId?: number): Promise<File[]> {
    if (folderId !== undefined) {
      return await db
        .select()
        .from(files)
        .where(
          and(
            eq(files.userId, userId),
            eq(files.folderId, folderId)
          )
        )
        .orderBy(desc(files.createdAt));
    } else {
      return await db
        .select()
        .from(files)
        .where(eq(files.userId, userId))
        .orderBy(desc(files.createdAt));
    }
  }

  async getFilesByFolderId(folderId: number): Promise<File[]> {
    return await db
      .select()
      .from(files)
      .where(eq(files.folderId, folderId))
      .orderBy(desc(files.createdAt));
  }

  async getFileByPath(path: string): Promise<File | undefined> {
    const [file] = await db
      .select()
      .from(files)
      .where(eq(files.path, path));
    
    return file;
  }

  async deleteFile(id: number): Promise<void> {
    const [file] = await db
      .select()
      .from(files)
      .where(eq(files.id, id));
    
    if (file) {
      // Reduce user storage usage
      await this.updateUserStorage(file.userId, -file.size);
      await db.delete(files).where(eq(files.id, id));
    }
  }

  async searchFiles(userId: number, query: string): Promise<File[]> {
    const searchQuery = `%${query.toLowerCase()}%`;
    
    return await db
      .select()
      .from(files)
      .where(
        and(
          eq(files.userId, userId),
          or(
            like(sql`LOWER(${files.name})`, searchQuery),
            like(sql`LOWER(${files.fileType})`, searchQuery)
          )
        )
      )
      .orderBy(desc(files.createdAt));
  }
}