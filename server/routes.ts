import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { db } from "./db";
import { handleChatQuery, handleAiOperation, analyzeDatasheet } from "./ai-service";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";

// Configure multer storage for file uploads
const uploadsDir = path.join(process.cwd(), 'uploads');
const imagesDir = path.join(uploadsDir, 'images');
const datasheetsDir = path.join(uploadsDir, 'datasheets');

// Ensure directories exist
[uploadsDir, imagesDir, datasheetsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure storage based on file type
const storage_multer = multer.diskStorage({
  destination: function(req, file, cb) {
    let destination = uploadsDir;
    
    // Route files to appropriate directories based on fieldname
    if (file.fieldname === 'image') {
      destination = imagesDir;
    } else if (file.fieldname === 'datasheet') {
      destination = datasheetsDir;
    }
    
    cb(null, destination);
  },
  filename: function(req, file, cb) {
    // Create unique filename with original extension
    const fileExt = path.extname(file.originalname);
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
    cb(null, fileName);
  }
});

const upload = multer({ 
  storage: storage_multer,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB file size limit
});
import { 
  insertCategorySchema, 
  insertSupplierSchema, 
  insertComponentSchema, 
  insertPurchaseSchema,
  insertClientSchema,
  insertInverterSchema,
  insertFaultTypeSchema,
  insertRepairSchema,
  insertUsedComponentSchema,
  insertUserSchema,
  RepairStatusEnum,
  statusHistoryEntrySchema,
  type StatusHistoryEntry,
  type RepairStatus
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve static files from uploads directory
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
  
  // File upload endpoints
  app.post("/api/upload/file", upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }
      
      // Return the file path that can be used to access the file
      const fileUrl = `/uploads/${req.file.filename}`;
      res.json({ 
        url: fileUrl,
        originalName: req.file.originalname,
        size: req.file.size
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });
  
  // Handle image uploads specifically
  app.post("/api/upload/image", upload.single('image'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }
      
      // Return the file path that can be used to access the image
      const fileUrl = `/uploads/images/${path.basename(req.file.path)}`;
      res.json({ 
        url: fileUrl,
        originalName: req.file.originalname,
        size: req.file.size
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });
  
  // Handle datasheet uploads specifically
  app.post("/api/upload/datasheet", upload.single('datasheet'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No datasheet file provided" });
      }
      
      // Return the file path that can be used to access the datasheet
      const fileUrl = `/uploads/datasheets/${path.basename(req.file.path)}`;
      res.json({ 
        url: fileUrl,
        originalName: req.file.originalname,
        size: req.file.size
      });
    } catch (error) {
      console.error("Error uploading datasheet:", error);
      res.status(500).json({ error: "Failed to upload datasheet" });
    }
  });
  app.post("/api/upload/image", upload.single('image'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }
      
      // Return the file path that can be used to access the image
      const imageUrl = `/uploads/${req.file.filename}`;
      res.json({ 
        url: imageUrl,
        originalName: req.file.originalname,
        size: req.file.size
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });

  app.post("/api/upload/datasheet", upload.single('datasheet'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No datasheet file provided" });
      }
      
      // Return the file path that can be used to access the datasheet
      const datasheetUrl = `/uploads/${req.file.filename}`;
      res.json({ 
        url: datasheetUrl,
        originalName: req.file.originalname,
        size: req.file.size
      });
    } catch (error) {
      console.error("Error uploading datasheet:", error);
      res.status(500).json({ error: "Failed to upload datasheet" });
    }
  });
  
  // put application routes here
  // prefix all routes with /api
  
  // User Management
  app.get("/api/users", async (req: Request, res: Response) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });
  
  app.get("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });
  
  app.post("/api/users", async (req: Request, res: Response) => {
    try {
      const data = insertUserSchema.parse(req.body);
      const user = await storage.createUser(data);
      
      // Don't return the password field
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      console.error("Error creating user:", error);
      
      // Check if it's a validation error or username taken error
      if (error.message && error.message.includes("already taken")) {
        return res.status(409).json({ error: error.message });
      }
      
      res.status(400).json({ error: "Invalid user data" });
    }
  });
  
  app.put("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // If password is empty string, remove it from the payload
      if (req.body.password === '') {
        delete req.body.password;
      }
      
      const user = await storage.updateUser(id, req.body);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return the password field
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error("Error updating user:", error);
      
      // Check if it's a username taken error
      if (error.message && error.message.includes("already taken")) {
        return res.status(409).json({ error: error.message });
      }
      
      res.status(400).json({ error: "Invalid user data" });
    }
  });
  
  app.delete("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const result = await storage.deleteUser(id);
      
      if (!result) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.status(200).json({ message: "User deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting user:", error);
      
      // Check if it's the last admin error
      if (error.message && error.message.includes("Cannot delete the last admin")) {
        return res.status(409).json({ error: error.message });
      }
      
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Categories
  app.get("/api/categories", async (req: Request, res: Response) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });
  
  app.get("/api/categories/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const category = await storage.getCategory(id);
    
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    
    res.json(category);
  });
  
  app.post("/api/categories", async (req: Request, res: Response) => {
    try {
      const data = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(data);
      res.status(201).json(category);
    } catch (error) {
      res.status(400).json({ error: "Invalid category data" });
    }
  });
  
  app.put("/api/categories/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertCategorySchema.parse(req.body);
      const category = await storage.updateCategory(id, data);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(category);
    } catch (error) {
      res.status(400).json({ error: "Invalid category data" });
    }
  });
  
  app.delete("/api/categories/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Call the storage function that will safely handle component references
      const result = await storage.deleteCategory(id);
      
      if (!result.success) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      // Respond with success and information about affected components
      res.status(200).json({ 
        message: "Category deleted successfully", 
        affectedComponents: result.affectedComponents || 0,
        note: result.affectedComponents ? "Components previously in this category have been updated to have no category." : ""
      });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ error: "Failed to delete category" });
    }
  });
  
  // Suppliers
  app.get("/api/suppliers", async (req: Request, res: Response) => {
    const suppliers = await storage.getSuppliers();
    res.json(suppliers);
  });
  
  app.get("/api/suppliers/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const supplier = await storage.getSupplier(id);
    
    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }
    
    res.json(supplier);
  });
  
  app.post("/api/suppliers", async (req: Request, res: Response) => {
    try {
      const data = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(data);
      res.status(201).json(supplier);
    } catch (error) {
      res.status(400).json({ error: "Invalid supplier data" });
    }
  });
  
  app.put("/api/suppliers/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertSupplierSchema.parse(req.body);
      const supplier = await storage.updateSupplier(id, data);
      
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      
      res.json(supplier);
    } catch (error) {
      res.status(400).json({ error: "Invalid supplier data" });
    }
  });
  
  // Components
  app.get("/api/components", async (req: Request, res: Response) => {
    const components = await storage.getComponents();
    res.json(components);
  });
  
  app.get("/api/components/low-stock", async (req: Request, res: Response) => {
    try {
      const components = await storage.getLowStockComponents();
      res.json(components);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch low stock components" });
    }
  });
  
  app.get("/api/components/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const component = await storage.getComponent(id);
    
    if (!component) {
      return res.status(404).json({ message: "Component not found" });
    }
    
    res.json(component);
  });
  
  app.post("/api/components", async (req: Request, res: Response) => {
    try {
      // Process the form data to ensure it has all required fields with defaults
      const formData = {
        ...req.body,
        minimumStock: req.body.minimumStock ?? 0,
        currentStock: req.body.currentStock ?? 0,
        supplierPrice: req.body.supplierPrice ?? 0,
        partNumber: req.body.partNumber || null,
        categoryId: req.body.categoryId || null,
        description: req.body.description || null,
        datasheet: req.body.datasheet || null,
        image: req.body.image || null,
        location: req.body.location || null,
        supplierId: req.body.supplierId || null,
        lastPurchaseDate: req.body.lastPurchaseDate || null
      };
      
      console.log("Processed component data:", formData);
      
      const data = insertComponentSchema.parse(formData);
      const component = await storage.createComponent(data);
      res.status(201).json(component);
    } catch (error) {
      console.error("Error creating component:", error);
      res.status(400).json({ error: "Invalid component data" });
    }
  });
  
  app.put("/api/components/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertComponentSchema.parse(req.body);
      const component = await storage.updateComponent(id, data);
      
      if (!component) {
        return res.status(404).json({ message: "Component not found" });
      }
      
      res.json(component);
    } catch (error) {
      res.status(400).json({ error: "Invalid component data" });
    }
  });
  
  app.patch("/api/components/:id/stock", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const schema = z.object({ quantity: z.number().int() });
      const { quantity } = schema.parse(req.body);
      
      const component = await storage.updateComponentStock(id, quantity);
      
      if (!component) {
        return res.status(404).json({ message: "Component not found" });
      }
      
      res.json(component);
    } catch (error) {
      res.status(400).json({ error: "Invalid stock update data" });
    }
  });
  
  app.patch("/api/components/:id/min-stock", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const schema = z.object({ minimumStock: z.number().int().min(0) });
      const { minimumStock } = schema.parse(req.body);
      
      const component = await storage.getComponent(id);
      if (!component) {
        return res.status(404).json({ message: "Component not found" });
      }
      
      const updatedComponent = await storage.updateComponent(id, { ...component, minimumStock });
      
      res.json(updatedComponent);
    } catch (error) {
      res.status(400).json({ error: "Invalid minimum stock update data" });
    }
  });
  
  // Purchases
  app.get("/api/purchases", async (req: Request, res: Response) => {
    const purchases = await storage.getPurchases();
    res.json(purchases);
  });
  
  app.get("/api/components/:id/purchases", async (req: Request, res: Response) => {
    const componentId = parseInt(req.params.id);
    const purchases = await storage.getComponentPurchases(componentId);
    res.json(purchases);
  });
  
  app.post("/api/purchases", async (req: Request, res: Response) => {
    try {
      const data = insertPurchaseSchema.parse(req.body);
      const purchase = await storage.createPurchase(data);
      res.status(201).json(purchase);
    } catch (error) {
      res.status(400).json({ error: "Invalid purchase data" });
    }
  });
  
  // Clients
  app.get("/api/clients", async (req: Request, res: Response) => {
    const clients = await storage.getClients();
    res.json(clients);
  });
  
  app.get("/api/clients/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const client = await storage.getClient(id);
    
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    
    res.json(client);
  });
  
  app.post("/api/clients", async (req: Request, res: Response) => {
    try {
      const data = insertClientSchema.parse(req.body);
      const client = await storage.createClient(data);
      res.status(201).json(client);
    } catch (error) {
      res.status(400).json({ error: "Invalid client data" });
    }
  });
  
  app.put("/api/clients/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertClientSchema.parse(req.body);
      const client = await storage.updateClient(id, data);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.json(client);
    } catch (error) {
      res.status(400).json({ error: "Invalid client data" });
    }
  });
  
  // Inverters
  app.get("/api/inverters", async (req: Request, res: Response) => {
    const inverters = await storage.getInverters();
    res.json(inverters);
  });
  
  app.get("/api/clients/:id/inverters", async (req: Request, res: Response) => {
    const clientId = parseInt(req.params.id);
    const inverters = await storage.getInvertersByClient(clientId);
    res.json(inverters);
  });
  
  app.get("/api/inverters/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const inverter = await storage.getInverter(id);
    
    if (!inverter) {
      return res.status(404).json({ message: "Inverter not found" });
    }
    
    res.json(inverter);
  });
  
  app.get("/api/inverters/by-serial/:serialNumber", async (req: Request, res: Response) => {
    const serialNumber = req.params.serialNumber;
    const inverter = await storage.getInverterBySerialNumber(serialNumber);
    
    if (!inverter) {
      return res.status(404).json({ message: "Inverter not found" });
    }
    
    res.json(inverter);
  });
  
  app.post("/api/inverters", async (req: Request, res: Response) => {
    try {
      const data = insertInverterSchema.parse(req.body);
      const inverter = await storage.createInverter(data);
      res.status(201).json(inverter);
    } catch (error) {
      res.status(400).json({ error: "Invalid inverter data" });
    }
  });
  
  app.put("/api/inverters/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertInverterSchema.parse(req.body);
      const inverter = await storage.updateInverter(id, data);
      
      if (!inverter) {
        return res.status(404).json({ message: "Inverter not found" });
      }
      
      res.json(inverter);
    } catch (error) {
      res.status(400).json({ error: "Invalid inverter data" });
    }
  });
  
  // Fault Types
  app.get("/api/fault-types", async (req: Request, res: Response) => {
    const faultTypes = await storage.getFaultTypes();
    res.json(faultTypes);
  });
  
  app.get("/api/fault-types/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const faultType = await storage.getFaultType(id);
    
    if (!faultType) {
      return res.status(404).json({ message: "Fault type not found" });
    }
    
    res.json(faultType);
  });
  
  app.post("/api/fault-types", async (req: Request, res: Response) => {
    try {
      const data = insertFaultTypeSchema.parse(req.body);
      const faultType = await storage.createFaultType(data);
      res.status(201).json(faultType);
    } catch (error) {
      res.status(400).json({ error: "Invalid fault type data" });
    }
  });
  
  // Repairs
  app.get("/api/repairs", async (req: Request, res: Response) => {
    const repairs = await storage.getRepairs();
    res.json(repairs);
  });
  
  app.get("/api/repairs/active", async (req: Request, res: Response) => {
    const repairs = await storage.getActiveRepairs();
    res.json(repairs);
  });
  
  app.get("/api/repairs/recent", async (req: Request, res: Response) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
    const repairs = await storage.getRecentRepairs(limit);
    res.json(repairs);
  });
  
  app.get("/api/clients/:id/repairs", async (req: Request, res: Response) => {
    const clientId = parseInt(req.params.id);
    const repairs = await storage.getRepairsByClient(clientId);
    res.json(repairs);
  });
  
  app.get("/api/inverters/:id/repairs", async (req: Request, res: Response) => {
    const inverterId = parseInt(req.params.id);
    const repairs = await storage.getRepairsByInverter(inverterId);
    res.json(repairs);
  });
  
  app.get("/api/repairs/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const repair = await storage.getRepair(id);
    
    if (!repair) {
      return res.status(404).json({ message: "Repair not found" });
    }
    
    res.json(repair);
  });
  
  app.post("/api/repairs", async (req: Request, res: Response) => {
    try {
      // Extract the data first to handle faultTypeName before validation
      const requestData = { ...req.body };
      
      // Handle date conversion for receivedDate
      if (requestData.receivedDate && typeof requestData.receivedDate === 'string') {
        requestData.receivedDate = new Date(requestData.receivedDate);
      }
      
      // Handle date conversion for completionDate
      if (requestData.completionDate && typeof requestData.completionDate === 'string') {
        requestData.completionDate = new Date(requestData.completionDate);
      }
      
      // Handle date conversion for estimatedCompletionDate
      if (requestData.estimatedCompletionDate && typeof requestData.estimatedCompletionDate === 'string') {
        requestData.estimatedCompletionDate = new Date(requestData.estimatedCompletionDate);
      }
      
      let faultTypeId = requestData.faultTypeId;
      
      // If faultTypeName is provided but no faultTypeId, try to create or find a fault type
      if (requestData.faultTypeName && !faultTypeId) {
        // Check if a fault type with this name already exists
        const existingFaultTypes = await storage.getFaultTypes();
        const matchingFaultType = existingFaultTypes.find(
          ft => ft.name.toLowerCase() === requestData.faultTypeName.toLowerCase()
        );
        
        if (matchingFaultType) {
          // Use existing fault type
          faultTypeId = matchingFaultType.id;
        } else if (requestData.faultTypeName.trim()) {
          // Create a new fault type if name is not empty
          try {
            const newFaultType = await storage.createFaultType({
              name: requestData.faultTypeName,
              description: null
            });
            faultTypeId = newFaultType.id;
          } catch (err) {
            console.error("Error creating new fault type:", err);
          }
        }
        
        // Update the request data with the found/created fault type ID
        requestData.faultTypeId = faultTypeId;
      }
      
      try {
        // Parse the incoming data with schema validation
        const data = insertRepairSchema.parse(requestData);
        
        // Initialize status history with the initial status
        const initialStatus = data.status || 'Received';
        const initialEntry: StatusHistoryEntry = {
          status: initialStatus as z.infer<typeof RepairStatusEnum>,
          timestamp: new Date(),
          note: 'Repair created',
          userId: null,
          userName: null
        };
        
        // Create the repair with status history
        const repair = await storage.createRepair({
          ...data,
          status: initialStatus,
          statusHistory: [initialEntry]
        });
        
        res.status(201).json(repair);
      } catch (parseError) {
        console.error("Schema validation error:", parseError);
        res.status(400).json({ error: "Invalid repair data", details: parseError });
      }
    } catch (error) {
      console.error("Error creating repair:", error);
      res.status(400).json({ error: "Invalid repair data" });
    }
  });
  
  app.put("/api/repairs/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Extract the data first to handle faultTypeName before validation
      const requestData = { ...req.body };
      
      // Handle date conversion for receivedDate
      if (requestData.receivedDate && typeof requestData.receivedDate === 'string') {
        requestData.receivedDate = new Date(requestData.receivedDate);
      }
      
      // Handle date conversion for completionDate
      if (requestData.completionDate && typeof requestData.completionDate === 'string') {
        requestData.completionDate = new Date(requestData.completionDate);
      }
      
      // Handle date conversion for estimatedCompletionDate
      if (requestData.estimatedCompletionDate && typeof requestData.estimatedCompletionDate === 'string') {
        requestData.estimatedCompletionDate = new Date(requestData.estimatedCompletionDate);
      }
      
      let faultTypeId = requestData.faultTypeId;
      
      // If faultTypeName is provided but no faultTypeId, try to create or find a fault type
      if (requestData.faultTypeName && !faultTypeId) {
        // Check if a fault type with this name already exists
        const existingFaultTypes = await storage.getFaultTypes();
        const matchingFaultType = existingFaultTypes.find(
          ft => ft.name.toLowerCase() === requestData.faultTypeName.toLowerCase()
        );
        
        if (matchingFaultType) {
          // Use existing fault type
          faultTypeId = matchingFaultType.id;
        } else if (requestData.faultTypeName.trim()) {
          // Create a new fault type if name is not empty
          try {
            const newFaultType = await storage.createFaultType({
              name: requestData.faultTypeName,
              description: null
            });
            faultTypeId = newFaultType.id;
          } catch (err) {
            console.error("Error creating new fault type:", err);
          }
        }
        
        // Update the request data with the found/created fault type ID
        requestData.faultTypeId = faultTypeId;
      }
      
      const data = insertRepairSchema.parse(requestData);
      const repair = await storage.updateRepair(id, data);
      
      if (!repair) {
        return res.status(404).json({ message: "Repair not found" });
      }
      
      res.json(repair);
    } catch (error) {
      console.error("Error updating repair:", error);
      res.status(400).json({ error: "Invalid repair data" });
    }
  });
  
  // Handler for both PATCH and POST requests to update repair status
  const handleRepairStatusUpdate = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      console.log("Received status update for repair ID:", id, "Body:", req.body);
      
      const schema = z.object({ 
        status: RepairStatusEnum,
        notes: z.string(),
        timestamp: z.string().optional(),
        photos: z.array(z.string()).optional()
      });
      
      // Safely parse the request body
      let requestData = {};
      try {
        requestData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      } catch (e) {
        console.error("Error parsing request body:", e);
        return res.status(400).json({ error: "Invalid request body format" });
      }
      
      const { status, notes, timestamp, photos } = schema.parse(requestData);
      
      const repair = await storage.getRepair(id);
      if (!repair) {
        return res.status(404).json({ message: "Repair not found" });
      }
      
      // Create a status history entry
      const statusHistoryEntry = {
        status,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        note: notes || null,
        userId: null, // Can be updated when authentication is implemented
        userName: null,
        photos: photos || []
      };
      
      // Get existing status history or initialize empty array
      const statusHistory = Array.isArray(repair.statusHistory) 
        ? [...repair.statusHistory, statusHistoryEntry]
        : [statusHistoryEntry];
      
      // Update the repair with new status and history
      const updatedRepair = await storage.updateRepair(id, { 
        ...repair, 
        status,
        statusHistory
      });
      
      res.json(updatedRepair);
    } catch (error) {
      console.error("Error updating repair status:", error);
      res.status(400).json({ error: "Invalid status data" });
    }
  }
  
  // Register both PATCH and POST endpoints for the same handler
  app.patch("/api/repairs/:id/status", handleRepairStatusUpdate);
  app.post("/api/repairs/:id/status", handleRepairStatusUpdate);
  
  // Used Components
  app.get("/api/repairs/:id/components", async (req: Request, res: Response) => {
    const repairId = parseInt(req.params.id);
    const usedComponents = await storage.getUsedComponentsByRepair(repairId);
    res.json(usedComponents);
  });
  
  app.post("/api/repairs/:id/components", async (req: Request, res: Response) => {
    try {
      const repairId = parseInt(req.params.id);
      const data = { ...req.body, repairId };
      const parsedData = insertUsedComponentSchema.parse(data);
      
      const usedComponent = await storage.createUsedComponent(parsedData);
      res.status(201).json(usedComponent);
    } catch (error) {
      res.status(400).json({ error: "Invalid used component data" });
    }
  });
  
  // Dashboard Data
  app.get("/api/dashboard/used-components", async (req: Request, res: Response) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
    const usedComponents = await storage.getMostUsedComponents(limit);
    res.json(usedComponents);
  });
  
  app.get("/api/dashboard/fault-types", async (req: Request, res: Response) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
    const faultTypes = await storage.getCommonFaultTypes(limit);
    res.json(faultTypes);
  });
  
  // AI Chatbot Endpoints
  app.post("/api/chat", handleChatQuery);
  app.post("/api/ai/operation", handleAiOperation);
  
  // PDF datasheet upload and analysis endpoint
  app.post("/api/analyze-datasheet", upload.single('datasheet'), async (req: Request, res: Response) => {
    try {
      const { componentName } = req.body;
      
      if (!componentName) {
        return res.status(400).json({ error: 'Component name is required' });
      }
      
      const pdfFile = req.file;
      if (!pdfFile) {
        return res.status(400).json({ error: 'PDF datasheet file is required' });
      }
      
      console.log(`Processing uploaded datasheet for ${componentName}`);
      console.log(`File saved at: ${pdfFile.path}`);
      
      // Process the datasheet using the AI service
      const analysis = await analyzeDatasheet('', componentName, pdfFile.path);
      
      return res.json({
        success: true,
        componentName,
        fileName: pdfFile.originalname,
        filePath: pdfFile.path,
        analysis
      });
    } catch (error) {
      console.error('Error analyzing uploaded datasheet:', error);
      return res.status(500).json({
        error: 'Failed to analyze datasheet',
        message: error.message
      });
    }
  });

  // Get unique inverter models for autocomplete
  app.get("/api/inverter-models", async (req: Request, res: Response) => {
    try {
      const models = await storage.getUniqueInverterModels();
      res.json(models);
    } catch (error) {
      console.error("Error fetching inverter models:", error);
      res.status(500).json({ error: "Failed to fetch inverter models" });
    }
  });

  // PDF Report generation endpoint
  app.get("/api/repairs/:id/report", async (req: Request, res: Response) => {
    const { id } = req.params;
    
    try {
      const repairId = parseInt(id);
      if (isNaN(repairId)) {
        return res.status(400).json({ error: "Invalid repair ID" });
      }
      
      // Fetch repair data
      const repair = await storage.getRepair(repairId);
      if (!repair) {
        return res.status(404).json({ error: "Repair not found" });
      }
      
      // Fetch related data
      const client = repair.clientId ? await storage.getClient(repair.clientId) : null;
      const inverter = repair.inverterId ? await storage.getInverter(repair.inverterId) : null;
      const faultType = repair.faultTypeId ? await storage.getFaultType(repair.faultTypeId) : null;
      const usedComponentsRaw = await storage.getUsedComponentsByRepair(repairId);
      
      // Get component details for each used component
      const usedComponents = await Promise.all(
        usedComponentsRaw.map(async (uc) => {
          const component = await storage.getComponent(uc.componentId);
          return {
            ...uc,
            componentName: component?.name || `Component #${uc.componentId}`,
            partNumber: component?.partNumber || 'N/A'
          };
        })
      );
      
      // Generate HTML content for PDF
      const htmlContent = generateRepairReportHTML(
        repair,
        client,
        inverter,
        faultType,
        usedComponents
      );
      
      // Return HTML content for client-side PDF generation
      res.setHeader('Content-Type', 'text/html');
      res.send(htmlContent);
      
    } catch (error) {
      console.error("Error generating repair report:", error);
      res.status(500).json({ error: "Failed to generate repair report" });
    }
  });

  // Settings API endpoints
  app.get("/api/settings/:key", async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      
      console.log(`Getting settings for key: ${key}`);
      
      // Get settings from database using SQL query
      const result = await db.execute(
        `SELECT value FROM settings WHERE key = $1`,
        [key]
      );
      
      console.log(`Database result:`, result.rows);
      
      // Check if settings exist
      if (!result || !result.rows || result.rows.length === 0) {
        console.log(`No settings found for key: ${key}`);
        return res.status(404).json({ message: "Settings not found" });
      }
      
      // Make sure we return a parsed JSON object (not a string)
      let settingsValue = result.rows[0].value;
      console.log(`Raw settings value:`, settingsValue);
      
      if (typeof settingsValue === 'string') {
        try {
          settingsValue = JSON.parse(settingsValue);
          console.log(`Parsed settings value:`, settingsValue);
        } catch (e) {
          console.error("Error parsing settings JSON:", e);
        }
      }
      
      res.json(settingsValue);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });
  
  app.put("/api/settings/:key", async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const value = req.body;
      
      // Update or insert settings
      const result = await db.execute(
        `INSERT INTO settings (key, value, updated_at) 
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (key) 
         DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [key, JSON.stringify(value)]
      );
      
      if (!result || !result.rows || result.rows.length === 0) {
        return res.status(500).json({ error: "Failed to update settings" });
      }
      
      // Make sure we return a parsed JSON object (not a string)
      let settingsValue = result.rows[0].value;
      if (typeof settingsValue === 'string') {
        try {
          settingsValue = JSON.parse(settingsValue);
        } catch (e) {
          console.error("Error parsing settings JSON:", e);
        }
      }
      
      res.json(settingsValue);
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

// Helper function to generate HTML content for PDF reports
function generateRepairReportHTML(
  repair: any,
  client: any,
  inverter: any,
  faultType: any,
  usedComponents: any[]
) {
  const components = usedComponents || [];
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Repair Report #${repair.id}</title>
      <style>
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
          img { max-width: 120px !important; height: auto !important; }
        }
        @page {
          size: A4;
          margin: 1in;
        }
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #2563eb;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #1e40af;
          margin: 0;
          font-size: 28px;
        }
        .header h2 {
          color: #64748b;
          margin: 5px 0;
          font-size: 18px;
          font-weight: normal;
        }
        .section {
          margin-bottom: 30px;
          background: #f8fafc;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #2563eb;
        }
        .section h3 {
          color: #1e40af;
          margin-top: 0;
          font-size: 18px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-top: 15px;
        }
        .info-item {
          background: white;
          padding: 10px;
          border-radius: 4px;
          border: 1px solid #e2e8f0;
        }
        .info-label {
          font-weight: bold;
          color: #64748b;
          font-size: 12px;
          text-transform: uppercase;
        }
        .info-value {
          color: #1e293b;
          margin-top: 2px;
        }
        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
        }
        .status-pending { background: #fef3c7; color: #92400e; }
        .status-in-progress { background: #dbeafe; color: #1d4ed8; }
        .status-completed { background: #d1fae5; color: #065f46; }
        .status-cancelled { background: #fee2e2; color: #dc2626; }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
          background: white;
        }
        th, td {
          padding: 12px;
          text-align: left;
          border: 1px solid #e2e8f0;
        }
        th {
          background: #f1f5f9;
          font-weight: bold;
          color: #1e293b;
        }
        .progress-updates {
          margin-top: 20px;
        }
        .update-item {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 15px;
          margin-bottom: 15px;
        }
        .update-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        .update-status {
          font-weight: bold;
          color: #1e40af;
        }
        .update-date {
          color: #64748b;
          font-size: 14px;
        }
        .update-notes {
          color: #374151;
          line-height: 1.5;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          color: #64748b;
          font-size: 12px;
          border-top: 1px solid #e2e8f0;
          padding-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Solar Inverter Repair Report</h1>
        <h2>Repair #${repair.id}</h2>
        <p>Generated on ${formatDateTime(new Date().toISOString())}</p>
      </div>

      <div class="section">
        <h3>Client Information</h3>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Client Name</div>
            <div class="info-value">${client?.name || 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Email</div>
            <div class="info-value">${client?.email || 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Phone</div>
            <div class="info-value">${client?.phone || 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Address</div>
            <div class="info-value">${client?.address || 'N/A'}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h3>Device Information</h3>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Inverter Model</div>
            <div class="info-value">${repair.inverterModel || inverter?.model || 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Serial Number</div>
            <div class="info-value">${repair.inverterSerialNumber || inverter?.serialNumber || 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Warranty Status</div>
            <div class="info-value">${inverter?.warrantyStatus || 'Unknown'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Installation Date</div>
            <div class="info-value">${inverter?.installationDate ? formatDateTime(inverter.installationDate) : 'N/A'}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h3>Repair Details</h3>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Status</div>
            <div class="info-value">
              <span class="status-badge status-${repair.status?.toLowerCase().replace(' ', '-')}">${repair.status || 'N/A'}</span>
            </div>
          </div>
          <div class="info-item">
            <div class="info-label">Fault Type</div>
            <div class="info-value">${faultType?.name || 'Not categorized'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Received Date</div>
            <div class="info-value">${formatDateTime(repair.receivedDate)}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Estimated Completion</div>
            <div class="info-value">${repair.estimatedCompletionDate ? formatDateTime(repair.estimatedCompletionDate) : 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Technician</div>
            <div class="info-value">${repair.technicianName || 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Labor Hours</div>
            <div class="info-value">${repair.laborHours || '0'}</div>
          </div>
        </div>
        
        <div style="margin-top: 15px;">
          <div class="info-label">Fault Description</div>
          <div style="background: white; padding: 15px; border-radius: 4px; border: 1px solid #e2e8f0; margin-top: 5px;">
            ${repair.faultDescription || 'No description provided'}
          </div>
        </div>
      </div>

      ${repair.statusHistory && repair.statusHistory.length > 0 ? `
      <div class="section">
        <h3>Progress Updates</h3>
        <div class="progress-updates">
          ${repair.statusHistory.map((update: any) => `
            <div class="update-item">
              <div class="update-header">
                <span class="update-status">${update.status}</span>
                <span class="update-date">${formatDateTime(update.timestamp)}</span>
              </div>
              ${update.note ? `<div class="update-notes">${update.note}</div>` : ''}
              ${update.photos && update.photos.length > 0 ? `
                <div style="margin-top: 15px;">
                  <div class="info-label" style="margin-bottom: 10px;">Attached Photos (${update.photos.length}):</div>
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 200px)); gap: 15px; margin-top: 10px; justify-content: start;">
                    ${update.photos.map((photo: string) => `
                      <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; background: white;">
                        <img src="${photo}" alt="Progress photo" style="width: 100%; max-width: 200px; height: auto; object-fit: contain; border-radius: 6px; margin-bottom: 8px;" />
                        <div style="font-size: 12px; color: #64748b; text-align: center;">Progress Photo</div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}

      ${components && components.length > 0 ? `
      <div class="section">
        <h3>Components Used</h3>
        <table>
          <thead>
            <tr>
              <th>Component</th>
              <th>Part Number</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${components.map((comp: any) => `
              <tr>
                <td>${comp.componentName || `Component #${comp.componentId}`}</td>
                <td>${comp.partNumber || 'N/A'}</td>
                <td>${comp.quantity}</td>
                <td>${formatCurrency(comp.unitPrice)}</td>
                <td>${formatCurrency(comp.quantity * comp.unitPrice)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div style="margin-top: 20px; text-align: right;">
          <div><strong>Parts Cost: ${formatCurrency(repair.totalPartsCost || 0)}</strong></div>
          <div><strong>Labor Cost: ${formatCurrency((repair.laborHours || 0) * (repair.laborRate || 0))}</strong></div>
          <div style="font-size: 18px; color: #1e40af;"><strong>Total Cost: ${formatCurrency(repair.totalCost || 0)}</strong></div>
        </div>
      </div>
      ` : ''}

      <div class="footer">
        <p>Solar Inverter Repair Management System</p>
        <p>This report was automatically generated on ${formatDateTime(new Date().toISOString())}</p>
      </div>
      
      <div class="no-print" style="position: fixed; top: 20px; right: 20px; z-index: 1000;">
        <button onclick="window.print()" style="background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: bold;">
          Print/Save as PDF
        </button>
        <button onclick="window.close()" style="background: #6b7280; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px; margin-left: 10px;">
          Close
        </button>
      </div>
    </body>
    </html>
  `;
}
