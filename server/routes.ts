import { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import fs from "fs";
import path from "path";
import multer from "multer";
import { setupAuth } from "./auth";
import { insertFolderSchema, insertFileSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

// Configure multer for file uploads
const uploadsDir = path.join(process.cwd(), "uploads");

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage_config = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create user directory if it doesn't exist
    if (req.user) {
      const userDir = path.join(uploadsDir, req.user.id.toString());
      if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
      }
      cb(null, userDir);
    } else {
      cb(new Error("User not authenticated"), "");
    }
  },
  filename: function (req, file, cb) {
    // Create a unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  }
});

const upload = multer({
  storage: storage_config,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check user storage limit
    if (req.user) {
      const remainingStorage = req.user.storageLimit - req.user.storageUsed;
      if (file.size && file.size > remainingStorage) {
        cb(new Error("Not enough storage space"), false);
      } else {
        cb(null, true);
      }
    } else {
      cb(new Error("User not authenticated"), false);
    }
  }
});

// Authentication middleware
function requireAuth(req: Request, res: Response, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // User routes
  app.get("/api/users/storage", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({
        used: user.storageUsed,
        limit: user.storageLimit,
        remaining: user.storageLimit - user.storageUsed
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching storage information" });
    }
  });

  // Folder routes
  app.post("/api/folders", requireAuth, async (req, res) => {
    try {
      const result = insertFolderSchema.safeParse({
        ...req.body,
        userId: req.user!.id
      });

      if (!result.success) {
        const errorMessage = fromZodError(result.error).message;
        return res.status(400).json({ message: errorMessage });
      }

      const folder = await storage.createFolder(result.data);
      res.status(201).json(folder);
    } catch (error) {
      res.status(500).json({ message: "Error creating folder" });
    }
  });

  app.get("/api/folders", requireAuth, async (req, res) => {
    try {
      const parentId = req.query.parentId ? Number(req.query.parentId) : undefined;
      const folders = await storage.getFoldersByUserId(req.user!.id, parentId);
      res.json(folders);
    } catch (error) {
      res.status(500).json({ message: "Error fetching folders" });
    }
  });

  app.get("/api/folders/:id", requireAuth, async (req, res) => {
    try {
      const folderId = Number(req.params.id);
      const folder = await storage.getFolderById(folderId);
      
      if (!folder) {
        return res.status(404).json({ message: "Folder not found" });
      }
      
      if (folder.userId !== req.user!.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(folder);
    } catch (error) {
      res.status(500).json({ message: "Error fetching folder" });
    }
  });

  app.delete("/api/folders/:id", requireAuth, async (req, res) => {
    try {
      const folderId = Number(req.params.id);
      const folder = await storage.getFolderById(folderId);
      
      if (!folder) {
        return res.status(404).json({ message: "Folder not found" });
      }
      
      if (folder.userId !== req.user!.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteFolder(folderId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting folder" });
    }
  });

  // File routes
  app.post("/api/files/upload", requireAuth, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { originalname, path: filePath, size, mimetype } = req.file;
      const fileType = originalname.split('.').pop() || '';
      // Get folderId from request body or use null for root folder
      let folderId = null;
      
      // If folderId is provided in the request (not empty string or undefined)
      if (req.body.folderId && req.body.folderId !== '') {
        folderId = Number(req.body.folderId);
        
        // Check if the folder exists and belongs to the user
        const folder = await storage.getFolderById(folderId);
        if (!folder || folder.userId !== req.user!.id) {
          return res.status(400).json({ message: "Invalid folder" });
        }
      }

      // Create file record in storage
      const fileData = {
        name: originalname,
        fileType,
        mimeType: mimetype,
        size,
        path: filePath,
        userId: req.user!.id,
        folderId,
        isPublic: false
      };

      const result = insertFileSchema.safeParse(fileData);
      if (!result.success) {
        // Clean up the file
        fs.unlinkSync(filePath);
        const errorMessage = fromZodError(result.error).message;
        return res.status(400).json({ message: errorMessage });
      }

      const file = await storage.createFile(result.data);
      res.status(201).json(file);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Error uploading file" });
    }
  });

  app.get("/api/files", requireAuth, async (req, res) => {
    try {
      const folderId = req.query.folderId ? Number(req.query.folderId) : undefined;
      const files = await storage.getFilesByUserId(req.user!.id, folderId);
      res.json(files);
    } catch (error) {
      res.status(500).json({ message: "Error fetching files" });
    }
  });

  app.get("/api/files/search", requireAuth, async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query required" });
      }
      
      const files = await storage.searchFiles(req.user!.id, query);
      res.json(files);
    } catch (error) {
      res.status(500).json({ message: "Error searching files" });
    }
  });

  app.get("/api/files/:id", requireAuth, async (req, res) => {
    try {
      const fileId = Number(req.params.id);
      const file = await storage.getFileById(fileId);
      
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      if (file.userId !== req.user!.id && !file.isPublic) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(file);
    } catch (error) {
      res.status(500).json({ message: "Error fetching file" });
    }
  });

  app.get("/api/files/:id/download", requireAuth, async (req, res) => {
    try {
      const fileId = Number(req.params.id);
      const file = await storage.getFileById(fileId);
      
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      if (file.userId !== req.user!.id && !file.isPublic) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      if (!fs.existsSync(file.path)) {
        return res.status(404).json({ message: "File not found on server" });
      }
      
      res.download(file.path, file.name);
    } catch (error) {
      res.status(500).json({ message: "Error downloading file" });
    }
  });

  app.delete("/api/files/:id", requireAuth, async (req, res) => {
    try {
      const fileId = Number(req.params.id);
      const file = await storage.getFileById(fileId);
      
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      if (file.userId !== req.user!.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Delete the file from disk
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      
      // Delete the file record
      await storage.deleteFile(fileId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting file" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
