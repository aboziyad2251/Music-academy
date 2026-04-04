/**
 * DeepSeek API Utility
 * OpenAI-compatible interface for DeepSeek services.
 */

export interface GLMMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface GLMResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

/**
 * Call the DeepSeek API
 */
export async function callGLM(messages: GLMMessage[], options: { temperature?: number; max_tokens?: number } = {}) {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY is not configured in environment variables.");
  }

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 1024,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`DeepSeek API Error (${response.status}): ${errorBody}`);
  }

  const data: GLMResponse = await response.json();
  return data.choices[0]?.message?.content || "";
}
