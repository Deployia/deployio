import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { FiTerminal, FiTrash2, FiBook } from "react-icons/fi";

const Terminal = ({ selectedRepo, devOpsMode = true }) => {
  const [history, setHistory] = useState([]);
  const [currentCommand, setCurrentCommand] = useState("");
  const terminalRef = useRef(null);

  // DevOps command responses
  const commandResponses = {
    ls: `total 48
drwxr-xr-x  6 deployio deployio 4096 Jul 11 15:30 client/
drwxr-xr-x  4 deployio deployio 4096 Jul 11 15:25 server/
drwxr-xr-x  3 deployio deployio 4096 Jul 11 15:20 docs/
-rw-r--r--  1 deployio deployio 2156 Jul 11 15:18 package.json
-rw-r--r--  1 deployio deployio 1024 Jul 11 15:15 Dockerfile
-rw-r--r--  1 deployio deployio  687 Jul 11 15:12 docker-compose.yml
-rw-r--r--  1 deployio deployio  342 Jul 11 15:10 .github/workflows/ci.yml
-rw-r--r--  1 deployio deployio 1567 Jul 11 15:08 README.md`,

    pwd: "/workspace/mern-project",

    "npm install": `Installing dependencies for MERN stack...
Installing React dependencies...
Installing Express.js dependencies...
Installing MongoDB driver...
Successfully installed 234 packages in 8.2s
Audit complete: found 0 vulnerabilities`,

    "docker build .": `Building containerized MERN application...
Successfully built mern-app:latest
Tagged as ${selectedRepo?.name || "mern-app"}:latest`,

    "git status": `On branch main
Your branch is up to date with 'origin/main'
Repository: ${selectedRepo?.name || "mern-project"}
Working tree clean`,

    help: `Deployio Playground - DevOps Terminal

File System:
  ls          - List files
  pwd         - Current directory

Development:
  npm install - Install dependencies
  npm start   - Start development
  npm build   - Build for production

Docker:
  docker build .    - Build container
  docker-compose up - Start services

Git:
  git status - Repository status

Type any command to see DevOps workflows!`,

    "": "Type 'help' to see available commands",
  };

  // Welcome message
  useEffect(() => {
    if (devOpsMode) {
      setHistory([
        {
          type: "system",
          content: `Welcome to Deployio DevOps Terminal!
Exploring: ${selectedRepo?.name || "MERN Stack Project"}
Type 'help' for available commands`,
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  }, [selectedRepo, devOpsMode]);

  const executeCommand = (command) => {
    const trimmedCommand = command.trim().toLowerCase();
    const response =
      commandResponses[trimmedCommand] ||
      `Command '${command}' not recognized. Type 'help' for available commands.`;

    setHistory((prev) => [
      ...prev,
      {
        type: "command",
        content: command,
        timestamp: new Date().toISOString(),
      },
      {
        type: "response",
        content: response,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (currentCommand.trim()) {
      executeCommand(currentCommand);
      setCurrentCommand("");
    }
  };

  const clearTerminal = () => setHistory([]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  return (
    <div className="h-full flex flex-col bg-neutral-900 text-white">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-2 md:px-4 py-1.5 md:py-2 border-b border-neutral-800 bg-neutral-900/50">
        <div className="flex items-center gap-1.5 md:gap-2">
          <FiTerminal className="w-3 h-3 md:w-4 md:h-4 text-green-400" />
          <span className="text-xs md:text-sm font-medium text-white">
            DevOps Terminal
          </span>
          <span className="px-1.5 py-0.5 md:px-2 bg-orange-500/20 border border-orange-500/30 rounded text-xs text-orange-400 hidden md:inline">
            Coming Soon
          </span>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => executeCommand("help")}
            className="p-1 md:p-1.5 rounded hover:bg-neutral-800 transition-colors text-neutral-400 hover:text-white"
            title="Show Help"
          >
            <FiBook className="w-3 h-3 md:w-3.5 md:h-3.5" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={clearTerminal}
            className="p-1 md:p-1.5 rounded hover:bg-neutral-800 transition-colors text-neutral-400 hover:text-white"
            title="Clear Terminal"
          >
            <FiTrash2 className="w-3 h-3 md:w-3.5 md:h-3.5" />
          </motion.button>
        </div>
      </div>

      {/* Terminal Content */}
      <div
        ref={terminalRef}
        className="flex-1 overflow-auto p-2 md:p-4 font-mono text-xs md:text-sm bg-black/20"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#525252 #262626",
        }}
      >
        <div className="space-y-1">
          {history.map((entry, index) => (
            <div key={index} className="break-words">
              {entry.type === "command" && (
                <div className="flex items-start gap-1 md:gap-2">
                  <span className="text-green-400 font-bold select-none text-xs md:text-sm">
                    deployio@playground:~/project$
                  </span>
                  <span className="text-white text-xs md:text-sm">
                    {entry.content}
                  </span>
                </div>
              )}
              {entry.type === "response" && (
                <div className="text-neutral-300 whitespace-pre-wrap text-xs md:text-sm">
                  {entry.content}
                </div>
              )}
              {entry.type === "system" && (
                <div className="text-yellow-400 whitespace-pre-wrap border-l-2 border-yellow-400/30 pl-2 md:pl-4 text-xs md:text-sm">
                  {entry.content}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Terminal Input - Git Bash Style */}
      <div className="border-t border-neutral-800 bg-black/30">
        <form onSubmit={handleSubmit} className="flex items-center p-2 md:p-3">
          <span className="text-green-400 font-bold font-mono text-xs md:text-sm select-none mr-1 md:mr-2 hidden sm:inline">
            deployio@playground:~/project$
          </span>
          <span className="text-green-400 font-bold font-mono text-xs select-none mr-1 sm:hidden">
            $
          </span>
          <input
            type="text"
            value={currentCommand}
            onChange={(e) => setCurrentCommand(e.target.value)}
            className="flex-1 bg-transparent text-white font-mono text-xs md:text-sm outline-none placeholder-neutral-500 caret-white"
            placeholder="Type a DevOps command... (try 'help')"
            autoComplete="off"
            autoFocus
          />
        </form>
      </div>
    </div>
  );
};

export default Terminal;
