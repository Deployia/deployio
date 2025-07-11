import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  FiTerminal,
  FiCopy,
  FiTrash2,
} from "react-icons/fi";

const Terminal = ({ selectedRepo }) => {
  const [history, setHistory] = useState([]);
  const [currentCommand, setCurrentCommand] = useState("");
  const [currentPath] = useState("~/deployio-project");
  const terminalRef = useRef(null);
  const inputRef = useRef(null);

  // Sample command responses for DevOps demonstrations
  const commandResponses = {
    ls: `total 24
drwxr-xr-x  4 deployio deployio 4096 Dec 10 10:30 src
drwxr-xr-x  2 deployio deployio 4096 Dec 10 10:25 config
-rw-r--r--  1 deployio deployio 1234 Dec 10 10:20 package.json
-rw-r--r--  1 deployio deployio  789 Dec 10 10:18 Dockerfile
-rw-r--r--  1 deployio deployio  456 Dec 10 10:15 docker-compose.yml
-rw-r--r--  1 deployio deployio  123 Dec 10 10:12 README.md`,
    
    pwd: "/home/deployio/deployio-project",
    whoami: "deployio",
    date: new Date().toLocaleString(),
    
    "npm install": `🔄 Installing dependencies...
📦 npm install completed successfully
✅ Added 142 packages in 4.23s
🔍 Found 0 vulnerabilities`,
    
    "npm start": `🚀 Starting development server...
📡 Server running on http://localhost:3000
✅ Application ready for development`,
    
    "docker build .": `🐳 Building Docker image...
📦 Sending build context to Docker daemon  2.048kB
🔧 Step 1/8 : FROM node:18-alpine
⬇️  Pulling from library/node
✅ Successfully built abc123def456
🏷️  Successfully tagged deployio-project:latest`,
    
    "docker-compose up": `🐳 Starting services with Docker Compose...
📦 Creating network "deployio-project_default"
📦 Creating deployio-project_postgres_1
📦 Creating deployio-project_redis_1
📦 Creating deployio-project_app_1
✅ All services started successfully`,
    
    "git status": `📂 On branch main
🔄 Your branch is up to date with 'origin/main'

📝 Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
        modified:   src/app.js
        modified:   Dockerfile

💡 Use "git add ." to stage all changes`,
    
    "git log --oneline": `abc1234 feat: Add Docker configuration
def5678 fix: Update database connection
ghi9012 docs: Update README with deployment steps
jkl3456 feat: Add health check endpoint`,
    
    "kubectl get pods": `NAME                    READY   STATUS    RESTARTS   AGE
app-deployment-abc123   1/1     Running   0          2m
redis-deployment-def45  1/1     Running   0          2m
postgres-deployment-gh  1/1     Running   0          2m`,
    
    help: `🚀 Deployio Playground Terminal Commands:

📂 File System:
  ls                    - List files and directories
  pwd                   - Show current directory
  cat <file>           - Display file contents

📦 Package Management:
  npm install          - Install dependencies
  npm start            - Start development server
  npm test             - Run tests

🐳 Docker Commands:
  docker build .       - Build Docker image
  docker-compose up    - Start all services
  docker ps            - List running containers

📝 Git Commands:
  git status           - Show repository status
  git log --oneline    - Show commit history
  git add .            - Stage all changes

☸️  Kubernetes:
  kubectl get pods     - List pods
  kubectl get svc      - List services

💡 Type 'help' anytime to see this menu`,
    
    clear: "CLEAR_TERMINAL"
  };

  // Add welcome message on component mount
  useEffect(() => {
    const welcomeMessage = {
      type: "output",
      content: `🚀 Welcome to Deployio Terminal!
📚 Type 'help' to see available commands
🔧 Repository: ${selectedRepo?.name || 'deployio-project'}
`,
      timestamp: new Date().toLocaleTimeString()
    };
    setHistory([welcomeMessage]);
  }, [selectedRepo]);

  // Handle command execution
  const executeCommand = () => {
    if (!currentCommand.trim()) return;

    const commandEntry = {
      type: "command",
      content: currentCommand,
      path: currentPath,
      timestamp: new Date().toLocaleTimeString()
    };

    // Check for special commands
    if (currentCommand.trim() === "clear") {
      setHistory([]);
      setCurrentCommand("");
      return;
    }

    // Get response for command
    const response = commandResponses[currentCommand.trim()] || 
      `❌ Command not found: ${currentCommand}\n💡 Type 'help' to see available commands`;

    const responseEntry = {
      type: "output",
      content: response,
      timestamp: new Date().toLocaleTimeString()
    };

    setHistory(prev => [...prev, commandEntry, responseEntry]);
    setCurrentCommand("");
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      executeCommand();
    }
  };

  // Clear terminal
  const clearTerminal = () => {
    setHistory([]);
  };

  // Copy terminal content
  const copyTerminalContent = () => {
    const content = history
      .map(entry => 
        entry.type === "command" 
          ? `$ ${entry.content}`
          : entry.content
      )
      .join("\n");
    
    navigator.clipboard.writeText(content);
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  // Focus input when clicking terminal
  const focusInput = () => {
    inputRef.current?.focus();
  };

  return (
    <div className="h-full flex flex-col bg-neutral-950">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-neutral-900/50 border-b border-neutral-800/50">
        <div className="flex items-center gap-2">
          <FiTerminal className="w-4 h-4 text-green-400" />
          <span className="text-sm font-medium text-white heading">Terminal</span>
          <span className="text-xs text-neutral-400 body">
            {selectedRepo?.name || 'deployio-project'}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={copyTerminalContent}
            className="p-1.5 rounded hover:bg-neutral-800 transition-colors text-neutral-400 hover:text-white"
            title="Copy Output"
          >
            <FiCopy className="w-3.5 h-3.5" />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={clearTerminal}
            className="p-1.5 rounded hover:bg-neutral-800 transition-colors text-neutral-400 hover:text-white"
            title="Clear Terminal"
          >
            <FiTrash2 className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      </div>

      {/* Terminal Content */}
      <div 
        ref={terminalRef}
        className="flex-1 overflow-auto custom-scrollbar p-4 font-mono text-sm cursor-text"
        onClick={focusInput}
      >
        {/* Command History */}
        {history.map((entry, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="mb-2"
          >
            {entry.type === "command" ? (
              <div className="flex items-center gap-2">
                <span className="text-green-400 body">deployio@playground</span>
                <span className="text-blue-400 body">{entry.path}</span>
                <span className="text-white body">$</span>
                <span className="text-neutral-200 body">{entry.content}</span>
              </div>
            ) : (
              <div className="text-neutral-300 whitespace-pre-wrap body leading-relaxed pl-4">
                {entry.content}
              </div>
            )}
          </motion.div>
        ))}

        {/* Current Command Input */}
        <div className="flex items-center gap-2">
          <span className="text-green-400 body">deployio@playground</span>
          <span className="text-blue-400 body">{currentPath}</span>
          <span className="text-white body">$</span>
          <input
            ref={inputRef}
            type="text"
            value={currentCommand}
            onChange={(e) => setCurrentCommand(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 bg-transparent text-neutral-200 outline-none body font-mono"
            placeholder="Type a command..."
            autoFocus
          />
        </div>
      </div>

      {/* Terminal Footer */}
      <div className="px-4 py-2 bg-neutral-900/50 border-t border-neutral-800/50">
        <div className="flex items-center justify-between text-xs text-neutral-500 body">
          <div className="flex items-center gap-4">
            <span>Press Enter to execute</span>
            <span>Type &apos;help&apos; for commands</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span>Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terminal;
