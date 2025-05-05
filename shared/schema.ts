import { pgTable, text, serial, integer, boolean, timestamp, jsonb, doublePrecision, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Categories for components
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  description: true,
});

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

// Suppliers
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactName: text("contact_name"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  website: text("website"),
  remarks: text("remarks"),
});

export const insertSupplierSchema = createInsertSchema(suppliers).pick({
  name: true,
  contactName: true,
  email: true,
  phone: true,
  website: true,
  remarks: true,
});

export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Supplier = typeof suppliers.$inferSelect;

// Electronic Components
export const components = pgTable("components", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  partNumber: text("part_number"),
  categoryId: integer("category_id"),
  description: text("description"),
  datasheet: text("datasheet"),
  image: text("image"),
  location: text("location"),
  minimumStock: integer("minimum_stock").default(10),
  currentStock: integer("current_stock").default(0),
  supplierPrice: doublePrecision("supplier_price").default(0),
  supplierId: integer("supplier_id"),
  lastPurchaseDate: timestamp("last_purchase_date"),
});

export const insertComponentSchema = createInsertSchema(components).pick({
  name: true,
  partNumber: true,
  categoryId: true,
  description: true,
  datasheet: true,
  image: true,
  location: true,
  minimumStock: true,
  currentStock: true,
  supplierPrice: true,
  supplierId: true,
  lastPurchaseDate: true,
});

export type InsertComponent = z.infer<typeof insertComponentSchema>;
export type Component = typeof components.$inferSelect;

// Purchase History
export const purchases = pgTable("purchases", {
  id: serial("id").primaryKey(),
  componentId: integer("component_id").notNull(),
  supplierId: integer("supplier_id").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: doublePrecision("unit_price").notNull(),
  date: timestamp("date").notNull(),
});

export const insertPurchaseSchema = createInsertSchema(purchases).pick({
  componentId: true,
  supplierId: true,
  quantity: true,
  unitPrice: true,
  date: true,
});

export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;
export type Purchase = typeof purchases.$inferSelect;

// Clients
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
});

export const insertClientSchema = createInsertSchema(clients).pick({
  name: true,
  email: true,
  phone: true,
  address: true,
});

export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

// Inverters
export const inverters = pgTable("inverters", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  model: text("model").notNull(),
  serialNumber: text("serial_number").notNull().unique(),
  warrantyStatus: text("warranty_status").default("Valid"),
  installationDate: timestamp("installation_date"),
});

export const insertInverterSchema = createInsertSchema(inverters).pick({
  clientId: true,
  model: true,
  serialNumber: true,
  warrantyStatus: true,
  installationDate: true,
});

export type InsertInverter = z.infer<typeof insertInverterSchema>;
export type Inverter = typeof inverters.$inferSelect;

// Common Fault Types
export const faultTypes = pgTable("fault_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
});

export const insertFaultTypeSchema = createInsertSchema(faultTypes).pick({
  name: true,
  description: true,
});

export type InsertFaultType = z.infer<typeof insertFaultTypeSchema>;
export type FaultType = typeof faultTypes.$inferSelect;

// Repair Status Enum
export const RepairStatusEnum = z.enum([
  "Received",
  "In Progress",
  "Waiting for Parts",
  "Ready for Pickup",
  "Completed",
  "Cancelled",
]);

export type RepairStatus = z.infer<typeof RepairStatusEnum>;

// Status History Entry Schema
export const statusHistoryEntrySchema = z.object({
  status: RepairStatusEnum,
  timestamp: z.date(),
  note: z.string().nullable(),
  userId: z.number().nullable(),
  userName: z.string().nullable(),
});

export type StatusHistoryEntry = z.infer<typeof statusHistoryEntrySchema>;

// Repair Logs
export const repairs = pgTable("repairs", {
  id: serial("id").primaryKey(),
  inverterId: integer("inverter_id"),
  clientId: integer("client_id").notNull(),
  faultTypeId: integer("fault_type_id"),
  faultDescription: text("fault_description"),
  status: text("status").default("Received"),
  receivedDate: timestamp("received_date").notNull(),
  estimatedCompletionDate: timestamp("estimated_completion_date"),
  completionDate: timestamp("completion_date"),
  laborHours: doublePrecision("labor_hours").default(0),
  laborRate: doublePrecision("labor_rate").default(85),
  technicianName: text("technician_name"),
  technicianNotes: text("technician_notes"),
  beforePhotos: text("before_photos").array(),
  afterPhotos: text("after_photos").array(),
  totalPartsCost: doublePrecision("total_parts_cost").default(0),
  totalCost: doublePrecision("total_cost").default(0),
  // Added fields for inverter model and serial number
  inverterModel: text("inverter_model"),
  inverterSerialNumber: text("inverter_serial_number"),
  // Added field to store status history
  statusHistory: jsonb("status_history").array().default([]),
});

export const insertRepairSchema = createInsertSchema(repairs).pick({
  inverterId: true,
  clientId: true,
  faultTypeId: true,
  faultDescription: true,
  status: true,
  receivedDate: true,
  estimatedCompletionDate: true,
  completionDate: true,
  laborHours: true,
  laborRate: true,
  technicianName: true,
  technicianNotes: true,
  beforePhotos: true,
  afterPhotos: true,
  totalPartsCost: true,
  totalCost: true,
  inverterModel: true,
  inverterSerialNumber: true,
  statusHistory: true,
});

export type InsertRepair = z.infer<typeof insertRepairSchema>;
export type Repair = typeof repairs.$inferSelect;

// Used Components in Repairs (Many-to-Many)
export const usedComponents = pgTable("used_components", {
  id: serial("id").primaryKey(),
  repairId: integer("repair_id").notNull(),
  componentId: integer("component_id").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: doublePrecision("unit_price").notNull(),
});

export const insertUsedComponentSchema = createInsertSchema(usedComponents).pick({
  repairId: true,
  componentId: true,
  quantity: true,
  unitPrice: true,
});

export type InsertUsedComponent = z.infer<typeof insertUsedComponentSchema>;
export type UsedComponent = typeof usedComponents.$inferSelect;

// Users (for authentication/authorization)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  role: text("role").default("Technician"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  role: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Define table relations
export const categoriesRelations = relations(categories, ({ many }) => ({
  components: many(components),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  components: many(components),
  purchases: many(purchases),
}));

export const componentsRelations = relations(components, ({ one, many }) => ({
  category: one(categories, {
    fields: [components.categoryId],
    references: [categories.id],
  }),
  supplier: one(suppliers, {
    fields: [components.supplierId],
    references: [suppliers.id],
  }),
  purchases: many(purchases),
  usedComponents: many(usedComponents),
}));

export const purchasesRelations = relations(purchases, ({ one }) => ({
  component: one(components, {
    fields: [purchases.componentId],
    references: [components.id],
  }),
  supplier: one(suppliers, {
    fields: [purchases.supplierId],
    references: [suppliers.id],
  }),
}));

export const clientsRelations = relations(clients, ({ many }) => ({
  inverters: many(inverters),
  repairs: many(repairs),
}));

export const invertersRelations = relations(inverters, ({ one, many }) => ({
  client: one(clients, {
    fields: [inverters.clientId],
    references: [clients.id],
  }),
  repairs: many(repairs),
}));

export const faultTypesRelations = relations(faultTypes, ({ many }) => ({
  repairs: many(repairs),
}));

export const repairsRelations = relations(repairs, ({ one, many }) => ({
  client: one(clients, {
    fields: [repairs.clientId],
    references: [clients.id],
  }),
  inverter: one(inverters, {
    fields: [repairs.inverterId],
    references: [inverters.id],
  }),
  faultType: one(faultTypes, {
    fields: [repairs.faultTypeId],
    references: [faultTypes.id],
  }),
  usedComponents: many(usedComponents),
}));

export const usedComponentsRelations = relations(usedComponents, ({ one }) => ({
  repair: one(repairs, {
    fields: [usedComponents.repairId],
    references: [repairs.id],
  }),
  component: one(components, {
    fields: [usedComponents.componentId],
    references: [components.id],
  }),
}));
