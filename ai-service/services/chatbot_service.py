"""
Chatbot Services for DeployIO AI Service

Provides business and DevOps chatbot functionality with RAG system integration.
Uses lightweight Groq API for fast responses.
"""

import logging
from typing import Dict, Any, List
from datetime import datetime
import json

from engines.llm.groq_client import GroqClient
from engines.llm.models import LLMRequest
from config.settings import settings

logger = logging.getLogger(__name__)


class RAGSystem:
    """
    Retrieval-Augmented Generation system for business chatbot.
    Provides context-aware responses using DeployIO documentation.
    """

    def __init__(self):
        self._knowledge_base = self._load_knowledge_base()

    def _load_knowledge_base(self) -> Dict[str, Any]:
        """Load DeployIO platform knowledge base."""
        return {
            "platform_overview": {
                "description": "DeployIO is an AI-powered DevOps platform that simplifies application deployment with intelligent automation.",
                "key_features": [
                    "AI-Powered Analysis: Automatically detects application type, dependencies, and optimal deployment strategy",
                    "Multi-Cloud Support: Deploy to AWS, Google Cloud, Azure, Heroku, and more",
                    "Zero Configuration: Get started without complex setup files",
                    "Intelligent Scaling: Automatic scaling based on traffic patterns",
                    "Built-in Monitoring: Real-time performance monitoring and alerting",
                    "Security First: Enterprise-grade security and compliance features",
                ],
                "how_it_works": [
                    "Connect Repository: Link your GitHub, GitLab, or Bitbucket repository",
                    "AI Analysis: Our AI analyzes your code structure and dependencies",
                    "Deployment Strategy: Automatically generates optimal deployment configuration",
                    "Deploy: One-click deployment to your preferred cloud platform",
                    "Monitor: Real-time monitoring and performance insights",
                ],
            },
            "pricing": {
                "free_tier": {
                    "name": "Free",
                    "price": "$0/month",
                    "features": [
                        "Up to 3 projects",
                        "100 deployments/month",
                        "Community support",
                        "Basic monitoring",
                    ],
                },
                "pro_tier": {
                    "name": "Pro",
                    "price": "$29/month",
                    "features": [
                        "Unlimited projects",
                        "Unlimited deployments",
                        "Priority support",
                        "Advanced monitoring",
                        "Custom integrations",
                    ],
                },
                "enterprise": {
                    "name": "Enterprise",
                    "price": "Custom pricing",
                    "features": [
                        "Custom pricing",
                        "Dedicated support",
                        "On-premises deployment",
                        "Custom SLAs",
                        "Advanced security features",
                    ],
                },
            },
            "supported_technologies": {
                "frontend": [
                    "React, Vue.js, Angular",
                    "Next.js, Nuxt.js, Gatsby",
                    "Static site generators",
                ],
                "backend": [
                    "Node.js, Python, PHP, Ruby",
                    "Java, Go, .NET",
                    "Microservices architectures",
                ],
                "databases": [
                    "PostgreSQL, MySQL, MongoDB",
                    "Redis, Elasticsearch",
                    "Managed database services",
                ],
                "containers": ["Docker", "Kubernetes", "Serverless functions"],
            },
            "getting_started": {
                "steps": [
                    "Sign up for an account at deployio.tech",
                    "Install the CLI with npm install -g deployio-cli",
                    "Connect your repository",
                    "Follow the guided setup wizard",
                    "Deploy your first application",
                ],
                "first_deployment": [
                    "Ensure your project is properly configured",
                    "Connect to your Git provider",
                    "Let AI analyze your codebase",
                    "Review generated configurations",
                    "Deploy with one click",
                ],
            },
            "support": {
                "channels": [
                    "Documentation: https://docs.deployio.tech",
                    "Community Discord: https://discord.gg/deployio",
                    "Email Support: support@deployio.tech",
                    "Support Portal: https://support.deployio.tech",
                ],
                "common_issues": [
                    "Build failures: Check logs in the dashboard",
                    "Deployment issues: Verify environment variables",
                    "Performance: Review resource allocation",
                    "SSL issues: Check domain configuration",
                ],
            },
        }

    def search_knowledge(self, query: str) -> Dict[str, Any]:
        """
        Search knowledge base for relevant information.

        Args:
            query: User query

        Returns:
            Relevant context for the query
        """
        query_lower = query.lower()
        relevant_context = {}

        # Search for pricing information
        if any(
            word in query_lower for word in ["price", "pricing", "cost", "plan", "tier"]
        ):
            relevant_context["pricing"] = self._knowledge_base["pricing"]

        # Search for platform information
        if any(
            word in query_lower
            for word in ["how", "work", "platform", "features", "what"]
        ):
            relevant_context["platform"] = self._knowledge_base["platform_overview"]

        # Search for getting started information
        if any(
            word in query_lower
            for word in ["start", "begin", "setup", "install", "first"]
        ):
            relevant_context["getting_started"] = self._knowledge_base[
                "getting_started"
            ]

        # Search for technical information
        if any(
            word in query_lower
            for word in ["tech", "technology", "support", "framework", "language"]
        ):
            relevant_context["technologies"] = self._knowledge_base[
                "supported_technologies"
            ]

        # Search for support information
        if any(
            word in query_lower
            for word in ["support", "help", "contact", "issue", "problem"]
        ):
            relevant_context["support"] = self._knowledge_base["support"]

        return relevant_context


class BusinessChatbotService:
    """
    Business chatbot service for customer support and sales inquiries.
    Uses RAG system for context-aware responses about DeployIO platform.
    """

    def __init__(self):
        self.groq_client = None
        self.rag_system = RAGSystem()
        self.conversation_history: Dict[str, List[Dict]] = {}

    async def initialize(self):
        """Initialize the Groq client."""
        if settings.groq_api_key:
            self.groq_client = GroqClient(
                api_key=settings.groq_api_key,
                model="llama-3.3-70b-versatile",  # Fast and lightweight
            )
            await self.groq_client.initialize()
            logger.info("Business chatbot service initialized with Groq")
        else:
            logger.warning("Groq API key not configured for business chatbot")

    async def get_response(
        self, user_message: str, session_id: str = "default"
    ) -> Dict[str, Any]:
        """
        Generate response for business inquiries with RAG enhancement.

        Args:
            user_message: User's message
            session_id: Conversation session ID

        Returns:
            Bot response with message and suggestions
        """
        try:
            # Search knowledge base for relevant context
            context = self.rag_system.search_knowledge(user_message)

            # Get conversation history
            history = self.conversation_history.get(session_id, [])

            # Generate response
            if self.groq_client and self.groq_client.is_available:
                response = await self._generate_ai_response(
                    user_message, context, history
                )
            else:
                response = self._generate_fallback_response(user_message, context)

            # Update conversation history
            self._update_conversation_history(
                session_id, user_message, response["message"]
            )

            # Generate contextual suggestions
            response["suggestions"] = self._generate_suggestions(
                user_message, response["message"]
            )
            response["timestamp"] = datetime.utcnow().isoformat()

            return response

        except Exception as e:
            logger.error(f"Business chatbot error: {e}")
            return {
                "message": "I apologize, but I'm experiencing technical difficulties. Please try again or contact our support team.",
                "suggestions": [
                    "Contact support",
                    "Try again later",
                    "Visit documentation",
                ],
                "timestamp": datetime.utcnow().isoformat(),
                "error": True,
            }

    async def _generate_ai_response(
        self, user_message: str, context: Dict, history: List
    ) -> Dict[str, Any]:
        """Generate AI response using Groq with RAG context."""
        system_prompt = self._build_system_prompt(context)

        # Build conversation context
        messages = [{"role": "system", "content": system_prompt}]

        # Add recent conversation history (last 10 messages)
        for msg in history[-10:]:
            messages.extend(
                [
                    {"role": "user", "content": msg["user"]},
                    {"role": "assistant", "content": msg["bot"]},
                ]
            )

        # Add current message
        messages.append({"role": "user", "content": user_message})

        request = LLMRequest(messages=messages, temperature=0.7, max_tokens=1024)

        response = await self.groq_client.generate(request)

        return {"message": response.content, "isBot": True}

    def _generate_fallback_response(
        self, user_message: str, context: Dict
    ) -> Dict[str, Any]:
        """Generate fallback response when AI is not available."""
        user_lower = user_message.lower()

        # Pricing inquiries
        if any(word in user_lower for word in ["price", "pricing", "cost", "plan"]):
            return {
                "message": "💰 **DeployIO Pricing:**\n\n• **Free**: $0/month - 3 projects, basic monitoring\n• **Pro**: $29/month - Unlimited projects, priority support\n• **Enterprise**: Custom pricing - Dedicated support, advanced features\n\nContact sales for custom Enterprise pricing!",
                "isBot": True,
            }

        # Getting started inquiries
        if any(word in user_lower for word in ["start", "begin", "how", "setup"]):
            return {
                "message": "🚀 **Getting Started with DeployIO:**\n\n1. Sign up at deployio.tech\n2. Connect your Git repository\n3. Let our AI analyze your code\n4. Review generated configurations\n5. Deploy with one click!\n\nNeed help? Check our documentation or start a free trial!",
                "isBot": True,
            }

        # Technical inquiries
        if any(
            word in user_lower for word in ["tech", "support", "framework", "language"]
        ):
            return {
                "message": "🔧 **Supported Technologies:**\n\n• **Frontend**: React, Vue, Angular, Next.js\n• **Backend**: Node.js, Python, Java, Go\n• **Databases**: PostgreSQL, MongoDB, Redis\n• **Containers**: Docker, Kubernetes\n\nOur AI automatically detects your stack and optimizes deployment!",
                "isBot": True,
            }

        # Default response
        return {
            "message": f'Thanks for asking about **"{user_message}"**!\n\n🚀 **DeployIO** is an AI-powered deployment platform that:\n\n• Analyzes your code automatically\n• Generates optimal configurations\n• Deploys to any cloud platform\n• Monitors performance in real-time\n\nWant to learn more? Ask about pricing, getting started, or our supported technologies!',
            "isBot": True,
        }

    def _build_system_prompt(self, context: Dict) -> str:
        """Build system prompt with RAG context."""
        base_prompt = """You are DeployBot, a friendly and knowledgeable AI assistant for DeployIO, an AI-powered DevOps platform. 

Your role:
- Answer questions about DeployIO's features, pricing, and capabilities
- Help users understand how to get started
- Provide technical guidance when appropriate
- Be concise, helpful, and professional
- Use markdown formatting for better readability
- If you don't know something, suggest contacting support

Communication style:
- Friendly and approachable
- Use bullet points and clear structure
- Include relevant emojis sparingly
- Keep responses concise but informative
- Always try to be helpful and solution-oriented

"""

        # Add context information
        if context:
            base_prompt += "\nCurrent context about DeployIO:\n"
            for key, value in context.items():
                base_prompt += f"\n{key.upper()}:\n{json.dumps(value, indent=2)}\n"

        base_prompt += (
            "\nUse this context to provide accurate, helpful responses about DeployIO."
        )

        return base_prompt

    def _update_conversation_history(
        self, session_id: str, user_message: str, bot_response: str
    ):
        """Update conversation history for context."""
        if session_id not in self.conversation_history:
            self.conversation_history[session_id] = []

        self.conversation_history[session_id].append(
            {
                "user": user_message,
                "bot": bot_response,
                "timestamp": datetime.utcnow().isoformat(),
            }
        )

        # Keep only last 20 exchanges to manage memory
        if len(self.conversation_history[session_id]) > 20:
            self.conversation_history[session_id] = self.conversation_history[
                session_id
            ][-20:]

    def _generate_suggestions(self, user_message: str, bot_response: str) -> List[str]:
        """Generate contextual suggestions based on the conversation."""
        user_lower = user_message.lower()

        if any(word in user_lower for word in ["price", "pricing", "cost"]):
            return [
                "What's included in Free tier?",
                "Tell me about Enterprise features",
                "How do I upgrade?",
            ]

        if any(word in user_lower for word in ["start", "begin", "how"]):
            return [
                "Show me a demo",
                "What technologies do you support?",
                "How long does deployment take?",
            ]

        if any(word in user_lower for word in ["tech", "support", "framework"]):
            return [
                "Do you support my tech stack?",
                "What about databases?",
                "How does AI analysis work?",
            ]

        # Default suggestions
        return ["How does DeployIO work?", "Show me pricing", "Contact sales"]

    def reset_conversation(self, session_id: str):
        """Reset conversation history for a session."""
        if session_id in self.conversation_history:
            del self.conversation_history[session_id]


class DevOpsChatbotService:
    """
    DevOps chatbot service for technical assistance and guidance.
    Provides expert-level DevOps advice and troubleshooting.
    """

    def __init__(self):
        self.groq_client = None

    async def initialize(self):
        """Initialize the Groq client."""
        if settings.groq_api_key:
            self.groq_client = GroqClient(
                api_key=settings.groq_api_key,
                model="llama-3.3-70b-versatile",  # Fast and capable model
            )
            await self.groq_client.initialize()
            logger.info("DevOps chatbot service initialized with Groq")
        else:
            logger.warning("Groq API key not configured for DevOps chatbot")

    async def get_response(
        self, user_message: str, context: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Generate DevOps-focused response.

        Args:
            user_message: User's technical question
            context: Optional context (active file, repository, etc.)

        Returns:
            Technical response with examples and guidance
        """
        try:
            if self.groq_client and self.groq_client.is_available:
                response = await self._generate_ai_response(user_message, context or {})
            else:
                response = self._generate_fallback_response(user_message)

            response["timestamp"] = datetime.utcnow().isoformat()
            return response

        except Exception as e:
            logger.error(f"DevOps chatbot error: {e}")
            return {
                "message": "I encountered an error while processing your request. Please try again or rephrase your question.",
                "timestamp": datetime.utcnow().isoformat(),
                "error": True,
            }

    async def _generate_ai_response(
        self, user_message: str, context: Dict
    ) -> Dict[str, Any]:
        """Generate AI response for DevOps queries."""
        system_prompt = self._get_devops_system_prompt(context)

        request = LLMRequest(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            temperature=0.7,
            max_tokens=1024,
        )

        response = await self.groq_client.generate(request)

        return {"message": response.content, "isBot": True}

    def _generate_fallback_response(self, user_message: str) -> Dict[str, Any]:
        """Generate fallback response for DevOps queries."""
        user_lower = user_message.lower()

        # Docker inquiries
        if "docker" in user_lower:
            return {
                "message": """🐳 **Docker Best Practices:**

**Image Optimization:**
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
USER node
EXPOSE 3000
CMD ["npm", "start"]
```

**Key Tips:**
• Use multi-stage builds
• Run as non-root user
• Use Alpine images for smaller size
• Implement health checks""",
                "isBot": True,
            }

        # Kubernetes inquiries
        elif "kubernetes" in user_lower or "k8s" in user_lower:
            return {
                "message": """☸️ **Kubernetes Essentials:**

**Deployment Configuration:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: app
        image: myapp:latest
        resources:
          requests:
            memory: "64Mi"
            cpu: "250m"
          limits:
            memory: "128Mi"
            cpu: "500m"
```

**Best Practices:**
• Always set resource limits
• Use health checks
• Implement RBAC
• Use namespaces for organization""",
                "isBot": True,
            }

        # CI/CD inquiries
        elif any(
            word in user_lower for word in ["ci", "cd", "pipeline", "github actions"]
        ):
            return {
                "message": """🚀 **CI/CD Pipeline Guide:**

**GitHub Actions Example:**
```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - name: Build & Deploy
      run: |
        docker build -t app .
        docker push app:latest
```

**Pipeline Principles:**
• Test before deploy
• Use environment variables
• Implement rollback strategies
• Monitor deployment health""",
                "isBot": True,
            }

        # Default DevOps response
        return {
            "message": f"""I understand you're asking about **"{user_message}"**

**I can help you with:**
• **Docker & Containers:** Optimization, security, best practices
• **Kubernetes:** Deployments, services, scaling strategies  
• **CI/CD:** GitHub Actions, Jenkins, pipeline design
• **Infrastructure:** Terraform, AWS, Azure, GCP
• **Security:** Container scanning, RBAC, compliance
• **Monitoring:** Logging, metrics, observability

💡 **Tip:** Try asking about specific topics like "Docker best practices" or "Kubernetes deployment"

Need more specific help? Feel free to ask about any DevOps topic!""",
            "isBot": True,
        }

    def _get_devops_system_prompt(self, context: Dict) -> str:
        """Get system prompt for DevOps assistant."""
        base_prompt = """You are DeployBot, an intelligent DevOps AI assistant specializing in:

**Core Expertise:**
- Docker & Containerization (optimization, security, best practices)
- Kubernetes & Container Orchestration
- CI/CD Pipelines (GitHub Actions, Jenkins, GitLab CI)
- Infrastructure as Code (Terraform, CloudFormation, Pulumi)
- Cloud Platforms (AWS, Azure, GCP)
- DevOps Security & Compliance
- Monitoring & Observability
- Microservices Architecture

**Communication Style:**
- Provide clear, actionable advice
- Include code examples when relevant
- Use markdown formatting for better readability
- Structure responses with headers, bullet points, and code blocks
- Be concise but comprehensive
- Focus on production-ready solutions

**Response Format:**
Use markdown formatting:
- **Bold** for section headers
- `inline code` for commands/file names
- ```language blocks for code examples
- • Bullet points for lists
- 🔧 Relevant emojis for visual appeal

Always provide practical, industry-standard DevOps solutions."""

        # Add context if available
        if context:
            base_prompt += "\n\n**Current Context:**\n"
            if context.get("activeFile"):
                base_prompt += f"Currently viewing file: {context['activeFile']}\n"
            if context.get("repository"):
                base_prompt += f"Repository: {context['repository']}\n"

        return base_prompt


# Global service instances
business_chatbot_service = BusinessChatbotService()
devops_chatbot_service = DevOpsChatbotService()


async def initialize_chatbot_services():
    """Initialize both chatbot services."""
    await business_chatbot_service.initialize()
    await devops_chatbot_service.initialize()
    logger.info("Chatbot services initialized")


def get_business_chatbot_service() -> BusinessChatbotService:
    """Get business chatbot service instance."""
    return business_chatbot_service


def get_devops_chatbot_service() -> DevOpsChatbotService:
    """Get DevOps chatbot service instance."""
    return devops_chatbot_service
