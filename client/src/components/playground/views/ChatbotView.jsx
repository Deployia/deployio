import { useState } from "react";
import ChatbotPanel from "../ChatbotPanel";
import { ChatbotSidebar } from "../sidebars";

const ChatbotView = ({ selectedRepo }) => {
  // Chatbot-specific state
  const [workspace, setWorkspace] = useState({
    chatHistory: [],
    activeConversation: null,
    context: {
      repository: selectedRepo,
      files: [],
      lastAnalysis: null,
    },
    settings: {
      model: "gpt-4",
      temperature: 0.7,
      maxTokens: 2048,
    },
  });

  // Get sidebar content
  const getSidebarContent = () => ({
    title: "Chat Context",
    content: <ChatbotSidebar workspace={workspace} />,
  });

  return {
    workspace,
    setWorkspace,
    getSidebarContent,
    renderContent: () => (
      <div className="h-full overflow-auto">
        <ChatbotPanel
          workspace={workspace}
          setWorkspace={setWorkspace}
          selectedRepo={selectedRepo}
        />
      </div>
    ),
  };
};

export default ChatbotView;
