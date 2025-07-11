import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaComments,
  FaTimes,
  FaPaperPlane,
  FaRobot,
  FaUser,
  FaSpinner,
} from "react-icons/fa";
import businessChatService from "@services/businessChatService";

const BusinessChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize chatbot with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage = businessChatService.initializeConversation();
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleSendMessage = async (messageText = null) => {
    const messageToSend = messageText || inputMessage.trim();
    if (!messageToSend) return;

    // Add user message
    const userMessage = {
      message: messageToSend,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Get bot response
      const botResponse = await businessChatService.generateBusinessResponse(
        messageToSend
      );
      setMessages((prev) => [...prev, botResponse]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          message:
            "I apologize, but I'm having trouble responding right now. Please try again in a moment, or contact our support team directly.",
          isBot: true,
          timestamp: new Date(),
          suggestions: ["Contact support", "Try again later"],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    handleSendMessage(suggestion);
  };

  const formatMessage = (message) => {
    // Enhanced markdown-like formatting for better readability
    return message
      .replace(
        /\*\*(.*?)\*\*/g,
        '<strong class="text-white font-semibold">$1</strong>'
      )
      .replace(/\*(.*?)\*/g, '<em class="text-blue-300">$1</em>')
      .replace(
        /`(.*?)`/g,
        '<code class="bg-neutral-700/80 px-2 py-0.5 rounded text-xs font-mono text-green-300 border border-neutral-600/50">$1</code>'
      )
      .replace(/•\s/g, '<span class="text-blue-400">•</span> ')
      .replace(/\n\n/g, "<br/><br/>")
      .replace(/\n/g, "<br/>");
  };

  return (
    <>
      {/* Floating Chat Button - Only show when closed */}
      {!isOpen && (
        <motion.button
          onClick={toggleChat}
          className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full shadow-2xl transition-all duration-300 bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 hover:from-blue-700 hover:via-purple-700 hover:to-green-700"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          <motion.div
            initial={{ rotate: 0, opacity: 1 }}
            animate={{ rotate: 0, opacity: 1 }}
            className="flex items-center justify-center w-full h-full"
          >
            <FaComments className="w-7 h-7 text-white" />
          </motion.div>

          {/* Notification dot for new users */}
          <motion.div
            className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white flex items-center justify-center"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          </motion.div>
        </motion.button>
      )}

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-6 right-6 z-40 w-[420px] h-[600px] bg-neutral-900/95 backdrop-blur-xl border border-neutral-700/50 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 p-4 text-white relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <FaRobot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg heading">DeployBot</h3>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <p className="text-sm text-white/90 body">AI Assistant</p>
                    </div>
                  </div>
                </div>

                {/* Close button in header */}
                <button
                  onClick={toggleChat}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors backdrop-blur-sm"
                >
                  <FaTimes className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 h-[420px] overflow-y-auto p-4 space-y-4 bg-neutral-950/50 custom-scrollbar">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${
                    msg.isBot ? "justify-start" : "justify-end"
                  }`}
                >
                  <div
                    className={`flex items-start space-x-3 max-w-[88%] ${
                      msg.isBot ? "" : "flex-row-reverse space-x-reverse"
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${
                        msg.isBot
                          ? "bg-gradient-to-r from-blue-500 to-purple-500"
                          : "bg-gradient-to-r from-green-500 to-blue-500"
                      }`}
                    >
                      {msg.isBot ? (
                        <FaRobot className="w-4 h-4 text-white" />
                      ) : (
                        <FaUser className="w-4 h-4 text-white" />
                      )}
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`px-4 py-3 rounded-2xl shadow-lg ${
                        msg.isBot
                          ? "bg-neutral-800/80 backdrop-blur-sm text-gray-100 border border-neutral-700/50"
                          : "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                      }`}
                    >
                      <div
                        className="text-sm leading-relaxed body"
                        dangerouslySetInnerHTML={{
                          __html: formatMessage(msg.message),
                        }}
                      />

                      {/* Suggestions */}
                      {msg.suggestions && msg.suggestions.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {msg.suggestions.map((suggestion, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="block w-full text-left px-3 py-2 text-xs bg-neutral-700/80 hover:bg-neutral-600/80 rounded-lg transition-all duration-200 text-gray-300 hover:text-white border border-neutral-600/50 hover:border-neutral-500/50 backdrop-blur-sm"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-3 max-w-[88%]">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                      <FaRobot className="w-4 h-4 text-white" />
                    </div>
                    <div className="px-4 py-3 bg-neutral-800/80 backdrop-blur-sm rounded-2xl border border-neutral-700/50">
                      <div className="flex items-center space-x-2 text-gray-300">
                        <FaSpinner className="w-4 h-4 animate-spin" />
                        <span className="text-sm body">
                          DeployBot is thinking...
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-neutral-700/50 bg-neutral-900/80 backdrop-blur-xl">
              <div className="flex items-end space-x-2">
                <div className="flex-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything about Deployia..."
                    className="w-full px-4 py-2.5 bg-neutral-800/80 backdrop-blur-sm border border-neutral-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all duration-200 text-sm body"
                    disabled={isLoading}
                  />
                </div>
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || isLoading}
                  className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 rounded-xl flex items-center justify-center transition-all duration-200 disabled:cursor-not-allowed shadow-lg hover:shadow-xl disabled:shadow-none"
                >
                  <FaPaperPlane className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Quick actions */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {["Pricing", "Demo", "Features"].map((action) => (
                  <button
                    key={action}
                    onClick={() =>
                      handleSendMessage(`Tell me about ${action.toLowerCase()}`)
                    }
                    className="px-3 py-1.5 text-xs bg-neutral-800/60 hover:bg-neutral-700/80 text-gray-300 hover:text-white rounded-lg transition-all duration-200 border border-neutral-700/50 hover:border-neutral-600/50 backdrop-blur-sm body"
                    disabled={isLoading}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default BusinessChatbot;
