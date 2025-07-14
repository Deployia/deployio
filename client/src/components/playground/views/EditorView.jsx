import { useRef, useCallback, useState } from "react";
import SEO from "@components/SEO";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { motion } from "framer-motion";
import FileExplorer from "../FileExplorer";
import CodeEditor from "../CodeEditor";
import Terminal from "../Terminal";

const EditorView = ({
  workspace,
  setWorkspace,
  selectedRepo,
  terminalVisible,
  setTerminalVisible,
  githubToken,
}) => {
  // File selection ref for communication between FileExplorer and CodeEditor
  const fileSelectRef = useRef(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);

  // Handle file selection from FileExplorer
  const handleFileSelect = useCallback((fileNode) => {
    if (fileSelectRef.current) {
      fileSelectRef.current(fileNode);
    }
  }, []);

  return (
    <>
      <SEO page="playground-editor" />
      <div className="h-full">
        {/* Mobile: Stack layout */}
        <div className="md:hidden h-full flex flex-col">
          {/* Progress Bar */}
          {isLoadingFile && (
            <div className="h-0.5 bg-neutral-800">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 2, ease: "easeInOut" }}
              />
            </div>
          )}

          {/* Code Editor - Mobile */}
          <div className="flex-1 min-h-0">
            <CodeEditor
              workspace={workspace}
              setWorkspace={setWorkspace}
              onFileSelect={fileSelectRef}
              onLoadingChange={setIsLoadingFile}
              readOnlyMode={true}
              selectedRepo={selectedRepo}
              githubToken={githubToken}
              terminalVisible={terminalVisible}
              setTerminalVisible={setTerminalVisible}
            />
          </div>

          {/* Terminal - Mobile */}
          {terminalVisible && (
            <div className="h-40 border-t border-neutral-800">
              <Terminal
                selectedRepo={selectedRepo}
                workspace={workspace}
                setWorkspace={setWorkspace}
              />
            </div>
          )}
        </div>

        {/* Desktop: Panel layout */}
        <div className="hidden md:block h-full">
          <PanelGroup direction="horizontal">
            {/* File Explorer */}
            <Panel
              id="file-explorer"
              defaultSize={25}
              minSize={15}
              maxSize={40}
            >
              <div className="h-full border-r border-neutral-700/50 bg-neutral-950/50">
                <div className="h-10 border-b border-neutral-700/50 flex items-center px-3">
                  <span className="text-sm font-medium text-white heading">
                    Repository Explorer
                  </span>
                </div>
                <div className="h-full overflow-hidden">
                  <FileExplorer
                    onFileSelect={handleFileSelect}
                    githubToken={githubToken}
                    readOnlyMode={true}
                    selectedRepo={selectedRepo}
                  />
                </div>
              </div>
            </Panel>

            {/* Panel Resize Handle */}
            <PanelResizeHandle className="w-1 bg-neutral-800/50 hover:bg-neutral-600 transition-colors" />

            {/* Main Editor Content */}
            <Panel id="main-content" defaultSize={75} minSize={50}>
              {/* Progress Bar */}
              {isLoadingFile && (
                <div className="h-0.5 bg-neutral-800">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                  />
                </div>
              )}

              <PanelGroup direction="vertical">
                {/* Code Editor */}
                <Panel
                  id="code-editor"
                  defaultSize={terminalVisible ? 70 : 100}
                  minSize={40}
                >
                  <CodeEditor
                    workspace={workspace}
                    setWorkspace={setWorkspace}
                    onFileSelect={fileSelectRef}
                    onLoadingChange={setIsLoadingFile}
                    readOnlyMode={true}
                    selectedRepo={selectedRepo}
                    githubToken={githubToken}
                    terminalVisible={terminalVisible}
                    setTerminalVisible={setTerminalVisible}
                  />
                </Panel>

                {/* DevOps Terminal */}
                {terminalVisible && (
                  <>
                    <PanelResizeHandle className="h-1 bg-neutral-800 hover:bg-neutral-600 transition-colors" />
                    <Panel
                      id="terminal"
                      defaultSize={30}
                      minSize={15}
                      maxSize={60}
                    >
                      <div className="h-full border-t border-neutral-800">
                        <Terminal
                          selectedRepo={selectedRepo}
                          workspace={workspace}
                          setWorkspace={setWorkspace}
                        />
                      </div>
                    </Panel>
                  </>
                )}
              </PanelGroup>
            </Panel>
          </PanelGroup>
        </div>
      </div>
    </>
  );
};

export default EditorView;
