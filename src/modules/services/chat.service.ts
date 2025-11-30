import prisma from "../../prisma/client";
import { AppError } from "../../utils/errorHandler";

export interface ChatMessage {
  message: string;
  reply: string;
}

export interface ChatRequest {
  message: string;
  userId?: string;
}

export interface ChatResponse {
  reply: string;
}

export class ChatService {
  private readonly AI_API_URL: string;
  private readonly AI_MODEL: string;
  private readonly AI_API_KEY: string | undefined;
  private readonly MAX_HISTORY: number = 3;

  constructor() {
    // HuggingFace Inference API (free tier available)
    this.AI_API_URL =
      process.env.AI_API_URL ||
      "https://api-inference.huggingface.co/models";
    // Using a text generation model that's more reliable
    // Alternative models: gpt2, EleutherAI/gpt-neo-125M, distilgpt2
    this.AI_MODEL =
      process.env.AI_MODEL || "gpt2";
    this.AI_API_KEY = process.env.AI_API_KEY || process.env.HUGGINGFACE_API_KEY;
  }

  /**
   * Get conversation history for a user (last N messages)
   */
  private async getConversationHistory(
    userId?: string
  ): Promise<Array<{ role: string; content: string }>> {
    if (!userId) {
      return [];
    }

    const recentChats = await prisma.chat.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: this.MAX_HISTORY,
      select: {
        message: true,
        reply: true,
      },
    });

    // Reverse to get chronological order
    const history: Array<{ role: string; content: string }> = [];
    recentChats.reverse().forEach((chat) => {
      history.push({ role: "user", content: chat.message });
      history.push({ role: "assistant", content: chat.reply });
    });

    return history;
  }

  /**
   * Build prompt with context for the AI model
   */
  private buildPrompt(message: string, history: Array<{ role: string; content: string }>): string {
    // System prompt for product-related chatbot
    const systemPrompt = `You are a helpful customer service assistant for an e-commerce platform. 
You help customers with product recommendations, order inquiries, and general questions.
Be concise, friendly, and helpful.`;

    // Build conversation context
    let prompt = systemPrompt + "\n\n";
    
    if (history.length > 0) {
      prompt += "Previous conversation:\n";
      history.forEach((msg) => {
        prompt += `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}\n`;
      });
      prompt += "\n";
    }

    prompt += `User: ${message}\nAssistant:`;
    
    return prompt;
  }

  /**
   * Build chat messages array for chat-based APIs (Groq, DeepSeek)
   */
  private buildChatMessages(message: string, history: Array<{ role: string; content: string }>): Array<{ role: string; content: string }> {
    const systemPrompt = `You are a helpful customer service assistant for an e-commerce platform. 
You help customers with product recommendations, order inquiries, and general questions.
Be concise, friendly, and helpful.`;

    const messages: Array<{ role: string; content: string }> = [
      { role: "system", content: systemPrompt }
    ];

    // Add history
    messages.push(...history);

    // Add current message
    messages.push({ role: "user", content: message });

    return messages;
  }

  /**
   * Call HuggingFace Inference API
   */
  private async callHuggingFaceAPI(prompt: string): Promise<string> {
    try {
      const modelUrl = `${this.AI_API_URL}/${this.AI_MODEL}`;
      
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (this.AI_API_KEY) {
        headers["Authorization"] = `Bearer ${this.AI_API_KEY}`;
      }

      const response = await fetch(modelUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 512,
            temperature: 0.7,
            top_p: 0.9,
            return_full_text: false,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("HuggingFace API Error:", errorText);
        console.error("Model URL:", modelUrl);
        console.error("Status:", response.status);
        
        // Handle specific error cases
        if (response.status === 410) {
          throw new AppError(
            `The AI model "${this.AI_MODEL}" is no longer available on HuggingFace. Please switch to Groq (free) by adding to .env: AI_PROVIDER="groq" and GROQ_API_KEY="your-key" (get free key at https://console.groq.com/keys). Or try DeepSeek: AI_PROVIDER="deepseek" with DEEPSEEK_API_KEY.`,
            410
          );
        }
        
        if (response.status === 503) {
          // Model might be loading, return a helpful message
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.error?.includes("loading")) {
              throw new AppError(
                "The AI model is currently loading. Please try again in 10-20 seconds.",
                503
              );
            }
          } catch {
            // If parsing fails, use generic message
          }
          throw new AppError(
            "AI service is temporarily unavailable. Please try again in a moment.",
            503
          );
        }
        
        if (response.status === 429) {
          throw new AppError(
            "AI service rate limit exceeded. Please try again later or add a HuggingFace API key to your .env file.",
            429
          );
        }

        if (response.status === 401) {
          throw new AppError(
            "AI service authentication failed. Please check your HUGGINGFACE_API_KEY in .env file.",
            401
          );
        }

        throw new AppError(
          `AI service error: ${response.statusText}. Status code: ${response.status}`,
          response.status
        );
      }

      const data = await response.json();

      // Handle different response formats
      if (Array.isArray(data) && data.length > 0) {
        if (data[0].generated_text) {
          return data[0].generated_text.trim();
        }
        if (typeof data[0] === "string") {
          return data[0].trim();
        }
      }

      if (data.generated_text) {
        return data.generated_text.trim();
      }

      if (typeof data === "string") {
        return data.trim();
      }

      // Fallback response
      return "I apologize, but I'm having trouble processing your request. Please try rephrasing your question.";
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      console.error("Chat service error:", error);
      throw new AppError(
        "Failed to get AI response. Please try again later.",
        500
      );
    }
  }

  /**
   * Call DeepSeek Free API (alternative provider)
   */
  private async callDeepSeekAPI(prompt: string, history?: Array<{ role: string; content: string }>): Promise<string> {
    try {
      const apiKey = process.env.DEEPSEEK_API_KEY || this.AI_API_KEY;
      
      if (!apiKey) {
        throw new AppError(
          "DeepSeek API key is required. Get a free key at https://platform.deepseek.com/api_keys and add DEEPSEEK_API_KEY to your .env file.",
          400
        );
      }

      // Build messages for chat-based API
      const messages = history 
        ? this.buildChatMessages(prompt, history)
        : [{ role: "user", content: prompt }];

      const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: messages,
          temperature: 0.7,
          max_tokens: 512,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("DeepSeek API Error:", errorText);
        
        if (response.status === 401) {
          throw new AppError(
            "DeepSeek API key is invalid. Please check your DEEPSEEK_API_KEY in .env file.",
            401
          );
        }
        
        throw new AppError(
          `DeepSeek API error: ${response.statusText}`,
          response.status
        );
      }

      const data = await response.json();
      return data.choices[0]?.message?.content?.trim() || "No response from AI.";
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to get AI response from DeepSeek", 500);
    }
  }

  /**
   * Call Google Gemini Free API
   */
  private async callGeminiAPI(prompt: string, history?: Array<{ role: string; content: string }>): Promise<string> {
    try {
      const apiKey = process.env.GEMINI_API_KEY || this.AI_API_KEY;
      if (!apiKey) {
        throw new AppError(
          "Gemini API key is required. Get a free key at https://aistudio.google.com/app/apikey and add GEMINI_API_KEY to your .env file.",
          400
        );
      }

      // Try different model names in order of preference
      const modelsToTry = process.env.GEMINI_MODEL
        ? [process.env.GEMINI_MODEL, "gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"]
        : [
            "gemini-1.5-flash",
            "gemini-1.5-flash-latest",
            "gemini-1.5-pro",
            "gemini-1.5-pro-latest",
            "gemini-pro",
            "gemini-pro-latest"
          ];

      // Build messages for Gemini API
      const messages = history && history.length > 0
        ? this.buildChatMessages(prompt, history)
        : [{ role: "user", content: prompt }];

      // Convert messages to Gemini format
      const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
      
      for (const msg of messages) {
        if (msg.role === "system") {
          continue;
        }
        
        contents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }]
        });
      }

      const systemInstruction = messages.find(msg => msg.role === "system")?.content;
      const requestBody: any = { contents: contents };
      
      if (systemInstruction && contents.length > 0) {
        requestBody.systemInstruction = {
          parts: [{ text: systemInstruction }]
        };
      }

      // Try each model until one works
      let lastError: any = null;
      
      for (const model of modelsToTry) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          console.log(`Trying Gemini model: ${model}`);

          const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          });

          if (response.ok) {
            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (text) {
              console.log(`✓ Successfully used model: ${model}`);
              return text.trim();
            }
          }

          // Save error for reporting
          const errorText = await response.text();
          let errorData: any = null;
          try {
            errorData = JSON.parse(errorText);
          } catch {}

          lastError = {
            status: response.status,
            model: model,
            message: errorData?.error?.message || response.statusText
          };

          // Don't try other models for non-404 errors
          if (response.status !== 404) {
            break;
          }
        } catch (error) {
          lastError = {
            model: model,
            message: error instanceof Error ? error.message : "Unknown error"
          };
        }
      }

      // All models failed - provide helpful error
      if (lastError) {
        if (lastError.status === 404) {
          // Try to get list of available models
          try {
            const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
            const listResponse = await fetch(listUrl);
            
            if (listResponse.ok) {
              const listData = await listResponse.json();
              const availableModels = listData.models?.map((m: any) => m.name?.replace('models/', '')) || [];
              
              if (availableModels.length > 0) {
                throw new AppError(
                  `Gemini models not found. Your API key has access to: ${availableModels.join(", ")}. Set GEMINI_MODEL to one of these in your .env file.`,
                  404
                );
              }
            }
          } catch {
            // Ignore list errors
          }
          
          throw new AppError(
            `None of the Gemini models are available. Please: 1) Verify your API key is correct, 2) Enable Gemini API in Google AI Studio (https://aistudio.google.com/app/apikey), 3) Try setting GEMINI_MODEL="gemini-1.5-flash" in your .env file.`,
            404
          );
        }
        
        if (lastError.status === 401 || lastError.status === 403) {
          throw new AppError(
            "Gemini API key is invalid or unauthorized. Please verify your key at https://aistudio.google.com/app/apikey and ensure the Gemini API is enabled.",
            401
          );
        }
        
        if (lastError.status === 400) {
          throw new AppError(`Gemini API error: ${lastError.message || "Invalid request"}`, 400);
        }
      }
      
      throw new AppError("Failed to connect to Gemini API. Please check your API key and internet connection.", 500);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error("Gemini API unexpected error:", error);
      throw new AppError("Failed to get AI response from Gemini", 500);
    }
  }

  /**
   * Call Groq Free LLaMA API (alternative provider)
   */
  private async callGroqAPI(prompt: string, history?: Array<{ role: string; content: string }>): Promise<string> {
    try {
      const apiKey = process.env.GROQ_API_KEY || this.AI_API_KEY;
      
      if (!apiKey) {
        throw new AppError(
          "Groq API key is required. Get a free key at https://console.groq.com/keys and add GROQ_API_KEY to your .env file.",
          400
        );
      }

      // Build messages for chat-based API
      const messages = history 
        ? this.buildChatMessages(prompt, history)
        : [{ role: "user", content: prompt }];

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: messages,
          temperature: 0.7,
          max_tokens: 512,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Groq API Error:", errorText);
        
        if (response.status === 401) {
          throw new AppError(
            "Groq API key is invalid. Please check your GROQ_API_KEY in .env file.",
            401
          );
        }
        
        throw new AppError(
          `Groq API error: ${response.statusText}`,
          response.status
        );
      }

      const data = await response.json();
      return data.choices[0]?.message?.content?.trim() || "No response from AI.";
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to get AI response from Groq", 500);
    }
  }

  /**
   * Get AI response based on configured provider
   */
  private async getAIResponse(
    prompt: string,
    history?: Array<{ role: string; content: string }>,
    provider?: string
  ): Promise<string> {
    const aiProvider = provider || process.env.AI_PROVIDER || "groq"; // Default to Groq (more reliable than Gemini)

    switch (aiProvider.toLowerCase()) {
      case "gemini":
        return this.callGeminiAPI(prompt, history);
      case "deepseek":
        return this.callDeepSeekAPI(prompt, history);
      case "groq":
        return this.callGroqAPI(prompt, history);
      case "huggingface":
        return this.callHuggingFaceAPI(prompt);
      default:
        // Default to Gemini if provider not recognized
        console.warn(`Unknown AI provider: ${aiProvider}, defaulting to Gemini`);
        return this.callGeminiAPI(prompt, history);
    }
  }

  /**
   * Process chat message and get AI response
   */
  async processMessage(request: ChatRequest): Promise<ChatResponse> {
    const { message, userId } = request;

    if (!message || message.trim().length === 0) {
      throw new AppError("Message cannot be empty", 400);
    }

    // Get conversation history
    const history = await this.getConversationHistory(userId);

    // Build prompt with context
    const prompt = this.buildPrompt(message, history);

    // Get AI response (pass history for chat-based APIs)
    let reply: string;
    try {
      reply = await this.getAIResponse(prompt, history);
      
      // If reply is empty or too short, might be an error
      if (!reply || reply.trim().length < 5) {
        throw new Error("Empty or invalid response from AI");
      }
    } catch (error) {
      // If it's a specific error (like 410 Gone), throw it with helpful message
      if (error instanceof AppError) {
        // Re-throw AppErrors as-is (they have helpful messages)
        throw error;
      }
      
      // Fallback response for unexpected errors
      console.error("Unexpected AI service error:", error);
      reply =
        "I apologize, but I'm having trouble processing your request right now. Please try again in a moment. If the issue persists, please check your AI_MODEL configuration in .env file or contact customer support.";
    }

    // Save to database for history (last 3 messages)
    try {
      await prisma.chat.create({
        data: {
          userId: userId || null,
          message: message.trim(),
          reply: reply.trim(),
        },
      });

      // Keep only last MAX_HISTORY messages per user
      if (userId) {
        const chats = await prisma.chat.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          skip: this.MAX_HISTORY,
          select: { id: true },
        });

        if (chats.length > 0) {
          await prisma.chat.deleteMany({
            where: {
              id: { in: chats.map((c) => c.id) },
            },
          });
        }
      }
    } catch (error) {
      // Log error but don't fail the request if DB save fails
      console.error("Failed to save chat history:", error);
    }

    return {
      reply: reply.trim(),
    };
  }
}

