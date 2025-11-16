/**
 * Mock data for frontend testing without D1 database
 * Set VITE_USE_MOCK_DATA=true in .env to enable
 */

export const mockComponents = [
  {
    id: 1,
    name: "Solar Panel 400W",
    partNumber: "SP-400-M",
    categoryId: 1,
    description: "400W monocrystalline solar panel",
    currentStock: 25,
    minimumStock: 10,
    supplierPrice: 150.00,
    location: "Warehouse A1",
    supplierId: 1,
  },
  {
    id: 2,
    name: "Inverter 5KW",
    partNumber: "INV-5K-H",
    categoryId: 2,
    description: "5KW hybrid solar inverter",
    currentStock: 5,
    minimumStock: 3,
    supplierPrice: 800.00,
    location: "Warehouse B2",
    supplierId: 1,
  },
  {
    id: 3,
    name: "Battery 12V 200Ah",
    partNumber: "BAT-12-200",
    categoryId: 3,
    description: "Deep cycle lithium battery",
    currentStock: 2,
    minimumStock: 5,
    supplierPrice: 450.00,
    location: "Warehouse C1",
    supplierId: 2,
  },
];

export const mockCategories = [
  { id: 1, name: "Solar Panels", description: "Photovoltaic panels" },
  { id: 2, name: "Inverters", description: "DC to AC converters" },
  { id: 3, name: "Batteries", description: "Energy storage systems" },
  { id: 4, name: "Cables", description: "Electrical cables and connectors" },
];

export const mockSuppliers = [
  {
    id: 1,
    name: "Solar Tech Ltd",
    contactName: "John Doe",
    email: "john@solartech.com",
    phone: "+1234567890",
    address: "123 Solar Street",
  },
  {
    id: 2,
    name: "Energy Systems Inc",
    contactName: "Jane Smith",
    email: "jane@energysys.com",
    phone: "+0987654321",
    address: "456 Battery Avenue",
  },
];

export const mockClients = [
  {
    id: 1,
    name: "ABC Corporation",
    contactName: "Mike Johnson",
    email: "mike@abc.com",
    phone: "+1111111111",
    address: "789 Client Road",
  },
  {
    id: 2,
    name: "Green Energy Co",
    contactName: "Sarah Williams",
    email: "sarah@greenenergy.com",
    phone: "+2222222222",
    address: "321 Green Street",
  },
];

export const mockRepairs = [
  {
    id: 1,
    clientId: 1,
    inverterModel: "5KW Hybrid",
    inverterSerialNumber: "INV-2024-001",
    faultDescription: "Error code 11 - Grid voltage issue",
    status: "In Progress",
    priority: "High",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    clientId: 2,
    inverterModel: "3.5KW Standard",
    inverterSerialNumber: "INV-2024-002",
    faultDescription: "Display not working",
    status: "Pending",
    priority: "Medium",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const mockUsers = [
  {
    id: 1,
    username: "admin",
    name: "Admin User",
    role: "Admin",
  },
  {
    id: 2,
    username: "tech1",
    name: "Technician One",
    role: "Technician",
  },
];

export const mockStats = {
  totalComponents: mockComponents.length,
  lowStockComponents: mockComponents.filter(c => c.currentStock <= c.minimumStock).length,
  totalRepairs: mockRepairs.length,
  pendingRepairs: mockRepairs.filter(r => r.status === "Pending").length,
  totalClients: mockClients.length,
  totalSuppliers: mockSuppliers.length,
};

// Mock API handlers - Returns data in the same format as real API
export function getMockData(endpoint: string): any {
  if (endpoint.includes('/api/components')) {
    return mockComponents; // Components page expects array directly
  }
  if (endpoint.includes('/api/categories')) {
    return mockCategories; // Categories expects array directly
  }
  if (endpoint.includes('/api/suppliers')) {
    return mockSuppliers; // Suppliers expects array directly
  }
  if (endpoint.includes('/api/clients')) {
    return mockClients; // Clients expects array directly
  }
  if (endpoint.includes('/api/repairs')) {
    return mockRepairs; // Repairs expects array directly
  }
  if (endpoint.includes('/api/stats')) {
    return mockStats; // Stats expects object directly
  }
  if (endpoint.includes('/api/auth/me')) {
    return { user: mockUsers[0] }; // Auth expects { user: {...} }
  }

  return null;
}
