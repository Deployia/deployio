import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  FaPlay,
  FaCopy,
  FaSave,
  FaTrash,
  FaPlus,
  FaCloud,
  FaClock,
  FaDownload,
} from "react-icons/fa";
import SEO from "../components/SEO";
import { toast } from "react-hot-toast";

const APITester = () => {
  const [request, setRequest] = useState({
    method: "GET",
    url: "",
    headers: [{ key: "", value: "", enabled: true }],
    body: "",
    bodyType: "json",
  });
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savedRequests, setSavedRequests] = useState([
    {
      id: 1,
      name: "Get User Profile",
      method: "GET",
      url: "https://api.deployio.dev/user/profile",
      saved: true,
    },
    {
      id: 2,
      name: "Create Deployment",
      method: "POST",
      url: "https://api.deployio.dev/deployments",
      saved: true,
    },
  ]);
  const [activeTab, setActiveTab] = useState("headers");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [requestName, setRequestName] = useState("");
  const responseRef = useRef();

  const httpMethods = [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "HEAD",
    "OPTIONS",
  ];
  const bodyTypes = [
    "json",
    "form-data",
    "x-www-form-urlencoded",
    "raw",
    "binary",
  ];

  const handleMethodChange = (method) => {
    setRequest((prev) => ({ ...prev, method }));
  };

  const handleUrlChange = (e) => {
    setRequest((prev) => ({ ...prev, url: e.target.value }));
  };

  const handleHeaderChange = (index, field, value) => {
    const newHeaders = [...request.headers];
    newHeaders[index] = { ...newHeaders[index], [field]: value };
    setRequest((prev) => ({ ...prev, headers: newHeaders }));
  };

  const addHeader = () => {
    setRequest((prev) => ({
      ...prev,
      headers: [...prev.headers, { key: "", value: "", enabled: true }],
    }));
  };

  const removeHeader = (index) => {
    const newHeaders = request.headers.filter((_, i) => i !== index);
    setRequest((prev) => ({ ...prev, headers: newHeaders }));
  };

  const handleBodyChange = (e) => {
    setRequest((prev) => ({ ...prev, body: e.target.value }));
  };

  const sendRequest = async () => {
    if (!request.url) {
      toast.error("Please enter a URL");
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      // Simulate API request
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 + Math.random() * 2000)
      );

      // Mock response based on method
      const mockResponse = {
        status: request.method === "POST" ? 201 : 200,
        statusText: request.method === "POST" ? "Created" : "OK",
        headers: {
          "content-type": "application/json",
          "x-response-time": "145ms",
          date: new Date().toISOString(),
        },
        data:
          request.method === "GET"
            ? { id: 1, name: "John Doe", email: "john@example.com" }
            : { success: true, message: "Operation completed successfully" },
        time: Math.floor(145 + Math.random() * 300),
        size: Math.floor(1200 + Math.random() * 2000),
      };
      setResponse(mockResponse);
      toast.success("Request completed successfully");
    } catch {
      const errorResponse = {
        status: 500,
        statusText: "Internal Server Error",
        headers: {},
        data: { error: "Something went wrong" },
        time: 0,
        size: 0,
      };
      setResponse(errorResponse);
      toast.error("Request failed");
    } finally {
      setLoading(false);
    }
  };

  const saveRequest = () => {
    if (!requestName.trim()) {
      toast.error("Please enter a request name");
      return;
    }

    const newRequest = {
      id: Date.now(),
      name: requestName,
      method: request.method,
      url: request.url,
      headers: request.headers,
      body: request.body,
      bodyType: request.bodyType,
      saved: true,
    };

    setSavedRequests((prev) => [...prev, newRequest]);
    setRequestName("");
    setShowSaveDialog(false);
    toast.success("Request saved successfully");
  };

  const loadRequest = (savedRequest) => {
    setRequest({
      method: savedRequest.method,
      url: savedRequest.url,
      headers: savedRequest.headers || [{ key: "", value: "", enabled: true }],
      body: savedRequest.body || "",
      bodyType: savedRequest.bodyType || "json",
    });
    toast.success("Request loaded");
  };

  const copyResponse = () => {
    const responseText = JSON.stringify(response.data, null, 2);
    navigator.clipboard.writeText(responseText);
    toast.success("Response copied to clipboard");
  };

  const exportRequest = () => {
    const exportData = {
      request,
      timestamp: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `api-request-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <>
      <SEO
        title="API Tester - Deployio"
        description="Test and debug APIs with our powerful API testing tool. Send requests, view responses, and manage your API workflows."
        keywords="API, testing, REST, HTTP, debugging, requests, responses"
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center">
          <h1 className="text-4xl font-bold text-white flex items-center justify-center gap-3">
            <FaCloud className="text-blue-400" />
            API Tester
          </h1>
          <p className="mt-4 text-xl text-gray-400">
            Test and debug your APIs with our powerful testing tool
          </p>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Saved Requests Sidebar */}
          <motion.div variants={itemVariants} className="xl:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Saved Requests
                </h3>
                <button
                  onClick={() => setShowSaveDialog(true)}
                  className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  <FaPlus />
                </button>
              </div>

              <div className="space-y-2">
                {savedRequests.map((req) => (
                  <div
                    key={req.id}
                    onClick={() => loadRequest(req)}
                    className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-white text-sm">
                        {req.name}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          req.method === "GET"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : req.method === "POST"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            : req.method === "PUT"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {req.method}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {req.url}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div
            variants={itemVariants}
            className="xl:col-span-3 space-y-6"
          >
            {/* Request Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Request
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={exportRequest}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <FaDownload />
                    Export
                  </button>
                  <button
                    onClick={() => setShowSaveDialog(true)}
                    className="px-4 py-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <FaSave />
                    Save
                  </button>
                </div>
              </div>

              {/* URL and Method */}
              <div className="flex gap-3 mb-6">
                <select
                  value={request.method}
                  onChange={(e) => handleMethodChange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {httpMethods.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={request.url}
                  onChange={handleUrlChange}
                  placeholder="https://api.example.com/users"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={sendRequest}
                  disabled={loading || !request.url}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {loading ? (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <FaPlay />
                  )}
                  Send
                </button>
              </div>

              {/* Request Configuration Tabs */}
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex space-x-8">
                  {["headers", "body", "auth"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="mt-6">
                {activeTab === "headers" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Headers
                      </h4>
                      <button
                        onClick={addHeader}
                        className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                      >
                        <FaPlus /> Add Header
                      </button>
                    </div>
                    {request.headers.map((header, index) => (
                      <div key={index} className="flex gap-3 items-center">
                        <input
                          type="checkbox"
                          checked={header.enabled}
                          onChange={(e) =>
                            handleHeaderChange(
                              index,
                              "enabled",
                              e.target.checked
                            )
                          }
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          value={header.key}
                          onChange={(e) =>
                            handleHeaderChange(index, "key", e.target.value)
                          }
                          placeholder="Header name"
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <input
                          type="text"
                          value={header.value}
                          onChange={(e) =>
                            handleHeaderChange(index, "value", e.target.value)
                          }
                          placeholder="Header value"
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          onClick={() => removeHeader(index)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "body" && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Body
                      </h4>
                      <select
                        value={request.bodyType}
                        onChange={(e) =>
                          setRequest((prev) => ({
                            ...prev,
                            bodyType: e.target.value,
                          }))
                        }
                        className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      >
                        {bodyTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                    <textarea
                      value={request.body}
                      onChange={handleBodyChange}
                      placeholder={
                        request.bodyType === "json"
                          ? '{\n  "key": "value"\n}'
                          : "Request body..."
                      }
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                    />
                  </div>
                )}

                {activeTab === "auth" && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Authentication
                    </h4>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Authentication options will be available in a future
                      update.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Response Section */}
            {response && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Response
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={copyResponse}
                      className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <FaCopy />
                      Copy
                    </button>
                  </div>
                </div>

                {/* Response Status */}
                <div className="flex items-center gap-4 mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      response.status >= 200 && response.status < 300
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : response.status >= 400
                        ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                    }`}
                  >
                    {response.status} {response.statusText}
                  </span>
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <FaClock />
                    {response.time}ms
                  </span>
                  <span className="text-sm text-gray-500">
                    {response.size} bytes
                  </span>
                </div>

                {/* Response Body */}
                <div className="bg-gray-900 rounded-lg p-4">
                  <pre
                    ref={responseRef}
                    className="text-green-400 text-sm overflow-x-auto"
                  >
                    {JSON.stringify(response.data, null, 2)}
                  </pre>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Save Request Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Save Request
            </h3>
            <input
              type="text"
              value={requestName}
              onChange={(e) => setRequestName(e.target.value)}
              placeholder="Enter request name"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveRequest}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default APITester;
