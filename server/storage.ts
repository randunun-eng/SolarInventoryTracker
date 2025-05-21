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
    // Initialize maps
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
    
    // Initialize IDs
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
    
    // Create some initial data
    this.initializeData();
  }
  
  private initializeData() {
    // Create default categories
    const categories = [
      { name: "IC", description: "Integrated Circuits" },
      { name: "Transistor", description: "Transistors and MOSFETs" },
      { name: "Capacitor", description: "All types of capacitors" },
      { name: "Resistor", description: "All types of resistors" },
      { name: "Diode", description: "Diodes and rectifiers" },
      { name: "Connector", description: "Connectors and terminals" },
    ];
    
    categories.forEach(cat => this.createCategory(cat));
    
    // Create default suppliers
    const suppliers = [
      { name: "Mouser Electronics", contactName: "John Smith", email: "john@mouser.com", phone: "555-123-4567", address: "123 Component Way" },
      { name: "Digi-Key", contactName: "Jane Doe", email: "jane@digikey.com", phone: "555-987-6543", address: "456 Electronics Blvd" },
    ];
    
    suppliers.forEach(sup => this.createSupplier(sup));
    
    // Create default fault types
    const faultTypes = [
      { name: "DC Input Failure", description: "Problems with the DC input stage" },
      { name: "Control Board Failure", description: "Issues with the main control board" },
      { name: "Cooling Fan Issues", description: "Problems with cooling system" },
      { name: "Power Supply Failure", description: "Issues with internal power supply" },
      { name: "Display/Communication Error", description: "Display or communication problems" },
    ];
    
    faultTypes.forEach(ft => this.createFaultType(ft));
    
    // Create default components
    const components = [
      { 
        name: "LM7805 Voltage Regulator", 
        partNumber: "LM7805", 
        categoryId: 1, 
        description: "5V Voltage Regulator",
        minimumStock: 10,
        currentStock: 5,
        supplierPrice: 1.20,
        supplierId: 1,
      },
      { 
        name: "470μF Electrolytic Capacitor", 
        partNumber: "CAP-470UF", 
        categoryId: 3, 
        description: "470μF 25V Electrolytic Capacitor",
        minimumStock: 20,
        currentStock: 12,
        supplierPrice: 0.50,
        supplierId: 2,
      },
      { 
        name: "IRF540N MOSFET", 
        partNumber: "IRF540N", 
        categoryId: 2, 
        description: "100V 33A N-Channel MOSFET",
        minimumStock: 15,
        currentStock: 3,
        supplierPrice: 2.45,
        supplierId: 1,
      },
      { 
        name: "1N4007 Diode", 
        partNumber: "1N4007", 
        categoryId: 5, 
        description: "1000V 1A General Purpose Diode",
        minimumStock: 30,
        currentStock: 15,
        supplierPrice: 0.10,
        supplierId: 2,
      },
      { 
        name: "IGBT Module FGA25N120ANTD", 
        partNumber: "FGA25N120ANTD", 
        categoryId: 2, 
        description: "1200V 25A Field Stop IGBT",
        minimumStock: 10,
        currentStock: 27,
        supplierPrice: 8.75,
        supplierId: 1,
      },
      {
        name: "10A Fuse", 
        partNumber: "FUSE-10A", 
        categoryId: 6, 
        description: "10A Fast-Blow Fuse",
        minimumStock: 50,
        currentStock: 35,
        supplierPrice: 0.30,
        supplierId: 2,
      },
      {
        name: "DC Fuse 15A", 
        partNumber: "FUSE-15A-DC", 
        categoryId: 6, 
        description: "15A DC Fuse",
        minimumStock: 25,
        currentStock: 18,
        supplierPrice: 5.50,
        supplierId: 1,
      },
      {
        name: "Thermal Paste", 
        partNumber: "TP-100", 
        categoryId: 6, 
        description: "Thermal Compound for Heat Transfer",
        minimumStock: 5,
        currentStock: 3,
        supplierPrice: 6.75,
        supplierId: 2,
      }
    ];
    
    components.forEach(comp => this.createComponent(comp));
    
    // Create default clients
    const clients = [
      { name: "Sarah Johnson", email: "sarah.j@example.com", phone: "+1 (555) 123-4567", address: "1234 Solar Lane, Sunnyvale, CA 94086" },
      { name: "Michael Brown", email: "mbrown@example.com", phone: "+1 (555) 234-5678", address: "567 Energy Ave, Springfield, IL 62701" },
      { name: "David Wilson", email: "dwilson@example.com", phone: "+1 (555) 345-6789", address: "890 Power Drive, Austin, TX 78701" },
    ];
    
    clients.forEach(client => this.createClient(client));
    
    // Create default inverters
    const inverters = [
      { clientId: 1, model: "SMA Sunny Boy - SB5000TL", serialNumber: "SB212345678", warrantyStatus: "Expired", installationDate: new Date("2020-05-15") },
      { clientId: 2, model: "Fronius Primo - 8.2-1", serialNumber: "FP987654321", warrantyStatus: "Valid", installationDate: new Date("2022-02-10") },
      { clientId: 3, model: "Growatt - SPF 5000TL HVM", serialNumber: "GW567891234", warrantyStatus: "Valid", installationDate: new Date("2021-11-25") },
    ];
    
    inverters.forEach(inv => this.createInverter(inv));
    
    // Create some repair logs
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    const repairs = [
      { 
        inverterId: 1, 
        clientId: 1, 
        faultTypeId: 1, 
        faultDescription: "Inverter showing Error 503 - DC Input Failure. Unit powers on but shows error code and won't convert power. Display operational but red LED error indicator lit.",
        status: "In Progress",
        receivedDate: oneWeekAgo,
        estimatedCompletionDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        laborHours: 2.5,
        laborRate: 85,
        technicianName: "Alex Martinez",
        technicianNotes: "DC input stage damaged due to possible lightning strike. Replaced IGBT module and DC fuses. Preliminary testing shows normal operation. Need to complete 24hr load test before closing repair ticket.",
        beforePhotos: [],
        afterPhotos: [],
        totalPartsCost: 42.70,
        totalCost: 255.20
      },
      {
        inverterId: 2, 
        clientId: 2, 
        faultTypeId: 2, 
        faultDescription: "Unit powers on but shuts down after a few minutes with Error 567.",
        status: "Completed",
        receivedDate: twoWeeksAgo,
        completionDate: oneWeekAgo,
        laborHours: 3.0,
        laborRate: 85,
        technicianName: "Alex Martinez",
        technicianNotes: "Main control board had several blown capacitors. Replaced capacitors and performed full system diagnostic. Unit now functioning normally.",
        beforePhotos: [],
        afterPhotos: [],
        totalPartsCost: 15.75,
        totalCost: 270.75
      },
      {
        inverterId: 3, 
        clientId: 3, 
        faultTypeId: 3, 
        faultDescription: "Overheating during operation, fans not running.",
        status: "Received",
        receivedDate: now,
        estimatedCompletionDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
        laborHours: 0,
        laborRate: 85,
        technicianName: "",
        technicianNotes: "",
        beforePhotos: [],
        afterPhotos: [],
        totalPartsCost: 0,
        totalCost: 0
      }
    ];
    
    repairs.forEach(repair => this.createRepair(repair));
    
    // Add used components to repairs
    const usedComponents = [
      {
        repairId: 1,
        componentId: 5, // IGBT Module
        quantity: 1,
        unitPrice: 24.95
      },
      {
        repairId: 1,
        componentId: 7, // DC Fuse 15A
        quantity: 2,
        unitPrice: 5.50
      },
      {
        repairId: 1,
        componentId: 8, // Thermal Paste
        quantity: 1,
        unitPrice: 6.75
      },
      {
        repairId: 2,
        componentId: 2, // 470μF Electrolytic Capacitor
        quantity: 4,
        unitPrice: 0.65
      },
      {
        repairId: 2,
        componentId: 1, // LM7805
        quantity: 1,
        unitPrice: 1.50
      }
    ];
    
    usedComponents.forEach(uc => this.createUsedComponent(uc));
    
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
    
    const newStock = Math.max(0, (existingComponent.currentStock || 0) + quantity);
    const updatedComponent: Component = { ...existingComponent, currentStock: newStock };
    this.components.set(id, updatedComponent);
    return updatedComponent;
  }
  
  async getLowStockComponents(): Promise<Component[]> {
    return Array.from(this.components.values()).filter(
      component => (component.currentStock !== undefined ? component.currentStock : 0) <= 
                   (component.minimumStock !== undefined ? component.minimumStock : 10)
    );
  }
  
  // Purchase Management
  async getPurchases(): Promise<Purchase[]> {
    return Array.from(this.purchases.values());
  }
  
  async getComponentPurchases(componentId: number): Promise<Purchase[]> {
    return Array.from(this.purchases.values()).filter(
      purchase => purchase.componentId === componentId
    );
  }
  
  async createPurchase(purchase: InsertPurchase): Promise<Purchase> {
    const id = this.currentPurchaseId++;
    const newPurchase: Purchase = { ...purchase, id };
    this.purchases.set(id, newPurchase);
    
    // Update component stock
    await this.updateComponentStock(purchase.componentId, purchase.quantity);
    
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
      inverter => inverter.clientId === clientId
    );
  }
  
  async getInverter(id: number): Promise<Inverter | undefined> {
    return this.inverters.get(id);
  }
  
  async getInverterBySerialNumber(serialNumber: string): Promise<Inverter | undefined> {
    return Array.from(this.inverters.values()).find(
      inverter => inverter.serialNumber === serialNumber
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
      repair => repair.clientId === clientId
    );
  }
  
  async getRepairsByInverter(inverterId: number): Promise<Repair[]> {
    return Array.from(this.repairs.values()).filter(
      repair => repair.inverterId === inverterId
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
      repair => repair.status !== "Completed" && repair.status !== "Cancelled"
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
      usedComponent => usedComponent.repairId === repairId
    );
  }
  
  async createUsedComponent(usedComponent: InsertUsedComponent): Promise<UsedComponent> {
    const id = this.currentUsedComponentId++;
    const newUsedComponent: UsedComponent = { ...usedComponent, id };
    this.usedComponents.set(id, newUsedComponent);
    
    // Decrease component stock
    await this.updateComponentStock(usedComponent.componentId, -usedComponent.quantity);
    
    return newUsedComponent;
  }
  
  async getMostUsedComponents(limit: number): Promise<{componentId: number, componentName: string, totalUsed: number}[]> {
    const componentUsage = new Map<number, number>();
    
    // Count usage of each component
    Array.from(this.usedComponents.values()).forEach(uc => {
      const currentCount = componentUsage.get(uc.componentId) || 0;
      componentUsage.set(uc.componentId, currentCount + uc.quantity);
    });
    
    // Convert to array and sort
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
    
    // Count each fault type
    Array.from(this.repairs.values()).forEach(repair => {
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

export class DatabaseStorage implements IStorage {
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

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
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
  
  async deleteCategory(id: number): Promise<{ success: boolean; affectedComponents?: number }> {
    // First, check if any components are using this category
    const componentsWithCategory = await db
      .select({ id: components.id })
      .from(components)
      .where(eq(components.categoryId, id));
    
    // If components are using this category, set their categoryId to null
    if (componentsWithCategory.length > 0) {
      await db
        .update(components)
        .set({ categoryId: null })
        .where(eq(components.categoryId, id));
    }
    
    // Now delete the category
    const result = await db
      .delete(categories)
      .where(eq(categories.id, id))
      .returning();
    
    return { 
      success: result.length > 0,
      affectedComponents: componentsWithCategory.length
    };
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
    const [component] = await db.select().from(components).where(eq(components.id, id));
    if (!component) return undefined;
    
    const currentStock = component.currentStock || 0;
    const newStock = currentStock + quantity;
    
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
        sql`(${components.currentStock} <= ${components.minimumStock}) 
            OR (${components.minimumStock} IS NULL AND ${components.currentStock} <= 10)`
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
    
    // Update component stock
    await this.updateComponentStock(purchase.componentId, purchase.quantity);
    
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
    
    // Decrease component stock
    await this.updateComponentStock(usedComponent.componentId, -usedComponent.quantity);
    
    return newUsedComponent;
  }
  
  async getMostUsedComponents(limit: number): Promise<{componentId: number, componentName: string, totalUsed: number}[]> {
    const result = await db
      .select({
        componentId: usedComponents.componentId,
        totalUsed: sql<number>`sum(${usedComponents.quantity})`.as('totalUsed')
      })
      .from(usedComponents)
      .groupBy(usedComponents.componentId)
      .orderBy(desc(sql<number>`sum(${usedComponents.quantity})`))
      .limit(limit);
    
    // Get component names
    const componentNames = await Promise.all(
      result.map(async (item) => {
        const component = await this.getComponent(item.componentId);
        return {
          componentId: item.componentId,
          componentName: component ? component.name : `Component #${item.componentId}`,
          totalUsed: item.totalUsed
        };
      })
    );
    
    return componentNames;
  }
  
  async getCommonFaultTypes(limit: number): Promise<{faultTypeId: number, faultTypeName: string, percentage: number}[]> {
    // Count total repairs with fault types
    const [{ totalRepairs }] = await db
      .select({
        totalRepairs: count(repairs.id)
      })
      .from(repairs)
      .where(sql`${repairs.faultTypeId} IS NOT NULL`);
    
    if (totalRepairs === 0) {
      return [];
    }
    
    // Count repairs by fault type
    const faultTypeCounts = await db
      .select({
        faultTypeId: repairs.faultTypeId,
        count: count(repairs.id)
      })
      .from(repairs)
      .where(sql`${repairs.faultTypeId} IS NOT NULL`)
      .groupBy(repairs.faultTypeId)
      .orderBy(desc(count(repairs.id)))
      .limit(limit);
    
    // Get fault type names and calculate percentages
    const result = await Promise.all(
      faultTypeCounts.map(async (item) => {
        const faultType = await this.getFaultType(item.faultTypeId!);
        return {
          faultTypeId: item.faultTypeId!,
          faultTypeName: faultType ? faultType.name : `Fault Type #${item.faultTypeId}`,
          percentage: Math.round((item.count / totalRepairs) * 100)
        };
      })
    );
    
    return result;
  }
}

// Use the database implementation instead of memory storage
export const storage = new DatabaseStorage();
