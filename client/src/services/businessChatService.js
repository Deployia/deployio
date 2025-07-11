// Business Chat Service for Deployia Customer Support
// Specialized AI assistant for customer inquiries about Deployia platform

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
        "👋 Hi! I'm **DeployBot**, your AI assistant for Deployia.\n\nI can help you with:\n• **Platform Overview** - What Deployia can do\n• **Pricing & Plans** - Find the right plan\n• **Technical Help** - Docker, Kubernetes, CI/CD\n• **Getting Started** - Deploy your first project\n• **Integrations** - AWS, Azure, GCP setup\n\nWhat would you like to know?",
      isBot: true,
      timestamp: new Date(),
      suggestions: [
        "How does Deployia work?",
        "What are your pricing plans?",
        "Can you help with Docker?",
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

  // Get specialized business system prompt for Deployia
  getBusinessSystemPrompt() {
    return `You are DeployBot, a friendly and knowledgeable customer support AI for Deployia - an AI-powered DevOps automation platform. You help potential customers understand our services and existing users with their questions.

**About Deployia:**
Deployia is a revolutionary AI-powered DevOps platform that automates the entire deployment process from code to production. Our platform analyzes your codebase, generates optimized Docker configurations, creates CI/CD pipelines, and deploys to any cloud provider - all with AI intelligence.

**Key Features & Services:**
• **AI Code Analysis**: Automatically detects frameworks, dependencies, and optimal deployment strategies
• **Smart Dockerization**: Generates production-ready Dockerfiles with security best practices
• **Automated CI/CD**: Creates GitHub Actions, GitLab CI, or Jenkins pipelines automatically
• **Multi-Cloud Deployment**: Deploy to AWS, Azure, GCP, or any cloud provider
• **Real-time Monitoring**: Built-in observability with logs, metrics, and alerting
• **Security First**: Vulnerability scanning, compliance checks, and security hardening
• **Microservices Ready**: Kubernetes orchestration and service mesh integration

**Pricing Plans:**
• **Free Tier**: Up to 3 projects, basic deployments, community support
• **Professional ($29/month)**: Up to 15 projects, advanced CI/CD, priority support
• **Team ($99/month)**: Up to 50 projects, team collaboration, dedicated support
• **Enterprise**: Custom pricing, unlimited projects, dedicated account management, SLA

**Target Users:**
• Startups and scale-ups needing fast deployment solutions
• Development teams wanting to automate DevOps workflows
• Companies migrating to cloud-native architectures
• Organizations seeking AI-powered infrastructure optimization

**Communication Style:**
• Be helpful, professional, and conversational
• Use emojis sparingly but effectively (🚀 🔧 ☁️ 💡)
• Provide specific, actionable information
• If unsure about technical details, suggest contacting our technical team
• Always aim to understand the customer's specific needs
• Offer to connect them with demos, trials, or sales team when appropriate

**Response Format:**
• Use markdown formatting for clarity
• Structure responses with headers and bullet points
• Include relevant code examples when discussing technical features
• Keep responses focused and not too lengthy
• End with helpful suggestions or next steps

**Important Guidelines:**
• Focus on business value and customer benefits
• Acknowledge limitations honestly - don't oversell
• Suggest appropriate resources (docs, demos, sales contact)
• For complex technical issues, recommend contacting our support team
• Always maintain a helpful and solution-oriented tone

Remember: Your goal is to help customers understand how Deployia can solve their DevOps challenges and guide them to the right solution for their needs.`;
  }

  // Fallback responses when API is not available
  getFallbackBusinessResponse(userMessage) {
    const userLower = userMessage.toLowerCase();

    const responses = {
      greeting: {
        message:
          "👋 **Welcome to Deployia!**\n\nI'm here to help you understand how our AI-powered DevOps platform can revolutionize your deployment process.\n\n**What makes Deployia special:**\n• **AI analyzes your code** and creates optimal deployment strategies\n• **Zero configuration** - just paste your GitHub URL\n• **Deploy in minutes** to any cloud provider\n• **Enterprise security** with automated compliance\n\n💡 **Ready to see it in action?** Try our free demo or ask me anything about our platform!",
        suggestions: [
          "Show me a demo",
          "What are your pricing plans?",
          "How does the AI work?",
        ],
      },

      pricing: {
        message:
          "💰 **Deployia Pricing Plans:**\n\n**🆓 Free Tier**\n• Up to 3 projects\n• Basic deployments\n• Community support\n• Perfect for trying out the platform\n\n**👨‍💻 Professional - $29/month**\n• Up to 15 projects\n• Advanced CI/CD pipelines\n• Priority email support\n• Great for individual developers\n\n**👥 Team - $99/month**\n• Up to 50 projects\n• Team collaboration features\n• Dedicated Slack support\n• Ideal for growing teams\n\n**🏢 Enterprise - Custom Pricing**\n• Unlimited projects\n• White-label options\n• Dedicated account manager\n• Custom SLA and support\n\n📞 **Want to discuss your specific needs?** Contact our sales team for a personalized quote!",
        suggestions: [
          "What's included in Free tier?",
          "Tell me about Enterprise features",
          "Can I get a demo?",
        ],
      },

      demo: {
        message:
          "🎥 **See Deployia in Action!**\n\n**Live Demo Options:**\n\n**📱 Interactive Demo**\n• Try our platform with a sample repository\n• See AI code analysis in real-time\n• Watch automated deployment process\n• No signup required!\n\n**👨‍💼 Personalized Demo**\n• 30-minute session with our team\n• Custom demo with your actual codebase\n• Q&A about your specific use case\n• Best practices and recommendations\n\n**🚀 Free Trial**\n• Full access to Professional features\n• Deploy your real projects\n• 14-day trial period\n• Dedicated onboarding support\n\n💡 **Ready to get started?** I can help you sign up for any of these options!",
        suggestions: [
          "Start interactive demo",
          "Schedule personalized demo",
          "Sign up for free trial",
        ],
      },

      technical: {
        message:
          "🔧 **Deployia Technical Overview:**\n\n**🤖 AI-Powered Analysis**\n• Detects 50+ frameworks automatically\n• Optimizes Docker configurations\n• Security-hardened setups\n• Best practice recommendations\n\n**☁️ Multi-Cloud Support**\n• AWS, Azure, GCP, DigitalOcean\n• Kubernetes on any provider\n• Serverless deployments\n\n**🔄 CI/CD Integration**\n• GitHub Actions & GitLab CI\n• Jenkins pipelines\n• Custom webhook triggers\n\n**📊 Monitoring Built-in**\n• Real-time logs and metrics\n• Performance monitoring\n• Custom dashboards\n\n🛡️ **Enterprise Security**\n• SOC 2 Type II & GDPR compliant\n• Vulnerability scanning\n• Role-based access control\n\n*Need detailed technical specs?* Our engineering team can help!",
        suggestions: [
          "What frameworks do you support?",
          "How does security work?",
          "Can you integrate with our tools?",
        ],
      },

      support: {
        message:
          "🎧 **Get Help with Deployia:**\n\n**📚 Self-Service**\n• Comprehensive documentation\n• Video tutorials & guides\n• Community forum\n• 200+ knowledge base articles\n\n**💬 Direct Support**\n• **Free/Pro**: Email (24-48h response)\n• **Team**: Slack + priority support\n• **Enterprise**: Dedicated team + phone\n\n**🚀 Onboarding Included**\n• Free onboarding for all paid plans\n• Custom training for Enterprise\n• Best practices consultation\n\n**🔧 Technical Help**\n• Migration assistance\n• Custom integrations\n• Performance optimization\n\n📞 *Available Mon-Fri, 9 AM - 6 PM EST*",
        suggestions: [
          "Contact support team",
          "View documentation",
          "Schedule onboarding call",
        ],
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
      message: `Thanks for asking about **"${userMessage}"**!\n\nI can help you with:\n\n• **🚀 How Deployia works** - AI-powered deployments\n• **💰 Pricing & Plans** - Find your perfect plan\n• **🎥 Live Demo** - See it in action\n• **🔧 Technical Features** - Integrations & capabilities\n• **📞 Contact Sales** - Talk to our team\n\n💡 *Try: "How does Deployia work?" or "Show me pricing"*`,
      isBot: true,
      timestamp: new Date(),
      suggestions: [
        "How does Deployia work?",
        "Show me pricing plans",
        "Can I see a demo?",
      ],
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
