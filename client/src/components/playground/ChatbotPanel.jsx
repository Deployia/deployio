import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSend,
  FiUser,
  FiCpu,
  FiMic,
  FiPaperclip,
  FiSettings,
  FiTrash2,
  FiCopy,
  FiThumbsUp,
  FiThumbsDown,
  FiCode,
  FiZap,
  FiBookOpen,
} from "react-icons/fi";

const ChatbotPanel = ({ workspace, context = "devops" }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatContext, setChatContext] = useState(context);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize chat session
  const initializeChatSession = useCallback(async () => {
    try {
      // Add welcome message
      const welcomeMessage = {
        id: Date.now(),
        type: "ai",
        content: `Hello! I'm your DevOps AI assistant. I can help you with:
        
• Code analysis and optimization
• Debugging and troubleshooting
• DevOps best practices
• Docker and containerization
• CI/CD pipeline guidance
• Infrastructure as Code
• Security recommendations

How can I assist you today?`,
        timestamp: new Date().toISOString(),
      };

      setMessages([welcomeMessage]);
    } catch (err) {
      console.error("Failed to initialize chat session:", err);
    }
  }, []);

  useEffect(() => {
    initializeChatSession();
  }, [initializeChatSession]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isTyping) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: inputMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    try {
      // For now, simulate AI responses until we have a proper chat endpoint
      const aiResponse = await simulateAIResponse(
        userMessage.content,
        workspace
      );

      const aiMessage = {
        id: Date.now() + 1,
        type: "ai",
        content: aiResponse,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error("Failed to send message:", err);

      const errorMessage = {
        id: Date.now() + 1,
        type: "ai",
        content:
          "I apologize, but I encountered an error processing your request. Please try rephrasing your question or try again later.",
        timestamp: new Date().toISOString(),
        isError: true,
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const simulateAIResponse = async (message, workspaceContext) => {
    // Simulate API delay
    await new Promise((resolve) =>
      setTimeout(resolve, 1000 + Math.random() * 2000)
    );

    const lowerMessage = message.toLowerCase();

    // Context-aware responses based on message content
    if (
      lowerMessage.includes("explain") ||
      lowerMessage.includes("what does")
    ) {
      return getCodeExplanationResponse(workspaceContext);
    } else if (
      lowerMessage.includes("optimize") ||
      lowerMessage.includes("improve")
    ) {
      return getOptimizationResponse(workspaceContext);
    } else if (
      lowerMessage.includes("debug") ||
      lowerMessage.includes("error") ||
      lowerMessage.includes("problem")
    ) {
      return getDebuggingResponse(workspaceContext);
    } else if (
      lowerMessage.includes("devops") ||
      lowerMessage.includes("deployment") ||
      lowerMessage.includes("best practice")
    ) {
      return getDevOpsBestPracticesResponse(workspaceContext);
    } else if (
      lowerMessage.includes("docker") ||
      lowerMessage.includes("container")
    ) {
      return getDockerResponse(workspaceContext);
    } else if (
      lowerMessage.includes("ci/cd") ||
      lowerMessage.includes("pipeline") ||
      lowerMessage.includes("github actions")
    ) {
      return getCICDResponse(workspaceContext);
    } else if (
      lowerMessage.includes("security") ||
      lowerMessage.includes("vulnerability")
    ) {
      return getSecurityResponse(workspaceContext);
    }

    // Default response
    return getDefaultResponse(message, workspaceContext);
  };

  const getCodeExplanationResponse = (workspace) => {
    const activeFile = workspace?.activeFile || "your code";
    return `I'd be happy to explain ${activeFile}! Let me analyze the code structure:

**Code Analysis:**
- **Language**: ${getFileLanguage(activeFile)}
- **Purpose**: This appears to be a ${getFileType(activeFile)} file
- **Key Components**: Based on the file extension and structure

**Recommendations:**
1. **Code Quality**: Add proper error handling and input validation
2. **Documentation**: Include inline comments for complex logic
3. **Testing**: Consider adding unit tests for better reliability
4. **Performance**: Look for optimization opportunities

Would you like me to focus on any specific aspect of the code or provide more detailed analysis?`;
  };

  const getOptimizationResponse = (_workspace) => {
    return `Here are optimization strategies for your project:

**Performance Optimizations:**
🚀 **Application Level**
- Implement caching strategies (Redis/Memcached)
- Optimize database queries and add indexing
- Use connection pooling for databases
- Enable compression for API responses

🐳 **Container Optimizations**
- Multi-stage Docker builds (reduce image size by 60-70%)
- Use Alpine-based images
- Optimize layer caching
- Remove unnecessary dependencies

⚡ **Infrastructure Optimizations**
- Implement horizontal pod autoscaling
- Use CDN for static assets
- Configure load balancing
- Optimize resource requests/limits

📊 **Monitoring & Profiling**
- Add APM tools (New Relic, DataDog)
- Implement health checks
- Use Prometheus for metrics
- Set up distributed tracing

Which optimization area would you like to explore first?`;
  };

  const getDebuggingResponse = (_workspace) => {
    return `I'll help you debug this issue! Let's approach this systematically:

**🔍 Debugging Checklist:**

**1. Error Analysis**
- What's the exact error message?
- When does the error occur?
- Is it consistent or intermittent?

**2. Common Issues & Solutions**
- **Memory Leaks**: Check for unclosed connections
- **Async Errors**: Verify proper async/await usage
- **Environment**: Confirm all required env vars are set
- **Dependencies**: Check for version conflicts

**3. Debugging Tools**
- Enable debug logs: \`DEBUG=* npm start\`
- Use Node Inspector: \`node --inspect app.js\`
- Chrome DevTools for memory profiling
- Container logs: \`docker logs <container-id>\`

**4. Testing Strategy**
- Isolate the problem area
- Add logging at key points
- Test with minimal data set
- Verify configuration settings

**Next Steps:**
Please share the specific error message or symptoms you're experiencing, and I'll provide targeted debugging guidance!`;
  };

  const getDevOpsBestPracticesResponse = (_workspace) => {
    return `Here are essential DevOps best practices for your project:

**🔄 CI/CD Pipeline**
✅ Automated testing on every commit
✅ Progressive deployment (dev → staging → prod)
✅ Automated rollback capabilities
✅ Infrastructure as Code (Terraform/CloudFormation)
✅ GitOps workflows

**🐳 Containerization**
✅ Multi-stage Docker builds
✅ Non-root user in containers
✅ Health checks and readiness probes
✅ Resource limits and requests
✅ Security scanning (Trivy/Snyk)

**📊 Monitoring & Observability**
✅ Centralized logging (ELK/Fluentd)
✅ Metrics collection (Prometheus/Grafana)
✅ Distributed tracing (Jaeger/Zipkin)
✅ Alerting and incident response
✅ SLA/SLO monitoring

**🔒 Security**
✅ Secrets management (Vault/AWS Secrets)
✅ Network policies and segmentation
✅ Regular security audits
✅ Least privilege access
✅ Vulnerability scanning

**📈 Performance**
✅ Load testing and capacity planning
✅ Caching strategies
✅ Database optimization
✅ CDN implementation

Which area would you like to dive deeper into?`;
  };

  const getDockerResponse = (_workspace) => {
    return `Let's optimize your Docker setup! Here's a comprehensive guide:

**🐳 Docker Best Practices:**

**Dockerfile Optimization:**
\`\`\`dockerfile
# Multi-stage build example
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runtime
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
USER nextjs
EXPOSE 3000
CMD ["npm", "start"]
\`\`\`

**Key Improvements:**
- **Multi-stage builds**: Reduce final image size
- **Non-root user**: Enhanced security
- **Layer optimization**: Cache npm install separately
- **Alpine images**: Smaller attack surface

**Docker Compose Tips:**
- Use environment files for configuration
- Implement health checks
- Set resource limits
- Use named volumes for data persistence

**Security Enhancements:**
- Scan images with Trivy: \`trivy image your-image\`
- Use distroless images when possible
- Regular base image updates
- Secrets management

Would you like me to help optimize your specific Dockerfile or Docker Compose setup?`;
  };

  const getCICDResponse = (_workspace) => {
    return `Let's set up a robust CI/CD pipeline for your project:

**🔄 CI/CD Pipeline Architecture:**

**GitHub Actions Workflow:**
\`\`\`yaml
name: CI/CD Pipeline
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      - run: npm run lint
      - run: npm run security-audit
      
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: docker build -t app .
      - run: docker run --rm app npm test
\`\`\`

**Pipeline Stages:**
1. **Code Quality**: Linting, formatting, type checking
2. **Testing**: Unit, integration, e2e tests
3. **Security**: Vulnerability scanning, SAST
4. **Build**: Container image creation
5. **Deploy**: Staged deployment with rollback

**Advanced Features:**
- **Blue-Green Deployment**: Zero-downtime deployments
- **Canary Releases**: Gradual traffic shifting
- **Feature Flags**: Control feature rollouts
- **Automated Rollbacks**: Revert on failure

**Monitoring Integration:**
- Health check endpoints
- Deployment notifications (Slack/Discord)
- Performance monitoring
- Error tracking (Sentry)

Would you like help setting up any specific part of the pipeline?`;
  };

  const getSecurityResponse = (_workspace) => {
    return `Let's enhance your project's security posture:

**🔒 Security Assessment & Recommendations:**

**Code Security:**
- **SAST**: Static code analysis (SonarQube, CodeQL)
- **Dependency Scanning**: Check for vulnerable packages
- **Secrets Detection**: Prevent credential leaks
- **Input Validation**: Sanitize all user inputs

**Container Security:**
- **Image Scanning**: Trivy, Snyk, or Aqua Security
- **Base Image Updates**: Regular security patches
- **Non-root Users**: Run containers with minimal privileges
- **Network Policies**: Restrict inter-pod communication

**Infrastructure Security:**
- **Network Segmentation**: VPC, subnets, security groups
- **Access Control**: IAM policies, RBAC
- **Encryption**: At rest and in transit
- **Monitoring**: Security event logging

**Security Tools Integration:**
\`\`\`bash
# Security scanning commands
npm audit --audit-level=high
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image your-image
terraform plan -var-file=security.tfvars
\`\`\`

**Compliance Frameworks:**
- SOC 2 Type II
- ISO 27001
- PCI DSS (if applicable)
- GDPR compliance

**Incident Response:**
- Automated alerting
- Playbook documentation
- Regular security drills
- Forensic capabilities

What specific security aspect would you like to address first?`;
  };

  const getDefaultResponse = (message, workspace) => {
    return `I understand you're asking about: "${message}"

Based on your workspace context, I can help you with:

**🛠️ Available Assistance:**
- **Code Analysis**: Review and optimize your code
- **DevOps Guidance**: CI/CD, containerization, deployment
- **Debugging Support**: Troubleshoot issues and errors
- **Security Review**: Identify and fix vulnerabilities
- **Performance Optimization**: Improve application performance
- **Best Practices**: Industry-standard DevOps practices

**💡 Quick Actions:**
- Type "explain code" to get code analysis
- Type "optimize" for performance improvements
- Type "debug help" for troubleshooting assistance
- Type "devops tips" for best practices

**🔧 Workspace Context:**
${
  workspace?.activeFile
    ? `- Currently viewing: ${workspace.activeFile}`
    : "- No active file"
}
${workspace?.language ? `- Language: ${workspace.language}` : ""}
${workspace?.framework ? `- Framework: ${workspace.framework}` : ""}

How can I help you with your DevOps workflow today?`;
  };

  const getFileLanguage = (filename) => {
    if (!filename) return "Unknown";
    const ext = filename.split(".").pop()?.toLowerCase();
    const languageMap = {
      js: "JavaScript",
      ts: "TypeScript",
      py: "Python",
      java: "Java",
      go: "Go",
      rs: "Rust",
      cpp: "C++",
      c: "C",
      php: "PHP",
      rb: "Ruby",
      yml: "YAML",
      yaml: "YAML",
      json: "JSON",
      xml: "XML",
      html: "HTML",
      css: "CSS",
      scss: "SCSS",
      md: "Markdown",
    };
    return languageMap[ext] || "Unknown";
  };

  const getFileType = (filename) => {
    if (!filename) return "unknown";
    const name = filename.toLowerCase();
    if (name.includes("dockerfile")) return "Docker container configuration";
    if (name.includes("docker-compose")) return "Docker Compose configuration";
    if (name.includes("package.json")) return "Node.js package configuration";
    if (name.includes("requirements.txt")) return "Python dependencies";
    if (name.includes(".tf")) return "Terraform infrastructure configuration";
    if (name.includes(".yml") || name.includes(".yaml"))
      return "YAML configuration";
    if (name.includes("main.")) return "main application";
    if (name.includes("index.")) return "index/entry point";
    if (name.includes("config")) return "configuration";
    if (name.includes("test")) return "test";
    return "source code";
  };

  // Predefined quick actions
  const quickActions = [
    {
      id: "explain-code",
      label: "Explain Code",
      icon: FiCode,
      prompt: "Can you explain what this code does and suggest improvements?",
    },
    {
      id: "optimize",
      label: "Optimize",
      icon: FiZap,
      prompt: "How can I optimize this code for better performance?",
    },
    {
      id: "debug",
      label: "Debug Help",
      icon: FiUser,
      prompt: "I'm having issues with this code. Can you help me debug it?",
    },
    {
      id: "devops-best-practices",
      label: "DevOps Tips",
      icon: FiBookOpen,
      prompt: "What are the best DevOps practices for this project?",
    },
  ];

  // Sample AI responses
  const aiResponses = {
    greeting:
      "Hello! I'm your DevOps AI assistant. I can help you with code analysis, deployment strategies, infrastructure optimization, and DevOps best practices. What would you like to know?",

    codeExplanation: `Looking at your code, I can see this is a Node.js Express application. Here's what it does:

**Main Components:**
- Sets up an Express server on port 3000
- Implements basic middleware for JSON parsing
- Defines health check and root endpoints
- Includes error handling middleware

**Suggestions for improvement:**
1. **Security**: Add helmet.js for security headers
2. **Logging**: Implement structured logging with winston
3. **Validation**: Add input validation with joi or express-validator
4. **Rate Limiting**: Implement rate limiting to prevent abuse

Would you like me to show you how to implement any of these improvements?`,

    optimization: `Here are several optimization strategies for your application:

**Performance Optimizations:**
1. **Caching**: Implement Redis for session storage and API caching
2. **Compression**: Enable gzip compression for responses
3. **Database**: Add connection pooling and query optimization
4. **Static Assets**: Use CDN for static file delivery

**Docker Optimizations:**
1. **Multi-stage builds**: Reduce image size by 60-70%
2. **Layer caching**: Optimize Dockerfile layer order
3. **Alpine images**: Use smaller base images
4. **Security scanning**: Add vulnerability scanning to CI/CD

**Monitoring & Observability:**
1. **APM**: Integrate New Relic or DataDog
2. **Metrics**: Add Prometheus metrics
3. **Tracing**: Implement distributed tracing
4. **Health checks**: Enhanced health endpoints

Which area would you like to focus on first?`,

    debugging: `I'll help you debug this issue. Let me analyze the common problems:

**Common Node.js Issues:**
1. **Memory Leaks**: Check for unclosed connections, event listeners
2. **Async Errors**: Ensure proper error handling in async/await
3. **Environment Variables**: Verify all required env vars are set
4. **Dependencies**: Check for conflicting package versions

**Debugging Steps:**
1. **Enable Debug Logs**: Set DEBUG=* to see detailed logs
2. **Use Node Inspector**: \`node --inspect app.js\`
3. **Memory Profiling**: Use \`--inspect\` with Chrome DevTools
4. **Performance Monitoring**: Add performance.now() timing

**Docker-specific Issues:**
- Check container logs: \`docker logs <container-id>\`
- Verify port mappings and network connectivity
- Ensure proper file permissions in container

Can you share the specific error message or symptoms you're experiencing?`,

    devopsBestPractices: `Here are essential DevOps best practices for your project:

**CI/CD Pipeline:**
✅ Automated testing on every commit
✅ Security scanning in pipeline
✅ Progressive deployment (staging → production)
✅ Rollback capabilities
✅ Infrastructure as Code (IaC)

**Containerization:**
✅ Multi-stage Docker builds
✅ Non-root user in containers
✅ Health checks and resource limits
✅ Minimal base images (Alpine)
✅ Vulnerability scanning

**Monitoring & Observability:**
✅ Centralized logging (ELK stack)
✅ Application metrics (Prometheus)
✅ Distributed tracing (Jaeger)
✅ Alerting rules (PagerDuty)
✅ SLA/SLO monitoring

**Security:**
✅ Secrets management (HashiCorp Vault)
✅ Network policies and segmentation
✅ Regular security audits
✅ Principle of least privilege
✅ Automated compliance checks

Would you like me to elaborate on any of these areas or help implement specific practices?`,
  };

  useEffect(() => {
    // Add welcome message when component mounts
    if (messages.length === 0) {
      setMessages([
        {
          id: 1,
          type: "ai",
          content: aiResponses.greeting,
          timestamp: new Date(),
          context: chatContext,
        },
      ]);
    }
  }, [messages.length, aiResponses.greeting, chatContext]);
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleQuickAction = (action) => {
    setInputMessage(action.prompt);
    // Auto-send the quick action message
    const userMessage = {
      id: Date.now(),
      type: "user",
      content: action.prompt,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    // Get AI response for the quick action
    simulateAIResponse(action.prompt, workspace)
      .then((response) => {
        const aiMessage = {
          id: Date.now() + 1,
          type: "ai",
          content: response,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMessage]);
        setIsTyping(false);
      })
      .catch((err) => {
        console.error("Quick action error:", err);
        setIsTyping(false);
      });
  };

  const clearChat = () => {
    setMessages([]);
    initializeChatSession();
  };

  const copyMessage = (content) => {
    navigator.clipboard.writeText(content);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-full flex flex-col bg-neutral-900/50 backdrop-blur-sm">
      {/* Header */}
      <div className="p-4 border-b border-neutral-800/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center">
              <FiCpu className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-white">
                AI DevOps Assistant
              </h2>
              <p className="text-xs text-gray-400">Context: {chatContext}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={clearChat}
              className="p-2 rounded-lg hover:bg-neutral-800/50 text-gray-400 hover:text-red-400 transition-colors"
              title="Clear conversation"
            >
              <FiTrash2 className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-lg hover:bg-neutral-800/50 text-gray-400 hover:text-white transition-colors"
              title="Chat settings"
            >
              <FiSettings className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Context Selector */}
        <div className="flex gap-2">
          {["devops", "security", "performance", "general"].map((ctx) => (
            <motion.button
              key={ctx}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setChatContext(ctx)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                chatContext === ctx
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  : "bg-neutral-800/50 text-gray-400 hover:text-white"
              }`}
            >
              {ctx.charAt(0).toUpperCase() + ctx.slice(1)}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-b border-neutral-800/50 bg-neutral-900/30">
        <div className="grid grid-cols-2 gap-2">
          {quickActions.map((action) => (
            <motion.button
              key={action.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleQuickAction(action)}
              className="flex items-center gap-2 p-2 bg-neutral-800/50 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-neutral-700/50 transition-colors"
            >
              <action.icon className="w-4 h-4 text-cyan-400" />
              <span>{action.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={`flex gap-3 ${
                message.type === "user" ? "flex-row-reverse" : ""
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.type === "user"
                    ? "bg-gradient-to-r from-blue-500 to-purple-600"
                    : "bg-gradient-to-r from-cyan-500 to-blue-600"
                }`}
              >
                {message.type === "user" ? (
                  <FiUser className="w-4 h-4 text-white" />
                ) : (
                  <FiCpu className="w-4 h-4 text-white" />
                )}
              </div>

              {/* Message Content */}
              <div
                className={`flex-1 max-w-[80%] ${
                  message.type === "user" ? "text-right" : ""
                }`}
              >
                <div
                  className={`inline-block p-3 rounded-2xl ${
                    message.type === "user"
                      ? "bg-blue-500/20 text-blue-100 border border-blue-500/30"
                      : "bg-neutral-800/50 text-gray-100 border border-neutral-700/50"
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {message.content}
                  </div>

                  {/* Message Actions */}
                  <div
                    className={`flex items-center gap-2 mt-2 text-xs ${
                      message.type === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <span className="text-gray-400">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => copyMessage(message.content)}
                      className="p-1 rounded hover:bg-neutral-700/50 text-gray-400 hover:text-white transition-colors"
                      title="Copy message"
                    >
                      <FiCopy className="w-3 h-3" />
                    </motion.button>
                    {message.type === "ai" && (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-1 rounded hover:bg-neutral-700/50 text-gray-400 hover:text-green-400 transition-colors"
                          title="Good response"
                        >
                          <FiThumbsUp className="w-3 h-3" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-1 rounded hover:bg-neutral-700/50 text-gray-400 hover:text-red-400 transition-colors"
                          title="Poor response"
                        >
                          <FiThumbsDown className="w-3 h-3" />
                        </motion.button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center">
                <FiCpu className="w-4 h-4 text-white" />
              </div>
              <div className="bg-neutral-800/50 border border-neutral-700/50 rounded-2xl p-3">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" />
                  <div
                    className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <div
                    className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                  <span className="ml-2 text-xs text-gray-400">
                    AI is thinking...
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-neutral-800/50 bg-neutral-900/30">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 bg-neutral-800/50 rounded-xl border border-neutral-700/50 p-3">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Ask me about ${chatContext} best practices...`}
                className="flex-1 bg-transparent text-white placeholder-gray-400 resize-none outline-none text-sm max-h-20"
                rows={1}
                disabled={isTyping}
              />
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-1.5 rounded-lg hover:bg-neutral-700/50 text-gray-400 hover:text-white transition-colors"
                  title="Attach file"
                >
                  <FiPaperclip className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-1.5 rounded-lg hover:bg-neutral-700/50 text-gray-400 hover:text-white transition-colors"
                  title="Voice input"
                >
                  <FiMic className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => sendMessage()}
            disabled={!inputMessage.trim() || isTyping}
            className="p-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl text-white hover:from-cyan-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiSend className="w-5 h-5" />
          </motion.button>
        </div>

        {workspace.activeFile && (
          <div className="mt-2 text-xs text-gray-400">
            Context: Currently viewing{" "}
            <span className="text-cyan-400">{workspace.activeFile}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatbotPanel;
