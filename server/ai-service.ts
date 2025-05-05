import { GoogleGenerativeAI } from '@google/generative-ai';
import { Request, Response } from 'express';
import { storage } from './storage';

// Initialize the Google AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

interface ChatHistory {
  role: 'user' | 'model';
  parts: string;
}

const chatSessions: Map<string, ChatHistory[]> = new Map();

// Formats data for system context
const getSystemContext = async () => {
  try {
    // Get relevant data counts for context
    const components = await storage.getComponents();
    const categories = await storage.getCategories();
    const suppliers = await storage.getSuppliers();
    const clients = await storage.getClients();
    const repairs = await storage.getRepairs();
    const activeRepairs = await storage.getActiveRepairs();
    const lowStockComponents = await storage.getLowStockComponents();
    
    return `
You are an AI assistant for a Solar Inverter Repair Management System. 
This system manages inventory, repairs, clients, and suppliers for a solar equipment repair business.

Current system status:
- Total components in inventory: ${components.length}
- Components with low stock: ${lowStockComponents.length}
- Component categories: ${categories.length}
- Suppliers: ${suppliers.length}
- Clients: ${clients.length}
- Total repairs: ${repairs.length}
- Active repairs: ${activeRepairs.length}

You can help with the following actions:
1. Search for components, repairs, clients, or suppliers
2. Generate reports
3. Get information about inventory status
4. Check repair status
5. Edit component details (requires confirmation)
6. Update repair status (requires confirmation)
7. Manage stock levels (requires confirmation)

Format your responses in a helpful, professional manner.
When displaying lists, use markdown formatting for readability.
For actions that modify data, always ask for confirmation.
`;
  } catch (error) {
    console.error('Error generating system context:', error);
    return `You are an AI assistant for a Solar Inverter Repair Management System. You can help with inventory, repairs, clients, and reporting.`;
  }
};

// Process user query to determine intent and entities
const processQuery = async (chatHistory: ChatHistory[], query: string) => {
  const systemContext = await getSystemContext();
  
  // Prepare the chat session with system context and history
  const chat = model.startChat({
    history: chatHistory,
    generationConfig: {
      maxOutputTokens: 1000,
    },
  });
  
  try {
    // Send the query to the model
    const result = await chat.sendMessage(systemContext + '\n\nUser question: ' + query);
    return result.response.text();
  } catch (error) {
    console.error('Error processing chat query:', error);
    return 'Sorry, I encountered an error processing your question. Please try again.';
  }
};

// Search components based on criteria
const searchComponents = async (criteria: any) => {
  try {
    const allComponents = await storage.getComponents();
    let filteredComponents = [...allComponents];
    
    // Apply search filters
    if (criteria.name) {
      const nameLower = criteria.name.toLowerCase();
      filteredComponents = filteredComponents.filter(
        comp => comp.name.toLowerCase().includes(nameLower)
      );
    }
    
    if (criteria.partNumber) {
      const partNumberLower = criteria.partNumber.toLowerCase();
      filteredComponents = filteredComponents.filter(
        comp => comp.partNumber && comp.partNumber.toLowerCase().includes(partNumberLower)
      );
    }
    
    if (criteria.categoryId) {
      filteredComponents = filteredComponents.filter(
        comp => comp.categoryId === criteria.categoryId
      );
    }
    
    if (criteria.lowStock === true) {
      filteredComponents = filteredComponents.filter(
        comp => comp.currentStock <= comp.minimumStock
      );
    }
    
    return filteredComponents;
  } catch (error) {
    console.error('Error searching components:', error);
    throw error;
  }
};

// Search repairs based on criteria
const searchRepairs = async (criteria: any) => {
  try {
    const allRepairs = await storage.getRepairs();
    let filteredRepairs = [...allRepairs];
    
    // Apply search filters
    if (criteria.status) {
      filteredRepairs = filteredRepairs.filter(
        repair => repair.status === criteria.status
      );
    }
    
    if (criteria.clientId) {
      filteredRepairs = filteredRepairs.filter(
        repair => repair.clientId === criteria.clientId
      );
    }
    
    if (criteria.inverterId) {
      filteredRepairs = filteredRepairs.filter(
        repair => repair.inverterId === criteria.inverterId
      );
    }
    
    // Filter by date range
    if (criteria.startDate) {
      const startDate = new Date(criteria.startDate);
      filteredRepairs = filteredRepairs.filter(
        repair => new Date(repair.receivedDate) >= startDate
      );
    }
    
    if (criteria.endDate) {
      const endDate = new Date(criteria.endDate);
      filteredRepairs = filteredRepairs.filter(
        repair => new Date(repair.receivedDate) <= endDate
      );
    }
    
    return filteredRepairs;
  } catch (error) {
    console.error('Error searching repairs:', error);
    throw error;
  }
};

// Search clients based on criteria
const searchClients = async (criteria: any) => {
  try {
    const allClients = await storage.getClients();
    let filteredClients = [...allClients];
    
    // Apply search filters
    if (criteria.name) {
      const nameLower = criteria.name.toLowerCase();
      filteredClients = filteredClients.filter(
        client => client.name.toLowerCase().includes(nameLower)
      );
    }
    
    if (criteria.email) {
      const emailLower = criteria.email.toLowerCase();
      filteredClients = filteredClients.filter(
        client => client.email && client.email.toLowerCase().includes(emailLower)
      );
    }
    
    return filteredClients;
  } catch (error) {
    console.error('Error searching clients:', error);
    throw error;
  }
};

// Update component data
const updateComponent = async (id: number, updates: any) => {
  try {
    const component = await storage.getComponent(id);
    if (!component) {
      throw new Error(`Component with ID ${id} not found`);
    }
    
    // Apply updates
    const updatedComponent = await storage.updateComponent(id, {
      ...updates,
    });
    
    return updatedComponent;
  } catch (error) {
    console.error(`Error updating component ${id}:`, error);
    throw error;
  }
};

// Update repair status
const updateRepairStatus = async (id: number, status: string) => {
  try {
    const repair = await storage.getRepair(id);
    if (!repair) {
      throw new Error(`Repair with ID ${id} not found`);
    }
    
    const validStatuses = [
      'Received', 
      'In Progress', 
      'Waiting for Parts', 
      'Ready for Pickup', 
      'Completed', 
      'Cancelled'
    ];
    
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }
    
    // Update the repair with new status
    const updatedRepair = await storage.updateRepair(id, {
      ...repair,
      status
    });
    
    return updatedRepair;
  } catch (error) {
    console.error(`Error updating repair ${id}:`, error);
    throw error;
  }
};

// Update component stock
const updateComponentStock = async (id: number, quantity: number) => {
  try {
    const component = await storage.getComponent(id);
    if (!component) {
      throw new Error(`Component with ID ${id} not found`);
    }
    
    // Update the stock level
    const updatedComponent = await storage.updateComponentStock(id, quantity);
    
    return updatedComponent;
  } catch (error) {
    console.error(`Error updating stock for component ${id}:`, error);
    throw error;
  }
};

// Generate simple reports based on data
const generateReportData = async (reportType: string) => {
  switch (reportType) {
    case 'inventory':
      const components = await storage.getComponents();
      const categories = await storage.getCategories();
      const lowStockComponents = await storage.getLowStockComponents();
      
      return {
        totalComponents: components.length,
        lowStockCount: lowStockComponents.length,
        categoryBreakdown: categories.map(cat => {
          const catComponents = components.filter(comp => comp.categoryId === cat.id);
          return {
            category: cat.name,
            count: catComponents.length
          };
        }),
        inventoryValue: components.reduce((sum, comp) => {
          return sum + ((comp.currentStock || 0) * (comp.supplierPrice || 0));
        }, 0)
      };
      
    case 'repairs':
      const repairs = await storage.getRepairs();
      const activeRepairs = await storage.getActiveRepairs();
      const completedRepairs = repairs.filter(repair => repair.status === 'Completed');
      
      return {
        totalRepairs: repairs.length,
        activeRepairs: activeRepairs.length,
        completedRepairs: completedRepairs.length,
        statusBreakdown: (() => {
          const statuses: { [key: string]: number } = {};
          repairs.forEach(repair => {
            statuses[repair.status || 'Unknown'] = (statuses[repair.status || 'Unknown'] || 0) + 1;
          });
          return Object.entries(statuses).map(([status, count]) => ({
            status,
            count,
            percentage: repairs.length ? Math.round((count / repairs.length) * 100) : 0
          }));
        })()
      };
      
    default:
      throw new Error(`Unsupported report type: ${reportType}`);
  }
};

// Express handler for chat endpoint
export const handleChatQuery = async (req: Request, res: Response) => {
  try {
    const { sessionId, message } = req.body;
    
    if (!sessionId || !message) {
      return res.status(400).json({
        error: 'Missing sessionId or message'
      });
    }
    
    // Get or initialize chat history
    let chatHistory = chatSessions.get(sessionId) || [];
    
    // Add user message to history
    chatHistory.push({
      role: 'user',
      parts: message
    });
    
    // Process user query
    const response = await processQuery(chatHistory, message);
    
    // Add model response to history
    chatHistory.push({
      role: 'model',
      parts: response
    });
    
    // Keep history limited to last 10 messages
    if (chatHistory.length > 10) {
      chatHistory = chatHistory.slice(chatHistory.length - 10);
    }
    
    // Store updated history
    chatSessions.set(sessionId, chatHistory);
    
    // Return response
    return res.json({
      sessionId,
      response
    });
  } catch (error) {
    console.error('Error handling chat query:', error);
    return res.status(500).json({
      error: 'Failed to process chat query'
    });
  }
};

// Handle data operations requested by AI
export const handleAiOperation = async (req: Request, res: Response) => {
  try {
    const { operation, params } = req.body;
    
    if (!operation) {
      return res.status(400).json({
        error: 'Missing operation'
      });
    }
    
    let result;
    
    switch (operation) {
      case 'searchComponents':
        result = await searchComponents(params);
        break;
      
      case 'searchRepairs':
        result = await searchRepairs(params);
        break;
      
      case 'searchClients':
        result = await searchClients(params);
        break;
      
      case 'updateComponent':
        if (!params.id || !params.updates) {
          throw new Error('Missing component id or updates');
        }
        result = await updateComponent(params.id, params.updates);
        break;
      
      case 'updateRepairStatus':
        if (!params.id || !params.status) {
          throw new Error('Missing repair id or status');
        }
        result = await updateRepairStatus(params.id, params.status);
        break;
      
      case 'updateStock':
        if (!params.id || params.quantity === undefined) {
          throw new Error('Missing component id or quantity');
        }
        result = await updateComponentStock(params.id, params.quantity);
        break;
      
      case 'generateReport':
        if (!params.reportType) {
          throw new Error('Missing report type');
        }
        result = await generateReportData(params.reportType);
        break;
      
      default:
        return res.status(400).json({
          error: `Unsupported operation: ${operation}`
        });
    }
    
    return res.json({ result });
  } catch (error) {
    console.error('Error handling AI operation:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to process operation'
    });
  }
};