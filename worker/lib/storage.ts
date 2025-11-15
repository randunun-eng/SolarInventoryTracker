import {
  type User,
  type InsertUser,
  type Category,
  type InsertCategory,
  type Supplier,
  type InsertSupplier,
  type Component,
  type InsertComponent,
  type Purchase,
  type InsertPurchase,
  type Client,
  type InsertClient,
  type Inverter,
  type InsertInverter,
  type FaultType,
  type InsertFaultType,
  type Repair,
  type InsertRepair,
  type UsedComponent,
  type InsertUsedComponent,
  users,
  categories,
  suppliers,
  components,
  purchases,
  clients,
  inverters,
  faultTypes,
  repairs,
  usedComponents,
} from '@shared/schema';
import { eq, and, lte, desc, count, sql, gt, isNull } from 'drizzle-orm';
import { getDb } from './db';

export class WorkerStorage {
  constructor(private databaseUrl: string) {}

  private get db() {
    return getDb(this.databaseUrl);
  }

  // User Management
  async getUsers(): Promise<User[]> {
    return this.db.select().from(users);
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const existingUser = await this.getUserByUsername(userData.username);
    if (existingUser) {
      throw new Error(`Username "${userData.username}" is already taken`);
    }

    const [user] = await this.db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(
    id: number,
    userData: Partial<InsertUser>
  ): Promise<User | undefined> {
    const existingUser = await this.getUser(id);
    if (!existingUser) {
      return undefined;
    }

    if (userData.username && userData.username !== existingUser.username) {
      const userWithSameUsername = await this.getUserByUsername(
        userData.username
      );
      if (userWithSameUsername) {
        throw new Error(`Username "${userData.username}" is already taken`);
      }
    }

    const [updatedUser] = await this.db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();

    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    const adminUsers = await this.db
      .select()
      .from(users)
      .where(eq(users.role, 'Admin'));

    const userToDelete = await this.getUser(id);
    if (!userToDelete) {
      return false;
    }

    if (userToDelete.role === 'Admin' && adminUsers.length <= 1) {
      throw new Error('Cannot delete the last admin user');
    }

    const result = await this.db
      .delete(users)
      .where(eq(users.id, id))
      .returning();

    return result.length > 0;
  }

  // Category Management
  async getCategories(): Promise<Category[]> {
    return this.db.select().from(categories);
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await this.db
      .select()
      .from(categories)
      .where(eq(categories.id, id));
    return category;
  }

  async createCategory(categoryData: InsertCategory): Promise<Category> {
    const [category] = await this.db
      .insert(categories)
      .values(categoryData)
      .returning();
    return category;
  }

  async updateCategory(
    id: number,
    categoryData: InsertCategory
  ): Promise<Category | undefined> {
    const [category] = await this.db
      .update(categories)
      .set(categoryData)
      .where(eq(categories.id, id))
      .returning();
    return category;
  }

  // Supplier Management
  async getSuppliers(): Promise<Supplier[]> {
    return this.db.select().from(suppliers);
  }

  async getSupplier(id: number): Promise<Supplier | undefined> {
    const [supplier] = await this.db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, id));
    return supplier;
  }

  async createSupplier(supplierData: InsertSupplier): Promise<Supplier> {
    const [supplier] = await this.db
      .insert(suppliers)
      .values(supplierData)
      .returning();
    return supplier;
  }

  async updateSupplier(
    id: number,
    supplierData: InsertSupplier
  ): Promise<Supplier | undefined> {
    const [supplier] = await this.db
      .update(suppliers)
      .set(supplierData)
      .where(eq(suppliers.id, id))
      .returning();
    return supplier;
  }

  // Component Management
  async getComponents(): Promise<Component[]> {
    return this.db.select().from(components);
  }

  async getComponent(id: number): Promise<Component | undefined> {
    const [component] = await this.db
      .select()
      .from(components)
      .where(eq(components.id, id));
    return component;
  }

  async createComponent(componentData: InsertComponent): Promise<Component> {
    const [component] = await this.db
      .insert(components)
      .values(componentData)
      .returning();
    return component;
  }

  async updateComponent(
    id: number,
    componentData: InsertComponent
  ): Promise<Component | undefined> {
    const [component] = await this.db
      .update(components)
      .set(componentData)
      .where(eq(components.id, id))
      .returning();
    return component;
  }

  async updateComponentStock(
    id: number,
    quantity: number
  ): Promise<Component | undefined> {
    const [component] = await this.db
      .update(components)
      .set({ quantityInStock: quantity })
      .where(eq(components.id, id))
      .returning();
    return component;
  }

  async getLowStockComponents(): Promise<Component[]> {
    return this.db
      .select()
      .from(components)
      .where(lte(components.quantityInStock, components.minimumStockLevel));
  }

  // Client Management
  async getClients(): Promise<Client[]> {
    return this.db.select().from(clients);
  }

  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await this.db
      .select()
      .from(clients)
      .where(eq(clients.id, id));
    return client;
  }

  async createClient(clientData: InsertClient): Promise<Client> {
    const [client] = await this.db
      .insert(clients)
      .values(clientData)
      .returning();
    return client;
  }

  async updateClient(
    id: number,
    clientData: InsertClient
  ): Promise<Client | undefined> {
    const [client] = await this.db
      .update(clients)
      .set(clientData)
      .where(eq(clients.id, id))
      .returning();
    return client;
  }

  // Repair Management
  async getRepairs(): Promise<Repair[]> {
    return this.db.select().from(repairs).orderBy(desc(repairs.dateReceived));
  }

  async getRepair(id: number): Promise<Repair | undefined> {
    const [repair] = await this.db
      .select()
      .from(repairs)
      .where(eq(repairs.id, id));
    return repair;
  }

  async getRepairByToken(token: string): Promise<Repair | undefined> {
    const [repair] = await this.db
      .select()
      .from(repairs)
      .where(eq(repairs.trackingToken, token));
    return repair;
  }

  async createRepair(repairData: InsertRepair): Promise<Repair> {
    const [repair] = await this.db
      .insert(repairs)
      .values(repairData)
      .returning();
    return repair;
  }

  async updateRepair(
    id: number,
    repairData: Partial<InsertRepair>
  ): Promise<Repair | undefined> {
    const [repair] = await this.db
      .update(repairs)
      .set(repairData)
      .where(eq(repairs.id, id))
      .returning();
    return repair;
  }

  async getActiveRepairs(): Promise<Repair[]> {
    return this.db
      .select()
      .from(repairs)
      .where(and(
        sql`${repairs.status} != 'Completed'`,
        sql`${repairs.status} != 'Cancelled'`
      ))
      .orderBy(desc(repairs.dateReceived));
  }

  async getRecentRepairs(limit: number): Promise<Repair[]> {
    return this.db
      .select()
      .from(repairs)
      .orderBy(desc(repairs.dateReceived))
      .limit(limit);
  }

  // Inverter Management
  async getInverters(): Promise<Inverter[]> {
    return this.db.select().from(inverters);
  }

  async getInverter(id: number): Promise<Inverter | undefined> {
    const [inverter] = await this.db
      .select()
      .from(inverters)
      .where(eq(inverters.id, id));
    return inverter;
  }

  async getInverterBySerialNumber(
    serialNumber: string
  ): Promise<Inverter | undefined> {
    const [inverter] = await this.db
      .select()
      .from(inverters)
      .where(eq(inverters.serialNumber, serialNumber));
    return inverter;
  }

  async createInverter(inverterData: InsertInverter): Promise<Inverter> {
    const [inverter] = await this.db
      .insert(inverters)
      .values(inverterData)
      .returning();
    return inverter;
  }

  async updateInverter(
    id: number,
    inverterData: InsertInverter
  ): Promise<Inverter | undefined> {
    const [inverter] = await this.db
      .update(inverters)
      .set(inverterData)
      .where(eq(inverters.id, id))
      .returning();
    return inverter;
  }

  // Fault Type Management
  async getFaultTypes(): Promise<FaultType[]> {
    return this.db.select().from(faultTypes);
  }

  async getFaultType(id: number): Promise<FaultType | undefined> {
    const [faultType] = await this.db
      .select()
      .from(faultTypes)
      .where(eq(faultTypes.id, id));
    return faultType;
  }

  async createFaultType(faultTypeData: InsertFaultType): Promise<FaultType> {
    const [faultType] = await this.db
      .insert(faultTypes)
      .values(faultTypeData)
      .returning();
    return faultType;
  }

  // Used Components Management
  async getUsedComponentsByRepair(
    repairId: number
  ): Promise<UsedComponent[]> {
    return this.db
      .select()
      .from(usedComponents)
      .where(eq(usedComponents.repairId, repairId));
  }

  async createUsedComponent(
    usedComponentData: InsertUsedComponent
  ): Promise<UsedComponent> {
    const [usedComponent] = await this.db
      .insert(usedComponents)
      .values(usedComponentData)
      .returning();
    return usedComponent;
  }

  // Purchase Management
  async getPurchases(): Promise<Purchase[]> {
    return this.db.select().from(purchases);
  }

  async getComponentPurchases(componentId: number): Promise<Purchase[]> {
    return this.db
      .select()
      .from(purchases)
      .where(eq(purchases.componentId, componentId));
  }

  async createPurchase(purchaseData: InsertPurchase): Promise<Purchase> {
    const [purchase] = await this.db
      .insert(purchases)
      .values(purchaseData)
      .returning();
    return purchase;
  }

  // Dashboard and Statistics
  async getMostUsedComponents(
    limit: number
  ): Promise<
    { componentId: number; componentName: string; totalUsed: number }[]
  > {
    const results = await this.db
      .select({
        componentId: usedComponents.componentId,
        componentName: components.name,
        totalUsed: sql<number>`sum(${usedComponents.quantity})`,
      })
      .from(usedComponents)
      .leftJoin(components, eq(usedComponents.componentId, components.id))
      .groupBy(usedComponents.componentId, components.name)
      .orderBy(desc(sql`sum(${usedComponents.quantity})`))
      .limit(limit);

    return results.map((r) => ({
      componentId: r.componentId,
      componentName: r.componentName || 'Unknown',
      totalUsed: Number(r.totalUsed),
    }));
  }

  async getCommonFaultTypes(
    limit: number
  ): Promise<
    { faultTypeId: number; faultTypeName: string; percentage: number }[]
  > {
    const totalRepairsResult = await this.db
      .select({ count: count() })
      .from(repairs)
      .where(sql`${repairs.faultTypeId} IS NOT NULL`);

    const totalRepairs = Number(totalRepairsResult[0]?.count || 0);

    if (totalRepairs === 0) {
      return [];
    }

    const results = await this.db
      .select({
        faultTypeId: repairs.faultTypeId,
        faultTypeName: faultTypes.name,
        count: count(),
      })
      .from(repairs)
      .leftJoin(faultTypes, eq(repairs.faultTypeId, faultTypes.id))
      .where(sql`${repairs.faultTypeId} IS NOT NULL`)
      .groupBy(repairs.faultTypeId, faultTypes.name)
      .orderBy(desc(count()))
      .limit(limit);

    return results.map((r) => ({
      faultTypeId: r.faultTypeId || 0,
      faultTypeName: r.faultTypeName || 'Unknown',
      percentage: (Number(r.count) / totalRepairs) * 100,
    }));
  }

  async getUniqueInverterModels(): Promise<string[]> {
    const results = await this.db
      .selectDistinct({ model: inverters.model })
      .from(inverters)
      .orderBy(inverters.model);

    return results.map((r) => r.model);
  }

  // Get repairs by client or inverter
  async getRepairsByClient(clientId: number): Promise<Repair[]> {
    return this.db
      .select()
      .from(repairs)
      .where(eq(repairs.clientId, clientId))
      .orderBy(desc(repairs.dateReceived));
  }

  async getRepairsByInverter(inverterId: number): Promise<Repair[]> {
    return this.db
      .select()
      .from(repairs)
      .where(eq(repairs.inverterId, inverterId))
      .orderBy(desc(repairs.dateReceived));
  }

  async getInvertersByClient(clientId: number): Promise<Inverter[]> {
    return this.db
      .select()
      .from(inverters)
      .where(eq(inverters.clientId, clientId));
  }
}
