import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  FiTerminal,
  FiMaximize2,
  FiMinimize2,
  FiSettings,
  FiCopy,
  FiTrash2,
} from "react-icons/fi";

const Terminal = ({ workspace: _workspace, onResize }) => {
  const [history, setHistory] = useState([]);
  const [currentCommand, setCurrentCommand] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPath, setCurrentPath] = useState("/workspace");
  const terminalRef = useRef(null);
  const inputRef = useRef(null);

  // Sample command history and responses
  const commandResponses = {
    ls: `total 12
drwxr-xr-x  3 user user 4096 Dec 10 10:30 src
drwxr-xr-x  2 user user 4096 Dec 10 10:25 docker
-rw-r--r--  1 user user 1234 Dec 10 10:20 package.json
-rw-r--r--  1 user user  567 Dec 10 10:18 README.md
-rw-r--r--  1 user user  123 Dec 10 10:15 .gitignore`,
    pwd: "/workspace/playground-project",
    whoami: "deployio-user",
    date: new Date().toString(),
    "npm install": `npm WARN deprecated package@1.0.0: This package is deprecated
added 142 packages from 98 contributors and audited 142 packages in 4.231s
found 0 vulnerabilities`,
    "docker build .": `Sending build context to Docker daemon  2.048kB
Step 1/8 : FROM node:18-alpine
 ---> b87cb2842d3a
Step 2/8 : WORKDIR /app
 ---> Using cache
 ---> 123456789abc
Successfully built 123456789abc
Successfully tagged playground-project:latest`,
    "git status": `On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
        modified:   src/app.js

no changes added to commit (use "git add ." or "git commit -a")`,
    help: `Available commands:
ls, pwd, whoami, date, clear, help
npm install, npm start, npm test
docker build, docker run, docker ps
git status, git add, git commit, git push
kubectl get pods, kubectl apply
terraform plan, terraform apply`,
  };

  useEffect(() => {
    // Add welcome message
    setHistory([
      {
        id: 1,
        type: "system",
        content: "Welcome to DeployIO Playground Terminal",
        timestamp: new Date(),
      },
      {
        id: 2,
        type: "system",
        content: 'Type "help" to see available commands',
        timestamp: new Date(),
      },
    ]);
  }, []);

  // Auto-scroll to bottom when history updates
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  // Focus input when terminal is clicked
  useEffect(() => {
    const handleClick = () => {
      inputRef.current?.focus();
    };

    const terminal = terminalRef.current;
    if (terminal) {
      terminal.addEventListener("click", handleClick);
      return () => terminal.removeEventListener("click", handleClick);
    }
  }, []);

  const executeCommand = (command) => {
    const trimmedCommand = command.trim().toLowerCase();

    // Add command to history
    const commandEntry = {
      id: Date.now(),
      type: "command",
      content: `${currentPath}$ ${command}`,
      timestamp: new Date(),
    };

    let response = "";

    if (trimmedCommand === "clear") {
      setHistory([]);
      setCurrentCommand("");
      return;
    }

    if (trimmedCommand.startsWith("cd ")) {
      const newPath = trimmedCommand.substring(3);
      if (newPath === "..") {
        setCurrentPath("/workspace");
      } else {
        setCurrentPath(`/workspace/${newPath}`);
      }
      response = "";
    } else if (commandResponses[trimmedCommand]) {
      response = commandResponses[trimmedCommand];
    } else if (trimmedCommand === "") {
      response = "";
    } else {
      response = `bash: ${command}: command not found`;
    }

    const responseEntry = response
      ? {
          id: Date.now() + 1,
          type: "response",
          content: response,
          timestamp: new Date(),
        }
      : null;

    setHistory((prev) => [
      ...prev,
      commandEntry,
      ...(responseEntry ? [responseEntry] : []),
    ]);
    setCurrentCommand("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      executeCommand(currentCommand);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      // Get last command from history
      const lastCommand = history
        .filter((entry) => entry.type === "command")
        .pop();
      if (lastCommand) {
        const command = lastCommand.content.split("$ ")[1];
        setCurrentCommand(command || "");
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      // Simple autocomplete
      const suggestions = Object.keys(commandResponses).filter((cmd) =>
        cmd.startsWith(currentCommand)
      );
      if (suggestions.length === 1) {
        setCurrentCommand(suggestions[0]);
      }
    }
  };

  const clearTerminal = () => {
    setHistory([]);
  };

  const copyTerminalContent = () => {
    const content = history.map((entry) => entry.content).join("\n");
    navigator.clipboard.writeText(content);
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    onResize(isExpanded ? 300 : 600);
  };

  return (
    <div className="h-full flex flex-col bg-black/90 backdrop-blur-sm">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-neutral-900/80 border-b border-neutral-800/50">
        <div className="flex items-center gap-3">
          <FiTerminal className="w-4 h-4 text-green-400" />
          <span className="text-sm font-medium text-white">Terminal</span>
          <span className="text-xs text-gray-400">{currentPath}</span>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={copyTerminalContent}
            className="p-1.5 rounded-md hover:bg-neutral-800/50 text-gray-400 hover:text-white transition-colors"
            title="Copy terminal content"
          >
            <FiCopy className="w-3 h-3" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={clearTerminal}
            className="p-1.5 rounded-md hover:bg-neutral-800/50 text-gray-400 hover:text-red-400 transition-colors"
            title="Clear terminal"
          >
            <FiTrash2 className="w-3 h-3" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleExpanded}
            className="p-1.5 rounded-md hover:bg-neutral-800/50 text-gray-400 hover:text-white transition-colors"
            title={isExpanded ? "Minimize" : "Maximize"}
          >
            {isExpanded ? (
              <FiMinimize2 className="w-3 h-3" />
            ) : (
              <FiMaximize2 className="w-3 h-3" />
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-1.5 rounded-md hover:bg-neutral-800/50 text-gray-400 hover:text-white transition-colors"
            title="Terminal settings"
          >
            <FiSettings className="w-3 h-3" />
          </motion.button>
        </div>
      </div>

      {/* Terminal Content */}
      <div
        ref={terminalRef}
        className="flex-1 p-4 overflow-auto font-mono text-sm text-green-400 cursor-text"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#374151 transparent",
        }}
      >
        {/* History */}
        {history.map((entry) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-1 ${
              entry.type === "command"
                ? "text-white"
                : entry.type === "system"
                ? "text-blue-400"
                : "text-gray-300"
            }`}
          >
            <pre className="whitespace-pre-wrap break-words font-mono">
              {entry.content}
            </pre>
          </motion.div>
        ))}

        {/* Current Input Line */}
        <div className="flex items-center">
          <span className="text-green-400 mr-2">{currentPath}$</span>
          <input
            ref={inputRef}
            type="text"
            value={currentCommand}
            onChange={(e) => setCurrentCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-white outline-none font-mono"
            placeholder="Type a command..."
            autoFocus
          />
          <span className="w-2 h-4 bg-green-400 ml-1 animate-pulse"></span>
        </div>
      </div>

      {/* Terminal Status */}
      <div className="px-4 py-1 bg-neutral-900/60 border-t border-neutral-800/50 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-4">
          <span>Shell: bash</span>
          <span>User: deployio-user</span>
          <span className="text-green-400">● Connected</span>
        </div>
        <div className="flex items-center gap-2">
          <span>{history.length} lines</span>
          <span>•</span>
          <span>Ready</span>
        </div>
      </div>
    </div>
  );
};

export default Terminal;
