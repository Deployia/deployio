import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSend,
  FiUser,
  FiCpu,
  FiTrash2,
  FiCopy,
  FiCode,
  FiZap,
  FiBookOpen,
} from "react-icons/fi";

const ChatbotPanel = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize chat with welcome message
  useEffect(() => {
    const welcomeMessage = {
      id: 1,
      type: "ai",
      content: `👋 Hello! I'm your DevOps AI assistant. I can help you with:

🔧 **Code Analysis & Optimization**
🐛 **Debugging & Troubleshooting** 
📚 **DevOps Best Practices**
🐳 **Docker & Containerization**
🚀 **CI/CD Pipeline Guidance**
☁️ **Infrastructure as Code**
🔒 **Security Recommendations**

How can I assist you today?`,
      timestamp: new Date().toISOString(),
    };
    setMessages([welcomeMessage]);
  }, []);

  // Sample AI responses for demonstration
  const getAIResponse = (userMessage) => {
    const responses = {
      "docker": "🐳 Docker is a containerization platform that packages applications and dependencies into lightweight containers. Here are some best practices:\n\n• Use multi-stage builds to reduce image size\n• Run as non-root user for security\n• Use specific base image tags\n• Implement health checks\n• Optimize layer caching",
      
      "ci/cd": "🚀 CI/CD (Continuous Integration/Continuous Deployment) automates your development workflow. Key components:\n\n• **Continuous Integration**: Automated testing and building\n• **Continuous Deployment**: Automated deployment to production\n• **Popular tools**: GitHub Actions, Jenkins, GitLab CI\n• **Best practices**: Test early, deploy often, rollback quickly",
      
      "kubernetes": "☸️ Kubernetes orchestrates containerized applications at scale. Core concepts:\n\n• **Pods**: Smallest deployable units\n• **Services**: Network abstraction layer\n• **Deployments**: Manage replica sets\n• **Ingress**: Expose services externally\n• **ConfigMaps & Secrets**: Configuration management",
      
      "terraform": "🏗️ Terraform enables Infrastructure as Code (IaC). Benefits:\n\n• **Declarative**: Define desired state\n• **Version Control**: Track infrastructure changes\n• **Reusable**: Modules for common patterns\n• **Multi-cloud**: Works across providers\n• **State Management**: Tracks resource state",
      
      "security": "🔒 DevOps security best practices:\n\n• **Shift Left**: Integrate security early in development\n• **Secrets Management**: Use tools like HashiCorp Vault\n• **Image Scanning**: Check for vulnerabilities\n• **RBAC**: Role-based access control\n• **Network Policies**: Secure pod-to-pod communication\n• **Regular Updates**: Keep dependencies current",
      
      "monitoring": "📊 Monitoring and observability are crucial:\n\n• **Metrics**: Prometheus, Grafana\n• **Logging**: ELK Stack, Fluentd\n• **Tracing**: Jaeger, Zipkin\n• **Alerting**: PagerDuty, Slack integration\n• **Health Checks**: Application and infrastructure\n• **SLIs/SLOs**: Service level indicators and objectives"
    };

    // Find matching response based on keywords
    const userLower = userMessage.toLowerCase();
    for (const [keyword, response] of Object.entries(responses)) {
      if (userLower.includes(keyword)) {
        return response;
      }
    }

    // Default response
    return `I understand you're asking about "${userMessage}". While I can provide general DevOps guidance, I'd recommend:\n\n• Check the official documentation\n• Explore hands-on tutorials\n• Join DevOps communities\n• Practice with real projects\n\nIs there a specific DevOps topic you'd like to learn more about? (Docker, CI/CD, Kubernetes, Terraform, Security, Monitoring)`;
  };

  // Send message
  const sendMessage = async () => {
    if (!inputMessage.trim() || isTyping) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: inputMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const aiMessage = {
        id: Date.now() + 1,
        type: "ai",
        content: getAIResponse(userMessage.content),
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Clear chat
  const clearChat = () => {
    setMessages([]);
  };

  // Copy message
  const copyMessage = (content) => {
    navigator.clipboard.writeText(content);
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const quickPrompts = [
    { icon: FiCode, text: "How to optimize Docker images?", color: "blue" },
    { icon: FiZap, text: "CI/CD best practices", color: "green" },
    { icon: FiBookOpen, text: "Kubernetes for beginners", color: "purple" },
  ];

  return (
    <div className="h-full flex flex-col bg-neutral-900">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-neutral-800/50">
        <div className="flex items-center gap-3">
          <FiCpu className="w-6 h-6 text-blue-400" />
          <div>
            <h2 className="text-2xl font-bold text-white heading">DevOps Assistant</h2>
            <p className="text-neutral-400 body">AI-powered DevOps guidance and support</p>
          </div>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={clearChat}
          className="p-2 rounded-lg hover:bg-neutral-800 transition-colors text-neutral-400 hover:text-white"
          title="Clear Chat"
        >
          <FiTrash2 className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto custom-scrollbar p-6">
        <div className="space-y-4">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-3xl ${message.type === "user" ? "order-2" : ""}`}>
                <div className="flex items-start gap-3">
                  {message.type === "ai" && (
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                      <FiCpu className="w-4 h-4 text-blue-400" />
                    </div>
                  )}
                  
                  <div className={`rounded-xl p-4 ${
                    message.type === "user"
                      ? "bg-blue-500/20 border border-blue-500/30 text-blue-100"
                      : "bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 text-neutral-200"
                  }`}>
                    <div className="prose prose-sm max-w-none">
                      <div className="whitespace-pre-wrap body leading-relaxed">
                        {message.content}
                      </div>
                    </div>
                    
                    {message.type === "ai" && (
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-700/50">
                        <span className="text-xs text-neutral-500 body">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => copyMessage(message.content)}
                          className="p-1 rounded hover:bg-neutral-800 transition-colors text-neutral-400 hover:text-white"
                          title="Copy Message"
                        >
                          <FiCopy className="w-3 h-3" />
                        </motion.button>
                      </div>
                    )}
                  </div>
                  
                  {message.type === "user" && (
                    <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center flex-shrink-0">
                      <FiUser className="w-4 h-4 text-green-400" />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {/* Typing Indicator */}
          <AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex justify-start"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                    <FiCpu className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4">
                    <div className="flex items-center gap-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                      </div>
                      <span className="text-sm text-neutral-400 body">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Prompts */}
      {messages.length <= 1 && (
        <div className="px-6 pb-4">
          <div className="text-sm text-neutral-400 mb-3 body">Try asking about:</div>
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((prompt, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setInputMessage(prompt.text)}
                className={`flex items-center gap-2 px-3 py-2 bg-${prompt.color}-500/20 border border-${prompt.color}-500/30 rounded-lg text-${prompt.color}-400 hover:bg-${prompt.color}-500/30 transition-colors text-sm body`}
              >
                <prompt.icon className="w-3 h-3" />
                {prompt.text}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-6 border-t border-neutral-800/50">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about DevOps..."
              className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 resize-none body transition-all"
              rows={1}
              style={{ minHeight: "44px", maxHeight: "120px" }}
              onInput={(e) => {
                e.target.style.height = "44px";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
            />
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isTyping}
            className="p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiSend className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPanel;
