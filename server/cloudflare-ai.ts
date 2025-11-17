// Use the local Cloudflare Pages function instead of external worker
// This uses the /api/ai-chat endpoint provided by functions/api/ai-chat.ts

export class CloudflareAI {
  /**
   * Send chat message to Cloudflare AI using the local Pages function
   */
  static async chat(message: string, context?: any): Promise<string> {
    try {
      // Use fetch to call the local Cloudflare Pages function
      // Note: When running locally, this will fail, but in production it will work
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, context })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Cloudflare AI error: ${response.status} ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      return data.response || 'Sorry, I could not process your request.';
    } catch (error) {
      console.error('Error calling Cloudflare AI chat:', error);
      throw error;
    }
  }

  /**
   * Process voice command using the chat endpoint
   */
  static async voice(command: string, inventory?: any): Promise<string> {
    try {
      // Use the same /api/ai-chat endpoint with voice-specific context
      const context = {
        isVoiceMode: true,
        inventoryCount: Array.isArray(inventory) ? inventory.length : 0,
        components: Array.isArray(inventory) ? inventory.slice(0, 10).map(c => ({
          name: c.name,
          stock: c.currentStock
        })) : []
      };

      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: command, context })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Cloudflare AI error: ${response.status} ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      return data.response || 'Sorry, I could not process your voice command.';
    } catch (error) {
      console.error('Error calling Cloudflare AI voice:', error);
      throw error;
    }
  }

}
