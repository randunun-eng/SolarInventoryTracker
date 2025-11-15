import { Hono } from 'hono';
import type { Env } from '../index';
import { WorkerStorage } from '../lib/storage';

export const aiRoutes = new Hono<{ Bindings: Env }>();

// Helper to call OpenAI API
async function callOpenAI(
  apiKey: string,
  apiBase: string,
  messages: Array<{ role: string; content: string }>,
  model: string = 'gpt-3.5-turbo'
) {
  const response = await fetch(`${apiBase}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  return response.json();
}

/**
 * POST /api/chat
 * Handle chat queries with AI
 */
aiRoutes.post('/chat', async (c) => {
  try {
    const { message, context } = await c.req.json();

    if (!message) {
      return c.json({ error: 'Message is required' }, 400);
    }

    const apiKey = c.env.OPENAI_API_KEY;
    const apiBase = c.env.OPENAI_API_BASE || 'https://api.openai.com/v1';

    if (!apiKey) {
      return c.json(
        { error: 'OpenAI API key not configured' },
        500
      );
    }

    // Build context-aware system message
    let systemMessage = `You are a helpful assistant for a solar inverter repair management system called ElectroTrack.
You help users with questions about repairs, components, inventory, and general system operations.`;

    if (context) {
      systemMessage += `\n\nCurrent context: ${JSON.stringify(context)}`;
    }

    // Call OpenAI
    const result = await callOpenAI(
      apiKey,
      apiBase,
      [
        { role: 'system', content: systemMessage },
        { role: 'user', content: message },
      ]
    );

    return c.json({
      response: result.choices[0]?.message?.content || 'No response generated',
      model: result.model,
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    return c.json(
      { error: error.message || 'Failed to process chat' },
      500
    );
  }
});

/**
 * POST /api/ai/operation
 * Handle AI-powered operations (data extraction, analysis, etc.)
 */
aiRoutes.post('/operation', async (c) => {
  try {
    const { operation, data, prompt } = await c.req.json();

    if (!operation || !data) {
      return c.json({ error: 'Operation and data are required' }, 400);
    }

    const apiKey = c.env.OPENAI_API_KEY;
    const apiBase = c.env.OPENAI_API_BASE || 'https://api.openai.com/v1';

    if (!apiKey) {
      return c.json(
        { error: 'OpenAI API key not configured' },
        500
      );
    }

    // Build operation-specific prompt
    let systemPrompt = '';
    let userPrompt = '';

    switch (operation) {
      case 'extract_serial':
        systemPrompt =
          'You are an expert at extracting serial numbers from text. Return ONLY the serial number, nothing else.';
        userPrompt = `Extract the serial number from this text: ${data}`;
        break;

      case 'summarize_fault':
        systemPrompt =
          'You are an expert at summarizing technical faults concisely.';
        userPrompt = `Summarize this fault description: ${data}`;
        break;

      case 'suggest_components':
        systemPrompt =
          'You are an expert in solar inverter repairs. Suggest components that might be needed.';
        userPrompt = `Based on this fault description, suggest components: ${data}`;
        break;

      default:
        systemPrompt = 'You are a helpful assistant.';
        userPrompt = prompt || data;
    }

    // Call OpenAI
    const result = await callOpenAI(
      apiKey,
      apiBase,
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ]
    );

    return c.json({
      result: result.choices[0]?.message?.content || 'No result generated',
      operation,
    });
  } catch (error: any) {
    console.error('AI operation error:', error);
    return c.json(
      { error: error.message || 'Failed to process AI operation' },
      500
    );
  }
});

/**
 * POST /api/analyze-datasheet
 * Analyze a datasheet using AI (requires multimodal support)
 */
aiRoutes.post('/analyze-datasheet', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('datasheet') as File;

    if (!file) {
      return c.json({ error: 'No datasheet provided' }, 400);
    }

    // For now, return a placeholder response
    // Full implementation would require:
    // 1. OCR or PDF parsing
    // 2. Sending extracted text to OpenAI
    // 3. Structured data extraction

    return c.json({
      message:
        'Datasheet analysis is not yet implemented in Workers version',
      filename: file.name,
    });
  } catch (error: any) {
    console.error('Datasheet analysis error:', error);
    return c.json(
      { error: error.message || 'Failed to analyze datasheet' },
      500
    );
  }
});
