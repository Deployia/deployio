import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaArchive,
  FaBell,
  FaCog,
  FaDatabase,
  FaExclamationTriangle,
  FaGithub,
  FaPlus,
  FaSave,
  FaShieldAlt,
  FaTimes,
  FaTrash,
  FaUsers,
} from "react-icons/fa";
import {
  clearProjectError,
  clearProjectSuccess,
  deleteProject,
  toggleArchiveProject,
  updateProject,
} from "@redux/index";

const ENVIRONMENTS = ["production", "staging", "development"];

const ProjectSettings = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const { currentProject, loading, error, success } = useSelector(
    (state) => state.projects,
  );

  const [activeSection, setActiveSection] = useState("general");
  const [activeEnv, setActiveEnv] = useState("production");
  const initializedProjectId = useRef(null);

  const [generalSettings, setGeneralSettings] = useState({
    name: "",
    description: "",
    visibility: "private",
    autoDeployment: { enabled: false, branch: "main", environments: ["production"] },
  });
  const [repositorySettings, setRepositorySettings] = useState({ url: "", branch: "main" });
  const [collaborators, setCollaborators] = useState([]);
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState("");
  const [notifications, setNotifications] = useState({ email: true });
  const [envByTarget, setEnvByTarget] = useState({
    production: [],
    staging: [],
    development: [],
  });
  const [newEnvVar, setNewEnvVar] = useState({ key: "", value: "", isSecret: true });

  useEffect(() => {
    const projectIdentity = currentProject?._id || currentProject?.id;
    if (!projectIdentity || initializedProjectId.current === projectIdentity) {
      return;
    }
    initializedProjectId.current = projectIdentity;

    setGeneralSettings({
      name: currentProject.name || "",
      description: currentProject.description || "",
      visibility: currentProject.visibility || "private",
      autoDeployment: {
        enabled: Boolean(currentProject.settings?.autoDeployment?.enabled),
        branch: currentProject.settings?.autoDeployment?.branch || "main",
        environments: currentProject.settings?.autoDeployment?.environments || [
          "production",
        ],
      },
    });

    setRepositorySettings({
      url: currentProject.repository?.url || "",
      branch: currentProject.repository?.branch || "main",
    });
    setCollaborators(currentProject.collaborators || []);
    setNotifications({
      email: currentProject.settings?.notifications?.email ?? true,
    });

    const source = currentProject.deployment?.environment || {};
    setEnvByTarget({
      production: Array.isArray(source.production) ? source.production : [],
      staging: Array.isArray(source.staging) ? source.staging : [],
      development: Array.isArray(source.development) ? source.development : [],
    });
  }, [currentProject]);

  useEffect(() => {
    if (success.update) {
      const timer = setTimeout(
        () => dispatch(clearProjectSuccess({ field: "update" })),
        3000,
      );
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [dispatch, success.update]);

  useEffect(() => {
    if (!error.update && !error.currentProject) return undefined;
    const timer = setTimeout(
      () => dispatch(clearProjectError({ field: "update" })),
      5000,
    );
    return () => clearTimeout(timer);
  }, [dispatch, error.currentProject, error.update]);

  const saveProject = (updateData) =>
    dispatch(updateProject({ projectId: id, updateData }));

  const addEnvVar = () => {
    if (!newEnvVar.key.trim()) return;
    setEnvByTarget((prev) => ({
      ...prev,
      [activeEnv]: [...prev[activeEnv], { ...newEnvVar, key: newEnvVar.key.trim() }],
    }));
    setNewEnvVar({ key: "", value: "", isSecret: true });
  };

  const removeEnvVar = (index) => {
    setEnvByTarget((prev) => ({
      ...prev,
      [activeEnv]: prev[activeEnv].filter((_, i) => i !== index),
    }));
  };

  const handleDeleteProject = async () => {
    if (!window.confirm("Delete this project permanently?")) return;
    await dispatch(deleteProject(id));
    navigate("/dashboard/projects");
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Project Settings</h2>
        <p className="text-gray-400 mt-1">
          Configure project behavior, environments, and deployment defaults.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-neutral-900/50 border border-neutral-800/50 rounded-xl p-4 space-y-2">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 ${
                    activeSection === section.id
                      ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      : "text-gray-300 hover:bg-neutral-800/60"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {section.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-3 bg-neutral-900/50 border border-neutral-800/50 rounded-xl p-6">
          {activeSection === "general" && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white">General</h3>
              <input
                value={generalSettings.name}
                onChange={(e) =>
                  setGeneralSettings((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
                placeholder="Project name"
              />
              <textarea
                value={generalSettings.description}
                onChange={(e) =>
                  setGeneralSettings((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={3}
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
                placeholder="Description"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={generalSettings.visibility}
                  onChange={(e) =>
                    setGeneralSettings((prev) => ({ ...prev, visibility: e.target.value }))
                  }
                  className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
                >
                  <option value="private">Private</option>
                  <option value="public">Public</option>
                </select>
                <input
                  value={generalSettings.autoDeployment.branch}
                  onChange={(e) =>
                    setGeneralSettings((prev) => ({
                      ...prev,
                      autoDeployment: { ...prev.autoDeployment, branch: e.target.value },
                    }))
                  }
                  className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
                  placeholder="Auto deploy branch"
                />
              </div>
              <button
                type="button"
                onClick={() =>
                  saveProject({
                    name: generalSettings.name,
                    description: generalSettings.description,
                    visibility: generalSettings.visibility,
                    settings: {
                      ...currentProject?.settings,
                      autoDeployment: generalSettings.autoDeployment,
                    },
                  })
                }
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
              >
                <FaSave className="w-4 h-4" /> Save General Settings
              </button>
            </div>
          )}

          {activeSection === "repository" && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white">Repository</h3>
              <input
                value={repositorySettings.url}
                onChange={(e) =>
                  setRepositorySettings((prev) => ({ ...prev, url: e.target.value }))
                }
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
                placeholder="Repository URL"
              />
              <input
                value={repositorySettings.branch}
                onChange={(e) =>
                  setRepositorySettings((prev) => ({ ...prev, branch: e.target.value }))
                }
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
                placeholder="Branch"
              />
              <button
                type="button"
                onClick={() =>
                  saveProject({
                    repository: {
                      ...currentProject?.repository,
                      ...repositorySettings,
                    },
                  })
                }
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
              >
                <FaSave className="w-4 h-4" /> Save Repository
              </button>
            </div>
          )}

          {activeSection === "collaborators" && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white">Collaborators</h3>
              <div className="flex gap-2">
                <input
                  value={newCollaboratorEmail}
                  onChange={(e) => setNewCollaboratorEmail(e.target.value)}
                  className="flex-1 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
                  placeholder="email@example.com"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newCollaboratorEmail.trim()) return;
                    const updated = [
                      ...collaborators,
                      { email: newCollaboratorEmail.trim(), role: "viewer" },
                    ];
                    setCollaborators(updated);
                    setNewCollaboratorEmail("");
                    saveProject({ collaborators: updated });
                  }}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg"
                >
                  <FaPlus className="w-4 h-4" />
                </button>
              </div>
              {collaborators.map((collaborator) => (
                <div
                  key={collaborator.email}
                  className="flex items-center justify-between bg-neutral-800/60 rounded-lg px-3 py-2"
                >
                  <div className="text-gray-200">{collaborator.email}</div>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = collaborators.filter(
                        (item) => item.email !== collaborator.email,
                      );
                      setCollaborators(updated);
                      saveProject({ collaborators: updated });
                    }}
                    className="text-red-300 hover:text-red-200"
                  >
                    <FaTimes className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeSection === "environment" && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white">Environment Variables</h3>
              <div className="flex gap-2">
                {ENVIRONMENTS.map((env) => (
                  <button
                    key={env}
                    type="button"
                    onClick={() => setActiveEnv(env)}
                    className={`px-3 py-1 rounded-lg text-sm ${
                      activeEnv === env
                        ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                        : "bg-neutral-800 text-gray-300"
                    }`}
                  >
                    {env}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input
                  value={newEnvVar.key}
                  onChange={(e) =>
                    setNewEnvVar((prev) => ({ ...prev, key: e.target.value }))
                  }
                  className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
                  placeholder="KEY"
                />
                <input
                  value={newEnvVar.value}
                  onChange={(e) =>
                    setNewEnvVar((prev) => ({ ...prev, value: e.target.value }))
                  }
                  className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
                  placeholder="VALUE"
                />
                <button
                  type="button"
                  onClick={addEnvVar}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2"
                >
                  <FaPlus className="w-4 h-4" /> Add
                </button>
              </div>

              <div className="space-y-2">
                {(envByTarget[activeEnv] || []).map((item, index) => (
                  <div
                    key={`${item.key}-${index}`}
                    className="flex items-center justify-between bg-neutral-800/60 rounded-lg px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-white font-mono text-sm truncate">{item.key}</p>
                      <p className="text-gray-400 text-xs truncate">
                        {item.isSecret ? "********" : item.value}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeEnvVar(index)}
                      className="text-red-300 hover:text-red-200"
                    >
                      <FaTimes className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() =>
                  saveProject({
                    deployment: {
                      ...currentProject?.deployment,
                      environment: envByTarget,
                    },
                  })
                }
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
              >
                <FaSave className="w-4 h-4" /> Save {activeEnv} Variables
              </button>
            </div>
          )}

          {activeSection === "notifications" && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white">Notifications</h3>
              <label className="flex items-center gap-2 text-gray-200">
                <input
                  type="checkbox"
                  checked={notifications.email}
                  onChange={(e) =>
                    setNotifications((prev) => ({ ...prev, email: e.target.checked }))
                  }
                />
                Email notifications
              </label>
              <button
                type="button"
                onClick={() =>
                  saveProject({
                    settings: {
                      ...currentProject?.settings,
                      notifications,
                    },
                  })
                }
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
              >
                <FaSave className="w-4 h-4" /> Save Notifications
              </button>
            </div>
          )}

          {activeSection === "security" && (
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-white">Security</h3>
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-200">
                SSL is enabled for deployments by default.
              </div>
            </div>
          )}

          {activeSection === "danger" && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-red-300">Danger Zone</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => dispatch(toggleArchiveProject(id))}
                  className="px-4 py-2 rounded-lg border border-yellow-500/40 text-yellow-200 bg-yellow-500/10 flex items-center gap-2"
                >
                  <FaArchive className="w-4 h-4" />
                  {currentProject?.status === "archived" ? "Unarchive" : "Archive"}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteProject}
                  className="px-4 py-2 rounded-lg border border-red-500/40 text-red-200 bg-red-500/10 flex items-center gap-2"
                >
                  <FaTrash className="w-4 h-4" />
                  Delete Project
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {success.update && (
        <motion.div className="fixed bottom-4 right-4 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-300">
          Settings updated.
        </motion.div>
      )}
      {(error.update || error.currentProject) && (
        <motion.div className="fixed bottom-4 right-4 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300">
          {error.update || error.currentProject}
        </motion.div>
      )}
    </div>
  );
};

export default ProjectSettings;
