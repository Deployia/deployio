import { useState, useRef, useEffect } from "react";
import SEO from "@components/SEO";
import { useSelector } from "react-redux";
import ProfileAvatar from "@components/ProfileAvatar";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  FiSend,
  FiTrash2,
  FiCopy,
  FiCode,
  FiZap,
  FiBookOpen,
  FiSettings,
} from "react-icons/fi";
import devopsChatService from "../../services/devopsChatService";

const ChatbotPanel = () => {
  const { user } = useSelector((state) => state.auth);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [llmConnected, setLlmConnected] = useState(false);
  const [copySuccess, setCopySuccess] = useState(null);

  // Check DevOpsChat service connection status
  useEffect(() => {
    setLlmConnected(devopsChatService.isConfigured());
  }, []);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Predefined suggestions for quick interaction
  const suggestions = [
    { text: "How do I optimize Docker images?", icon: FiCode },
    { text: "Set up CI/CD pipeline", icon: FiZap },
    { text: "Kubernetes best practices", icon: FiSettings },
    { text: "Security recommendations", icon: FiZap },
    { text: "Infrastructure as Code guide", icon: FiBookOpen },
  ];

  // Initialize chat with welcome message
  useEffect(() => {
    const welcomeMessage = {
      id: 1,
      type: "ai",
      content: `👋 Hello! I'm **DeployBot**, your intelligent DevOps assistant.

⚠️ **Please Note**: This editor is **read-only** and designed for **educational purposes** to demonstrate DevOps best practices.

I can help you with:
🔧 **Code Analysis & Optimization**
🐛 **Debugging & Troubleshooting** 
📚 **DevOps Best Practices**
🐳 **Docker & Containerization**
🚀 **CI/CD Pipeline Guidance**
☁️ **Infrastructure as Code**
🔒 **Security Recommendations**

Click on a suggestion below or ask me anything about DevOps!`,
      timestamp: new Date().toISOString(),
    };
    setMessages([welcomeMessage]);
  }, []);

  // Enhanced AI responses using LLM service
  const getAIResponse = async (userMessage) => {
    try {
      if (devopsChatService.isConfigured()) {
        const context = {
          activeFile: null,
          repository: "Deployio Playground",
        };
        const response = await devopsChatService.generateResponse(
          userMessage,
          context
        );
        return response;
      } else {
        return devopsChatService.getFallbackResponse(userMessage);
      }
    } catch (error) {
      console.error("AI Response Error:", error);
      return devopsChatService.getFallbackResponse(userMessage);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestionText) => {
    setInputMessage(suggestionText);
    setShowSuggestions(false);
    inputRef.current?.focus();
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

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputMessage.trim();
    setInputMessage("");
    setIsTyping(true);
    setShowSuggestions(false);

    try {
      // Get AI response using LLM service
      const aiResponse = await getAIResponse(currentInput);

      let aiMessage;
      if (typeof aiResponse === "string") {
        aiMessage = {
          id: Date.now() + 1,
          type: "ai",
          content: aiResponse,
          timestamp: new Date().toISOString(),
        };
      } else {
        aiMessage = {
          id: Date.now() + 1,
          type: "ai",
          content: aiResponse.message || "",
          timestamp: aiResponse.timestamp || new Date().toISOString(),
          suggestions: aiResponse.suggestions || [],
        };
      }
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Failed to get AI response:", error);
      const errorMessage = {
        id: Date.now() + 1,
        type: "ai",
        content:
          "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Clear chat
  const clearChat = () => {
    setMessages([]);
    setShowSuggestions(true);
  };

  // Copy message
  const copyMessage = (content, messageId) => {
    navigator.clipboard.writeText(content);
    setCopySuccess(messageId);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  return (
    <>
      <SEO page="playground-chatbot" />
      <div className="h-full flex flex-col bg-neutral-900">
        {/* Header */}
        <div className="p-6 border-b border-neutral-800/50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <FiZap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white heading">
                  DeployBot
                </h2>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-neutral-400 body">
                    Your DevOps AI Assistant
                  </p>
                  <div className="flex items-center gap-1">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        llmConnected ? "bg-green-500" : "bg-yellow-500"
                      }`}
                    ></div>
                    <span className="text-xs text-neutral-500">
                      {llmConnected ? "AI Active" : "Demo Mode"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={clearChat}
                className="p-2 rounded-lg hover:bg-neutral-800 transition-colors text-neutral-400 hover:text-white"
                title="Clear Chat"
              >
                <FiTrash2 className="w-4 h-4" />
              </motion.button>
              <ProfileAvatar user={user} />
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div
          className="flex-1 overflow-auto"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "#525252 #262626",
          }}
        >
          <div className="p-6 space-y-6">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 ${
                  message.type === "user" ? "justify-end" : ""
                }`}
              >
                {message.type === "ai" && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <FiZap className="w-4 h-4 text-white" />
                  </div>
                )}

                <div
                  className={`flex flex-col ${
                    message.type === "user" ? "items-end" : ""
                  } max-w-2xl`}
                >
                  <div
                    className={`rounded-2xl px-5 py-4 ${
                      message.type === "user"
                        ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white max-w-md ml-auto shadow-lg"
                        : "bg-neutral-800/80 border border-neutral-700/30 text-neutral-100 max-w-3xl backdrop-blur-sm"
                    }`}
                  >
                    {message.type === "user" ? (
                      <div className="text-white font-medium">
                        {message.content}
                      </div>
                    ) : (
                      <div className="prose prose-sm prose-invert max-w-none">
                        <ReactMarkdown
                          components={{
                            code: ({
                              node,
                              inline,
                              className,
                              children,
                              ...props
                            }) => {
                              const match = /language-(\w+)/.exec(
                                className || ""
                              );
                              return !inline && match ? (
                                <pre
                                  className="bg-neutral-900/80 border border-neutral-600/30 rounded-lg p-4 my-3 overflow-x-auto"
                                  style={{
                                    scrollbarWidth: "thin",
                                    scrollbarColor: "#525252 #262626",
                                  }}
                                >
                                  <code className={className} {...props}>
                                    {children}
                                  </code>
                                </pre>
                              ) : (
                                <code
                                  className="bg-neutral-800/70 px-2 py-1 rounded text-blue-300 text-sm font-mono"
                                  {...props}
                                >
                                  {children}
                                </code>
                              );
                            },
                            h1: ({ children }) => (
                              <h1 className="text-xl font-bold text-blue-300 mb-3">
                                {children}
                              </h1>
                            ),
                            h2: ({ children }) => (
                              <h2 className="text-lg font-semibold text-blue-200 mb-2">
                                {children}
                              </h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className="text-md font-medium text-blue-100 mb-2">
                                {children}
                              </h3>
                            ),
                            strong: ({ children }) => (
                              <strong className="font-semibold text-blue-200">
                                {children}
                              </strong>
                            ),
                            em: ({ children }) => (
                              <em className="italic text-neutral-300">
                                {children}
                              </em>
                            ),
                            ul: ({ children }) => (
                              <ul className="list-disc ml-4 mb-3 space-y-1">
                                {children}
                              </ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="list-decimal ml-4 mb-3 space-y-1">
                                {children}
                              </ol>
                            ),
                            li: ({ children }) => (
                              <li className="text-neutral-200">{children}</li>
                            ),
                            p: ({ children }) => (
                              <p className="text-neutral-200 leading-relaxed mb-2">
                                {children}
                              </p>
                            ),
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-4 border-neutral-500/50 pl-4 my-3 text-neutral-300 italic">
                                {children}
                              </blockquote>
                            ),
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-neutral-500">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                    {message.type === "ai" && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => copyMessage(message.content, message.id)}
                        className="p-1 rounded hover:bg-neutral-800 transition-colors text-neutral-500 hover:text-white"
                        title={
                          copySuccess === message.id
                            ? "Copied!"
                            : "Copy Message"
                        }
                      >
                        {copySuccess === message.id ? (
                          <FiCode className="w-3 h-3 text-green-400" />
                        ) : (
                          <FiCopy className="w-3 h-3" />
                        )}
                      </motion.button>
                    )}
                  </div>
                </div>

                {message.type === "user" && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <img
                      src={user.profileImage}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </motion.div>
            ))}

            {/* Typing Indicator */}
            <AnimatePresence>
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex gap-4"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <FiZap className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-neutral-800/50 border border-neutral-700/50 rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <div
                        className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <div
                        className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <div
                        className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Suggestions */}
        <AnimatePresence>
          {showSuggestions && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="px-6 pb-4"
            >
              <div className="text-sm text-neutral-400 mb-3">
                Quick suggestions:
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, index) => {
                  const Icon = suggestion.icon;
                  return (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSuggestionClick(suggestion.text)}
                      className="flex items-center gap-2 px-3 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-sm text-neutral-300 hover:bg-neutral-700/50 hover:text-white transition-colors"
                    >
                      <Icon className="w-3 h-3" />
                      {suggestion.text}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <div className="border-t border-neutral-800/50 bg-neutral-900/50 backdrop-blur-sm flex-shrink-0">
          <div className="p-4">
            <div className="relative">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => {
                  setInputMessage(e.target.value);
                  // Auto-resize textarea
                  e.target.style.height = "auto";
                  e.target.style.height =
                    Math.min(e.target.scrollHeight, 120) + "px";
                }}
                onKeyPress={handleKeyPress}
                placeholder="Ask DeployBot about DevOps, containers, CI/CD, security..."
                className="w-full bg-neutral-800/90 border border-neutral-600/30 rounded-xl px-4 py-3 pr-12 text-white placeholder-neutral-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm leading-relaxed shadow-lg backdrop-blur-sm"
                rows={1}
                style={{ minHeight: "48px", maxHeight: "120px" }}
              />

              {/* Submit button inside input */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isTyping}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-neutral-700 disabled:to-neutral-700 disabled:text-neutral-400 rounded-lg text-white transition-all shadow-md disabled:shadow-none"
              >
                {isTyping ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <FiSend className="w-4 h-4" />
                )}
              </motion.button>

              {/* Suggestions toggle for empty input */}
              {!inputMessage && !showSuggestions && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowSuggestions(true)}
                  className="absolute right-14 top-1/2 transform -translate-y-1/2 text-neutral-500 hover:text-blue-400 transition-colors"
                  title="Show Suggestions"
                >
                  <FiZap className="w-4 h-4" />
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatbotPanel;
