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
  FaSave,
  FaShieldAlt,
  FaTimes,
  FaTrash,
  FaUsers,
} from "react-icons/fa";
import {
  clearProjectError,
  clearProjectSuccess,
  clearProjectDeployments,
  deleteProject,
  fetchProjects,
  toggleArchiveProject,
  updateProject,
  addProjectCollaborator,
  removeProjectCollaborator,
} from "@redux/index";
import CollaboratorUserSearch from "@components/projects/CollaboratorUserSearch";
import EnvironmentVariablesEditor from "@components/project-creation/EnvironmentVariablesEditor";
import { normalizeEnvironmentVariables } from "@utils/deploymentConstants";

const ProjectSettings = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const { currentProject, loading, error, success } = useSelector(
    (state) => state.projects,
  );

  const [activeSection, setActiveSection] = useState("general");
  const initializedProjectId = useRef(null);

  const [generalSettings, setGeneralSettings] = useState({
    name: "",
    description: "",
    visibility: "private",
    autoDeployment: { enabled: false, branch: "main", environments: ["production"] },
  });
  const [repositorySettings, setRepositorySettings] = useState({ url: "", branch: "main" });
  const [collaboratorActionError, setCollaboratorActionError] = useState(null);
  const [notifications, setNotifications] = useState({ email: true });
  const [envByTarget, setEnvByTarget] = useState({
    production: [],
    staging: [],
    development: [],
  });
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
        enabled: false,
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
    setNotifications({
      email: currentProject.settings?.notifications?.email ?? true,
    });

    const source = currentProject.deployment?.environment || {};
    setEnvByTarget(normalizeEnvironmentVariables(source));
  }, [currentProject]);

  useEffect(() => {
    if (!currentProject?.deployment?.environment) return;
    setEnvByTarget(
      normalizeEnvironmentVariables(currentProject.deployment.environment),
    );
  }, [currentProject?.deployment?.environment, currentProject?.updatedAt]);

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

  const handleSaveEnvironment = () => {
    const cleared = normalizeEnvironmentVariables(envByTarget);
    Object.keys(cleared).forEach((target) => {
      cleared[target] = cleared[target].map((row) => ({
        ...row,
        value: row.value || "",
        isSecret: true,
      }));
    });
    saveProject({
      deployment: {
        ...currentProject?.deployment,
        environment: cleared,
      },
    });
  };

  const handleDeleteProject = async () => {
    const projectName = currentProject?.name || "";
    const typed = window.prompt(
      `Type "${projectName}" to permanently delete this project. All deployments will be stopped and removed.`,
      "",
    );
    if (typed !== projectName) return;

    try {
      await dispatch(deleteProject(id)).unwrap();
      dispatch(clearProjectDeployments());
      await dispatch(fetchProjects({ _noCache: true })).unwrap().catch(() => {});
      navigate("/dashboard/projects", { replace: true });
    } catch {
      // surfaced via redux
    }
  };

  const isOwner =
    currentProject?.isOwner ?? currentProject?.membershipRole === "owner";
  const collaborators = currentProject?.collaborators || [];
  const existingCollaboratorIds = collaborators
    .map((entry) => entry.user?.id || entry.user?._id || entry.user)
    .filter(Boolean);

  const handleAddCollaborator = async (user) => {
    setCollaboratorActionError(null);
    try {
      await dispatch(
        addProjectCollaborator({ projectId: id, userId: user.id }),
      ).unwrap();
    } catch (err) {
      setCollaboratorActionError(
        typeof err === "string" ? err : "Failed to add collaborator",
      );
    }
  };

  const handleRemoveCollaborator = async (userId) => {
    setCollaboratorActionError(null);
    try {
      await dispatch(
        removeProjectCollaborator({ projectId: id, userId }),
      ).unwrap();
    } catch (err) {
      setCollaboratorActionError(
        typeof err === "string" ? err : "Failed to remove collaborator",
      );
    }
  };

  const allSections = [
    { id: "general", label: "General", icon: FaCog },
    { id: "repository", label: "Repository", icon: FaGithub },
    { id: "collaborators", label: "Collaborators", icon: FaUsers },
    {
      id: "environment",
      label: "Environment",
      icon: FaDatabase,
      ownerOnly: true,
    },
    { id: "notifications", label: "Notifications", icon: FaBell },
    { id: "security", label: "Security", icon: FaShieldAlt },
    { id: "danger", label: "Danger Zone", icon: FaExclamationTriangle, ownerOnly: true },
  ];
  const sections = allSections.filter((section) => isOwner || !section.ownerOnly);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Project Settings</h2>
        <p className="text-gray-400 mt-1">
          {isOwner
            ? "Configure project behavior, environments, and deployment defaults."
            : "View-only access. You can deploy and manage deployments, but cannot change project settings."}
        </p>
      </div>

      {!isOwner && (
        <motion.div className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">
          You are a collaborator on this project. Project settings are read-only.
        </motion.div>
      )}

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
                disabled={!isOwner}
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white disabled:opacity-60"
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
                disabled={!isOwner}
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white disabled:opacity-60"
                placeholder="Description"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={generalSettings.visibility}
                  onChange={(e) =>
                    setGeneralSettings((prev) => ({ ...prev, visibility: e.target.value }))
                  }
                  className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white sm:col-span-2"
                >
                  <option value="private">Private</option>
                  <option value="public">Public</option>
                </select>
              </div>
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
                <p className="text-sm font-medium text-amber-200">Auto-deploy on push</p>
                <p className="text-xs text-amber-200/80 mt-1">
                  Coming soon. Use Deploy and Redeploy on the project dashboard to test the full
                  lifecycle for now.
                </p>
              </div>
              {isOwner && (
              <button
                type="button"
                onClick={() =>
                  saveProject({
                    name: generalSettings.name,
                    description: generalSettings.description,
                    visibility: generalSettings.visibility,
                    settings: {
                      ...currentProject?.settings,
                      autoDeployment: {
                        ...generalSettings.autoDeployment,
                        enabled: false,
                      },
                    },
                  })
                }
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
              >
                <FaSave className="w-4 h-4" /> Save General Settings
              </button>
              )}
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
                disabled={!isOwner}
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white disabled:opacity-60"
                placeholder="Repository URL"
              />
              <input
                value={repositorySettings.branch}
                onChange={(e) =>
                  setRepositorySettings((prev) => ({ ...prev, branch: e.target.value }))
                }
                disabled={!isOwner}
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white disabled:opacity-60"
                placeholder="Branch"
              />
              {isOwner && (
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
              )}
            </div>
          )}

          {activeSection === "collaborators" && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white">Collaborators</h3>
              <p className="text-sm text-gray-400">
                {isOwner
                  ? "Invite registered users to collaborate. Collaborators can deploy but cannot change project settings or environment variables."
                  : "People with access to this project. You can deploy but cannot edit settings."}
              </p>

              {!isOwner && (
                <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-sm text-blue-200">
                  View-only — contact the project owner to manage collaborators.
                </div>
              )}

              {isOwner && (
                <CollaboratorUserSearch
                  onSelect={handleAddCollaborator}
                  existingUserIds={existingCollaboratorIds}
                />
              )}

              {collaboratorActionError && (
                <p className="text-sm text-red-400">{collaboratorActionError}</p>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between bg-neutral-800/60 rounded-lg px-3 py-2 border border-neutral-700/50">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-xs text-gray-300">
                      {(currentProject?.owner?.name ||
                        currentProject?.owner?.email ||
                        "O")[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-gray-200 truncate">
                        {currentProject?.owner?.name ||
                          currentProject?.owner?.email ||
                          "Project owner"}
                      </p>
                      {currentProject?.owner?.email && (
                        <p className="text-xs text-gray-500 truncate">
                          {currentProject.owner.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-amber-500/15 text-amber-200 border border-amber-500/30">
                    Owner
                  </span>
                </div>

                {collaborators.length === 0 ? (
                  <p className="text-sm text-gray-500 py-2">
                    No collaborators yet. Search above to invite someone.
                  </p>
                ) : (
                  collaborators.map((entry) => {
                    const user = entry.user || {};
                    const userId = user.id || user._id;
                    return (
                      <div
                        key={userId || user.email}
                        className="flex items-center justify-between bg-neutral-800/60 rounded-lg px-3 py-2"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {user.profileImage ? (
                            <img
                              src={user.profileImage}
                              alt=""
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-xs text-gray-400">
                              {(user.name || user.email || "?")[0]?.toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-gray-200 truncate">
                              {user.name || user.email || "User"}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-neutral-700 text-gray-300">
                            Collaborator
                          </span>
                          {isOwner && userId && (
                          <button
                            type="button"
                            onClick={() => handleRemoveCollaborator(userId)}
                            className="text-red-300 hover:text-red-200"
                          >
                            <FaTimes className="w-4 h-4" />
                          </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {activeSection === "environment" && isOwner && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white">
                Environment Variables
              </h3>
              <p className="text-sm text-gray-400">
                Values are encrypted and never shown again after save. Leave a value
                blank to keep the existing secret.
              </p>
              <EnvironmentVariablesEditor
                value={envByTarget}
                onChange={setEnvByTarget}
                disabled={loading.update}
                showSaveButton
                saving={loading.update}
                saveLabel="Save environment variables"
                onSave={handleSaveEnvironment}
              />
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
              {isOwner && (
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
              )}
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
