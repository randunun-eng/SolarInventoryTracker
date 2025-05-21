import { GoogleGenerativeAI, type Content, type Part, GenerativeModel } from '@google/generative-ai';
import { Request, Response } from 'express';
import { storage } from './storage';
import * as fs from 'fs';
import * as path from 'path';

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
  
  // Enhanced patterns for electronic components and technical queries
  
  // Components - enhanced with common voltage regulators (both positive and negative)
  const directComponentPattern = /(78\s*m\s*05|78\s*0\s*5|78\s*12|l\s*78\s*12|7805|7806|7808|7809|7812|7815|7818|7824|lm\s*317|l\s*79\s*05|l\s*7905|l\s*7912|[\d]+[a-z][\d]+)/i;
  const directComponentMatch = command.match(directComponentPattern);
  
  // Technical parameter checks
  const voltageQuery = /voltage|volts|vdc|vac|output|input|power|supply/i.test(command);
  const pinoutQuery = /pinout|pin\s*out|pin\s*configuration|pin\s*diagram/i.test(command);
  const packageQuery = /package|case|housing|to-\d+|sot-\d+|smd|through\s*hole/i.test(command);
  
  if (directComponentMatch) {
    const rawComponentName = directComponentMatch[0];
    console.log(`Detected direct component query for: "${rawComponentName}"`);
    
    try {
      // Query the database directly with exact information
      const components = await storage.getComponents();
      
      // Only search our actual component database
      // Get a list of all component names for better searching
      const componentNameVariations = [];
      
      // Find matching components in the inventory
      const foundComponents = components.filter(comp => {
        const name = comp.name.toLowerCase();
        const partNumber = comp.partNumber ? comp.partNumber.toLowerCase() : '';
        const description = comp.description ? comp.description.toLowerCase() : '';
        
        // Create variations for searching
        componentNameVariations.push(name);
        if (partNumber) componentNameVariations.push(partNumber);
        
        // Check if any of the component fields match the query
        return name.includes(rawComponentName.toLowerCase()) || 
               partNumber.includes(rawComponentName.toLowerCase()) ||
               description.includes(rawComponentName.toLowerCase());
      });
      
      console.log(`Found ${foundComponents.length} potential matches`);
      
      if (foundComponents.length > 0) {
        // We found at least one component that matches the query
        if (voltageQuery) {
          // The user is asking about voltage specifications
          const voltageResponses = foundComponents.map(component => {
            let voltageInfo = "Voltage information not specified";
            if (component.description && component.description.match(/(\d+\.?\d*)\s*V(olt)?/i)) {
              voltageInfo = component.description.match(/(\d+\.?\d*)\s*V(olt)?/i)![1] + " volts";
            }
            
            return `${component.name} (${component.partNumber || 'No part number'}): ${voltageInfo}`;
          });
          
          return voltageResponses.join("\n");
        } else if (pinoutQuery) {
          // The user is asking about pinout
          const pinoutResponses = foundComponents.map(component => {
            return `${component.name} (${component.partNumber || 'No part number'}) pinout information: ${component.description || 'No detailed pinout information available in inventory.'}`;
          });
          
          return pinoutResponses.join("\n");
        } else if (command.toLowerCase().includes('many') || 
                   /stock|inventory|available|have|many/i.test(command)) {
          // The user is asking about stock levels
          const stockResponses = foundComponents.map(component => {
            return `${component.name} has ${component.currentStock} units in stock. 
          The minimum stock level is set to ${component.minimumStock}.`;
          });
          
          return `I found ${foundComponents.length} component${foundComponents.length > 1 ? 's' : ''} matching ${rawComponentName}. 
          ${stockResponses.join("\n")}`;
        } else {
          // General information about the components
          const infoResponses = foundComponents.map(component => {
            return `${component.name} (${component.partNumber || 'No part number'}): ${component.description || 'No detailed description available'}. 
            Current stock: ${component.currentStock} units.`;
          });
          
          return `Found ${foundComponents.length} component${foundComponents.length > 1 ? 's' : ''} matching ${rawComponentName}:
          ${infoResponses.join("\n\n")}`;
        }
      } else {
        // No component found in inventory - provide a helpful response
        if (components.length > 0) {
          // If we have components in the database but none matched, suggest checking inventory
          const suggestions = components.map(c => c.name).slice(0, 5).join(", ");
          return `I couldn't find a component matching "${rawComponentName}" in the inventory. 
          Would you like me to search using a different name format?`;
        } else {
          // No components at all - suggest adding some
          return `I couldn't find any components in the inventory. Please add some components first to enable querying.`;
        }
      }
      
      // Return early since we've either found a match or provided appropriate guidance
      return `I couldn't find a component matching "${rawComponentName}" in the inventory. 
      Would you like me to search using a different name format?`;
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
// Helper function to convert file to base64
const fileToGenerativePart = async (filePath: string, mimeType: string): Promise<Part> => {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`File does not exist: ${filePath}`);
      return { text: `File not found: ${filePath}` };
    }
    
    // Read file and convert to base64
    const fileData = fs.readFileSync(filePath);
    const base64Data = fileData.toString('base64');
    
    return {
      inlineData: {
        data: base64Data,
        mimeType
      }
    };
  } catch (error) {
    console.error('Error converting file to base64:', error);
    return { text: `Error processing file: ${error.message}` };
  }
};

// Analyze datasheet content using AI with fallback to database
export const analyzeDatasheet = async (datasheetUrl: string, componentName: string, pdfFilePath?: string) => {
  console.log(`Analyzing datasheet for ${componentName} at ${datasheetUrl}`);
  
  // Check if we have a PDF file path provided
  let pdfContent: Part | null = null;
  if (pdfFilePath) {
    try {
      console.log(`Attempting to read PDF file from: ${pdfFilePath}`);
      pdfContent = await fileToGenerativePart(pdfFilePath, 'application/pdf');
      console.log('Successfully converted PDF to base64 for AI analysis');
    } catch (pdfError) {
      console.error('Error processing PDF file:', pdfError);
    }
  }

  try {
    // First check if we can find this component in our database
    const components = await storage.getComponents();
    
    // Normalize the component name for better matching
    const normalizedName = componentName.toLowerCase().replace(/\s+/g, '');
    
    // Try to find the component in our database
    const matchingComponents = components.filter(c => {
      const normalizedCompName = c.name.toLowerCase().replace(/\s+/g, '');
      return normalizedCompName.includes(normalizedName) || 
             normalizedName.includes(normalizedCompName);
    });
    
    console.log(`Found ${matchingComponents.length} matching components in database`);
    
    // If we found a matching component, use its data
    if (matchingComponents.length > 0) {
      const component = matchingComponents[0];
      
      // Get the component's category if available
      let categoryName = "Unknown";
      if (component.categoryId) {
        try {
          const category = await storage.getCategory(component.categoryId);
          if (category) {
            categoryName = category.name;
          }
        } catch (err) {
          console.error('Error fetching category:', err);
        }
      }
      
      // Get a more detailed understanding of component from description field
      // For voltage regulators, parse the description for voltage values
      let voltage = null;
      let voltageMatch = null;
      
      if (component.description) {
        // Look for voltage specifications like "+5V", "5VDC", etc.
        voltageMatch = component.description.match(/([+-]?\d+(?:\.\d+)?)\s*v(?:olt)?(?:dc|ac)?/i);
        if (voltageMatch) {
          voltage = voltageMatch[1];
        }
      }
      
      // Build a more detailed response from the database
      const dbResponse = {
        specifications: {
          name: component.name,
          partNumber: component.partNumber || "Not specified",
          category: categoryName,
          description: component.description || "Not available",
          key_features: [
            `${categoryName} component`,
            component.description || "",
            `Package: ${component.partNumber || "Not specified"}`
          ],
          voltage_rating: voltage ? `${voltage}V` : "Not specified in database",
          current_capacity: "Not specified in database"
        },
        package: component.partNumber || "Unknown",
        operatingParameters: {
          notes: component.description || "No detailed operating parameters available",
          input_voltage_range: categoryName.toLowerCase().includes("regulator") ? 
            "Typically 1.5-2V higher than output voltage" : "Not specified",
          output_voltage: voltage ? `${voltage}V` : "Not specified in database",
          max_current: "Not specified in database",
          temperature_range: "Not specified in database"
        },
        applications: [categoryName],
        alternatives: [],
        commonIssues: [],
        technicalNotes: `This component information was retrieved from the local database. The description field "${component.description}" contains key technical details. For more details, please consult the datasheet.`,
        databaseSource: true
      };
      
      console.log('Using database information for component analysis');
      return dbResponse;
    }
    
    // If no database match or if we want enhanced information, try the AI model
    if (!model) {
      console.error('AI model not available for datasheet analysis. Using fallback response.');
      return { 
        technicalNotes: `Unable to analyze the datasheet for ${componentName} as the AI service is currently unavailable. Please check your component inventory directly or try again later.`,
        error: "AI service unavailable",
        specifications: {
          name: componentName,
          partNumber: "Unknown",
          description: "Information not available without AI service"
        },
        package: "Unknown",
        operatingParameters: {
          notes: "Information not available without AI service"
        },
        applications: ["Information not available"],
        alternatives: [],
        commonIssues: []
      };
    }
    
    // If AI model is available, use it for analysis
    const parts: Part[] = [
      { text: `
You are a technical component analyst that specializes in electronic components.
Please analyze the datasheet for the component "${componentName}".

Focus particularly on the "Features" and "Description" sections at the top of the first page, as these contain the most critical component specifications.

Extract the following information in a structured JSON format:
1. Key specifications from the Features/Description section
2. Package type (e.g., TO-220, SOT-23, DIP, etc.)
3. Operating parameters (voltage, current, temperature range)
4. Common applications mentioned in the datasheet
5. Alternative/compatible components that could be used as replacements
6. Common issues or failure modes

Be particularly attentive to voltage ratings, current capacity, and pin configurations as these are the most critical parameters for electronics repair work.

${datasheetUrl ? `A URL to the datasheet is provided: ${datasheetUrl}` : ''}
${pdfContent ? 'I am also providing the PDF datasheet directly for analysis.' : ''}

Format your response as valid JSON with the following structure:
{
  "specifications": { 
    "key_features": [ ... ],
    "description": "...",
    "voltage_rating": "...",
    "current_capacity": "..."
  },
  "package": "...",
  "operatingParameters": { 
    "input_voltage_range": "...",
    "output_voltage": "...",
    "max_current": "...",
    "temperature_range": "..."
  },
  "applications": [ ... ],
  "alternatives": [ ... ],
  "commonIssues": [ ... ],
  "technicalNotes": "..."
}
` }
    ];
    
    // Add PDF content if available
    if (pdfContent) {
      parts.push(pdfContent);
    }
    
    console.log(`Sending request to Gemini AI with ${parts.length} parts (${pdfContent ? 'including PDF' : 'text only'})`);
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1500,
      },
    });
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
    // Provide a fallback response even when there's an error
    return { 
      technicalNotes: `An error occurred while analyzing the datasheet for ${componentName}. Please try again later.`,
      error: "Error analyzing datasheet",
      errorDetails: error.message,
      specifications: {
        name: componentName
      }
    };
  }
};

// Find alternative components when out of stock, with fallback to database
export const findAlternativeComponents = async (componentName: string, specifications: any) => {
  console.log(`Searching for alternatives to ${componentName}`);
  
  try {
    // First look for alternatives in our database
    const components = await storage.getComponents();
    
    // If the request is for a specific component, try to find it first
    let originalComponent = null;
    const normalizedName = componentName.toLowerCase().replace(/\s+/g, '');
    
    // Try to find the original component
    for (const comp of components) {
      const normalizedCompName = comp.name.toLowerCase().replace(/\s+/g, '');
      if (normalizedCompName === normalizedName || 
          (normalizedCompName.includes(normalizedName) && normalizedName.length > 3)) {
        originalComponent = comp;
        break;
      }
    }
    
    // If we found the original component, look for others in the same category
    if (originalComponent && originalComponent.categoryId) {
      console.log(`Found original component: ${originalComponent.name}, looking for alternatives in category ${originalComponent.categoryId}`);
      
      // Get components in the same category
      const alternatives = components.filter(c => 
        c.id !== originalComponent.id && 
        c.categoryId === originalComponent.categoryId
      );
      
      if (alternatives.length > 0) {
        console.log(`Found ${alternatives.length} alternative components in the same category`);
        
        // Get category name
        let categoryName = "Same category";
        try {
          const category = await storage.getCategory(originalComponent.categoryId);
          if (category) {
            categoryName = category.name;
          }
        } catch (err) {
          console.error('Error fetching category:', err);
        }
        
        // Format database alternatives
        const dbAlternatives = alternatives.slice(0, 3).map(alt => ({
          name: alt.name,
          manufacturer: "Unknown",
          partNumber: alt.partNumber || "Not specified",
          keyDifferences: [
            `Different part number: ${alt.partNumber || 'Not specified'}`,
            `Current stock: ${alt.currentStock} units`
          ],
          adjustmentsNeeded: "Please consult the datasheet for compatibility details.",
          availabilityNotes: `${alt.currentStock} units available in inventory`
        }));
        
        return {
          alternatives: dbAlternatives,
          generalAdvice: `These alternatives are from the same category (${categoryName}) as the requested component. Please verify technical specifications before use.`,
          databaseSource: true
        };
      }
    }
    
    // If no model is available or if AI hits quota limit, provide basic alternative suggestions
    if (!model) {
      console.error('AI model not available for component search. Using fallback response.');
      return { 
        generalAdvice: `Unable to provide detailed alternatives for ${componentName} as the AI service is currently unavailable. 
          Please check other components in your inventory from the same category or consult a component reference catalog.`,
        alternatives: [
          {
            name: "Similar components in database",
            manufacturer: "Various",
            keyDifferences: ["Unknown without AI analysis"],
            adjustmentsNeeded: "Verify specifications carefully before substitution",
            availabilityNotes: "Check your inventory system"
          }
        ],
        error: "AI service unavailable"
      };
    }
    
    // If AI model is available, use it for finding alternatives
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
    
    // Provide fallback response on error
    return { 
      generalAdvice: `An error occurred while searching for alternatives to ${componentName}. Please try a different component or check your inventory directly.`,
      error: "Error finding alternatives",
      errorDetails: error.message
    };
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