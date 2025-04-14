import { pgTable, text, serial, integer, boolean, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name"),
  storageUsed: integer("storage_used").default(0).notNull(),
  storageLimit: integer("storage_limit").default(10485760).notNull(), // 10MB default in bytes
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Folders table
export const folders = pgTable("folders", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  userId: integer("user_id").notNull(),
  parentId: integer("parent_id"), // null if in root directory
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Files table
export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  fileType: text("file_type").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(), // in bytes
  path: text("path").notNull(),
  userId: integer("user_id").notNull(),
  folderId: integer("folder_id"), // null if in root directory
  isPublic: boolean("is_public").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Schemas for insertions
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
});

export const insertFolderSchema = createInsertSchema(folders).pick({
  name: true,
  userId: true,
  parentId: true,
});

export const insertFileSchema = createInsertSchema(files).pick({
  name: true,
  fileType: true,
  mimeType: true,
  size: true,
  path: true,
  userId: true,
  folderId: true,
  isPublic: true,
});

// Types for the schemas
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertFolder = z.infer<typeof insertFolderSchema>;
export type Folder = typeof folders.$inferSelect;

export type InsertFile = z.infer<typeof insertFileSchema>;
export type File = typeof files.$inferSelect;
