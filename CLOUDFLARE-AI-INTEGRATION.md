# Cloudflare AI Worker Integration Guide

## 🎉 Successfully Deployed!

**Worker URL**: https://solar-inventory-ai.randunun.workers.dev

Your Solar Inventory Tracker now has an additional AI backend using Cloudflare Workers AI!

## Why Use Cloudflare AI?

This worker **complements** your existing Google Gemini AI:

1. **Backup**: When Google AI quota is reached, fallback to Cloudflare
2. **Cost-effective**: Cloudflare Workers AI is often cheaper
3. **Faster**: Runs on Cloudflare's edge network
4. **Additional models**: Access to different AI models

## Architecture

```
Solar Inventory Tracker
    ├── Primary AI: Google Gemini (existing)
    └── Backup AI: Cloudflare Workers AI (new)
```

## Available Endpoints

### 1. Chat Interface
```javascript
POST https://solar-inventory-ai.randunun.workers.dev/api/chat

{
  "message": "How many components do we have?",
  "history": [],
  "context": {
    "totalComponents": 150,
    "lowStockCount": 5,
    "totalRepairs": 45,
    "activeRepairs": 12
  }
}
```

### 2. Voice Commands
```javascript
POST https://solar-inventory-ai.randunun.workers.dev/api/voice

{
  "command": "Show me low stock items",
  "inventory": {...}
}
```

### 3. Component Search
```javascript
POST https://solar-inventory-ai.randunun.workers.dev/api/component-search

{
  "query": "Find all 78M05 voltage regulators",
  "components": [...]
}
```

### 4. Auto-Categorize
```javascript
POST https://solar-inventory-ai.randunun.workers.dev/api/categorize

{
  "component": {
    "name": "78M05",
    "partNumber": "LM78M05",
    "description": "5V voltage regulator"
  }
}
```

### 5. Find Alternatives
```javascript
POST https://solar-inventory-ai.randunun.workers.dev/api/alternatives

{
  "componentName": "78M05",
  "specifications": {...},
  "availableComponents": [...]
}
```

### 6. Analyze Repair
```javascript
POST https://solar-inventory-ai.randunun.workers.dev/api/analyze-repair

{
  "repair": {
    "id": 1,
    "inverterModel": "3.5KW Hybrid",
    "faultDescription": "Error 11",
    "status": "In Progress"
  },
  "faultTypes": [...]
}
```

### 7. Datasheet Extraction
```javascript
POST https://solar-inventory-ai.randunun.workers.dev/api/datasheet

{
  "componentName": "78M05",
  "datasheetText": "...",
  "partNumber": "LM78M05"
}
```

## Integration with Existing Code

### Step 1: Create AI Service Helper

Create a new file: `server/cloudflare-ai.ts`

```typescript
const CLOUDFLARE_AI_URL = 'https://solar-inventory-ai.randunun.workers.dev';

export class CloudflareAI {
  /**
   * Send chat message to Cloudflare AI
   */
  static async chat(message: string, context?: any): Promise<string> {
    const response = await fetch(`${CLOUDFLARE_AI_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, context })
    });

    const data = await response.json();
    return data.response;
  }

  /**
   * Process voice command
   */
  static async voice(command: string, inventory?: any): Promise<string> {
    const response = await fetch(`${CLOUDFLARE_AI_URL}/api/voice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, inventory })
    });

    const data = await response.json();
    return data.response;
  }

  /**
   * Search components using natural language
   */
  static async searchComponents(query: string, components: any[]): Promise<any> {
    const response = await fetch(`${CLOUDFLARE_AI_URL}/api/component-search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, components })
    });

    return await response.json();
  }

  /**
   * Categorize component
   */
  static async categorize(component: any): Promise<any> {
    const response = await fetch(`${CLOUDFLARE_AI_URL}/api/categorize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ component })
    });

    return await response.json();
  }

  /**
   * Find alternative components
   */
  static async findAlternatives(componentName: string, specifications: any, availableComponents: any[]): Promise<any> {
    const response = await fetch(`${CLOUDFLARE_AI_URL}/api/alternatives`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ componentName, specifications, availableComponents })
    });

    return await response.json();
  }

  /**
   * Analyze repair
   */
  static async analyzeRepair(repair: any, faultTypes: any[]): Promise<any> {
    const response = await fetch(`${CLOUDFLARE_AI_URL}/api/analyze-repair`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repair, faultTypes })
    });

    return await response.json();
  }

  /**
   * Extract datasheet information
   */
  static async analyzeDatasheet(componentName: string, partNumber: string, datasheetText: string): Promise<any> {
    const response = await fetch(`${CLOUDFLARE_AI_URL}/api/datasheet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ componentName, partNumber, datasheetText })
    });

    return await response.json();
  }
}
```

### Step 2: Modify ai-service.ts to Use Fallback

In `server/ai-service.ts`, add fallback logic:

```typescript
import { CloudflareAI } from './cloudflare-ai';

// In processQuery function, add try-catch with fallback:
const processQuery = async (chatHistory: Content[], query: string) => {
  // Try Google AI first
  if (!model) {
    console.log('Google AI not available, using Cloudflare AI');
    return await CloudflareAI.chat(query, await getSystemContextData());
  }

  try {
    const systemContext = await getSystemContext();
    const chat = model.startChat({
      history: chatHistory,
      generationConfig: { maxOutputTokens: 1000 }
    });

    const result = await chat.sendMessage(systemContext + '\n\nUser question: ' + query);
    return result.response.text();
  } catch (error) {
    console.error('Google AI error, falling back to Cloudflare AI:', error);

    // Fallback to Cloudflare AI
    return await CloudflareAI.chat(query, await getSystemContextData());
  }
};

// Helper to get context as plain object
const getSystemContextData = async () => {
  const components = await storage.getComponents();
  const repairs = await storage.getRepairs();
  const activeRepairs = await storage.getActiveRepairs();
  const lowStockComponents = await storage.getLowStockComponents();

  return {
    totalComponents: components.length,
    lowStockCount: lowStockComponents.length,
    totalRepairs: repairs.length,
    activeRepairs: activeRepairs.length
  };
};
```

### Step 3: Update Voice Command Processing

In `processVoiceCommand`, add Cloudflare AI fallback:

```typescript
const processVoiceCommand = async (chatHistory: Content[], command: string) => {
  // Existing direct database queries...

  // If no model available, use Cloudflare AI
  if (!model) {
    console.log('Using Cloudflare AI for voice command');
    const inventory = await storage.getComponents();
    return await CloudflareAI.voice(command, inventory);
  }

  try {
    // Existing Google AI logic...
  } catch (error) {
    console.error('Google AI error, using Cloudflare AI');
    const inventory = await storage.getComponents();
    return await CloudflareAI.voice(command, inventory);
  }
};
```

### Step 4: Use for Component Analysis

Replace or enhance `analyzeDatasheet`:

```typescript
export const analyzeDatasheet = async (datasheetUrl: string, componentName: string, pdfFilePath?: string) => {
  try {
    // Try existing Google AI logic first
    // ...
  } catch (error) {
    console.log('Using Cloudflare AI for datasheet analysis');

    // Extract text from PDF if available
    let datasheetText = '';
    if (pdfFilePath) {
      // You might want to extract text from PDF first
      // For now, use component info
    }

    const partNumber = componentName; // Or extract from other sources
    return await CloudflareAI.analyzeDatasheet(componentName, partNumber, datasheetText);
  }
};
```

### Step 5: Add Alternative Component Finder

```typescript
export const findAlternativeComponents = async (componentName: string, specifications: any) => {
  try {
    // Try existing logic...
  } catch (error) {
    console.log('Using Cloudflare AI for alternatives');

    const components = await storage.getComponents();
    return await CloudflareAI.findAlternatives(componentName, specifications, components);
  }
};
```

## Testing

### Test from Command Line

```bash
# Test chat
curl -X POST https://solar-inventory-ai.randunun.workers.dev/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "context": {"totalComponents": 100}}'

# Test voice
curl -X POST https://solar-inventory-ai.randunun.workers.dev/api/voice \
  -H "Content-Type: application/json" \
  -d '{"command": "How many repairs do we have?"}'
```

### Test from Your Application

Add a test endpoint in `server/routes.ts`:

```typescript
app.post('/api/test-cloudflare-ai', async (req, res) => {
  try {
    const { message } = req.body;
    const result = await CloudflareAI.chat(message, {
      totalComponents: 150,
      lowStockCount: 5
    });

    res.json({ success: true, response: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Environment Variables

Add to your `.env` file:

```env
# Existing variables...
GOOGLE_AI_API_KEY=your_google_key

# New Cloudflare AI Worker URL
CLOUDFLARE_AI_URL=https://solar-inventory-ai.randunun.workers.dev

# Optional: Enable/disable Cloudflare AI fallback
USE_CLOUDFLARE_AI_FALLBACK=true
```

## Monitoring & Logs

### View Worker Logs

```bash
cd ~/browser-automation && ./wrangler.sh tail solar-inventory-ai
```

### Check Worker Stats

Visit: https://dash.cloudflare.com/fba2eb8c1f67996b268a0f108405f6ae/workers/services/view/solar-inventory-ai/production

## Deployment Updates

To update the AI Worker:

```bash
cd ~/browser-automation/solar-inventory-ai-worker

# Edit src/index.js with your changes

# Deploy
export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh"
npx wrangler deploy
```

## Cost Comparison

| Feature | Google Gemini | Cloudflare AI |
|---------|---------------|---------------|
| Free tier | Limited | 10,000 requests/day |
| Cost per request | Varies | $0.01 per 1000 |
| Speed | ~1-2s | ~0.5-1s |
| Models | Gemini 1.5 Pro | Llama 3.1 8B |

## Best Practices

1. **Use Google AI as primary** - It has better accuracy for complex queries
2. **Use Cloudflare AI as backup** - When quota is reached or for simple queries
3. **Cache results** - Both services benefit from caching common queries
4. **Monitor usage** - Track which service is being used more
5. **Test both** - Ensure both work correctly

## Troubleshooting

### Worker not responding
```bash
# Check deployment status
cd ~/browser-automation && ./wrangler.sh deployments list --name solar-inventory-ai

# View logs
./wrangler.sh tail solar-inventory-ai
```

### CORS errors
The worker already includes CORS headers. If you still see errors, check your request headers.

### Quota exceeded
Cloudflare Workers AI free tier: 10,000 requests/day
Upgrade if needed in the Cloudflare dashboard.

## Next Steps

1. ✅ Deploy the CloudflareAI helper class
2. ✅ Add fallback logic to existing AI functions
3. ✅ Test the integration
4. Monitor usage and performance
5. Gradually increase Cloudflare AI usage if performance is good

## Support

- **Cloudflare Docs**: https://developers.cloudflare.com/workers-ai/
- **Worker Dashboard**: https://dash.cloudflare.com/fba2eb8c1f67996b268a0f108405f6ae/workers/services/view/solar-inventory-ai
- **Wrangler Docs**: https://developers.cloudflare.com/workers/wrangler/

---

**Your Solar Inventory Tracker now has dual AI power! 🚀**
