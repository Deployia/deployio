import { FaComments, FaBrain } from "react-icons/fa";

const ChatbotSidebar = () => {
  return (
    <div className="p-4 space-y-4 custom-scrollbar">
      <div className="text-xs text-neutral-400 uppercase tracking-wide font-medium body">
        Chat History
      </div>
      <div className="space-y-3">
        <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-white heading mb-3">
            Recent Conversations
          </h4>
          <div className="space-y-2 text-xs text-neutral-400 body">
            <div className="p-2 bg-neutral-800/50 rounded cursor-pointer hover:bg-neutral-700/50 transition-colors">
              How to optimize Docker builds?
            </div>
            <div className="p-2 bg-neutral-800/50 rounded cursor-pointer hover:bg-neutral-700/50 transition-colors">
              Setting up GitHub Actions
            </div>
            <div className="p-2 bg-neutral-800/50 rounded cursor-pointer hover:bg-neutral-700/50 transition-colors">
              Kubernetes deployment strategies
            </div>
          </div>
        </div>

        <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-white heading mb-3">
            Quick Actions
          </h4>
          <div className="space-y-2">
            <button className="w-full flex items-center gap-2 px-3 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors text-xs body">
              <FaComments className="w-3 h-3" />
              Clear History
            </button>
            <button className="w-full flex items-center gap-2 px-3 py-2 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 hover:bg-green-500/30 transition-colors text-xs body">
              <FaBrain className="w-3 h-3" />
              Suggest Topics
            </button>
          </div>
        </div>

        <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-white heading mb-3">
            Context
          </h4>
          <div className="text-xs text-neutral-400 body">
            <div className="mb-2">Current repo: MERN Template</div>
            <div className="mb-2">Files in context: 3</div>
            <div>Last analysis: 2 min ago</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotSidebar;
