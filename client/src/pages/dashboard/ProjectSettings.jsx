import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaCog,
  FaGithub,
  FaTrash,
  FaArchive,
  FaUsers,
  FaKey,
  FaBell,
  FaDatabase,
  FaShieldAlt,
  FaExclamationTriangle,
  FaSave,
  FaSync,
  FaPlus,
  FaTimes,
  FaCheck,
} from "react-icons/fa";
import {
  updateProject,
  deleteProject,
  toggleArchiveProject,
  clearProjectError,
  clearProjectSuccess,
} from "@redux/index";

const ProjectSettings = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();

  const { currentProject, loading, error, success } = useSelector(
    (state) => state.projects
  );

  // Form states
  const [generalSettings, setGeneralSettings] = useState({
    name: "",
    description: "",
    visibility: "private",
    autoDeployEnabled: false,
    deploymentBranch: "main",
  });

  const [repositorySettings, setRepositorySettings] = useState({
    url: "",
    branch: "main",
    autoSync: false,
    webhookEnabled: false,
  });

  const [collaborators, setCollaborators] = useState([]);
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState("");

  const [environmentVariables, setEnvironmentVariables] = useState([]);
  const [newEnvVar, setNewEnvVar] = useState({ key: "", value: "" });

  const [notifications, setNotifications] = useState({
    deploymentSuccess: true,
    deploymentFailure: true,
    securityAlerts: true,
    weeklyReports: false,
  });

  const [activeSection, setActiveSection] = useState("general");

  // Initialize form data when project loads
  useEffect(() => {
    if (currentProject) {
      setGeneralSettings({
        name: currentProject.name || "",
        description: currentProject.description || "",
        visibility: currentProject.visibility || "private",
        autoDeployEnabled: currentProject.autoDeployEnabled || false,
        deploymentBranch: currentProject.deploymentBranch || "main",
      });

      setRepositorySettings({
        url: currentProject.repository?.url || "",
        branch: currentProject.repository?.branch || "main",
        autoSync: currentProject.repository?.autoSync || false,
        webhookEnabled: currentProject.repository?.webhookEnabled || false,
      });

      setCollaborators(currentProject.collaborators || []);
      setEnvironmentVariables(currentProject.environmentVariables || []);
    }
  }, [currentProject]);

  // Clear messages
  useEffect(() => {
    if (success.update) {
      setTimeout(
        () => dispatch(clearProjectSuccess({ field: "update" })),
        3000
      );
    }
    if (error.project) {
      setTimeout(() => dispatch(clearProjectError({ field: "project" })), 5000);
    }
  }, [success.update, error.project, dispatch]);

  const handleGeneralSettingsUpdate = () => {
    dispatch(updateProject({ id, data: generalSettings }));
  };

  const handleRepositorySettingsUpdate = () => {
    dispatch(
      updateProject({
        id,
        data: { repository: repositorySettings },
      })
    );
  };

  const handleAddCollaborator = () => {
    if (
      newCollaboratorEmail &&
      !collaborators.find((c) => c.email === newCollaboratorEmail)
    ) {
      const newCollaborator = {
        email: newCollaboratorEmail,
        role: "viewer",
        addedAt: new Date().toISOString(),
      };
      const updatedCollaborators = [...collaborators, newCollaborator];
      setCollaborators(updatedCollaborators);
      setNewCollaboratorEmail("");
      dispatch(
        updateProject({
          id,
          data: { collaborators: updatedCollaborators },
        })
      );
    }
  };

  const handleRemoveCollaborator = (email) => {
    const updatedCollaborators = collaborators.filter((c) => c.email !== email);
    setCollaborators(updatedCollaborators);
    dispatch(
      updateProject({
        id,
        data: { collaborators: updatedCollaborators },
      })
    );
  };

  const handleAddEnvironmentVariable = () => {
    if (newEnvVar.key && newEnvVar.value) {
      const updatedEnvVars = [
        ...environmentVariables,
        { ...newEnvVar, id: Date.now() },
      ];
      setEnvironmentVariables(updatedEnvVars);
      setNewEnvVar({ key: "", value: "" });
      dispatch(
        updateProject({
          id,
          data: { environmentVariables: updatedEnvVars },
        })
      );
    }
  };

  const handleRemoveEnvironmentVariable = (envVarId) => {
    const updatedEnvVars = environmentVariables.filter(
      (env) => env.id !== envVarId
    );
    setEnvironmentVariables(updatedEnvVars);
    dispatch(
      updateProject({
        id,
        data: { environmentVariables: updatedEnvVars },
      })
    );
  };

  const handleNotificationsUpdate = () => {
    dispatch(
      updateProject({
        id,
        data: { notifications },
      })
    );
  };

  const handleDeleteProject = () => {
    if (
      window.confirm(
        "Are you sure you want to delete this project? This action cannot be undone and will delete all deployments and data associated with this project."
      )
    ) {
      dispatch(deleteProject(id)).then(() => {
        navigate("/dashboard/projects");
      });
    }
  };

  const handleArchiveToggle = () => {
    dispatch(toggleArchiveProject(id));
  };

  const sections = [
    { id: "general", label: "General", icon: FaCog },
    { id: "repository", label: "Repository", icon: FaGithub },
    { id: "collaborators", label: "Collaborators", icon: FaUsers },
    { id: "environment", label: "Environment", icon: FaDatabase },
    { id: "notifications", label: "Notifications", icon: FaBell },
    { id: "security", label: "Security", icon: FaShieldAlt },
    { id: "danger", label: "Danger Zone", icon: FaExclamationTriangle },
  ];

  if (loading.project) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Project Settings</h2>
        <p className="text-gray-400 mt-1">
          Configure your project settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4">
            <nav className="space-y-2">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeSection === section.id
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : "text-gray-400 hover:text-white hover:bg-neutral-800/50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {section.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6">
            {/* General Settings */}
            {activeSection === "general" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <h3 className="text-xl font-semibold text-white">
                  General Settings
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">
                      Project Name
                    </label>
                    <input
                      type="text"
                      value={generalSettings.name}
                      onChange={(e) =>
                        setGeneralSettings({
                          ...generalSettings,
                          name: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white focus:border-blue-500/50 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 text-sm mb-2">
                      Description
                    </label>
                    <textarea
                      value={generalSettings.description}
                      onChange={(e) =>
                        setGeneralSettings({
                          ...generalSettings,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full px-3 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white focus:border-blue-500/50 focus:outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 text-sm mb-2">
                      Visibility
                    </label>
                    <select
                      value={generalSettings.visibility}
                      onChange={(e) =>
                        setGeneralSettings({
                          ...generalSettings,
                          visibility: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white focus:border-blue-500/50 focus:outline-none"
                    >
                      <option value="private">Private</option>
                      <option value="public">Public</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-400 text-sm mb-2">
                      Deployment Branch
                    </label>
                    <input
                      type="text"
                      value={generalSettings.deploymentBranch}
                      onChange={(e) =>
                        setGeneralSettings({
                          ...generalSettings,
                          deploymentBranch: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white focus:border-blue-500/50 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="autoDeploy"
                      checked={generalSettings.autoDeployEnabled}
                      onChange={(e) =>
                        setGeneralSettings({
                          ...generalSettings,
                          autoDeployEnabled: e.target.checked,
                        })
                      }
                      className="rounded"
                    />
                    <label htmlFor="autoDeploy" className="text-white">
                      Enable auto-deployment on push
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleGeneralSettingsUpdate}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  <FaSave className="w-4 h-4" />
                  Save Changes
                </button>
              </motion.div>
            )}

            {/* Repository Settings */}
            {activeSection === "repository" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <h3 className="text-xl font-semibold text-white">
                  Repository Settings
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">
                      Repository URL
                    </label>
                    <input
                      type="url"
                      value={repositorySettings.url}
                      onChange={(e) =>
                        setRepositorySettings({
                          ...repositorySettings,
                          url: e.target.value,
                        })
                      }
                      placeholder="https://github.com/username/repository"
                      className="w-full px-3 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white focus:border-blue-500/50 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 text-sm mb-2">
                      Default Branch
                    </label>
                    <input
                      type="text"
                      value={repositorySettings.branch}
                      onChange={(e) =>
                        setRepositorySettings({
                          ...repositorySettings,
                          branch: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white focus:border-blue-500/50 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="autoSync"
                      checked={repositorySettings.autoSync}
                      onChange={(e) =>
                        setRepositorySettings({
                          ...repositorySettings,
                          autoSync: e.target.checked,
                        })
                      }
                      className="rounded"
                    />
                    <label htmlFor="autoSync" className="text-white">
                      Auto-sync repository changes
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="webhook"
                      checked={repositorySettings.webhookEnabled}
                      onChange={(e) =>
                        setRepositorySettings({
                          ...repositorySettings,
                          webhookEnabled: e.target.checked,
                        })
                      }
                      className="rounded"
                    />
                    <label htmlFor="webhook" className="text-white">
                      Enable webhook for deployments
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleRepositorySettingsUpdate}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    <FaSave className="w-4 h-4" />
                    Save Repository Settings
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 rounded-lg transition-colors">
                    <FaSync className="w-4 h-4" />
                    Sync Now
                  </button>
                </div>
              </motion.div>
            )}

            {/* Collaborators */}
            {activeSection === "collaborators" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <h3 className="text-xl font-semibold text-white">
                  Collaborators
                </h3>

                <div className="flex gap-3">
                  <input
                    type="email"
                    value={newCollaboratorEmail}
                    onChange={(e) => setNewCollaboratorEmail(e.target.value)}
                    placeholder="collaborator@example.com"
                    className="flex-1 px-3 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white focus:border-blue-500/50 focus:outline-none"
                  />
                  <button
                    onClick={handleAddCollaborator}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    <FaPlus className="w-4 h-4" />
                    Add
                  </button>
                </div>

                <div className="space-y-3">
                  {collaborators.length > 0 ? (
                    collaborators.map((collaborator) => (
                      <div
                        key={collaborator.email}
                        className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <FaUsers className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-white">{collaborator.email}</p>
                            <p className="text-gray-400 text-sm">
                              Role: {collaborator.role}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            handleRemoveCollaborator(collaborator.email)
                          }
                          className="p-2 text-red-400 hover:text-red-300 transition-colors"
                        >
                          <FaTimes className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-center py-8">
                      No collaborators added yet
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Environment Variables */}
            {activeSection === "environment" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <h3 className="text-xl font-semibold text-white">
                  Environment Variables
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={newEnvVar.key}
                    onChange={(e) =>
                      setNewEnvVar({ ...newEnvVar, key: e.target.value })
                    }
                    placeholder="VARIABLE_NAME"
                    className="px-3 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white focus:border-blue-500/50 focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newEnvVar.value}
                      onChange={(e) =>
                        setNewEnvVar({ ...newEnvVar, value: e.target.value })
                      }
                      placeholder="variable_value"
                      className="flex-1 px-3 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white focus:border-blue-500/50 focus:outline-none"
                    />
                    <button
                      onClick={handleAddEnvironmentVariable}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                    >
                      <FaPlus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {environmentVariables.length > 0 ? (
                    environmentVariables.map((envVar) => (
                      <div
                        key={envVar.id}
                        className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <FaKey className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-white font-mono">{envVar.key}</p>
                            <p className="text-gray-400 text-sm">••••••••</p>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            handleRemoveEnvironmentVariable(envVar.id)
                          }
                          className="p-2 text-red-400 hover:text-red-300 transition-colors"
                        >
                          <FaTimes className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-center py-8">
                      No environment variables configured
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Notifications */}
            {activeSection === "notifications" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <h3 className="text-xl font-semibold text-white">
                  Notification Settings
                </h3>

                <div className="space-y-4">
                  {Object.entries(notifications).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-lg"
                    >
                      <div>
                        <p className="text-white capitalize">
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </p>
                        <p className="text-gray-400 text-sm">
                          {key === "deploymentSuccess" &&
                            "Get notified when deployments succeed"}
                          {key === "deploymentFailure" &&
                            "Get notified when deployments fail"}
                          {key === "securityAlerts" &&
                            "Receive security-related notifications"}
                          {key === "weeklyReports" &&
                            "Weekly project performance reports"}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) =>
                          setNotifications({
                            ...notifications,
                            [key]: e.target.checked,
                          })
                        }
                        className="rounded"
                      />
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleNotificationsUpdate}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  <FaSave className="w-4 h-4" />
                  Save Notification Settings
                </button>
              </motion.div>
            )}

            {/* Security */}
            {activeSection === "security" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <h3 className="text-xl font-semibold text-white">
                  Security Settings
                </h3>

                <div className="space-y-4">
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <FaCheck className="w-4 h-4 text-green-400" />
                      <span className="text-green-400 font-medium">
                        SSL Certificate
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm">
                      Your project is secured with SSL encryption
                    </p>
                  </div>

                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <FaExclamationTriangle className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-400 font-medium">
                        Security Scan
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm mb-3">
                      Last security scan: 3 days ago
                    </p>
                    <button className="flex items-center gap-2 px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded text-sm">
                      <FaSync className="w-3 h-3" />
                      Run Security Scan
                    </button>
                  </div>

                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <FaShieldAlt className="w-4 h-4 text-blue-400" />
                      <span className="text-blue-400 font-medium">
                        Access Control
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm">
                      Configure who can access and modify this project
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Danger Zone */}
            {activeSection === "danger" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <h3 className="text-xl font-semibold text-red-400">
                  Danger Zone
                </h3>

                <div className="space-y-4">
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-medium mb-1">
                          Archive Project
                        </h4>
                        <p className="text-gray-400 text-sm">
                          {currentProject?.isArchived
                            ? "Unarchive this project to make it active again"
                            : "Archive this project to make it read-only"}
                        </p>
                      </div>
                      <button
                        onClick={handleArchiveToggle}
                        className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/30 rounded-lg transition-colors"
                      >
                        <FaArchive className="w-4 h-4" />
                        {currentProject?.isArchived ? "Unarchive" : "Archive"}
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-medium mb-1">
                          Delete Project
                        </h4>
                        <p className="text-gray-400 text-sm">
                          Permanently delete this project and all associated
                          data. This action cannot be undone.
                        </p>
                      </div>
                      <button
                        onClick={handleDeleteProject}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors"
                      >
                        <FaTrash className="w-4 h-4" />
                        Delete Project
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success.update && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-4 right-4 bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-green-400"
        >
          Settings updated successfully!
        </motion.div>
      )}

      {error.project && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-4 right-4 bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400"
        >
          {error.project}
        </motion.div>
      )}
    </div>
  );
};

export default ProjectSettings;
