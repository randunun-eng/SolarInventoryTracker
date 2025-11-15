import type {
  User,
  InsertUser,
  Category,
  InsertCategory,
  Supplier,
  InsertSupplier,
  Component,
  InsertComponent,
  Purchase,
  InsertPurchase,
  Client,
  InsertClient,
  Inverter,
  InsertInverter,
  FaultType,
  InsertFaultType,
  Repair,
  InsertRepair,
  UsedComponent,
  InsertUsedComponent,
} from '@shared/schema';

/**
 * D1 Storage Implementation for Cloudflare Workers
 * Uses direct D1 SQL queries instead of Drizzle ORM
 */
export class D1Storage {
  constructor(private db: D1Database) {}

  // ========================================================================
  // USER MANAGEMENT
  // ========================================================================

  async getUsers(): Promise<User[]> {
    const result = await this.db.prepare('SELECT * FROM users').all();
    return result.results as User[];
  }

  async getUser(id: number): Promise<User | null> {
    const result = await this.db
      .prepare('SELECT * FROM users WHERE id = ?')
      .bind(id)
      .first();
    return result as User | null;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const result = await this.db
      .prepare('SELECT * FROM users WHERE username = ?')
      .bind(username)
      .first();
    return result as User | null;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const result = await this.db
      .prepare(
        'INSERT INTO users (username, password, role) VALUES (?, ?, ?) RETURNING *'
      )
      .bind(userData.username, userData.password, userData.role || 'Technician')
      .first();
    return result as User;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | null> {
    const fields: string[] = [];
    const values: any[] = [];

    if (userData.username !== undefined) {
      fields.push('username = ?');
      values.push(userData.username);
    }
    if (userData.password !== undefined) {
      fields.push('password = ?');
      values.push(userData.password);
    }
    if (userData.role !== undefined) {
      fields.push('role = ?');
      values.push(userData.role);
    }

    if (fields.length === 0) return this.getUser(id);

    values.push(id);
    const result = await this.db
      .prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ? RETURNING *`)
      .bind(...values)
      .first();
    return result as User | null;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await this.db
      .prepare('DELETE FROM users WHERE id = ? RETURNING id')
      .bind(id)
      .first();
    return result !== null;
  }

  // ========================================================================
  // CATEGORY MANAGEMENT
  // ========================================================================

  async getCategories(): Promise<Category[]> {
    const result = await this.db.prepare('SELECT * FROM categories').all();
    return result.results as Category[];
  }

  async getCategory(id: number): Promise<Category | null> {
    const result = await this.db
      .prepare('SELECT * FROM categories WHERE id = ?')
      .bind(id)
      .first();
    return result as Category | null;
  }

  async createCategory(categoryData: InsertCategory): Promise<Category> {
    const result = await this.db
      .prepare('INSERT INTO categories (name, description) VALUES (?, ?) RETURNING *')
      .bind(categoryData.name, categoryData.description || null)
      .first();
    return result as Category;
  }

  async updateCategory(
    id: number,
    categoryData: InsertCategory
  ): Promise<Category | null> {
    const result = await this.db
      .prepare(
        'UPDATE categories SET name = ?, description = ? WHERE id = ? RETURNING *'
      )
      .bind(categoryData.name, categoryData.description || null, id)
      .first();
    return result as Category | null;
  }

  // ========================================================================
  // SUPPLIER MANAGEMENT
  // ========================================================================

  async getSuppliers(): Promise<Supplier[]> {
    const result = await this.db.prepare('SELECT * FROM suppliers').all();
    return result.results.map(this.parseSupplier) as Supplier[];
  }

  async getSupplier(id: number): Promise<Supplier | null> {
    const result = await this.db
      .prepare('SELECT * FROM suppliers WHERE id = ?')
      .bind(id)
      .first();
    return result ? this.parseSupplier(result) : null;
  }

  async createSupplier(supplierData: InsertSupplier): Promise<Supplier> {
    const result = await this.db
      .prepare(
        `INSERT INTO suppliers (name, contact_name, email, phone, address, website, remarks, tags)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`
      )
      .bind(
        supplierData.name,
        supplierData.contactName || null,
        supplierData.email || null,
        supplierData.phone || null,
        supplierData.address || null,
        supplierData.website || null,
        supplierData.remarks || null,
        supplierData.tags ? JSON.stringify(supplierData.tags) : null
      )
      .first();
    return this.parseSupplier(result!);
  }

  async updateSupplier(
    id: number,
    supplierData: InsertSupplier
  ): Promise<Supplier | null> {
    const result = await this.db
      .prepare(
        `UPDATE suppliers SET
         name = ?, contact_name = ?, email = ?, phone = ?, address = ?,
         website = ?, remarks = ?, tags = ?
         WHERE id = ? RETURNING *`
      )
      .bind(
        supplierData.name,
        supplierData.contactName || null,
        supplierData.email || null,
        supplierData.phone || null,
        supplierData.address || null,
        supplierData.website || null,
        supplierData.remarks || null,
        supplierData.tags ? JSON.stringify(supplierData.tags) : null,
        id
      )
      .first();
    return result ? this.parseSupplier(result) : null;
  }

  // ========================================================================
  // COMPONENT MANAGEMENT
  // ========================================================================

  async getComponents(): Promise<Component[]> {
    const result = await this.db.prepare('SELECT * FROM components').all();
    return result.results.map(this.parseComponent) as Component[];
  }

  async getComponent(id: number): Promise<Component | null> {
    const result = await this.db
      .prepare('SELECT * FROM components WHERE id = ?')
      .bind(id)
      .first();
    return result ? this.parseComponent(result) : null;
  }

  async createComponent(componentData: InsertComponent): Promise<Component> {
    const result = await this.db
      .prepare(
        `INSERT INTO components
         (name, part_number, category_id, description, datasheet, image, location,
          minimum_stock, current_stock, supplier_price, supplier_id, last_purchase_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`
      )
      .bind(
        componentData.name,
        componentData.partNumber || null,
        componentData.categoryId || null,
        componentData.description || null,
        componentData.datasheet || null,
        componentData.image || null,
        componentData.location || null,
        componentData.minimumStock || 10,
        componentData.currentStock || 0,
        componentData.supplierPrice || 0,
        componentData.supplierId || null,
        componentData.lastPurchaseDate
          ? new Date(componentData.lastPurchaseDate).toISOString()
          : null
      )
      .first();
    return this.parseComponent(result!);
  }

  async updateComponent(
    id: number,
    componentData: InsertComponent
  ): Promise<Component | null> {
    const result = await this.db
      .prepare(
        `UPDATE components SET
         name = ?, part_number = ?, category_id = ?, description = ?,
         datasheet = ?, image = ?, location = ?, minimum_stock = ?,
         current_stock = ?, supplier_price = ?, supplier_id = ?, last_purchase_date = ?
         WHERE id = ? RETURNING *`
      )
      .bind(
        componentData.name,
        componentData.partNumber || null,
        componentData.categoryId || null,
        componentData.description || null,
        componentData.datasheet || null,
        componentData.image || null,
        componentData.location || null,
        componentData.minimumStock || 10,
        componentData.currentStock || 0,
        componentData.supplierPrice || 0,
        componentData.supplierId || null,
        componentData.lastPurchaseDate
          ? new Date(componentData.lastPurchaseDate).toISOString()
          : null,
        id
      )
      .first();
    return result ? this.parseComponent(result) : null;
  }

  async updateComponentStock(id: number, quantity: number): Promise<Component | null> {
    const result = await this.db
      .prepare('UPDATE components SET current_stock = ? WHERE id = ? RETURNING *')
      .bind(quantity, id)
      .first();
    return result ? this.parseComponent(result) : null;
  }

  async getLowStockComponents(): Promise<Component[]> {
    const result = await this.db
      .prepare('SELECT * FROM components WHERE current_stock <= minimum_stock')
      .all();
    return result.results.map(this.parseComponent) as Component[];
  }

  // ========================================================================
  // CLIENT MANAGEMENT
  // ========================================================================

  async getClients(): Promise<Client[]> {
    const result = await this.db.prepare('SELECT * FROM clients').all();
    return result.results as Client[];
  }

  async getClient(id: number): Promise<Client | null> {
    const result = await this.db
      .prepare('SELECT * FROM clients WHERE id = ?')
      .bind(id)
      .first();
    return result as Client | null;
  }

  async createClient(clientData: InsertClient): Promise<Client> {
    const result = await this.db
      .prepare(
        `INSERT INTO clients (name, company, email, phone, address, city, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *`
      )
      .bind(
        clientData.name,
        clientData.company || null,
        clientData.email || null,
        clientData.phone || null,
        clientData.address || null,
        clientData.city || null,
        clientData.notes || null
      )
      .first();
    return result as Client;
  }

  async updateClient(id: number, clientData: InsertClient): Promise<Client | null> {
    const result = await this.db
      .prepare(
        `UPDATE clients SET
         name = ?, company = ?, email = ?, phone = ?, address = ?, city = ?, notes = ?
         WHERE id = ? RETURNING *`
      )
      .bind(
        clientData.name,
        clientData.company || null,
        clientData.email || null,
        clientData.phone || null,
        clientData.address || null,
        clientData.city || null,
        clientData.notes || null,
        id
      )
      .first();
    return result as Client | null;
  }

  // ========================================================================
  // REPAIR MANAGEMENT
  // ========================================================================

  async getRepairs(): Promise<Repair[]> {
    const result = await this.db
      .prepare('SELECT * FROM repairs ORDER BY date_received DESC')
      .all();
    return result.results.map(this.parseRepair) as Repair[];
  }

  async getRepair(id: number): Promise<Repair | null> {
    const result = await this.db
      .prepare('SELECT * FROM repairs WHERE id = ?')
      .bind(id)
      .first();
    return result ? this.parseRepair(result) : null;
  }

  async getRepairByToken(token: string): Promise<Repair | null> {
    const result = await this.db
      .prepare('SELECT * FROM repairs WHERE tracking_token = ?')
      .bind(token)
      .first();
    return result ? this.parseRepair(result) : null;
  }

  async createRepair(repairData: InsertRepair): Promise<Repair> {
    const result = await this.db
      .prepare(
        `INSERT INTO repairs
         (client_id, inverter_id, fault_type_id, date_received, date_completed,
          estimated_completion_date, status, description, technician_notes, photos,
          status_history, labor_cost, total_cost, tracking_token)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`
      )
      .bind(
        repairData.clientId,
        repairData.inverterId,
        repairData.faultTypeId || null,
        new Date(repairData.dateReceived).toISOString(),
        repairData.dateCompleted
          ? new Date(repairData.dateCompleted).toISOString()
          : null,
        repairData.estimatedCompletionDate
          ? new Date(repairData.estimatedCompletionDate).toISOString()
          : null,
        repairData.status || 'Received',
        repairData.description || null,
        repairData.technicianNotes || null,
        repairData.photos ? JSON.stringify(repairData.photos) : null,
        repairData.statusHistory ? JSON.stringify(repairData.statusHistory) : null,
        repairData.laborCost || 0,
        repairData.totalCost || 0,
        repairData.trackingToken || null
      )
      .first();
    return this.parseRepair(result!);
  }

  async updateRepair(id: number, repairData: Partial<InsertRepair>): Promise<Repair | null> {
    // Build dynamic update query
    const fields: string[] = [];
    const values: any[] = [];

    if (repairData.status !== undefined) {
      fields.push('status = ?');
      values.push(repairData.status);
    }
    if (repairData.description !== undefined) {
      fields.push('description = ?');
      values.push(repairData.description);
    }
    if (repairData.technicianNotes !== undefined) {
      fields.push('technician_notes = ?');
      values.push(repairData.technicianNotes);
    }
    if (repairData.statusHistory !== undefined) {
      fields.push('status_history = ?');
      values.push(JSON.stringify(repairData.statusHistory));
    }
    if (repairData.dateCompleted !== undefined) {
      fields.push('date_completed = ?');
      values.push(
        repairData.dateCompleted
          ? new Date(repairData.dateCompleted).toISOString()
          : null
      );
    }
    if (repairData.laborCost !== undefined) {
      fields.push('labor_cost = ?');
      values.push(repairData.laborCost);
    }
    if (repairData.totalCost !== undefined) {
      fields.push('total_cost = ?');
      values.push(repairData.totalCost);
    }

    if (fields.length === 0) return this.getRepair(id);

    values.push(id);
    const result = await this.db
      .prepare(`UPDATE repairs SET ${fields.join(', ')} WHERE id = ? RETURNING *`)
      .bind(...values)
      .first();
    return result ? this.parseRepair(result) : null;
  }

  async getActiveRepairs(): Promise<Repair[]> {
    const result = await this.db
      .prepare(
        `SELECT * FROM repairs
         WHERE status != 'Completed' AND status != 'Cancelled'
         ORDER BY date_received DESC`
      )
      .all();
    return result.results.map(this.parseRepair) as Repair[];
  }

  async getRecentRepairs(limit: number): Promise<Repair[]> {
    const result = await this.db
      .prepare('SELECT * FROM repairs ORDER BY date_received DESC LIMIT ?')
      .bind(limit)
      .all();
    return result.results.map(this.parseRepair) as Repair[];
  }

  // ========================================================================
  // Helper Methods to Parse JSON Fields
  // ========================================================================

  private parseSupplier(row: any): Supplier {
    return {
      ...row,
      tags: row.tags ? JSON.parse(row.tags) : null,
    };
  }

  private parseComponent(row: any): Component {
    return {
      ...row,
      lastPurchaseDate: row.last_purchase_date ? new Date(row.last_purchase_date) : null,
    };
  }

  private parseRepair(row: any): Repair {
    return {
      ...row,
      dateReceived: new Date(row.date_received),
      dateCompleted: row.date_completed ? new Date(row.date_completed) : null,
      estimatedCompletionDate: row.estimated_completion_date
        ? new Date(row.estimated_completion_date)
        : null,
      photos: row.photos ? JSON.parse(row.photos) : null,
      statusHistory: row.status_history ? JSON.parse(row.status_history) : null,
    };
  }

  // Additional methods needed for full compatibility...
  // (Inverters, FaultTypes, UsedComponents, Purchases, etc.)
  // I'll add these if needed
}
