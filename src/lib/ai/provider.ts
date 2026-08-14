/**
 * LLM Provider Adapter — Swappable backends for AI narrative generation
 * 
 * Supports: Groq (free Llama/Gemma), Together AI, OpenRouter, and a mock fallback.
 * Switching providers = changing one env var (LLM_PROVIDER).
 */

// ─── Types ──────────────────────────────────────────────────────

export interface CompletionRequest {
  prompt: string;
  context?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface CompletionResponse {
  text: string;
  model: string;
  provider: string;
  tokensUsed?: number;
}

interface LLMProvider {
  name: string;
  generate: (req: CompletionRequest) => Promise<CompletionResponse>;
}

// ─── Provider Implementations ───────────────────────────────────

/** Groq — Free tier with fast Llama/Gemma inference */
function createGroqProvider(apiKey: string, model: string): LLMProvider {
  return {
    name: 'groq',
    generate: async (req) => {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model || 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: req.context || 'You are a property valuation expert assistant for S Mohanty & Associates, a registered valuer firm in Bhubaneswar, India. Provide concise, professional analysis.' },
            { role: 'user', content: req.prompt },
          ],
          max_tokens: req.maxTokens || 500,
          temperature: req.temperature || 0.3,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Groq API error: ${response.status} — ${err}`);
      }

      const data = await response.json();
      return {
        text: data.choices?.[0]?.message?.content || '',
        model: data.model || model,
        provider: 'groq',
        tokensUsed: data.usage?.total_tokens,
      };
    },
  };
}

/** Together AI — Free tier with open-source models */
function createTogetherProvider(apiKey: string, model: string): LLMProvider {
  return {
    name: 'together',
    generate: async (req) => {
      const response = await fetch('https://api.together.xyz/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model || 'meta-llama/Llama-3.1-8B-Instruct-Turbo',
          messages: [
            { role: 'system', content: req.context || 'You are a property valuation expert assistant for S Mohanty & Associates, a registered valuer firm in Bhubaneswar, India. Provide concise, professional analysis.' },
            { role: 'user', content: req.prompt },
          ],
          max_tokens: req.maxTokens || 500,
          temperature: req.temperature || 0.3,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Together API error: ${response.status} — ${err}`);
      }

      const data = await response.json();
      return {
        text: data.choices?.[0]?.message?.content || '',
        model: data.model || model,
        provider: 'together',
        tokensUsed: data.usage?.total_tokens,
      };
    },
  };
}

/** OpenRouter — Aggregator with multiple free models */
function createOpenRouterProvider(apiKey: string, model: string): LLMProvider {
  return {
    name: 'openrouter',
    generate: async (req) => {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://smohantyassociates.com',
          'X-Title': 'S Mohanty Associates Valuation',
        },
        body: JSON.stringify({
          model: model || 'meta-llama/llama-3.1-8b-instruct:free',
          messages: [
            { role: 'system', content: req.context || 'You are a property valuation expert assistant for S Mohanty & Associates, a registered valuer firm in Bhubaneswar, India. Provide concise, professional analysis.' },
            { role: 'user', content: req.prompt },
          ],
          max_tokens: req.maxTokens || 500,
          temperature: req.temperature || 0.3,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} — ${err}`);
      }

      const data = await response.json();
      return {
        text: data.choices?.[0]?.message?.content || '',
        model: data.model || model,
        provider: 'openrouter',
        tokensUsed: data.usage?.total_tokens,
      };
    },
  };
}

/** Mock provider — Returns canned responses when no API key is configured */
function createMockProvider(): LLMProvider {
  return {
    name: 'mock',
    generate: async () => {
      return {
        text: '',
        model: 'mock',
        provider: 'mock',
        tokensUsed: 0,
      };
    },
  };
}

/** Fallback Provider — Tries multiple providers in sequence */
function createFallbackProvider(providers: LLMProvider[]): LLMProvider {
  return {
    name: 'fallback',
    generate: async (req) => {
      let lastError = new Error('No providers available');
      for (const provider of providers) {
        try {
          console.log(`[AI Assist] Trying LLM provider: ${provider.name}`);
          const res = await provider.generate(req);
          return res;
        } catch (err: any) {
          console.warn(`[AI Assist] Provider ${provider.name} failed:`, err.message);
          lastError = err;
          // continue to next provider in the fallback chain
        }
      }
      throw lastError;
    },
  };
}

// ─── Provider Factory ───────────────────────────────────────────

let cachedProvider: LLMProvider | null = null;

export function getLLMProvider(): LLMProvider {
  if (cachedProvider) return cachedProvider;

  const providers: LLMProvider[] = [];
  const primaryName = (process.env.LLM_PROVIDER || '').toLowerCase();
  
  // Map API keys — fallback to specific env vars if LLM_API_KEY is used for primary
  const groqKey = process.env.GROQ_API_KEY || (primaryName === 'groq' ? process.env.LLM_API_KEY : '');
  const togetherKey = process.env.TOGETHER_API_KEY || (primaryName === 'together' ? process.env.LLM_API_KEY : '');
  const openRouterKey = process.env.OPENROUTER_API_KEY || (primaryName === 'openrouter' ? process.env.LLM_API_KEY : '');

  // 1. Push the primary provider first
  if (primaryName === 'groq' && groqKey) providers.push(createGroqProvider(groqKey, process.env.LLM_MODEL || 'llama-3.1-8b-instant'));
  if (primaryName === 'together' && togetherKey) providers.push(createTogetherProvider(togetherKey, process.env.LLM_MODEL || 'meta-llama/Llama-3.1-8B-Instruct-Turbo'));
  if (primaryName === 'openrouter' && openRouterKey) providers.push(createOpenRouterProvider(openRouterKey, process.env.LLM_MODEL || 'meta-llama/llama-3.1-8b-instruct:free'));

  // 2. Push fallbacks (if they have keys and aren't already the primary)
  if (primaryName !== 'groq' && groqKey) providers.push(createGroqProvider(groqKey, 'llama-3.1-8b-instant'));
  if (primaryName !== 'together' && togetherKey) providers.push(createTogetherProvider(togetherKey, 'meta-llama/Llama-3.1-8B-Instruct-Turbo'));
  if (primaryName !== 'openrouter' && openRouterKey) providers.push(createOpenRouterProvider(openRouterKey, 'meta-llama/llama-3.1-8b-instruct:free'));

  if (providers.length === 0) {
    cachedProvider = createMockProvider();
    return cachedProvider;
  }

  // If only 1 provider exists, return it directly. Otherwise return fallback wrapper.
  cachedProvider = providers.length === 1 ? providers[0] : createFallbackProvider(providers);
  return cachedProvider;
}

// ─── Convenience Function ───────────────────────────────────────

export async function generateValuationNarrative(
  filledFields: Record<string, any>,
  suggestions: Record<string, { value: string; confidence: number }>
): Promise<string> {
  const provider = getLLMProvider();
  if (provider.name === 'mock') return '';

  // Build context about the property
  const propertyContext = [
    filledFields.propertyType && `Property Type: ${filledFields.propertyType}`,
    filledFields.city && `Location: ${filledFields.city}`,
    filledFields.classOfLocality && `Locality Class: ${filledFields.classOfLocality}`,
    filledFields.vicinity && `Vicinity: ${filledFields.vicinity}`,
    filledFields.structureType && `Structure: ${filledFields.structureType}`,
    filledFields.ageOfPropertyActual && `Age: ${filledFields.ageOfPropertyActual}`,
    filledFields.premisesType && `Premises: ${filledFields.premisesType}`,
    filledFields.landArea && `Land Area: ${filledFields.landArea} ${filledFields.landAreaUnit || 'Sqft'}`,
  ].filter(Boolean).join('\n');

  const suggestionSummary = Object.entries(suggestions)
    .map(([key, s]) => `${key}: ${s.value} (confidence: ${Math.round(s.confidence * 100)}%)`)
    .join('\n');

  try {
    const result = await provider.generate({
      prompt: `Based on the following property details, provide a brief 2-3 sentence professional analysis of the property valuation. Mention any notable factors affecting the value.

Property Details:
${propertyContext}

AI-Suggested Values:
${suggestionSummary}

Keep the response under 100 words, professional tone, no markdown formatting.`,
    });

    return result.text;
  } catch (error) {
    console.error('LLM narrative generation failed:', error);
    return '';
  }
}
