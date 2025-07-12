// Business Chat Service for deployio Customer Support
// Now uses backend server for proper authentication and AI service integration

import api from "../utils/api";

class BusinessChatService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || "http://localhost:3000";
    this.apiEndpoint = `${this.baseURL}/api/v1/ai/chat`;

    // Conversation history to maintain context
    this.conversationHistory = [];
  }

  // Check if backend API is configured
  isConfigured() {
    return !!this.baseURL;
  }

  // Initialize conversation with welcome message
  async initializeConversation() {
    try {
      const response = await api.get(`/ai/chat/business/welcome`);
      if (response.data.success) {
        return {
          message: response.data.data.message,
          isBot: true,
          timestamp: new Date(response.data.data.timestamp),
          suggestions: response.data.data.suggestions,
        };
      }
    } catch (error) {
      console.error("Failed to get welcome message:", error);
    }
    // Fallback welcome message
    this.conversationHistory = [];
    return {
      message:
        "👋 Hi! I'm **DeployBot**. Ask me about:\n• **How deployio works**\n• **Pricing & plans**\n• **Tech help** (Docker, CI/CD)\n• **Getting started**\n\nWhat would you like to know?",
      isBot: true,
      timestamp: new Date(),
      suggestions: [
        "How does deployio work?",
        "Show me pricing",
        "Help with Docker",
        "How do I get started?",
      ],
    };
  }

  // Generate response for business inquiries
  async generateBusinessResponse(userMessage, sessionId = "default") {
    try {
      const response = await api.post(
        `/ai/chat/business`,
        {
          message: userMessage,
          session_id: sessionId,
        },
        {
          timeout: 30000, // 30 second timeout
        }
      );

      if (response.data.success) {
        const botResponse = response.data.data;

        // Add to conversation history
        this.conversationHistory.push({
          role: "user",
          content: userMessage,
        });
        this.conversationHistory.push({
          role: "assistant",
          content: botResponse.message,
        });

        return {
          message: botResponse.message,
          isBot: true,
          timestamp: new Date(botResponse.timestamp),
          suggestions:
            botResponse.suggestions ||
            this.generateSuggestions(userMessage, botResponse.message),
        };
      } else {
        throw new Error(response.data.message || "API request failed");
      }
    } catch (error) {
      console.error("Business chat service error:", error);
      return this.getFallbackBusinessResponse(userMessage);
    }
  }

  // Generate contextual suggestions based on conversation
  generateSuggestions(userMessage, _botResponse) {
    const userLower = userMessage.toLowerCase();

    if (
      userLower.includes("pricing") ||
      userLower.includes("cost") ||
      userLower.includes("plan")
    ) {
      return [
        "What's included in the Free plan?",
        "Tell me about Enterprise features",
        "Do you offer custom pricing?",
      ];
    }

    if (
      userLower.includes("deploy") ||
      userLower.includes("getting started") ||
      userLower.includes("how")
    ) {
      return [
        "Can I deploy from GitHub?",
        "What frameworks do you support?",
        "How long does deployment take?",
      ];
    }

    if (
      userLower.includes("docker") ||
      userLower.includes("kubernetes") ||
      userLower.includes("technical")
    ) {
      return [
        "Best practices for Docker optimization",
        "Kubernetes deployment help",
        "CI/CD pipeline setup",
      ];
    }

    if (userLower.includes("security") || userLower.includes("compliance")) {
      return [
        "What security features do you have?",
        "Are you SOC 2 compliant?",
        "How do you handle data privacy?",
      ];
    }

    // Default suggestions
    return [
      "Tell me about your AI features",
      "Show me a demo",
      "How do I contact sales?",
    ];
  }

  // Fallback responses when API is not available
  getFallbackBusinessResponse(userMessage) {
    const userLower = userMessage.toLowerCase();

    const responses = {
      greeting: {
        message:
          "👋 **Welcome to deployio!**\nAsk about:\n• How it works\n• Pricing\n• Tech help\n• Getting started",
        suggestions: [
          "Show me a demo",
          "Pricing plans?",
          "How does the AI work?",
        ],
      },

      pricing: {
        message:
          "💰 **Pricing:**\n• Free: 3 projects\n• Pro: $29/mo\n• Team: $99/mo\n• Enterprise: Custom\nContact sales for details.",
        suggestions: ["What's in Free tier?", "Enterprise features?", "Demo?"],
      },

      demo: {
        message:
          "🎥 **Demo:**\n• Try demo (no signup)\n• Book a session\n• 14-day trial\nReady to start?",
        suggestions: ["Start demo", "Book session", "Sign up for trial"],
      },

      technical: {
        message:
          "🔧 **Tech:**\n• AI auto-detects frameworks\n• Docker & CI/CD\n• Multi-cloud\n• Monitoring & security\nNeed more? Ask!",
        suggestions: ["What frameworks?", "Security?", "Integrations?"],
      },

      support: {
        message:
          "🎧 **Support:**\n• Docs & guides\n• Email/Slack\n• Onboarding\n• Enterprise help\nHow can I help?",
        suggestions: ["Contact support", "View docs", "Onboarding"],
      },
    };

    // Determine response type based on user input
    if (
      userLower.includes("hello") ||
      userLower.includes("hi") ||
      userLower.includes("hey")
    ) {
      return { ...responses.greeting, isBot: true, timestamp: new Date() };
    }

    if (
      userLower.includes("price") ||
      userLower.includes("cost") ||
      userLower.includes("plan") ||
      userLower.includes("pricing")
    ) {
      return { ...responses.pricing, isBot: true, timestamp: new Date() };
    }

    if (
      userLower.includes("demo") ||
      userLower.includes("try") ||
      userLower.includes("test")
    ) {
      return { ...responses.demo, isBot: true, timestamp: new Date() };
    }

    if (
      userLower.includes("technical") ||
      userLower.includes("feature") ||
      userLower.includes("how") ||
      userLower.includes("work")
    ) {
      return { ...responses.technical, isBot: true, timestamp: new Date() };
    }

    if (
      userLower.includes("support") ||
      userLower.includes("help") ||
      userLower.includes("contact")
    ) {
      return { ...responses.support, isBot: true, timestamp: new Date() };
    }

    // Default response
    return {
      message: `Thanks for asking about **"${userMessage}"**!\nAsk about:\n• 🚀 How deployio works\n• 💰 Pricing\n• 🎥 Demo\n• 🔧 Tech features\n• 📞 Contact sales`,
      isBot: true,
      timestamp: new Date(),
      suggestions: ["How does deployio work?", "Show me pricing", "Demo?"],
    };
  }

  // Reset conversation history
  async resetConversation(sessionId = "default") {
    try {
      await api.post(`/ai/chat/business/reset`, null, {
        params: { session_id: sessionId },
        timeout: 10000, // 10 second timeout
      });
    } catch (error) {
      console.error("Failed to reset conversation on server:", error);
    }
    // Reset local history regardless
    this.conversationHistory = [];
  }

  // Get conversation history
  getConversationHistory() {
    return this.conversationHistory;
  }

  // Check service health
  async checkHealth() {
    try {
      const response = await api.get(`/ai/chat/health`, {
        timeout: 10000,
      });
      return response.data.success ? response.data.data : null;
    } catch (error) {
      console.error("Health check failed:", error);
      return null;
    }
  }
}

export default new BusinessChatService();
