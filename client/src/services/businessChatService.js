// Business Chat Service for deployio Customer Support
// Specialized AI assistant for customer inquiries about deployio platform

class BusinessChatService {
  constructor() {
    this.apiKey =
      import.meta.env.VITE_GROQ_API_KEY ||
      import.meta.env.VITE_APP_GROQ_API_KEY ||
      null;
    this.baseURL = "https://api.groq.com/openai/v1/chat/completions";
    this.model = "llama3-8b-8192"; // Fast and reliable model

    // Conversation history to maintain context
    this.conversationHistory = [];
  }

  // Check if API key is configured
  isConfigured() {
    return !!this.apiKey && this.apiKey !== "your_groq_api_key_here";
  }

  // Initialize conversation with welcome message
  initializeConversation() {
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
  async generateBusinessResponse(userMessage) {
    if (!this.isConfigured()) {
      return this.getFallbackBusinessResponse(userMessage);
    }

    // Add user message to conversation history
    this.conversationHistory.push({
      role: "user",
      content: userMessage,
    });

    const systemPrompt = this.getBusinessSystemPrompt();

    try {
      const response = await fetch(this.baseURL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: systemPrompt },
            ...this.conversationHistory.slice(-10), // Keep last 10 messages for context
          ],
          temperature: 0.7,
          max_tokens: 1024,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Groq API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      const botResponse =
        data.choices[0]?.message?.content ||
        "I apologize, but I couldn't generate a response. Please try asking again.";

      // Add bot response to conversation history
      this.conversationHistory.push({
        role: "assistant",
        content: botResponse,
      });

      return {
        message: botResponse,
        isBot: true,
        timestamp: new Date(),
        suggestions: this.generateSuggestions(userMessage, botResponse),
      };
    } catch (error) {
      console.error("Business Chat Service Error:", error);
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

  // Get specialized business system prompt for deployio
  getBusinessSystemPrompt() {
    return `You are DeployBot, a concise and friendly AI assistant for deployio, an AI-powered DevOps platform. Answer user questions about deployio's features, pricing, technical help, and getting started. Keep responses short, clear, and actionable. Use bullet points and markdown. If unsure, suggest contacting support. Example topics: How deployio works, pricing, Docker help, integrations, onboarding.`;
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

  // Clear conversation history
  resetConversation() {
    this.conversationHistory = [];
  }

  // Get conversation history
  getConversationHistory() {
    return this.conversationHistory;
  }
}

export default new BusinessChatService();
