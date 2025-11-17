# 🤖 AI Features Setup Guide - Cloudflare Workers AI

## ✨ AI Features Overview

Your Solar Inventory Tracker has **3 powerful AI features** powered by Cloudflare Workers AI (Llama 3.1 8B):

### 1. **AI Chatbot** 🗨️
- Interactive assistant in the bottom-right corner
- **Real-time D1 database access** - knows your current inventory and repairs
- Answers questions about:
  - Current inventory levels and low stock items
  - Repair job status and recent jobs
  - Client information
  - Solar components and systems
- Voice input/output support
- Context-aware responses with live data
- Endpoint: `/api/ai-chat`

### 2. **Component Analysis** 🔍
- AI-powered component specification analysis
- Provides insights on:
  - Component category and type
  - Common applications in solar systems
  - Key specifications to monitor
  - Compatible alternatives
  - Storage recommendations
- Endpoint: `/api/analyze-component`

### 3. **Dashboard AI Insights** 📊
- Automated business intelligence
- Analyzes inventory and repair statistics
- Provides actionable insights on:
  - Inventory health
  - Repair efficiency
  - Revenue trends
  - Recommended actions
- Endpoint: `/api/stats?insights=true`

---

## ⚙️ AI Configuration

### Current Status

✅ **AI Functions** - Already implemented in `/functions/api/`
✅ **AI Binding** - Configured in `wrangler.toml`
✅ **AI Model** - Using `@cf/meta/llama-3.1-8b-instruct`
✅ **D1 Database Integration** - Chatbot has real-time database access
✅ **Chatbot Endpoint** - Fixed and using Cloudflare AI with D1
⏳ **Dashboard Binding** - Needs configuration

### Latest Updates (2025-11-17)

🎉 **Chatbot Fixed!**
- Switched from Google Gemini API to Cloudflare Workers AI
- Added D1 database integration for real-time data
- Chatbot now queries:
  - Component inventory and stock levels
  - Low stock alerts
  - Repair job statuses
  - Recent repairs and client information
- Voice mode support maintained
- No API keys required - uses Cloudflare Workers AI

### Optional: Google Gemini API Integration

If you want to use Google Gemini API as an alternative AI provider:

1. **Get Gemini API Key:**
   - Visit: https://makersuite.google.com/app/apikey
   - Create a new API key
   - Copy the key

2. **Configure Environment Variable:**
   ```bash
   # Add to your .env or Cloudflare environment variables
   GOOGLE_AI_API_KEY=your_gemini_api_key_here
   ```

3. **Use the Gemini Endpoint:**
   - Endpoint: `/api/chat`
   - The old Gemini endpoint is still available in `server/routes.ts`
   - It provides similar functionality with Gemini-1.5-Pro model

**Note:** The chatbot currently uses Cloudflare AI by default, which is free (10,000 requests/day) and doesn't require API keys. The Gemini integration is optional and mainly for users who want to use Google's AI models.

---

## 🔧 Setup Instructions

### Step 1: Configure AI Binding in Cloudflare Dashboard

#### Option A: Via Cloudflare Dashboard (Recommended)

1. **Open Cloudflare Dashboard**
   ```
   https://dash.cloudflare.com
   ```

2. **Navigate to Pages Project**
   - Click **"Pages"** in left sidebar
   - Select **"solar-inventory-tracker"**
   - Go to **"Settings"** tab
   - Click **"Functions"** section

3. **Add AI Binding**
   - Scroll to **"Workers AI Catalog Bindings"** or **"AI bindings"**
   - Click **"Add binding"**
   - **Production Environment:**
     - **Variable name:** `AI`
   - Click **"Save"**

4. **Redeploy**
   - Go to **"Deployments"** tab
   - Click **"Retry deployment"** on latest deployment
   - Or push new commit to trigger auto-deployment

#### Option B: Automatic (Already in wrangler.toml)

The AI binding is already configured in `wrangler.toml`:
```toml
[ai]
binding = "AI"
```

This means Cloudflare Pages will automatically bind Workers AI when you configure it in the dashboard.

---

## 🧪 Testing AI Features

### 1. Test AI Chatbot

**From the Web UI:**
1. Login to: https://eurovolt.store
2. Look for chatbot icon in bottom-right corner
3. Click to open chat
4. Ask questions like:
   - "How many components are low on stock?" - Gets real-time data from D1
   - "What repairs are in progress?" - Queries current repair jobs
   - "Tell me about solar inverters" - General knowledge
   - "Show me recent repair jobs" - Gets latest repairs from database
   - "Which items need restocking?" - Queries low stock components

**Via API:**
```bash
curl -X POST https://eurovolt.store/api/ai-chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What components are low on stock?",
    "sessionId": "test-session-123",
    "isVoiceMode": false
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "response": "Based on the current inventory, you have 3 items that are low on stock:\n\n1. Solar Panel 400W: 5/10 units (Price: $250.00)\n2. Charge Controller MPPT: 2/8 units (Price: $180.00)\n3. Battery Bank 12V: 1/5 units (Price: $320.00)\n\nI recommend restocking these items soon to avoid delays in repairs.",
  "model": "@cf/meta/llama-3.1-8b-instruct",
  "sessionId": "test-session-123"
}
```

**NEW: Real-time Database Context**
The chatbot now automatically includes:
- Total components and stock levels
- Low stock alerts with specific items
- Repair statistics (total, in progress, completed)
- Recent repair jobs with details
- Client count and information

### 2. Test Component Analysis

```bash
curl -X POST https://production.solar-inventory-tracker.pages.dev/api/analyze-component \
  -H "Content-Type: application/json" \
  -d '{
    "component": {
      "name": "Solar Panel 400W",
      "partNumber": "SP-400-M",
      "category": "Solar Panels",
      "description": "400W monocrystalline panel",
      "specifications": "Voltage: 48V, Current: 8.33A"
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "analysis": "Component Category: Solar Panel - Photovoltaic Module\n\nCommon Applications:\n- Residential solar installations...",
  "component": {...},
  "model": "@cf/meta/llama-3.1-8b-instruct"
}
```

### 3. Test Dashboard AI Insights

```bash
curl https://production.solar-inventory-tracker.pages.dev/api/stats?insights=true
```

**Expected Response:**
```json
{
  "components": {...},
  "repairs": {...},
  "categoryBreakdown": [...],
  "lowStockItems": [...],
  "recentRepairs": [...],
  "aiInsights": "Key Insights:\n1. Inventory Health: Your stock levels are healthy with 15 total components...\n2. Repair Efficiency: Average turnaround time is good...\n..."
}
```

---

## 🎯 AI Feature Endpoints

### 1. AI Chat - `/api/ai-chat`

**Method:** POST

**Request Body:**
```json
{
  "message": "Your question here",
  "context": {
    "totalComponents": 100,
    "lowStock": 5
  }
}
```

**Response:**
```json
{
  "success": true,
  "response": "AI generated response",
  "model": "@cf/meta/llama-3.1-8b-instruct"
}
```

**Error Response:**
```json
{
  "error": "Failed to process AI request",
  "details": "Error message"
}
```

### 2. Analyze Component - `/api/analyze-component`

**Method:** POST

**Request Body:**
```json
{
  "component": {
    "name": "Component name",
    "partNumber": "Part number",
    "category": "Category",
    "description": "Description",
    "specifications": "Tech specs"
  }
}
```

**Response:**
```json
{
  "success": true,
  "analysis": "Detailed AI analysis",
  "component": {...},
  "model": "@cf/meta/llama-3.1-8b-instruct"
}
```

### 3. Stats with AI Insights - `/api/stats?insights=true`

**Method:** GET

**Query Parameters:**
- `insights=true` - Include AI-generated insights

**Response:**
```json
{
  "components": {...},
  "repairs": {...},
  "aiInsights": "AI-generated business insights"
}
```

---

## 💰 Cost & Usage

### Cloudflare Workers AI Pricing

**Free Tier:**
- **10,000 Neurons per day** (free)
- Llama 3.1 8B uses approximately 1 Neuron per request
- **That's ~10,000 AI requests per day for FREE!**

**Paid Tier:**
- After free tier: **$0.011 per 1,000 Neurons**
- Very affordable for most use cases

### Monitoring Usage

1. **Via Dashboard:**
   - Go to: https://dash.cloudflare.com
   - Click **"AI"** in sidebar
   - View usage metrics and costs

2. **Via Analytics:**
   - Pages → solar-inventory-tracker → Analytics
   - View function invocations

---

## 🔧 Troubleshooting

### Issue: "AI is not defined" Error

**Cause:** AI binding not configured in Pages dashboard

**Solution:**
1. Go to Cloudflare Dashboard
2. Pages → solar-inventory-tracker → Settings → Functions
3. Add AI binding: `AI` (variable name)
4. Redeploy

### Issue: "AI insights temporarily unavailable"

**Causes:**
- AI binding not configured
- Rate limit exceeded
- Temporary AI service issue

**Solutions:**
1. Verify AI binding in dashboard
2. Check usage limits (10,000 Neurons/day free)
3. Check Cloudflare status page

### Issue: Slow AI Responses

**Normal Behavior:**
- AI inference takes 1-3 seconds
- This is expected for on-demand AI
- Frontend shows loading state during processing

**Optimization:**
- Keep prompts concise
- Cache frequent queries (future enhancement)
- Use streaming responses (future enhancement)

### Issue: AI Responses Not Relevant

**Solutions:**
1. **Improve Context:**
   - Provide more context in the request
   - Include relevant system state

2. **Adjust Prompts:**
   - Edit prompts in `/functions/api/ai-chat.ts`
   - Make prompts more specific to your use case

3. **Fine-tune System Prompts:**
   - Update system prompts in each AI function
   - Add domain-specific instructions

---

## 🎨 Frontend Integration

### Chatbot Component

The chatbot is already integrated in:
```
client/src/components/ai/chat-bot.tsx
```

**Features:**
- Floating button in bottom-right
- Chat interface with message history
- Voice input support (optional)
- Auto-scroll to latest message
- Loading states

**To Enable/Disable:**
Edit `client/src/App.tsx`:
```typescript
// To disable chatbot, comment this line:
<ChatBot />
```

### Component Analysis UI

**Trigger Analysis:**
- Open component detail modal
- Click "Analyze with AI" button
- View AI-generated insights

**Implementation:**
```typescript
// In component detail modal
const analyzeComponent = async () => {
  const response = await apiRequest("POST", "/api/analyze-component", {
    component: componentData
  });
  // Display response.analysis
};
```

### Dashboard Insights

**Auto-load on Dashboard:**
```typescript
// In Dashboard component
const { data: stats } = useQuery({
  queryKey: ["/api/stats?insights=true"],
});

// Display stats.aiInsights
```

---

## 🔐 Security Considerations

### Rate Limiting

**Recommended:** Implement rate limiting for AI endpoints to prevent abuse

```typescript
// In AI function
const rateLimitCheck = async (userId: string) => {
  // Check request count in last hour
  // Return error if exceeded
};
```

### Input Validation

**Already Implemented:**
- Message length limits
- Content sanitization
- Error handling

### Cost Controls

**Recommendations:**
1. Monitor usage daily via Cloudflare dashboard
2. Set up billing alerts
3. Implement usage quotas per user (if needed)
4. Cache common queries

---

## 🚀 Advanced Features (Future)

### Streaming Responses

Enable real-time streaming for better UX:
```typescript
// Future enhancement
const stream = await env.AI.run(model, {
  stream: true,
  messages: [...]
});
```

### Multi-turn Conversations

Store conversation history:
```typescript
// Future enhancement
const conversationHistory = await getHistory(sessionId);
const messages = [
  ...conversationHistory,
  { role: 'user', content: newMessage }
];
```

### Custom Fine-tuning

Train on your specific domain:
- Export your inventory data
- Create training examples
- Fine-tune model (when available)

### Image Analysis

Analyze component photos:
```typescript
// Future: Use vision model
const analysis = await env.AI.run('@cf/llava-1.5-7b-hf', {
  image: componentPhoto,
  prompt: "Identify this component"
});
```

---

## 📊 AI Models Available

### Current: Llama 3.1 8B Instruct
- **Model:** `@cf/meta/llama-3.1-8b-instruct`
- **Best for:** General chat, text analysis
- **Context window:** 8,192 tokens
- **Cost:** 1 Neuron per request

### Alternative Models

You can switch to other models by editing the Functions:

```typescript
// For faster responses (lower quality)
'@cf/meta/llama-2-7b-chat-int8'

// For better quality (slower)
'@cf/meta/llama-3-70b-instruct'

// For code-specific tasks
'@hf/thebloke/codellama-7b-instruct-awq'
```

**To Change Model:**
Edit `/functions/api/ai-chat.ts` line 40:
```typescript
const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
  // ...
});
```

---

## ✅ Deployment Checklist

- [ ] AI binding configured in Cloudflare dashboard
- [ ] Deployed latest version with AI functions
- [ ] Tested `/api/ai-chat` endpoint
- [ ] Tested `/api/analyze-component` endpoint
- [ ] Tested `/api/stats?insights=true` endpoint
- [ ] Verified chatbot appears in UI
- [ ] Checked AI usage in Cloudflare dashboard
- [ ] Set up billing alerts (recommended)
- [ ] Documented AI features for users
- [ ] Trained team on AI capabilities

---

## 📞 Support

### Cloudflare Workers AI Docs
https://developers.cloudflare.com/workers-ai/

### Model Catalog
https://developers.cloudflare.com/workers-ai/models/

### Pricing
https://developers.cloudflare.com/workers-ai/platform/pricing/

### Community
https://discord.gg/cloudflaredev

---

**AI Features Powered By:** Cloudflare Workers AI
**Model:** Llama 3.1 8B Instruct
**Cost:** FREE up to 10,000 requests/day
**Setup Date:** 2025-11-16
**Documentation:** Claude Code
