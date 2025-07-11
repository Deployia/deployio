import { FaCode } from "react-icons/fa";

const GenerationSidebar = () => {
  return (
    <div className="p-4 space-y-4 custom-scrollbar">
      <div className="text-xs text-neutral-400 uppercase tracking-wide font-medium body">
        Generation Templates
      </div>
      <div className="space-y-3">
        <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-white heading mb-3">
            DevOps Templates
          </h4>
          <div className="space-y-2">
            <button className="w-full flex items-center gap-2 px-3 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors text-xs body">
              <FaCode className="w-3 h-3" />
              Dockerfile
            </button>
            <button className="w-full flex items-center gap-2 px-3 py-2 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 hover:bg-green-500/30 transition-colors text-xs body">
              <FaCode className="w-3 h-3" />
              CI/CD Pipeline
            </button>
            <button className="w-full flex items-center gap-2 px-3 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-400 hover:bg-purple-500/30 transition-colors text-xs body">
              <FaCode className="w-3 h-3" />
              Kubernetes Config
            </button>
          </div>
        </div>

        <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-white heading mb-3">
            AI Code Generation
          </h4>
          <div className="space-y-2">
            <button className="w-full flex items-center gap-2 px-3 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-400 hover:bg-yellow-500/30 transition-colors text-xs body">
              <FaCode className="w-3 h-3" />
              Generate Tests
            </button>
            <button className="w-full flex items-center gap-2 px-3 py-2 bg-pink-500/20 border border-pink-500/30 rounded-lg text-pink-400 hover:bg-pink-500/30 transition-colors text-xs body">
              <FaCode className="w-3 h-3" />
              Add Comments
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerationSidebar;
