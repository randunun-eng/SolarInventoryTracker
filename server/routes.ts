import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
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
  RepairStatusEnum
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

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
      const data = insertComponentSchema.parse(req.body);
      const component = await storage.createComponent(data);
      res.status(201).json(component);
    } catch (error) {
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
  
  app.get("/api/components/low-stock", async (req: Request, res: Response) => {
    const components = await storage.getLowStockComponents();
    res.json(components);
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
      const data = insertRepairSchema.parse(req.body);
      const repair = await storage.createRepair(data);
      res.status(201).json(repair);
    } catch (error) {
      res.status(400).json({ error: "Invalid repair data" });
    }
  });
  
  app.put("/api/repairs/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertRepairSchema.parse(req.body);
      const repair = await storage.updateRepair(id, data);
      
      if (!repair) {
        return res.status(404).json({ message: "Repair not found" });
      }
      
      res.json(repair);
    } catch (error) {
      res.status(400).json({ error: "Invalid repair data" });
    }
  });
  
  app.patch("/api/repairs/:id/status", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const schema = z.object({ status: RepairStatusEnum });
      const { status } = schema.parse(req.body);
      
      const repair = await storage.getRepair(id);
      if (!repair) {
        return res.status(404).json({ message: "Repair not found" });
      }
      
      const updatedRepair = await storage.updateRepair(id, { ...repair, status });
      res.json(updatedRepair);
    } catch (error) {
      res.status(400).json({ error: "Invalid status data" });
    }
  });
  
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

  const httpServer = createServer(app);

  return httpServer;
}
