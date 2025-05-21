import { GoogleGenerativeAI, type Content, type Part, GenerativeModel } from '@google/generative-ai';
import { Request, Response } from 'express';
import { storage } from './storage';

// Initialize the Google AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

// Initialize AI model with fallback options
let model: GenerativeModel | null = null;
try {
  // Try to use gemini-1.5-pro first
  model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  console.log('Successfully initialized gemini-1.5-pro model');
} catch (error) {
  console.warn('Failed to initialize gemini-1.5-pro, falling back to gemini-pro');
  try {
    // Fall back to gemini-pro
    model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    console.log('Successfully initialized gemini-pro model');
  } catch (fallbackError) {
    console.error('Failed to initialize AI models, will use database fallback mode');
    // We'll handle the null model case in our processing functions
  }
}

// Define chat message structure for Google AI
interface ChatMessage {
  role: 'user' | 'model';
  parts: Part[];
}

const chatSessions: Map<string, Content[]> = new Map();

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
const processQuery = async (chatHistory: Content[], query: string) => {
  // If no model is available, return a graceful error message
  if (!model) {
    console.error('AI model not available. API key might be missing or invalid.');
    return 'I\'m sorry, but the AI service is currently unavailable. Please check your API key configuration.';
  }
  
  const systemContext = await getSystemContext();
  
  try {
    // Prepare the chat session with system context and history
    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        maxOutputTokens: 1000,
      },
    });
    
    // Send the query to the model
    const result = await chat.sendMessage(systemContext + '\n\nUser question: ' + query);
    return result.response.text();
  } catch (error) {
    console.error('Error processing chat query:', error);
    return 'Sorry, I encountered an error processing your question. Please try again with a different question or check the API key configuration.';
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
        comp => (comp.currentStock || 0) <= (comp.minimumStock || 0)
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

// Process voice commands and optimize response for speech
const processVoiceCommand = async (chatHistory: Content[], command: string) => {
  // First check if this is a query about inventory components
  // that we can answer directly from the database
  console.log(`Processing voice command: "${command}"`);
  
  // Check for direct component number query like "78M05" or "78 m 05"
  const directComponentPattern = /(78\s*m\s*05|lm\s*317|l\s*7912)/i;
  const directComponentMatch = command.match(directComponentPattern);
  
  if (directComponentMatch) {
    const rawComponentName = directComponentMatch[0];
    console.log(`Detected direct component query for: "${rawComponentName}"`);
    
    try {
      // Query the database directly with exact information
      const components = await storage.getComponents();
      
      // Handle 78M05 specifically
      if (rawComponentName.toLowerCase().replace(/\s+/g, '').includes('78m05')) {
        const m78Component = components.find(c => 
          c.name.toLowerCase().replace(/\s+/g, '') === '78m05'
        );
        
        if (m78Component) {
          console.log('Found exact 78M05 component:', m78Component);
          return `We have ${m78Component.currentStock} ${m78Component.name} components in stock. 
            The minimum stock level is set to ${m78Component.minimumStock}.`;
        }
      }
      
      // Create normalized versions for comparison for other components
      const normalizedQuery = rawComponentName.toLowerCase().replace(/\s+/g, '');
      console.log(`Normalized component query: "${normalizedQuery}"`);
      
      // Find components that match when spaces are removed
      const matchingComponents = components.filter(c => {
        const normalizedName = c.name.toLowerCase().replace(/\s+/g, '');
        return normalizedName.includes(normalizedQuery) || 
               normalizedQuery.includes(normalizedName);
      });
      
      console.log(`Found ${matchingComponents.length} potential matches`);
      
      if (matchingComponents.length > 0) {
        const component = matchingComponents[0];
        return `I found ${component.name} in inventory. 
          We currently have ${component.currentStock} units in stock. 
          The minimum stock level is set to ${component.minimumStock}.`;
      } else {
        return `I couldn't find a component matching "${rawComponentName}" in the inventory. 
          Would you like me to search using a different name format?`;
      }
    } catch (dbError) {
      console.error('Error querying database for component:', dbError);
      return "I'm having trouble accessing the inventory data right now. Please try again in a moment.";
    }
  }
  
  // More general pattern matching for component queries
  const componentMatch = command.match(/how many (\w+)[ \-]?(\w*)[ \-]?(\w*)\s*components?/i);
  if (componentMatch) {
    // Build component name from matched parts, filtering out empty parts
    const parts = [componentMatch[1], componentMatch[2], componentMatch[3]].filter(part => part);
    const componentName = parts.join(' ');
    console.log(`Detected component query for: "${componentName}"`);
    
    // Check for numeric components with various patterns
    if (componentName.includes('78')) {
      console.log("Detected component with '78' - checking for voltage regulator");
      
      try {
        // Query the database directly for 78M05 or similar
        const components = await storage.getComponents();
        
        // Search for any component containing 78
        const matchingComponents = components.filter(c => 
          c.name.toLowerCase().replace(/\s+/g, '').includes('78')
        );
        
        if (matchingComponents.length > 0) {
          const component = matchingComponents[0];
          return `I found ${component.name} in inventory. 
            Current stock: ${component.currentStock} units. 
            Minimum stock level: ${component.minimumStock}.`;
        }
      } catch (dbError) {
        console.error('Error querying database for component with 78:', dbError);
      }
    }
    
    try {
      // Query the database directly
      const components = await storage.getComponents();
      const matchingComponents = components.filter(c => 
        c.name.toLowerCase().includes(componentName.toLowerCase())
      );
      
      if (matchingComponents.length > 0) {
        const component = matchingComponents[0];
        return `I found ${matchingComponents.length} component${matchingComponents.length > 1 ? 's' : ''} matching ${componentName}. 
          The ${component.name} has ${component.currentStock} units in stock. 
          The minimum stock level is set to ${component.minimumStock}.`;
      } else {
        return `I couldn't find any components matching "${componentName}" in the inventory. 
          Would you like to add this component to the inventory?`;
      }
    } catch (dbError) {
      console.error('Error querying database for component:', dbError);
    }
  }
  
  // Check other common queries that we can answer without the AI API
  if (command.toLowerCase().includes('low stock')) {
    try {
      const lowStockComponents = await storage.getLowStockComponents();
      if (lowStockComponents.length === 0) {
        return "Good news! There are no components with low stock at the moment.";
      } else {
        return `There are ${lowStockComponents.length} components with low stock. The most critical ones are: ${
          lowStockComponents.slice(0, 3).map(c => c.name).join(', ')
        }.`;
      }
    } catch (dbError) {
      console.error('Error querying database for low stock:', dbError);
    }
  }
  
  if (command.toLowerCase().includes('active repair') || command.toLowerCase().includes('ongoing repair')) {
    try {
      const activeRepairs = await storage.getActiveRepairs();
      if (activeRepairs.length === 0) {
        return "There are no active repairs at the moment.";
      } else {
        return `There are ${activeRepairs.length} active repairs in the system. The most recent ones are for clients: ${
          activeRepairs.slice(0, 3).map(r => r.clientName || 'Unknown').join(', ')
        }.`;
      }
    } catch (dbError) {
      console.error('Error querying database for active repairs:', dbError);
    }
  }
  
  // If no model is available or if we hit an API limitation, return a helpful response
  if (!model) {
    console.log('AI model not available for voice command. Providing database-backed response.');
    return 'I can help with basic inventory and repair questions without the AI service. Try asking about specific components, low stock items, or active repairs.';
  }
  
  const systemContext = `
You are an AI assistant for a Solar Inverter Repair Management System.
The user is interacting with you using voice commands, so keep your responses concise and easily speakable.
Format your responses for speaking aloud with these guidelines:
1. Keep sentences short and simple
2. Avoid complex lists or tables which would be hard to understand when spoken
3. Use natural conversational language
4. Include pauses where appropriate (use commas)
5. Avoid special characters or formatting that would be difficult to speak

When responding to voice commands, prioritize:
- Brevity: Keep responses under 4 sentences when possible
- Clarity: Use simple language
- Actionability: When an action is needed, make it very clear
- Context: Remind the user what they asked about in your answer

For most requests about the system, give one concise, informative answer.
`;

  try {
    // Prepare the chat session with system context and history
    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        maxOutputTokens: 800,
      },
    });
    
    // Send the query to the model
    const result = await chat.sendMessage(systemContext + '\n\nUser voice command: ' + command);
    return result.response.text();
  } catch (error) {
    console.error('Error processing voice command:', error);
    
    // If we hit API quota limits, return a more helpful message
    if (error.message && error.message.includes('quota')) {
      return 'I\'m sorry, but the AI service has reached its quota limit. I can still help with basic inventory and repair questions. Try asking about specific components, low stock items, or active repairs.';
    }
    
    return 'I can still help with basic questions even without the AI service. Try asking about specific components, low stock items, or active repairs.';
  }
};

// Express handler for chat endpoint
export const handleChatQuery = async (req: Request, res: Response) => {
  try {
    const { sessionId, message, isVoiceMode } = req.body;
    
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
      parts: [{ text: message }]
    });
    
    // Process user query - use voice-optimized processing if in voice mode
    const response = isVoiceMode 
      ? await processVoiceCommand(chatHistory, message)
      : await processQuery(chatHistory, message);
    
    // Add model response to history
    chatHistory.push({
      role: 'model',
      parts: [{ text: response }]
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
// Analyze datasheet content using AI
export const analyzeDatasheet = async (datasheetUrl: string, componentName: string) => {
  // If no model is available, return a graceful error message
  if (!model) {
    console.error('AI model not available for datasheet analysis.');
    throw new Error('AI service is currently unavailable. Please check your API key configuration.');
  }
  
  try {
    // For PDF analysis, we'd normally extract the text first
    // For this example, we're simulating by passing the URL and component name
    
    const prompt = `
You are a technical component analyst that specializes in electronic components.
Please analyze the datasheet for the component "${componentName}" at URL: ${datasheetUrl}

Extract the following information in a structured JSON format:
1. Key specifications
2. Package type
3. Operating parameters (voltage, current, temperature range)
4. Common applications
5. Alternative/compatible components that could be used as replacements
6. Common issues or failure modes

If you cannot access the actual datasheet content using the URL, provide educated technical information about typical components with this name based on your knowledge.

Format your response as valid JSON with the following structure:
{
  "specifications": { ... },
  "package": "...",
  "operatingParameters": { ... },
  "applications": [ ... ],
  "alternatives": [ ... ],
  "commonIssues": [ ... ],
  "technicalNotes": "..."
}
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    try {
      // Try to parse the response as JSON
      const jsonStart = responseText.indexOf('{');
      const jsonEnd = responseText.lastIndexOf('}') + 1;
      
      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        const jsonString = responseText.substring(jsonStart, jsonEnd);
        return JSON.parse(jsonString);
      } else {
        // If not JSON, return the text as is
        return { 
          technicalNotes: responseText,
          error: "Response was not in expected JSON format"
        };
      }
    } catch (parseError) {
      console.error('Error parsing AI response as JSON:', parseError);
      return { 
        technicalNotes: responseText,
        error: "Failed to parse JSON response"
      };
    }
  } catch (error) {
    console.error('Error analyzing datasheet:', error);
    throw error;
  }
};

// Find alternative components when out of stock
export const findAlternativeComponents = async (componentName: string, specifications: any) => {
  // If no model is available, return a graceful error message
  if (!model) {
    console.error('AI model not available for component search.');
    throw new Error('AI service is currently unavailable. Please check your API key configuration.');
  }
  
  try {
    const prompt = `
You are a technical component advisor for an electronic repair shop.
The shop is looking for alternatives to the component "${componentName}" with these specifications:
${JSON.stringify(specifications, null, 2)}

Please provide:
1. At least 3 alternative components that could work as replacements
2. The key differences between each alternative and the original
3. Any adjustments needed when using these alternatives
4. Where these components might be commonly available

Format your response as valid JSON with the following structure:
{
  "alternatives": [
    {
      "name": "...",
      "manufacturer": "...",
      "keyDifferences": [ ... ],
      "adjustmentsNeeded": "...",
      "availabilityNotes": "..."
    }
  ],
  "generalAdvice": "..."
}
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    try {
      // Try to parse the response as JSON
      const jsonStart = responseText.indexOf('{');
      const jsonEnd = responseText.lastIndexOf('}') + 1;
      
      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        const jsonString = responseText.substring(jsonStart, jsonEnd);
        return JSON.parse(jsonString);
      } else {
        // If not JSON, return the text as is
        return { 
          generalAdvice: responseText,
          error: "Response was not in expected JSON format"
        };
      }
    } catch (parseError) {
      console.error('Error parsing AI response as JSON:', parseError);
      return { 
        generalAdvice: responseText,
        error: "Failed to parse JSON response"
      };
    }
  } catch (error) {
    console.error('Error finding alternative components:', error);
    throw error;
  }
};

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
      
      case 'analyzeDatasheet':
        if (!params.datasheetUrl || !params.componentName) {
          throw new Error('Missing datasheet URL or component name');
        }
        result = await analyzeDatasheet(params.datasheetUrl, params.componentName);
        break;
        
      case 'findAlternativeComponents':
        if (!params.componentName) {
          throw new Error('Missing component name');
        }
        result = await findAlternativeComponents(params.componentName, params.specifications || {});
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