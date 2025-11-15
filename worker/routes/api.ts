import { Hono } from 'hono';
import type { Env } from '../index';
import { WorkerStorage } from '../lib/storage';
import { requireAuth, requireRole } from '../middleware/auth';
import crypto from 'crypto';
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
  statusHistoryEntrySchema,
  type StatusHistoryEntry,
} from '@shared/schema';
import bcrypt from 'bcryptjs';

export const apiRoutes = new Hono<{ Bindings: Env }>();

// Helper to get storage instance
function getStorage(c: any): WorkerStorage {
  return new WorkerStorage(c.env.DATABASE_URL);
}

// Helper function to generate unique tracking token
function generateTrackingToken(): string {
  return crypto.randomBytes(8).toString('hex');
}

// ============================================================================
// USER ROUTES
// ============================================================================

apiRoutes.get('/users', requireRole(['Admin']), async (c) => {
  const storage = getStorage(c);
  const users = await storage.getUsers();
  // Remove passwords from response
  const usersWithoutPasswords = users.map(({ password, ...user }) => user);
  return c.json(usersWithoutPasswords);
});

apiRoutes.get('/users/:id', requireRole(['Admin']), async (c) => {
  const storage = getStorage(c);
  const id = parseInt(c.req.param('id'));
  const user = await storage.getUser(id);

  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  const { password, ...userWithoutPassword } = user;
  return c.json(userWithoutPassword);
});

apiRoutes.post('/users', requireRole(['Admin']), async (c) => {
  const storage = getStorage(c);
  const body = await c.req.json();
  const userData = insertUserSchema.parse(body);

  // Hash password
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  const user = await storage.createUser({
    ...userData,
    password: hashedPassword,
  });

  const { password, ...userWithoutPassword } = user;
  return c.json(userWithoutPassword, 201);
});

apiRoutes.put('/users/:id', requireRole(['Admin']), async (c) => {
  const storage = getStorage(c);
  const id = parseInt(c.req.param('id'));
  const body = await c.req.json();

  // Hash password if provided
  if (body.password) {
    body.password = await bcrypt.hash(body.password, 10);
  }

  const user = await storage.updateUser(id, body);

  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  const { password, ...userWithoutPassword } = user;
  return c.json(userWithoutPassword);
});

apiRoutes.delete('/users/:id', requireRole(['Admin']), async (c) => {
  const storage = getStorage(c);
  const id = parseInt(c.req.param('id'));

  try {
    const deleted = await storage.deleteUser(id);

    if (!deleted) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

// ============================================================================
// CATEGORY ROUTES
// ============================================================================

apiRoutes.get('/categories', requireAuth(), async (c) => {
  const storage = getStorage(c);
  const categories = await storage.getCategories();
  return c.json(categories);
});

apiRoutes.get('/categories/:id', requireAuth(), async (c) => {
  const storage = getStorage(c);
  const id = parseInt(c.req.param('id'));
  const category = await storage.getCategory(id);

  if (!category) {
    return c.json({ error: 'Category not found' }, 404);
  }

  return c.json(category);
});

apiRoutes.post('/categories', requireRole(['Admin']), async (c) => {
  const storage = getStorage(c);
  const body = await c.req.json();
  const categoryData = insertCategorySchema.parse(body);
  const category = await storage.createCategory(categoryData);
  return c.json(category, 201);
});

apiRoutes.put('/categories/:id', requireRole(['Admin']), async (c) => {
  const storage = getStorage(c);
  const id = parseInt(c.req.param('id'));
  const body = await c.req.json();
  const categoryData = insertCategorySchema.parse(body);
  const category = await storage.updateCategory(id, categoryData);

  if (!category) {
    return c.json({ error: 'Category not found' }, 404);
  }

  return c.json(category);
});

// ============================================================================
// SUPPLIER ROUTES
// ============================================================================

apiRoutes.get('/suppliers', requireAuth(), async (c) => {
  const storage = getStorage(c);
  const suppliers = await storage.getSuppliers();
  return c.json(suppliers);
});

apiRoutes.get('/suppliers/:id', requireAuth(), async (c) => {
  const storage = getStorage(c);
  const id = parseInt(c.req.param('id'));
  const supplier = await storage.getSupplier(id);

  if (!supplier) {
    return c.json({ error: 'Supplier not found' }, 404);
  }

  return c.json(supplier);
});

apiRoutes.post('/suppliers', requireRole(['Admin']), async (c) => {
  const storage = getStorage(c);
  const body = await c.req.json();
  const supplierData = insertSupplierSchema.parse(body);
  const supplier = await storage.createSupplier(supplierData);
  return c.json(supplier, 201);
});

apiRoutes.put('/suppliers/:id', requireRole(['Admin']), async (c) => {
  const storage = getStorage(c);
  const id = parseInt(c.req.param('id'));
  const body = await c.req.json();
  const supplierData = insertSupplierSchema.parse(body);
  const supplier = await storage.updateSupplier(id, supplierData);

  if (!supplier) {
    return c.json({ error: 'Supplier not found' }, 404);
  }

  return c.json(supplier);
});

// ============================================================================
// COMPONENT ROUTES
// ============================================================================

apiRoutes.get('/components', requireAuth(), async (c) => {
  const storage = getStorage(c);
  const components = await storage.getComponents();
  return c.json(components);
});

apiRoutes.get('/components/low-stock', requireAuth(), async (c) => {
  const storage = getStorage(c);
  const components = await storage.getLowStockComponents();
  return c.json(components);
});

apiRoutes.get('/components/:id', requireAuth(), async (c) => {
  const storage = getStorage(c);
  const id = parseInt(c.req.param('id'));
  const component = await storage.getComponent(id);

  if (!component) {
    return c.json({ error: 'Component not found' }, 404);
  }

  return c.json(component);
});

apiRoutes.post('/components', requireRole(['Admin']), async (c) => {
  const storage = getStorage(c);
  const body = await c.req.json();
  const componentData = insertComponentSchema.parse(body);
  const component = await storage.createComponent(componentData);
  return c.json(component, 201);
});

apiRoutes.put('/components/:id', requireRole(['Admin']), async (c) => {
  const storage = getStorage(c);
  const id = parseInt(c.req.param('id'));
  const body = await c.req.json();
  const componentData = insertComponentSchema.parse(body);
  const component = await storage.updateComponent(id, componentData);

  if (!component) {
    return c.json({ error: 'Component not found' }, 404);
  }

  return c.json(component);
});

apiRoutes.patch('/components/:id/stock', requireRole(['Admin']), async (c) => {
  const storage = getStorage(c);
  const id = parseInt(c.req.param('id'));
  const { quantity } = await c.req.json();

  if (typeof quantity !== 'number') {
    return c.json({ error: 'Quantity must be a number' }, 400);
  }

  const component = await storage.updateComponentStock(id, quantity);

  if (!component) {
    return c.json({ error: 'Component not found' }, 404);
  }

  return c.json(component);
});

apiRoutes.patch(
  '/components/:id/min-stock',
  requireRole(['Admin']),
  async (c) => {
    const storage = getStorage(c);
    const id = parseInt(c.req.param('id'));
    const { minimumStockLevel } = await c.req.json();

    const component = await storage.getComponent(id);
    if (!component) {
      return c.json({ error: 'Component not found' }, 404);
    }

    const updated = await storage.updateComponent(id, {
      ...component,
      minimumStockLevel,
    });

    return c.json(updated);
  }
);

// ============================================================================
// CLIENT ROUTES
// ============================================================================

apiRoutes.get('/clients', requireAuth(), async (c) => {
  const storage = getStorage(c);
  const clients = await storage.getClients();
  return c.json(clients);
});

apiRoutes.get('/clients/:id', requireAuth(), async (c) => {
  const storage = getStorage(c);
  const id = parseInt(c.req.param('id'));
  const client = await storage.getClient(id);

  if (!client) {
    return c.json({ error: 'Client not found' }, 404);
  }

  return c.json(client);
});

apiRoutes.post('/clients', requireRole(['Admin']), async (c) => {
  const storage = getStorage(c);
  const body = await c.req.json();
  const clientData = insertClientSchema.parse(body);
  const client = await storage.createClient(clientData);
  return c.json(client, 201);
});

apiRoutes.put('/clients/:id', requireRole(['Admin']), async (c) => {
  const storage = getStorage(c);
  const id = parseInt(c.req.param('id'));
  const body = await c.req.json();
  const clientData = insertClientSchema.parse(body);
  const client = await storage.updateClient(id, clientData);

  if (!client) {
    return c.json({ error: 'Client not found' }, 404);
  }

  return c.json(client);
});

apiRoutes.get('/clients/:id/repairs', requireAuth(), async (c) => {
  const storage = getStorage(c);
  const id = parseInt(c.req.param('id'));
  const repairs = await storage.getRepairsByClient(id);
  return c.json(repairs);
});

apiRoutes.get('/clients/:id/inverters', requireAuth(), async (c) => {
  const storage = getStorage(c);
  const id = parseInt(c.req.param('id'));
  const inverters = await storage.getInvertersByClient(id);
  return c.json(inverters);
});

// ============================================================================
// INVERTER ROUTES
// ============================================================================

apiRoutes.get('/inverters', requireAuth(), async (c) => {
  const storage = getStorage(c);
  const inverters = await storage.getInverters();
  return c.json(inverters);
});

apiRoutes.get('/inverters/:id', requireAuth(), async (c) => {
  const storage = getStorage(c);
  const id = parseInt(c.req.param('id'));
  const inverter = await storage.getInverter(id);

  if (!inverter) {
    return c.json({ error: 'Inverter not found' }, 404);
  }

  return c.json(inverter);
});

apiRoutes.get('/inverters/by-serial/:serialNumber', requireAuth(), async (c) => {
  const storage = getStorage(c);
  const serialNumber = c.req.param('serialNumber');
  const inverter = await storage.getInverterBySerialNumber(serialNumber);

  if (!inverter) {
    return c.json({ error: 'Inverter not found' }, 404);
  }

  return c.json(inverter);
});

apiRoutes.post('/inverters', requireRole(['Admin']), async (c) => {
  const storage = getStorage(c);
  const body = await c.req.json();
  const inverterData = insertInverterSchema.parse(body);
  const inverter = await storage.createInverter(inverterData);
  return c.json(inverter, 201);
});

apiRoutes.put('/inverters/:id', requireRole(['Admin']), async (c) => {
  const storage = getStorage(c);
  const id = parseInt(c.req.param('id'));
  const body = await c.req.json();
  const inverterData = insertInverterSchema.parse(body);
  const inverter = await storage.updateInverter(id, inverterData);

  if (!inverter) {
    return c.json({ error: 'Inverter not found' }, 404);
  }

  return c.json(inverter);
});

apiRoutes.get('/inverters/:id/repairs', requireAuth(), async (c) => {
  const storage = getStorage(c);
  const id = parseInt(c.req.param('id'));
  const repairs = await storage.getRepairsByInverter(id);
  return c.json(repairs);
});

apiRoutes.get('/inverter-models', async (c) => {
  const storage = getStorage(c);
  const models = await storage.getUniqueInverterModels();
  return c.json(models);
});

// ============================================================================
// FAULT TYPE ROUTES
// ============================================================================

apiRoutes.get('/fault-types', requireAuth(), async (c) => {
  const storage = getStorage(c);
  const faultTypes = await storage.getFaultTypes();
  return c.json(faultTypes);
});

apiRoutes.get('/fault-types/:id', requireAuth(), async (c) => {
  const storage = getStorage(c);
  const id = parseInt(c.req.param('id'));
  const faultType = await storage.getFaultType(id);

  if (!faultType) {
    return c.json({ error: 'Fault type not found' }, 404);
  }

  return c.json(faultType);
});

apiRoutes.post('/fault-types', requireRole(['Admin']), async (c) => {
  const storage = getStorage(c);
  const body = await c.req.json();
  const faultTypeData = insertFaultTypeSchema.parse(body);
  const faultType = await storage.createFaultType(faultTypeData);
  return c.json(faultType, 201);
});

// ============================================================================
// REPAIR ROUTES
// ============================================================================

apiRoutes.get('/repairs', requireAuth(), async (c) => {
  const storage = getStorage(c);
  const repairs = await storage.getRepairs();
  return c.json(repairs);
});

apiRoutes.get('/repairs/active', requireAuth(), async (c) => {
  const storage = getStorage(c);
  const repairs = await storage.getActiveRepairs();
  return c.json(repairs);
});

apiRoutes.get('/repairs/recent', requireAuth(), async (c) => {
  const storage = getStorage(c);
  const repairs = await storage.getRecentRepairs(10);
  return c.json(repairs);
});

apiRoutes.get('/repairs/:id', requireAuth(), async (c) => {
  const storage = getStorage(c);
  const id = parseInt(c.req.param('id'));
  const repair = await storage.getRepair(id);

  if (!repair) {
    return c.json({ error: 'Repair not found' }, 404);
  }

  return c.json(repair);
});

// Public tracking endpoint (no auth required)
apiRoutes.get('/track/:token', async (c) => {
  const storage = getStorage(c);
  const token = c.req.param('token');
  const repair = await storage.getRepairByToken(token);

  if (!repair) {
    return c.json({ error: 'Repair not found' }, 404);
  }

  // Return only customer-facing data
  return c.json({
    id: repair.id,
    status: repair.status,
    dateReceived: repair.dateReceived,
    estimatedCompletionDate: repair.estimatedCompletionDate,
    completionDate: repair.completionDate,
    statusHistory: repair.statusHistory,
    description: repair.description,
  });
});

apiRoutes.post('/repairs', requireRole(['Admin']), async (c) => {
  const storage = getStorage(c);
  const body = await c.req.json();

  // Generate tracking token
  const trackingToken = generateTrackingToken();

  const repairData = insertRepairSchema.parse({
    ...body,
    trackingToken,
    statusHistory: [
      {
        status: body.status,
        timestamp: new Date().toISOString(),
        note: 'Repair created',
      },
    ],
  });

  const repair = await storage.createRepair(repairData);
  return c.json(repair, 201);
});

apiRoutes.put('/repairs/:id', requireAuth(), async (c) => {
  const storage = getStorage(c);
  const id = parseInt(c.req.param('id'));
  const body = await c.req.json();
  const repairData = insertRepairSchema.parse(body);
  const repair = await storage.updateRepair(id, repairData);

  if (!repair) {
    return c.json({ error: 'Repair not found' }, 404);
  }

  return c.json(repair);
});

// Status update endpoint
apiRoutes.patch('/repairs/:id/status', requireAuth(), async (c) => {
  const storage = getStorage(c);
  const id = parseInt(c.req.param('id'));
  const { status, note } = await c.req.json();

  const repair = await storage.getRepair(id);
  if (!repair) {
    return c.json({ error: 'Repair not found' }, 404);
  }

  // Add new status history entry
  const statusHistory = repair.statusHistory || [];
  statusHistory.push({
    status,
    timestamp: new Date().toISOString(),
    note: note || '',
  });

  const updated = await storage.updateRepair(id, {
    ...repair,
    status,
    statusHistory,
  });

  return c.json(updated);
});

// Also support POST for status updates
apiRoutes.post('/repairs/:id/status', requireAuth(), async (c) => {
  return apiRoutes.fetch(
    new Request(c.req.url.replace('/status', '/status'), {
      method: 'PATCH',
      headers: c.req.raw.headers,
      body: c.req.raw.body,
    }),
    c.env
  );
});

// ============================================================================
// USED COMPONENTS ROUTES
// ============================================================================

apiRoutes.get('/repairs/:id/components', requireAuth(), async (c) => {
  const storage = getStorage(c);
  const id = parseInt(c.req.param('id'));
  const components = await storage.getUsedComponentsByRepair(id);
  return c.json(components);
});

apiRoutes.post('/repairs/:id/components', requireAuth(), async (c) => {
  const storage = getStorage(c);
  const repairId = parseInt(c.req.param('id'));
  const body = await c.req.json();

  const usedComponentData = insertUsedComponentSchema.parse({
    ...body,
    repairId,
  });

  const usedComponent = await storage.createUsedComponent(usedComponentData);
  return c.json(usedComponent, 201);
});

// ============================================================================
// PURCHASE ROUTES
// ============================================================================

apiRoutes.get('/purchases', async (c) => {
  const storage = getStorage(c);
  const purchases = await storage.getPurchases();
  return c.json(purchases);
});

apiRoutes.get('/components/:id/purchases', async (c) => {
  const storage = getStorage(c);
  const id = parseInt(c.req.param('id'));
  const purchases = await storage.getComponentPurchases(id);
  return c.json(purchases);
});

apiRoutes.post('/purchases', async (c) => {
  const storage = getStorage(c);
  const body = await c.req.json();
  const purchaseData = insertPurchaseSchema.parse(body);
  const purchase = await storage.createPurchase(purchaseData);
  return c.json(purchase, 201);
});

// ============================================================================
// DASHBOARD ROUTES
// ============================================================================

apiRoutes.get('/dashboard/used-components', async (c) => {
  const storage = getStorage(c);
  const components = await storage.getMostUsedComponents(10);
  return c.json(components);
});

apiRoutes.get('/dashboard/fault-types', async (c) => {
  const storage = getStorage(c);
  const faultTypes = await storage.getCommonFaultTypes(10);
  return c.json(faultTypes);
});

// ============================================================================
// SETTINGS ROUTES
// ============================================================================

// Settings endpoints would need to be implemented with a settings table
// For now, return placeholder
apiRoutes.get('/settings/:key', requireRole(['Admin']), async (c) => {
  return c.json({ key: c.req.param('key'), value: {} });
});

apiRoutes.put('/settings/:key', requireRole(['Admin']), async (c) => {
  const body = await c.req.json();
  return c.json({ key: c.req.param('key'), value: body });
});
