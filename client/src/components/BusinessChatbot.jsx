import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
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
      (async () => {
        const welcomeMessage =
          await businessChatService.initializeConversation();
        setMessages([
          {
            message: welcomeMessage.message,
            isBot: true,
            timestamp: welcomeMessage.timestamp || new Date(),
            suggestions: welcomeMessage.suggestions || [],
          },
        ]);
      })();
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

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
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

  // No longer needed: formatMessage. Use react-markdown instead.

  return (
    <>
      {/* Floating Chat Button - Only show when closed */}
      {!isOpen && (
        <motion.button
          onClick={toggleChat}
          className="fixed bottom-4 right-2 z-50 w-12 h-12 sm:bottom-6 sm:right-6 sm:w-16 sm:h-16 rounded-full shadow-2xl transition-all duration-300 bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 hover:from-blue-700 hover:via-purple-700 hover:to-green-700"
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
            <FaComments className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
          </motion.div>

          {/* Notification dot for new users */}
          <motion.div
            className="absolute -top-0.5 -right-0.5 w-4 h-4 sm:-top-1 sm:-right-1 sm:w-5 sm:h-5 bg-green-400 rounded-full border-2 border-white flex items-center justify-center"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse" />
          </motion.div>
        </motion.button>
      )}

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay - covers all screens, adds blur and closes on click */}
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 bg-black/60 backdrop-blur-md"
              style={{
                WebkitBackdropFilter: "blur(8px)",
                backdropFilter: "blur(8px)",
              }}
              onClick={toggleChat}
            />

            {/* Chat Window */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="fixed bottom-2 left-1 right-1 z-40 h-[80vh] max-h-[95vh] bg-neutral-900/95 backdrop-blur-xl border border-neutral-700/50 rounded-xl shadow-xl overflow-hidden flex flex-col
                         sm:bottom-4 sm:left-4 sm:right-4 sm:h-[85vh] sm:max-h-[600px]
                         md:bottom-4 md:right-4 md:left-auto md:w-[360px] md:h-[70vh] md:max-h-[600px]
                         lg:w-[400px] lg:h-[600px] lg:bottom-6 lg:right-6"
            >
              {/* Header */}
              <div className="flex-none bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 p-3 md:p-2 text-white relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <FaRobot className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base md:text-lg heading">
                        DeployBot
                      </h3>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        <p className="text-xs md:text-sm text-white/90 body">
                          AI Assistant
                        </p>
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
              <div className="flex-1 min-h-0 overflow-y-auto p-3 md:p-2 space-y-2 md:space-y-1 bg-neutral-950/60 custom-scrollbar">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      msg.isBot ? "justify-start" : "justify-end"
                    }`}
                  >
                    <div
                      className={`flex items-end gap-2 max-w-[95%] md:max-w-[92%] ${
                        msg.isBot ? "" : "flex-row-reverse"
                      }`}
                    >
                      {/* Avatar */}
                      <div
                        className={`w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center flex-shrink-0 shadow ${
                          msg.isBot
                            ? "bg-gradient-to-r from-blue-500 to-purple-500"
                            : "bg-gradient-to-r from-green-500 to-blue-500"
                        }`}
                      >
                        {msg.isBot ? (
                          <span className="flex items-center justify-center w-full h-full">
                            <FaRobot className="w-3 h-3 md:w-3.5 md:h-3.5 text-white" />
                          </span>
                        ) : (
                          <span className="flex items-center justify-center w-full h-full">
                            <FaUser className="w-3 h-3 md:w-3.5 md:h-3.5 text-white" />
                          </span>
                        )}
                      </div>

                      {/* Message Bubble */}
                      <div
                        className={`px-3 py-2 md:px-2.5 md:py-1.5 rounded-xl shadow ${
                          msg.isBot
                            ? "bg-neutral-800/90 backdrop-blur-sm text-gray-100 border border-neutral-700/50"
                            : "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                        }`}
                        style={{
                          fontSize: "0.9rem",
                          lineHeight: 1.4,
                          minWidth: 0,
                          maxWidth: "100%",
                          wordBreak: "break-word",
                        }}
                      >
                        <div
                          className="body"
                          style={{ wordBreak: "break-word" }}
                        >
                          <ReactMarkdown
                            components={{
                              strong: ({ node, ...props }) => (
                                <strong
                                  className="text-white font-semibold"
                                  {...props}
                                />
                              ),
                              em: ({ node, ...props }) => (
                                <em className="text-blue-300" {...props} />
                              ),
                              code: ({ node, ...props }) => (
                                <code
                                  className="bg-neutral-700/80 px-1.5 py-0.5 md:px-2 md:py-0.5 rounded text-xs font-mono text-green-300 border border-neutral-600/50"
                                  {...props}
                                />
                              ),
                              li: ({ node, ...props }) => (
                                <li
                                  className="list-disc ml-4 text-blue-400"
                                  {...props}
                                />
                              ),
                            }}
                          >
                            {msg.message}
                          </ReactMarkdown>
                        </div>

                        {/* Suggestions */}
                        {msg.suggestions && msg.suggestions.length > 0 && (
                          <div className="mt-2 md:mt-1 space-y-1 md:space-y-0.5">
                            {msg.suggestions.map((suggestion, idx) => (
                              <button
                                key={idx}
                                onClick={() =>
                                  handleSuggestionClick(suggestion)
                                }
                                className="block w-full text-left px-2.5 py-1.5 md:px-2 md:py-1 text-xs bg-neutral-700/80 hover:bg-neutral-600/80 rounded transition-all duration-200 text-gray-300 hover:text-white border border-neutral-600/50 hover:border-neutral-500/50 backdrop-blur-sm"
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
                    <div className="flex items-end gap-2 max-w-[95%] md:max-w-[92%]">
                      <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow">
                        <span className="flex items-center justify-center w-full h-full">
                          <FaRobot className="w-3 h-3 md:w-3.5 md:h-3.5 text-white" />
                        </span>
                      </div>
                      <div className="px-3 py-2 bg-neutral-800/90 backdrop-blur-sm rounded-xl border border-neutral-700/50">
                        <div className="flex items-center gap-2 text-gray-300">
                          <FaSpinner className="w-3.5 h-3.5 animate-spin" />
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

              {/* Input Area */}
              <div className="flex-none p-3 md:p-2 border-t border-neutral-700/50 bg-neutral-900/80 backdrop-blur-xl">
                <div className="flex items-end space-x-2">
                  <div className="flex-1">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask me anything about Deployia..."
                      className="w-full px-3 py-3 md:px-4 md:py-2.5 bg-neutral-800/80 backdrop-blur-sm border border-neutral-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all duration-200 text-sm md:text-sm body"
                      disabled={isLoading}
                    />
                  </div>
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputMessage.trim() || isLoading}
                    className="w-11 h-11 md:w-10 md:h-10 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 rounded-xl flex items-center justify-center transition-all duration-200 disabled:cursor-not-allowed shadow-lg hover:shadow-xl disabled:shadow-none"
                  >
                    <FaPaperPlane className="w-4 h-4 text-white" />
                  </button>
                </div>

                {/* Quick actions */}
                <div className="mt-3 md:mt-2 flex flex-wrap gap-2 md:gap-1.5">
                  {["Pricing", "Demo", "Features"].map((action) => (
                    <button
                      key={action}
                      onClick={() =>
                        handleSendMessage(
                          `Tell me about ${action.toLowerCase()}`
                        )
                      }
                      className="px-3 py-2 md:px-3 md:py-1.5 text-xs bg-neutral-800/60 hover:bg-neutral-700/80 text-gray-300 hover:text-white rounded-lg transition-all duration-200 border border-neutral-700/50 hover:border-neutral-600/50 backdrop-blur-sm body"
                      disabled={isLoading}
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default BusinessChatbot;
