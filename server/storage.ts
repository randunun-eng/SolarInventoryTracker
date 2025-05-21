import { 
  type User, type InsertUser, 
  type Category, type InsertCategory,
  type Supplier, type InsertSupplier,
  type Component, type InsertComponent,
  type Purchase, type InsertPurchase,
  type Client, type InsertClient,
  type Inverter, type InsertInverter,
  type FaultType, type InsertFaultType,
  type Repair, type InsertRepair,
  type UsedComponent, type InsertUsedComponent
} from "@shared/schema";

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User management
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // Category management
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: InsertCategory): Promise<Category | undefined>;
  
  // Supplier management
  getSuppliers(): Promise<Supplier[]>;
  getSupplier(id: number): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, supplier: InsertSupplier): Promise<Supplier | undefined>;
  
  // Component management
  getComponents(): Promise<Component[]>;
  getComponent(id: number): Promise<Component | undefined>;
  createComponent(component: InsertComponent): Promise<Component>;
  updateComponent(id: number, component: InsertComponent): Promise<Component | undefined>;
  updateComponentStock(id: number, quantity: number): Promise<Component | undefined>;
  getLowStockComponents(): Promise<Component[]>;
  
  // Purchase management
  getPurchases(): Promise<Purchase[]>;
  getComponentPurchases(componentId: number): Promise<Purchase[]>;
  createPurchase(purchase: InsertPurchase): Promise<Purchase>;
  
  // Client management
  getClients(): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: InsertClient): Promise<Client | undefined>;
  
  // Inverter management
  getInverters(): Promise<Inverter[]>;
  getInvertersByClient(clientId: number): Promise<Inverter[]>;
  getInverter(id: number): Promise<Inverter | undefined>;
  getInverterBySerialNumber(serialNumber: string): Promise<Inverter | undefined>;
  createInverter(inverter: InsertInverter): Promise<Inverter>;
  updateInverter(id: number, inverter: InsertInverter): Promise<Inverter | undefined>;
  
  // Fault type management
  getFaultTypes(): Promise<FaultType[]>;
  getFaultType(id: number): Promise<FaultType | undefined>;
  createFaultType(faultType: InsertFaultType): Promise<FaultType>;
  
  // Repair management
  getRepairs(): Promise<Repair[]>;
  getRepairsByClient(clientId: number): Promise<Repair[]>;
  getRepairsByInverter(inverterId: number): Promise<Repair[]>;
  getRepair(id: number): Promise<Repair | undefined>;
  createRepair(repair: InsertRepair): Promise<Repair>;
  updateRepair(id: number, repair: InsertRepair): Promise<Repair | undefined>;
  getActiveRepairs(): Promise<Repair[]>;
  getRecentRepairs(limit: number): Promise<Repair[]>;
  
  // Used components management
  getUsedComponentsByRepair(repairId: number): Promise<UsedComponent[]>;
  createUsedComponent(usedComponent: InsertUsedComponent): Promise<UsedComponent>;
  getMostUsedComponents(limit: number): Promise<{componentId: number, componentName: string, totalUsed: number}[]>;
  getCommonFaultTypes(limit: number): Promise<{faultTypeId: number, faultTypeName: string, percentage: number}[]>;
}

// implement the interface with a memory storage
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private suppliers: Map<number, Supplier>;
  private components: Map<number, Component>;
  private purchases: Map<number, Purchase>;
  private clients: Map<number, Client>;
  private inverters: Map<number, Inverter>;
  private faultTypes: Map<number, FaultType>;
  private repairs: Map<number, Repair>;
  private usedComponents: Map<number, UsedComponent>;
  
  private currentUserId: number;
  private currentCategoryId: number;
  private currentSupplierId: number;
  private currentComponentId: number;
  private currentPurchaseId: number;
  private currentClientId: number;
  private currentInverterId: number;
  private currentFaultTypeId: number;
  private currentRepairId: number;
  private currentUsedComponentId: number;
  
  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.suppliers = new Map();
    this.components = new Map();
    this.purchases = new Map();
    this.clients = new Map();
    this.inverters = new Map();
    this.faultTypes = new Map();
    this.repairs = new Map();
    this.usedComponents = new Map();
    
    this.currentUserId = 1;
    this.currentCategoryId = 1;
    this.currentSupplierId = 1;
    this.currentComponentId = 1;
    this.currentPurchaseId = 1;
    this.currentClientId = 1;
    this.currentInverterId = 1;
    this.currentFaultTypeId = 1;
    this.currentRepairId = 1;
    this.currentUsedComponentId = 1;
    
    this.initializeData();
  }
  
  private initializeData() {
    // Create initial data for demo
    // Create admin user
    this.createUser({
      username: "admin",
      password: "admin123",
      name: "John Doe",
      role: "Admin"
    });
  }

  // User Management
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    // Check if username already exists
    const existingUser = await this.getUserByUsername(user.username);
    if (existingUser) {
      throw new Error(`Username "${user.username}" is already taken.`);
    }
    
    const id = this.currentUserId++;
    const newUser: User = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    // Check if username is being changed and is not already taken
    if (userData.username && userData.username !== user.username) {
      const existingUser = await this.getUserByUsername(userData.username);
      if (existingUser) {
        throw new Error(`Username "${userData.username}" is already taken.`);
      }
    }
    
    const updatedUser: User = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    // Don't allow deleting the last admin user
    const users = Array.from(this.users.values());
    const admins = users.filter(user => user.role === 'Admin');
    
    const userToDelete = this.users.get(id);
    if (!userToDelete) return false;
    
    if (userToDelete.role === 'Admin' && admins.length <= 1) {
      throw new Error('Cannot delete the last admin user');
    }
    
    return this.users.delete(id);
  }
  
  // Category Management
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }
  
  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }
  
  async createCategory(category: InsertCategory): Promise<Category> {
    const id = this.currentCategoryId++;
    const newCategory: Category = { ...category, id };
    this.categories.set(id, newCategory);
    return newCategory;
  }
  
  async updateCategory(id: number, category: InsertCategory): Promise<Category | undefined> {
    const existingCategory = this.categories.get(id);
    if (!existingCategory) return undefined;
    
    const updatedCategory: Category = { ...existingCategory, ...category };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }
  
  // Supplier Management
  async getSuppliers(): Promise<Supplier[]> {
    return Array.from(this.suppliers.values());
  }
  
  async getSupplier(id: number): Promise<Supplier | undefined> {
    return this.suppliers.get(id);
  }
  
  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const id = this.currentSupplierId++;
    const newSupplier: Supplier = { ...supplier, id };
    this.suppliers.set(id, newSupplier);
    return newSupplier;
  }
  
  async updateSupplier(id: number, supplier: InsertSupplier): Promise<Supplier | undefined> {
    const existingSupplier = this.suppliers.get(id);
    if (!existingSupplier) return undefined;
    
    const updatedSupplier: Supplier = { ...existingSupplier, ...supplier };
    this.suppliers.set(id, updatedSupplier);
    return updatedSupplier;
  }
  
  // Component Management
  async getComponents(): Promise<Component[]> {
    return Array.from(this.components.values());
  }
  
  async getComponent(id: number): Promise<Component | undefined> {
    return this.components.get(id);
  }
  
  async createComponent(component: InsertComponent): Promise<Component> {
    const id = this.currentComponentId++;
    const newComponent: Component = { ...component, id };
    this.components.set(id, newComponent);
    return newComponent;
  }
  
  async updateComponent(id: number, component: InsertComponent): Promise<Component | undefined> {
    const existingComponent = this.components.get(id);
    if (!existingComponent) return undefined;
    
    const updatedComponent: Component = { ...existingComponent, ...component };
    this.components.set(id, updatedComponent);
    return updatedComponent;
  }
  
  async updateComponentStock(id: number, quantity: number): Promise<Component | undefined> {
    const existingComponent = this.components.get(id);
    if (!existingComponent) return undefined;
    
    const newStock = existingComponent.currentStock + quantity;
    
    const updatedComponent: Component = { ...existingComponent, currentStock: newStock };
    this.components.set(id, updatedComponent);
    return updatedComponent;
  }
  
  async getLowStockComponents(): Promise<Component[]> {
    return Array.from(this.components.values()).filter(
      (component) => component.currentStock < component.minimumStock
    );
  }
  
  // Purchase Management
  async getPurchases(): Promise<Purchase[]> {
    return Array.from(this.purchases.values());
  }
  
  async getComponentPurchases(componentId: number): Promise<Purchase[]> {
    return Array.from(this.purchases.values()).filter(
      (purchase) => purchase.componentId === componentId
    );
  }
  
  async createPurchase(purchase: InsertPurchase): Promise<Purchase> {
    const id = this.currentPurchaseId++;
    const newPurchase: Purchase = { ...purchase, id };
    this.purchases.set(id, newPurchase);
    return newPurchase;
  }
  
  // Client Management
  async getClients(): Promise<Client[]> {
    return Array.from(this.clients.values());
  }
  
  async getClient(id: number): Promise<Client | undefined> {
    return this.clients.get(id);
  }
  
  async createClient(client: InsertClient): Promise<Client> {
    const id = this.currentClientId++;
    const newClient: Client = { ...client, id };
    this.clients.set(id, newClient);
    return newClient;
  }
  
  async updateClient(id: number, client: InsertClient): Promise<Client | undefined> {
    const existingClient = this.clients.get(id);
    if (!existingClient) return undefined;
    
    const updatedClient: Client = { ...existingClient, ...client };
    this.clients.set(id, updatedClient);
    return updatedClient;
  }
  
  // Inverter Management
  async getInverters(): Promise<Inverter[]> {
    return Array.from(this.inverters.values());
  }
  
  async getInvertersByClient(clientId: number): Promise<Inverter[]> {
    return Array.from(this.inverters.values()).filter(
      (inverter) => inverter.clientId === clientId
    );
  }
  
  async getInverter(id: number): Promise<Inverter | undefined> {
    return this.inverters.get(id);
  }
  
  async getInverterBySerialNumber(serialNumber: string): Promise<Inverter | undefined> {
    return Array.from(this.inverters.values()).find(
      (inverter) => inverter.serialNumber === serialNumber
    );
  }
  
  async createInverter(inverter: InsertInverter): Promise<Inverter> {
    const id = this.currentInverterId++;
    const newInverter: Inverter = { ...inverter, id };
    this.inverters.set(id, newInverter);
    return newInverter;
  }
  
  async updateInverter(id: number, inverter: InsertInverter): Promise<Inverter | undefined> {
    const existingInverter = this.inverters.get(id);
    if (!existingInverter) return undefined;
    
    const updatedInverter: Inverter = { ...existingInverter, ...inverter };
    this.inverters.set(id, updatedInverter);
    return updatedInverter;
  }
  
  // Fault Type Management
  async getFaultTypes(): Promise<FaultType[]> {
    return Array.from(this.faultTypes.values());
  }
  
  async getFaultType(id: number): Promise<FaultType | undefined> {
    return this.faultTypes.get(id);
  }
  
  async createFaultType(faultType: InsertFaultType): Promise<FaultType> {
    const id = this.currentFaultTypeId++;
    const newFaultType: FaultType = { ...faultType, id };
    this.faultTypes.set(id, newFaultType);
    return newFaultType;
  }
  
  // Repair Management
  async getRepairs(): Promise<Repair[]> {
    return Array.from(this.repairs.values());
  }
  
  async getRepairsByClient(clientId: number): Promise<Repair[]> {
    return Array.from(this.repairs.values()).filter(
      (repair) => repair.clientId === clientId
    );
  }
  
  async getRepairsByInverter(inverterId: number): Promise<Repair[]> {
    return Array.from(this.repairs.values()).filter(
      (repair) => repair.inverterId === inverterId
    );
  }
  
  async getRepair(id: number): Promise<Repair | undefined> {
    return this.repairs.get(id);
  }
  
  async createRepair(repair: InsertRepair): Promise<Repair> {
    const id = this.currentRepairId++;
    const newRepair: Repair = { ...repair, id };
    this.repairs.set(id, newRepair);
    return newRepair;
  }
  
  async updateRepair(id: number, repair: InsertRepair): Promise<Repair | undefined> {
    const existingRepair = this.repairs.get(id);
    if (!existingRepair) return undefined;
    
    const updatedRepair: Repair = { ...existingRepair, ...repair };
    this.repairs.set(id, updatedRepair);
    return updatedRepair;
  }
  
  async getActiveRepairs(): Promise<Repair[]> {
    return Array.from(this.repairs.values()).filter(
      (repair) => repair.status !== 'Completed' && repair.status !== 'Cancelled'
    );
  }
  
  async getRecentRepairs(limit: number): Promise<Repair[]> {
    return Array.from(this.repairs.values())
      .sort((a, b) => new Date(b.receivedDate).getTime() - new Date(a.receivedDate).getTime())
      .slice(0, limit);
  }
  
  // Used Components Management
  async getUsedComponentsByRepair(repairId: number): Promise<UsedComponent[]> {
    return Array.from(this.usedComponents.values()).filter(
      (usedComponent) => usedComponent.repairId === repairId
    );
  }
  
  async createUsedComponent(usedComponent: InsertUsedComponent): Promise<UsedComponent> {
    const id = this.currentUsedComponentId++;
    const newUsedComponent: UsedComponent = { ...usedComponent, id };
    this.usedComponents.set(id, newUsedComponent);
    return newUsedComponent;
  }
  
  async getMostUsedComponents(limit: number): Promise<{componentId: number, componentName: string, totalUsed: number}[]> {
    const componentUsage = new Map<number, number>();
    
    // Count usage of each component
    for (const uc of this.usedComponents.values()) {
      const currentCount = componentUsage.get(uc.componentId) || 0;
      componentUsage.set(uc.componentId, currentCount + uc.quantity);
    }
    
    // Convert to array and get component details
    const result = Array.from(componentUsage.entries())
      .map(([componentId, totalUsed]) => {
        const component = this.components.get(componentId);
        return {
          componentId,
          componentName: component ? component.name : `Component #${componentId}`,
          totalUsed
        };
      })
      .sort((a, b) => b.totalUsed - a.totalUsed)
      .slice(0, limit);
    
    return result;
  }
  
  async getCommonFaultTypes(limit: number): Promise<{faultTypeId: number, faultTypeName: string, percentage: number}[]> {
    const faultTypeCounts = new Map<number, number>();
    let totalRepairs = 0;
    
    // Count occurrences of each fault type
    this.repairs.forEach(repair => {
      if (repair.faultTypeId) {
        totalRepairs++;
        const currentCount = faultTypeCounts.get(repair.faultTypeId) || 0;
        faultTypeCounts.set(repair.faultTypeId, currentCount + 1);
      }
    });
    
    // Convert to array with percentages and sort
    const result = Array.from(faultTypeCounts.entries())
      .map(([faultTypeId, count]) => {
        const faultType = this.faultTypes.get(faultTypeId);
        return {
          faultTypeId,
          faultTypeName: faultType ? faultType.name : `Fault Type #${faultTypeId}`,
          percentage: Math.round((count / totalRepairs) * 100)
        };
      })
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, limit);
    
    return result;
  }
}

// Implementation using PostgreSQL database
/*
import { 
  eq, 
  and, 
  lte, 
  desc, 
  count, 
  sql, 
  gt,
  isNull
} from "drizzle-orm";
import { db } from "./db";
import {
  users,
  categories,
  suppliers,
  components,
  purchases,
  clients,
  inverters,
  faultTypes,
  repairs,
  usedComponents
} from "@shared/schema";

class DatabaseStorageClass implements IStorage {
  // User Management
  async getUsers(): Promise<User[]> {
    return db.select().from(users);
  }
  
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    // Check if username already exists
    const existingUser = await this.getUserByUsername(userData.username);
    if (existingUser) {
      throw new Error(`Username "${userData.username}" is already taken`);
    }
    
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    // Check if user exists
    const existingUser = await this.getUser(id);
    if (!existingUser) {
      return undefined;
    }
    
    // Check if username is being changed and not already taken
    if (userData.username && userData.username !== existingUser.username) {
      const userWithSameUsername = await this.getUserByUsername(userData.username);
      if (userWithSameUsername) {
        throw new Error(`Username "${userData.username}" is already taken`);
      }
    }
    
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    // Get all admin users
    const adminUsers = await db
      .select()
      .from(users)
      .where(eq(users.role, 'Admin'));
    
    // Get the user to delete
    const userToDelete = await this.getUser(id);
    if (!userToDelete) {
      return false;
    }
    
    // Check if trying to delete the last admin
    if (userToDelete.role === 'Admin' && adminUsers.length <= 1) {
      throw new Error('Cannot delete the last admin user');
    }
    
    // Delete the user
    const result = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning();
    
    return result.length > 0;
  }
}
*/

// Uncomment this section to use Database storage
import { 
  eq, 
  and, 
  lte, 
  desc, 
  count, 
  sql, 
  gt,
  isNull
} from "drizzle-orm";
import { db } from "./db";
import {
  users,
  categories,
  suppliers,
  components,
  purchases,
  clients,
  inverters,
  faultTypes,
  repairs,
  usedComponents
} from "@shared/schema";

class DatabaseStorageClass implements IStorage {
  // User Management
  async getUsers(): Promise<User[]> {
    return db.select().from(users);
  }
  
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    // Check if username already exists
    const existingUser = await this.getUserByUsername(userData.username);
    if (existingUser) {
      throw new Error(`Username "${userData.username}" is already taken`);
    }
    
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    // Check if user exists
    const existingUser = await this.getUser(id);
    if (!existingUser) {
      return undefined;
    }
    
    // Check if username is being changed and not already taken
    if (userData.username && userData.username !== existingUser.username) {
      const userWithSameUsername = await this.getUserByUsername(userData.username);
      if (userWithSameUsername) {
        throw new Error(`Username "${userData.username}" is already taken`);
      }
    }
    
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    // Get all admin users
    const adminUsers = await db
      .select()
      .from(users)
      .where(eq(users.role, 'Admin'));
    
    // Get the user to delete
    const userToDelete = await this.getUser(id);
    if (!userToDelete) {
      return false;
    }
    
    // Check if trying to delete the last admin
    if (userToDelete.role === 'Admin' && adminUsers.length <= 1) {
      throw new Error('Cannot delete the last admin user');
    }
    
    // Delete the user
    const result = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning();
    
    return result.length > 0;
  }
  
  // Category Management
  async getCategories(): Promise<Category[]> {
    return db.select().from(categories);
  }
  
  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }
  
  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }
  
  async updateCategory(id: number, category: InsertCategory): Promise<Category | undefined> {
    const [updatedCategory] = await db
      .update(categories)
      .set(category)
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory;
  }

  // Supplier Management
  async getSuppliers(): Promise<Supplier[]> {
    return db.select().from(suppliers);
  }
  
  async getSupplier(id: number): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return supplier;
  }
  
  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const [newSupplier] = await db.insert(suppliers).values(supplier).returning();
    return newSupplier;
  }
  
  async updateSupplier(id: number, supplier: InsertSupplier): Promise<Supplier | undefined> {
    const [updatedSupplier] = await db
      .update(suppliers)
      .set(supplier)
      .where(eq(suppliers.id, id))
      .returning();
    return updatedSupplier;
  }
  
  // Component Management
  async getComponents(): Promise<Component[]> {
    return db.select().from(components);
  }
  
  async getComponent(id: number): Promise<Component | undefined> {
    const [component] = await db.select().from(components).where(eq(components.id, id));
    return component;
  }
  
  async createComponent(component: InsertComponent): Promise<Component> {
    const [newComponent] = await db.insert(components).values(component).returning();
    return newComponent;
  }
  
  async updateComponent(id: number, component: InsertComponent): Promise<Component | undefined> {
    const [updatedComponent] = await db
      .update(components)
      .set(component)
      .where(eq(components.id, id))
      .returning();
    return updatedComponent;
  }
  
  async updateComponentStock(id: number, quantity: number): Promise<Component | undefined> {
    const component = await this.getComponent(id);
    if (!component) return undefined;
    
    const newStock = (component.currentStock || 0) + quantity;
    
    const [updatedComponent] = await db
      .update(components)
      .set({ currentStock: newStock })
      .where(eq(components.id, id))
      .returning();
    
    return updatedComponent;
  }
  
  async getLowStockComponents(): Promise<Component[]> {
    return db
      .select()
      .from(components)
      .where(
        and(
          gt(components.minimumStock, 0),
          lte(components.currentStock, components.minimumStock)
        )
      );
  }
  
  // Purchase Management
  async getPurchases(): Promise<Purchase[]> {
    return db.select().from(purchases);
  }
  
  async getComponentPurchases(componentId: number): Promise<Purchase[]> {
    return db
      .select()
      .from(purchases)
      .where(eq(purchases.componentId, componentId));
  }
  
  async createPurchase(purchase: InsertPurchase): Promise<Purchase> {
    const [newPurchase] = await db.insert(purchases).values(purchase).returning();
    return newPurchase;
  }
  
  // Client Management
  async getClients(): Promise<Client[]> {
    return db.select().from(clients);
  }
  
  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }
  
  async createClient(client: InsertClient): Promise<Client> {
    const [newClient] = await db.insert(clients).values(client).returning();
    return newClient;
  }
  
  async updateClient(id: number, client: InsertClient): Promise<Client | undefined> {
    const [updatedClient] = await db
      .update(clients)
      .set(client)
      .where(eq(clients.id, id))
      .returning();
    return updatedClient;
  }
  
  // Inverter Management
  async getInverters(): Promise<Inverter[]> {
    return db.select().from(inverters);
  }
  
  async getInvertersByClient(clientId: number): Promise<Inverter[]> {
    return db
      .select()
      .from(inverters)
      .where(eq(inverters.clientId, clientId));
  }
  
  async getInverter(id: number): Promise<Inverter | undefined> {
    const [inverter] = await db.select().from(inverters).where(eq(inverters.id, id));
    return inverter;
  }
  
  async getInverterBySerialNumber(serialNumber: string): Promise<Inverter | undefined> {
    const [inverter] = await db
      .select()
      .from(inverters)
      .where(eq(inverters.serialNumber, serialNumber));
    return inverter;
  }
  
  async createInverter(inverter: InsertInverter): Promise<Inverter> {
    const [newInverter] = await db.insert(inverters).values(inverter).returning();
    return newInverter;
  }
  
  async updateInverter(id: number, inverter: InsertInverter): Promise<Inverter | undefined> {
    const [updatedInverter] = await db
      .update(inverters)
      .set(inverter)
      .where(eq(inverters.id, id))
      .returning();
    return updatedInverter;
  }
  
  // Fault Type Management
  async getFaultTypes(): Promise<FaultType[]> {
    return db.select().from(faultTypes);
  }
  
  async getFaultType(id: number): Promise<FaultType | undefined> {
    const [faultType] = await db.select().from(faultTypes).where(eq(faultTypes.id, id));
    return faultType;
  }
  
  async createFaultType(faultType: InsertFaultType): Promise<FaultType> {
    const [newFaultType] = await db.insert(faultTypes).values(faultType).returning();
    return newFaultType;
  }
  
  // Repair Management
  async getRepairs(): Promise<Repair[]> {
    return db.select().from(repairs);
  }
  
  async getRepairsByClient(clientId: number): Promise<Repair[]> {
    return db
      .select()
      .from(repairs)
      .where(eq(repairs.clientId, clientId));
  }
  
  async getRepairsByInverter(inverterId: number): Promise<Repair[]> {
    return db
      .select()
      .from(repairs)
      .where(eq(repairs.inverterId, inverterId));
  }
  
  async getRepair(id: number): Promise<Repair | undefined> {
    const [repair] = await db.select().from(repairs).where(eq(repairs.id, id));
    return repair;
  }
  
  async createRepair(repair: InsertRepair): Promise<Repair> {
    const [newRepair] = await db.insert(repairs).values(repair).returning();
    return newRepair;
  }
  
  async updateRepair(id: number, repair: InsertRepair): Promise<Repair | undefined> {
    const [updatedRepair] = await db
      .update(repairs)
      .set(repair)
      .where(eq(repairs.id, id))
      .returning();
    return updatedRepair;
  }
  
  async getActiveRepairs(): Promise<Repair[]> {
    return db
      .select()
      .from(repairs)
      .where(
        and(
          sql`${repairs.status} != 'Completed'`,
          sql`${repairs.status} != 'Cancelled'`
        )
      );
  }
  
  async getRecentRepairs(limit: number): Promise<Repair[]> {
    return db
      .select()
      .from(repairs)
      .orderBy(desc(repairs.receivedDate))
      .limit(limit);
  }
  
  // Used Components Management
  async getUsedComponentsByRepair(repairId: number): Promise<UsedComponent[]> {
    return db
      .select()
      .from(usedComponents)
      .where(eq(usedComponents.repairId, repairId));
  }
  
  async createUsedComponent(usedComponent: InsertUsedComponent): Promise<UsedComponent> {
    const [newUsedComponent] = await db.insert(usedComponents).values(usedComponent).returning();
    return newUsedComponent;
  }
  
  async getMostUsedComponents(limit: number): Promise<{componentId: number, componentName: string, totalUsed: number}[]> {
    const result = await db
      .select({
        componentId: usedComponents.componentId,
        totalUsed: sql`SUM(${usedComponents.quantity})`.as('total_used')
      })
      .from(usedComponents)
      .groupBy(usedComponents.componentId)
      .orderBy(desc(sql`SUM(${usedComponents.quantity})`))
      .limit(limit);
    
    // Get component names
    const componentsWithNames = await Promise.all(
      result.map(async (item) => {
        const component = await this.getComponent(item.componentId);
        return {
          componentId: item.componentId,
          componentName: component ? component.name : `Component #${item.componentId}`,
          totalUsed: Number(item.totalUsed)
        };
      })
    );
    
    return componentsWithNames;
  }
  
  async getCommonFaultTypes(limit: number): Promise<{faultTypeId: number, faultTypeName: string, percentage: number}[]> {
    const totalRepairsCount = await db
      .select({ count: count() })
      .from(repairs)
      .where(sql`${repairs.faultTypeId} IS NOT NULL`);
    
    const totalCount = totalRepairsCount[0]?.count || 0;
    
    if (totalCount === 0) {
      return [];
    }
    
    const faultTypeCounts = await db
      .select({
        faultTypeId: repairs.faultTypeId,
        count: count()
      })
      .from(repairs)
      .where(sql`${repairs.faultTypeId} IS NOT NULL`)
      .groupBy(repairs.faultTypeId)
      .orderBy(desc(count()))
      .limit(limit);
    
    // Get fault type names and calculate percentages
    const result = await Promise.all(
      faultTypeCounts.map(async (item) => {
        if (!item.faultTypeId) return null;
        
        const faultType = await this.getFaultType(item.faultTypeId);
        return {
          faultTypeId: item.faultTypeId,
          faultTypeName: faultType ? faultType.name : `Fault Type #${item.faultTypeId}`,
          percentage: Math.round((Number(item.count) / totalCount) * 100)
        };
      })
    );
    
    return result.filter(item => item !== null) as {faultTypeId: number, faultTypeName: string, percentage: number}[];
  }
}

// Use PostgreSQL database storage
export const storage = new DatabaseStorageClass();