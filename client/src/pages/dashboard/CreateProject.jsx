import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaGithub,
  FaPlus,
  FaCode,
  FaRocket,
  FaCheck,
  FaArrowLeft,
  FaExclamationTriangle,
  FaSpinner,
} from "react-icons/fa";
import SEO from "@components/SEO";
import {
  createProject,
  analyzeRepository,
  generateDockerfile,
  clearProjectError,
  clearProjectSuccess,
} from "@redux/index";

const CreateProject = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux state
  const { loading, error, success, currentProject } = useSelector(
    (state) => state.projects
  );

  // Form state
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    repository: "",
    branch: "main",
    template: "",
    environmentVariables: [],
  });
  const [repoAnalysis, setRepoAnalysis] = useState(null);
  const [dockerfile, setDockerfile] = useState("");

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle environment variables
  const addEnvironmentVariable = () => {
    setFormData((prev) => ({
      ...prev,
      environmentVariables: [
        ...prev.environmentVariables,
        { key: "", value: "", isSecret: false },
      ],
    }));
  };

  const updateEnvironmentVariable = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      environmentVariables: prev.environmentVariables.map((env, i) =>
        i === index ? { ...env, [field]: value } : env
      ),
    }));
  };

  const removeEnvironmentVariable = (index) => {
    setFormData((prev) => ({
      ...prev,
      environmentVariables: prev.environmentVariables.filter(
        (_, i) => i !== index
      ),
    }));
  };

  // Handle repository analysis
  const handleAnalyzeRepository = async () => {
    if (!formData.repository) return;

    try {
      const result = await dispatch(
        analyzeRepository({
          repositoryUrl: formData.repository,
          branch: formData.branch,
        })
      ).unwrap();

      setRepoAnalysis(result);

      // Auto-fill project name from repo if not set
      if (!formData.name && result.name) {
        setFormData((prev) => ({ ...prev, name: result.name }));
      }

      // Auto-select template based on analysis
      if (result.stackAnalysis?.primary?.name) {
        setFormData((prev) => ({
          ...prev,
          template: result.stackAnalysis.primary.name.toLowerCase(),
        }));
      }

      setStep(2);
    } catch (error) {
      console.error("Repository analysis failed:", error);
    }
  };

  // Handle Dockerfile generation
  const handleGenerateDockerfile = async () => {
    try {
      const result = await dispatch(
        generateDockerfile({
          repositoryUrl: formData.repository,
          branch: formData.branch,
          template: formData.template,
        })
      ).unwrap();

      setDockerfile(result.dockerfile);
      setStep(3);
    } catch (error) {
      console.error("Dockerfile generation failed:", error);
    }
  };

  // Handle project creation
  const handleCreateProject = async () => {
    const projectData = {
      ...formData,
      stackAnalysis: repoAnalysis?.stackAnalysis,
      dockerfile: dockerfile,
      repositoryUrl: formData.repository,
    };

    try {
      await dispatch(createProject(projectData)).unwrap();
      // Success will be handled by useEffect
    } catch (error) {
      console.error("Project creation failed:", error);
    }
  };

  // Navigate to project after successful creation
  useEffect(() => {
    if (success.create && currentProject) {
      setTimeout(() => {
        navigate(`/dashboard/projects/${currentProject._id}`);
      }, 2000);
    }
  }, [success.create, currentProject, navigate]);

  // Clear errors when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearProjectError());
      dispatch(clearProjectSuccess());
    };
  }, [dispatch]);

  const templates = [
    {
      id: "react",
      name: "React",
      icon: "⚛️",
      description: "React application with modern tooling",
    },
    {
      id: "vue",
      name: "Vue.js",
      icon: "💚",
      description: "Vue.js application with Vite",
    },
    {
      id: "angular",
      name: "Angular",
      icon: "🅰️",
      description: "Angular application with CLI",
    },
    {
      id: "nodejs",
      name: "Node.js",
      icon: "🟢",
      description: "Node.js backend application",
    },
    {
      id: "nextjs",
      name: "Next.js",
      icon: "▲",
      description: "Full-stack React framework",
    },
    {
      id: "nuxtjs",
      name: "Nuxt.js",
      icon: "💚",
      description: "Full-stack Vue framework",
    },
    {
      id: "python",
      name: "Python",
      icon: "🐍",
      description: "Python application with Flask/Django",
    },
    {
      id: "django",
      name: "Django",
      icon: "🎯",
      description: "Django web framework",
    },
    {
      id: "fastapi",
      name: "FastAPI",
      icon: "⚡",
      description: "Modern Python API framework",
    },
    {
      id: "spring",
      name: "Spring Boot",
      icon: "🍃",
      description: "Java Spring Boot application",
    },
    {
      id: "laravel",
      name: "Laravel",
      icon: "🐘",
      description: "PHP Laravel framework",
    },
    {
      id: "rails",
      name: "Ruby on Rails",
      icon: "💎",
      description: "Ruby on Rails application",
    },
  ];

  return (
    <>
      <SEO page="create-project" />

      <div className="min-h-screen bg-neutral-950 text-white">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-neutral-900/50 backdrop-blur-md border-b border-neutral-800/50 p-6"
        >
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/dashboard/projects")}
                className="p-2 rounded-lg bg-neutral-800/50 hover:bg-neutral-700/50 transition-colors"
              >
                <FaArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-2xl font-bold">Create New Project</h1>
                <p className="text-gray-400">
                  Deploy your application with AI-powered automation
                </p>
              </div>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((stepNum) => (
                <div
                  key={stepNum}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    step >= stepNum
                      ? "bg-blue-500 text-white"
                      : "bg-neutral-700 text-gray-400"
                  }`}
                >
                  {step > stepNum ? <FaCheck className="w-3 h-3" /> : stepNum}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="max-w-4xl mx-auto p-6">
          {/* Error Message */}
          {error.create && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 flex items-center gap-3"
            >
              <FaExclamationTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-red-400">
                  Error creating project
                </h3>
                <p className="text-red-300 text-sm">{error.create}</p>
              </div>
            </motion.div>
          )}

          {/* Success Message */}
          {success.create && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6 flex items-center gap-3"
            >
              <FaCheck className="w-5 h-5 text-green-400 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-green-400">
                  Project created successfully!
                </h3>
                <p className="text-green-300 text-sm">
                  Redirecting to project details...
                </p>
              </div>
            </motion.div>
          )}

          {/* Step 1: Repository Configuration */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <FaGithub className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">
                    Repository Configuration
                  </h2>
                  <p className="text-gray-400">
                    Connect your GitHub repository to get started
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Project Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="My Awesome Project"
                    className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Brief description of your project..."
                    rows={3}
                    className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    GitHub Repository URL *
                  </label>
                  <input
                    type="url"
                    name="repository"
                    value={formData.repository}
                    onChange={handleInputChange}
                    placeholder="https://github.com/username/repository"
                    className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Branch
                  </label>
                  <input
                    type="text"
                    name="branch"
                    value={formData.branch}
                    onChange={handleInputChange}
                    placeholder="main"
                    className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <button
                  onClick={handleAnalyzeRepository}
                  disabled={!formData.repository || loading.analyze}
                  className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {loading.analyze ? (
                    <>
                      <FaSpinner className="w-4 h-4 animate-spin" />
                      Analyzing Repository...
                    </>
                  ) : (
                    <>
                      <FaCode className="w-4 h-4" />
                      Analyze Repository
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Template Selection */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Analysis Results */}
              {repoAnalysis && (
                <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Repository Analysis Results
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-400">Primary Language</p>
                      <p className="text-white font-medium">
                        {repoAnalysis.stackAnalysis?.primary?.name ||
                          "Not detected"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Confidence</p>
                      <p className="text-white font-medium">
                        {repoAnalysis.stackAnalysis?.primary?.confidence || 0}%
                      </p>
                    </div>
                    {repoAnalysis.stackAnalysis?.dependencies && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-400 mb-2">
                          Dependencies Found
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {repoAnalysis.stackAnalysis.dependencies
                            .slice(0, 10)
                            .map((dep, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded"
                              >
                                {dep}
                              </span>
                            ))}
                          {repoAnalysis.stackAnalysis.dependencies.length >
                            10 && (
                            <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded">
                              +
                              {repoAnalysis.stackAnalysis.dependencies.length -
                                10}{" "}
                              more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Template Selection */}
              <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-purple-500/20 rounded-lg">
                    <FaRocket className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Choose Template</h2>
                    <p className="text-gray-400">
                      Select the best template for your project
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          template: template.id,
                        }))
                      }
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        formData.template === template.id
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-neutral-700/50 bg-neutral-800/30 hover:border-neutral-600/50"
                      }`}
                    >
                      <div className="text-2xl mb-2">{template.icon}</div>
                      <h3 className="font-medium text-white mb-1">
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {template.description}
                      </p>
                    </button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="px-6 py-3 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleGenerateDockerfile}
                    disabled={!formData.template || loading.dockerfile}
                    className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {loading.dockerfile ? (
                      <>
                        <FaSpinner className="w-4 h-4 animate-spin" />
                        Generating Dockerfile...
                      </>
                    ) : (
                      <>
                        <FaRocket className="w-4 h-4" />
                        Generate Dockerfile
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Review & Deploy */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Dockerfile Preview */}
              <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-8">
                <h3 className="text-lg font-semibold mb-4">
                  Generated Dockerfile
                </h3>
                <div className="bg-neutral-800/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <pre className="text-gray-300 whitespace-pre-wrap">
                    {dockerfile}
                  </pre>
                </div>
              </div>

              {/* Environment Variables */}
              <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    Environment Variables
                  </h3>
                  <button
                    onClick={addEnvironmentVariable}
                    className="px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors flex items-center gap-2"
                  >
                    <FaPlus className="w-3 h-3" />
                    Add Variable
                  </button>
                </div>

                {formData.environmentVariables.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">
                    No environment variables added yet. Add some if your
                    application needs them.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {formData.environmentVariables.map((env, index) => (
                      <div key={index} className="flex gap-3 items-center">
                        <input
                          type="text"
                          placeholder="Variable name"
                          value={env.key}
                          onChange={(e) =>
                            updateEnvironmentVariable(
                              index,
                              "key",
                              e.target.value
                            )
                          }
                          className="flex-1 px-3 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type={env.isSecret ? "password" : "text"}
                          placeholder="Value"
                          value={env.value}
                          onChange={(e) =>
                            updateEnvironmentVariable(
                              index,
                              "value",
                              e.target.value
                            )
                          }
                          className="flex-1 px-3 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <label className="flex items-center gap-2 text-sm text-gray-400">
                          <input
                            type="checkbox"
                            checked={env.isSecret}
                            onChange={(e) =>
                              updateEnvironmentVariable(
                                index,
                                "isSecret",
                                e.target.checked
                              )
                            }
                            className="rounded"
                          />
                          Secret
                        </label>
                        <button
                          onClick={() => removeEnvironmentVariable(index)}
                          className="p-2 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Final Actions */}
              <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-8">
                <h3 className="text-lg font-semibold mb-4">Ready to Deploy</h3>
                <p className="text-gray-400 mb-6">
                  Your project is configured and ready to be created. Click the
                  button below to create your project.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(2)}
                    className="px-6 py-3 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCreateProject}
                    disabled={loading.create}
                    className="flex-1 px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {loading.create ? (
                      <>
                        <FaSpinner className="w-4 h-4 animate-spin" />
                        Creating Project...
                      </>
                    ) : (
                      <>
                        <FaRocket className="w-4 h-4" />
                        Create Project
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
};

export default CreateProject;
