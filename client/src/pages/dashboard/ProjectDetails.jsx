import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaProjectDiagram,
  FaCode,
  FaGithub,
  FaRocket,
  FaCog,
  FaTrash,
  FaEdit,
  FaCheck,
  FaTimes,
  FaChartLine,
  FaUsers,
  FaCalendarAlt,
  FaPlay,
  FaExternalLinkAlt,
  FaEye,
  FaArchive,
  FaExclamationTriangle,
  FaDocker,
} from "react-icons/fa";
import SEO from "@components/SEO";
import { redeployPrefillFromDeployment } from "@/utils/deploymentSource";
import { LoadingGrid, LoadingChart } from "@components/LoadingSpinner";
import {
  fetchProjectById,
  updateProject,
  deleteProject,
  fetchProjects,
  toggleArchiveProject,
  fetchProjectDeployments,
  fetchDeploymentSubdomains,
  checkDeploymentSubdomain,
  createDeployment,
  stopDeployment,
  cancelDeployment,
  clearDeploymentError,
  clearProjectError,
  clearProjectSuccess,
  clearProjectDeployments,
} from "@redux/index";
import {
  DEPLOYMENT_POLL_STATUSES,
  getProjectStatusBadge,
} from "../../utils/deploymentConstants";
import projectCreationService from "../../services/projectCreationService";
import { resolveRepositoryForGitApi } from "@/utils/resolveRepositoryForGitApi";
import appToast from "@/utils/appToast";

const ProjectDetails = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  // Redux state
  const { currentProject, loading, error, success } = useSelector(
    (state) => state.projects,
  );
  const {
    projectDeployments,
    loading: deploymentLoading,
    error: deploymentError,
  } = useSelector((state) => state.deployments);
  const { projectAnalytics } = useSelector((state) => state.analytics);

  // Local state
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [deployModalMode, setDeployModalMode] = useState("create");
  const deployPrefillRef = useRef(null);
  /** Set when the user picks a commit in the modal (prevents async loaders from resetting it). */
  const commitTouchedRef = useRef(false);
  const branchTouchedRef = useRef(false);
  const [deploymentForm, setDeploymentForm] = useState({
    environment: "development",
    subdomain: "",
    branch: "",
    commit: null,
  });
  const [gitSourceState, setGitSourceState] = useState({
    branches: [],
    commits: [],
    loadingBranches: false,
    loadingCommits: false,
    error: null,
  });
  const [hasLoadedProjectOnce, setHasLoadedProjectOnce] = useState(false);
  const [subdomainState, setSubdomainState] = useState({
    suggestions: [],
    capacity: null,
  });
  const [subdomainAvailability, setSubdomainAvailability] = useState({
    subdomain: "",
    available: null,
    status: null,
    reason: null,
    label: null,
    alternatives: [],
  });

  const SUBDOMAIN_REASON_LABELS = {
    available: "Available",
    "invalid-subdomain-format": "Invalid format — use lowercase letters, numbers, and hyphens",
    "platform-reserved-subdomain": "Reserved for platform use",
    "blocked-subdomain-policy": "Not allowed by platform policy",
    "already-allocated": "Already taken",
    "redeploy-reuse": "Reusing URL from previous deployment",
  };

  // Consider capacity reached when remainingDeployments is 0 or less
  const isDeploymentCapacityReached =
    typeof subdomainState.capacity?.maxDeployments === "number" &&
    (typeof subdomainState.capacity?.remainingDeployments === "number"
      ? subdomainState.capacity.remainingDeployments <= 0
      : (subdomainState.capacity?.activeDeployments || 0) >=
        subdomainState.capacity.maxDeployments);

  const isEnvCapacityReached = (env) => {
    const activeStatuses = new Set([
      "pending",
      "queued",
      "cloning",
      "detecting",
      "building",
      "deploying",
      "running",
      "stopping",
    ]);
    const getEnv = (d) =>
      d.config?.environment || d.environment || "";
    const envActive = (projectDeployments || []).filter(
      (d) =>
        getEnv(d) === env &&
        activeStatuses.has(String(d.status || "").toLowerCase()),
    ).length;
    const projectActive = (projectDeployments || []).filter((d) =>
      activeStatuses.has(String(d.status || "").toLowerCase()),
    ).length;
    const maxDeployments = subdomainState.capacity?.maxDeployments || 3;

    // Disable an environment button if it already has an active deployment,
    // or if the project is already at its overall maximum.
    if (envActive > 0) return true;

    return projectActive >= maxDeployments;
  };

  const refreshDeploymentData = (projectId, { bustCache = false } = {}) => {
    if (!projectId) return;

    const fetchArg = bustCache
      ? { projectId, _noCache: true }
      : projectId;

    dispatch(fetchProjectById(fetchArg));
    dispatch(
      fetchProjectDeployments(
        typeof fetchArg === "object"
          ? { ...fetchArg, silent: true }
          : { projectId: fetchArg, silent: true },
      ),
    );
  };

  // Get current tab from URL
  useEffect(() => {
    const pathSegments = location.pathname.split("/");
    const lastSegment = pathSegments[pathSegments.length - 1];
    if (["analysis", "deployments", "analytics", "settings"].includes(lastSegment)) {
      setActiveTab(lastSegment);
    } else {
      setActiveTab("overview");
    }
  }, [location.pathname]);

  useEffect(() => {
    setHasLoadedProjectOnce(false);
  }, [id]);

  useEffect(() => {
    if (id) {
      dispatch(clearProjectDeployments());

      const fetchData = async () => {
        try {
          await Promise.all([
            dispatch(fetchProjectById(id)).unwrap(),
            dispatch(fetchProjectDeployments(id)).unwrap(),
          ]);
        } catch {
          // Error handling is done by Redux slice
        } finally {
          setHasLoadedProjectOnce(true);
        }
      };

      fetchData();
    }
  }, [id, dispatch]);

  // Poll deployments while any row is still progressing (keeps overview + tabs in sync).
  // Intentionally excludes projectDeployments from deps to avoid interval churn on every poll.
  // The interval captures the latest `projectDeployments` via closure on each tick via dispatch.
  const hasInFlightRef = useRef(false);
  useEffect(() => {
    hasInFlightRef.current = Array.isArray(projectDeployments)
      ? projectDeployments.some((d) =>
          DEPLOYMENT_POLL_STATUSES.has(String(d?.status || "").toLowerCase()),
        )
      : false;
  }, [projectDeployments]);

  useEffect(() => {
    if (!id) return undefined;
    const timer = setInterval(() => {
      if (hasInFlightRef.current) {
        dispatch(fetchProjectDeployments({ projectId: id, silent: true }));
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [id, dispatch]);

  // Update edit form when currentProject changes
  useEffect(() => {
    if (currentProject) {
      setEditFormData({
        name: currentProject.name || "",
        description: currentProject.description || "",
      });
    }
  }, [currentProject]);

  // Project save feedback (single toast — includes saves from Settings tab)
  useEffect(() => {
    if (success.update) {
      appToast.success("Project saved");
      setIsEditing(false);
      const timer = setTimeout(
        () => dispatch(clearProjectSuccess({ field: "update" })),
        3000,
      );
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [success.update, dispatch]);

  useEffect(() => {
    const message = error.update || error.currentProject;
    if (!message) return undefined;
    appToast.error(message);
    const timer = setTimeout(
      () => {
        dispatch(clearProjectError({ field: "update" }));
        dispatch(clearProjectError({ field: "currentProject" }));
      },
      5000,
    );
    return () => clearTimeout(timer);
  }, [error.update, error.currentProject, dispatch]);

  // Handle tab navigation
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "overview") {
      navigate(`/dashboard/projects/${id}`);
    } else {
      navigate(`/dashboard/projects/${id}/${tab}`);
    }
  };

  // Handle project update
  const handleUpdateProject = () => {
    if (editFormData.name.trim()) {
      dispatch(updateProject({ projectId: id, updateData: editFormData }));
    }
  };

  // Handle project deletion
  const handleDeleteProject = () => {
    setShowDeleteModal(true);
  };

  // Handle archive toggle
  const handleArchiveToggle = () => {
    setShowArchiveModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteConfirmName("");
    dispatch(clearProjectError({ field: "delete" }));
  };

  // Confirm handlers
  const handleConfirmDelete = async () => {
    if (
      !currentProject?.name ||
      deleteConfirmName.trim() !== currentProject.name.trim()
    ) {
      return;
    }

    try {
      await dispatch(deleteProject(id)).unwrap();
      dispatch(clearProjectDeployments());
      closeDeleteModal();
      await dispatch(fetchProjects({ _noCache: true })).unwrap().catch(() => {});
      navigate("/dashboard/projects", { replace: true });
    } catch {
      // error surfaced by redux slice
    }
  };

  const handleConfirmArchive = async () => {
    try {
      await dispatch(toggleArchiveProject(id)).unwrap();
      setShowArchiveModal(false);
      refreshDeploymentData(id);
    } catch {
      // error surfaced by redux slice
    }
  };

  const getDeployRepoContext = () => {
    const repo = currentProject?.repository;
    if (!repo) return null;

    const coords = resolveRepositoryForGitApi(
      repo.provider || "github",
      {
        ...repo,
        htmlUrl: repo.url,
        fullName:
          repo.owner && repo.name && !repo.fullName
            ? `${repo.owner}/${repo.name}`
            : repo.fullName,
        owner:
          typeof repo.owner === "string"
            ? { login: repo.owner }
            : repo.owner,
      },
    );

    if (!coords) return null;

    return {
      ...coords,
      defaultBranch: repo.branch || repo.defaultBranch || "main",
    };
  };

  const handleOpenDeployModal = (prefill = null) => {
    if (isArchived) return;
    dispatch(clearDeploymentError({ field: "create" }));
    const repoCtx = getDeployRepoContext();
    const defaultBranch = repoCtx?.defaultBranch || "main";
    deployPrefillRef.current = prefill;
    commitTouchedRef.current = false;
    branchTouchedRef.current = false;
    setDeployModalMode(prefill ? "redeploy" : "create");
    setDeploymentForm({
      environment: prefill?.environment || "development",
      subdomain: prefill?.subdomain || "",
      branch: prefill?.branch || defaultBranch,
      commit: prefill?.commit || null,
    });
    setGitSourceState({
      branches: [],
      commits: [],
      loadingBranches: Boolean(repoCtx),
      loadingCommits: false,
      error: null,
    });
    setSubdomainState({
      suggestions: [],
      capacity: null,
    });
    setSubdomainAvailability({
      subdomain: "",
      available: null,
      status: null,
      reason: null,
      label: null,
      alternatives: [],
    });
    setShowDeployModal(true);
  };

  const handleRedeployFromDeployment = async (deployment) => {
    const prefill = redeployPrefillFromDeployment(deployment);
    if (!prefill) return;

    const status = String(deployment?.status || "").toLowerCase();
    const deploymentId =
      deployment._id || deployment.id || deployment.deploymentId;

    try {
      if (status === "running" || status === "stopping") {
        await dispatch(stopDeployment(deploymentId)).unwrap();
      } else if (
        [
          "pending",
          "queued",
          "cloning",
          "detecting",
          "building",
          "deploying",
        ].includes(status)
      ) {
        await dispatch(cancelDeployment(deploymentId)).unwrap();
      }
      if (id) {
        await dispatch(
          fetchProjectDeployments({ projectId: id, _noCache: true, silent: true }),
        ).unwrap();
      }
    } catch (err) {
      console.error("Failed to stop deployment before redeploy:", err);
    }

    handleOpenDeployModal(prefill);
  };

  const handleCloseDeployModal = () => {
    deployPrefillRef.current = null;
    commitTouchedRef.current = false;
    branchTouchedRef.current = false;
    setDeployModalMode("create");
    setShowDeployModal(false);
    setDeploymentForm({
      environment: "development",
      subdomain: "",
      branch: "",
      commit: null,
    });
    setGitSourceState({
      branches: [],
      commits: [],
      loadingBranches: false,
      loadingCommits: false,
      error: null,
    });
    setSubdomainState({
      suggestions: [],
      capacity: null,
    });
    setSubdomainAvailability({
      subdomain: "",
      available: null,
      status: null,
      reason: null,
      label: null,
      alternatives: [],
    });
  };

  const handleDeploymentEnvironmentChange = (environment) => {
    setDeploymentForm((previous) => ({
      ...previous,
      environment,
      subdomain: "",
    }));
    setSubdomainAvailability({
      subdomain: "",
      available: null,
      status: null,
      reason: null,
      label: null,
      alternatives: [],
    });
  };

  const handleSubdomainSelection = (suggestion) => {
    const slug =
      typeof suggestion === "string" ? suggestion : suggestion?.subdomain;
    if (!slug) return;
    setDeploymentForm((previous) => ({
      ...previous,
      subdomain: slug,
    }));
    setSubdomainAvailability({
      subdomain: slug,
      available: true,
      status: "available",
      reason: "available",
      label:
        typeof suggestion === "object" && suggestion?.label
          ? suggestion.label
          : null,
      alternatives: [],
    });
  };

  const handleSubdomainInputChange = (value) => {
    const normalized = value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 40);
    setDeploymentForm((previous) => ({
      ...previous,
      subdomain: normalized,
    }));
  };

  const isKnownAvailableSuggestion = (slug) =>
    (subdomainState.suggestions || []).some((item) => item.subdomain === slug);

  const isSubdomainDeployReady =
    Boolean(deploymentForm.subdomain) &&
    (isKnownAvailableSuggestion(deploymentForm.subdomain) ||
      (subdomainAvailability.subdomain === deploymentForm.subdomain &&
        (subdomainAvailability.available === true ||
          subdomainAvailability.reason === "redeploy-reuse")));

  const isGitSourceDeployReady =
    Boolean(deploymentForm.branch) &&
    Boolean(deploymentForm.commit?.hash);

  const formatCommitLabel = (commit) => {
    if (!commit?.hash) return "";
    const sha = String(commit.hash).slice(0, 8);
    const message = String(commit.message || "")
      .split("\n")[0]
      .trim()
      .slice(0, 72);
    const author = commit.author ? ` · ${commit.author}` : "";
    return `${sha} — ${message || "Commit"}${author}`;
  };

  const subdomainChipOptions = (() => {
    const map = new Map();
    (subdomainState.suggestions || []).forEach((item) => {
      map.set(item.subdomain, item);
    });
    if (subdomainAvailability.available === false) {
      (subdomainAvailability.alternatives || []).forEach((item) => {
        map.set(item.subdomain, item);
      });
    }
    return Array.from(map.values());
  })();

  const handleCreateDeployment = async () => {
    if (isEnvCapacityReached(deploymentForm.environment)) return;
    if (!isGitSourceDeployReady) return;

    try {
      const payload = await dispatch(
        createDeployment({
          projectId: id,
          deploymentData: {
            environment: deploymentForm.environment,
            subdomain: deploymentForm.subdomain || undefined,
            branch: deploymentForm.branch,
            commit: {
              hash: deploymentForm.commit.hash,
              message: deploymentForm.commit.message,
              author: deploymentForm.commit.author,
              timestamp: deploymentForm.commit.timestamp,
              url: deploymentForm.commit.url,
            },
            ...(deployPrefillRef.current?.sourceDeploymentId
              ? {
                  redeployFromDeploymentId:
                    deployPrefillRef.current.sourceDeploymentId,
                }
              : {}),
          },
        }),
      ).unwrap();

      dispatch(
        fetchProjectDeployments({ projectId: id, _noCache: true, silent: true }),
      );

      const created =
        payload?.data?.deployment ||
        payload?.deployment ||
        null;
      const focusDeploymentId = created?.deploymentId || created?._id || created?.id;
      const pinDeployment = created
        ? {
            ...created,
            _id: created._id || created.id,
            id: created.id || created._id,
          }
        : null;

      // Close modal first so UI updates immediately, then open deployments tab with panel intent
      handleCloseDeployModal();
      navigate(`/dashboard/projects/${id}/deployments`, {
        replace: false,
        state: {
          openLatestDeploymentPanel: true,
          openDeploymentsSeq: Date.now(),
          ...(pinDeployment ? { pinDeployment } : {}),
          ...(focusDeploymentId ? { focusDeploymentId: String(focusDeploymentId) } : {}),
        },
      });
    } catch {
      // Deployment errors are surfaced from Redux in the modal.
    }
  };

  useEffect(() => {
    if (!showDeployModal || !id) {
      return;
    }
    let cancelled = false;

    const loadSubdomains = async () => {
      try {
        const result = await dispatch(
          fetchDeploymentSubdomains({
            projectId: id,
            environment: deploymentForm.environment,
          }),
        ).unwrap();

        if (cancelled) return;

        setSubdomainState({
          suggestions: result.suggestions || [],
          capacity: result.capacity || null,
        });

        if (!cancelled && result.suggestions?.length) {
          const first = result.suggestions[0];
          setDeploymentForm((previous) =>
            previous.subdomain
              ? previous
              : { ...previous, subdomain: first.subdomain },
          );
          if (!cancelled) {
            setSubdomainAvailability({
              subdomain: first.subdomain,
              available: true,
              status: "available",
              reason: "available",
              label: first.label || null,
              alternatives: [],
            });
          }
        }
      } catch {
        // Deployment slice captures suggestion errors
      }
    };

    loadSubdomains();
    return () => {
      cancelled = true;
    };
  }, [dispatch, id, showDeployModal, deploymentForm.environment]);

  useEffect(() => {
    if (!showDeployModal) return undefined;

    const repoCtx = getDeployRepoContext();
    if (!repoCtx) {
      setGitSourceState((prev) => ({
        ...prev,
        loadingBranches: false,
        error: "Repository is not linked to this project.",
      }));
      return undefined;
    }

    let cancelled = false;

    const loadBranches = async () => {
      setGitSourceState((prev) => ({
        ...prev,
        loadingBranches: true,
        error: null,
      }));
      try {
        const branches = await projectCreationService.getBranches(
          repoCtx.provider,
          repoCtx.owner,
          repoCtx.repo,
          { fullName: repoCtx.fullName },
        );
        if (cancelled) return;

        const branchNames = (branches || [])
          .map((b) => b.name)
          .filter(Boolean);
        const defaultBranch =
          deployPrefillRef.current?.branch ||
          deploymentForm.branch ||
          repoCtx.defaultBranch ||
          branchNames[0] ||
          "main";
        const resolvedBranch = branchNames.includes(defaultBranch)
          ? defaultBranch
          : branchNames[0] || defaultBranch;

        setGitSourceState((prev) => ({
          ...prev,
          branches: branchNames,
          loadingBranches: false,
        }));
        setDeploymentForm((prev) => ({
          ...prev,
          branch: branchTouchedRef.current ? prev.branch : resolvedBranch,
          commit: commitTouchedRef.current
            ? prev.commit
            : deployPrefillRef.current?.commit || prev.commit || null,
        }));
      } catch (err) {
        if (cancelled) return;
        setGitSourceState((prev) => ({
          ...prev,
          loadingBranches: false,
          error:
            err?.message ||
            "Failed to load branches. Connect your git provider in settings.",
        }));
      }
    };

    loadBranches();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once per modal open
  }, [showDeployModal, currentProject?.repository?.url]);

  useEffect(() => {
    if (!showDeployModal || !deploymentForm.branch) return undefined;

    const repoCtx = getDeployRepoContext();
    if (!repoCtx) return undefined;

    let cancelled = false;

    const loadCommits = async () => {
      setGitSourceState((prev) => ({
        ...prev,
        loadingCommits: true,
        error: null,
      }));
      try {
        const commits = await projectCreationService.getCommits(
          repoCtx.provider,
          repoCtx.owner,
          repoCtx.repo,
          {
            branch: deploymentForm.branch,
            per_page: 30,
            fullName: repoCtx.fullName,
          },
        );
        if (cancelled) return;

        const list = Array.isArray(commits) ? commits : [];
        const findCommitInList = (commit) => {
          if (!commit?.hash || !list.length) return null;
          const needle = String(commit.hash).trim();
          return (
            list.find(
              (row) =>
                row.hash === needle ||
                String(row.hash || "").startsWith(needle.slice(0, 7)) ||
                needle.startsWith(String(row.hash || "").slice(0, 7)),
            ) || commit
          );
        };

        setGitSourceState((prev) => ({
          ...prev,
          commits: list,
          loadingCommits: false,
        }));
        setDeploymentForm((prev) => {
          if (commitTouchedRef.current && prev.commit?.hash) {
            return { ...prev, commit: findCommitInList(prev.commit) || prev.commit };
          }
          const prefillCommit = deployPrefillRef.current?.commit;
          const isRedeploy = Boolean(deployPrefillRef.current?.sourceDeploymentId);
          // Redeploy: default to branch HEAD (newest), not the superseded deployment's commit.
          let selectedCommit = list[0] || null;
          if (!isRedeploy && prefillCommit?.hash) {
            selectedCommit = findCommitInList(prefillCommit) || prefillCommit;
          }
          return { ...prev, commit: selectedCommit };
        });
      } catch (err) {
        if (cancelled) return;
        setGitSourceState((prev) => ({
          ...prev,
          loadingCommits: false,
          commits: [],
          error: err?.message || "Failed to load commits for this branch.",
        }));
        setDeploymentForm((prev) => ({ ...prev, commit: null }));
      }
    };

    loadCommits();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- branch-driven fetch
  }, [showDeployModal, deploymentForm.branch, currentProject?.repository?.url]);

  useEffect(() => {
    if (!showDeployModal || !id) return undefined;
    const slug = deploymentForm.subdomain?.trim();
    if (!slug || slug.length < 2) {
      setSubdomainAvailability((prev) =>
        prev.subdomain ? { ...prev, subdomain: "", available: null } : prev,
      );
      return undefined;
    }

    if (isKnownAvailableSuggestion(slug)) {
      const match = subdomainState.suggestions.find((s) => s.subdomain === slug);
      setSubdomainAvailability({
        subdomain: slug,
        available: true,
        status: "available",
        reason: "available",
        label: match?.label || null,
        alternatives: [],
      });
      return undefined;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const result = await dispatch(
          checkDeploymentSubdomain({
            projectId: id,
            subdomain: slug,
            environment: deploymentForm.environment,
            redeployFromDeploymentId:
              deployPrefillRef.current?.sourceDeploymentId || undefined,
          }),
        ).unwrap();
        if (cancelled) return;
        setSubdomainAvailability({
          subdomain: result.subdomain || slug,
          available: result.available ?? false,
          status: result.status || null,
          reason: result.reason || null,
          label: result.label || null,
          alternatives: result.alternatives || [],
        });
      } catch {
        if (!cancelled) {
          setSubdomainAvailability((prev) => ({
            ...prev,
            subdomain: slug,
            available: null,
          }));
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    dispatch,
    id,
    showDeployModal,
    deploymentForm.subdomain,
    deploymentForm.environment,
    subdomainState.suggestions,
  ]);

  useEffect(() => {
    if (!showDeployModal) return undefined;

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleCloseDeployModal();
      }
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [showDeployModal]);

  // Helper functions
  const detectTechnology = (project) => {
    // Check technology.primary first
    if (
      project?.technology?.primary &&
      project.technology.primary !== "other"
    ) {
      return project.technology.primary;
    }

    if (project?.stack?.detected?.primary) {
      return project.stack.detected.primary;
    }

    if (project?.analysis?.stack) {
      return project.analysis.stack;
    }

    // Check stackAnalysis
    if (project?.stackAnalysis?.primary?.name) {
      return project.stackAnalysis.primary.name;
    }

    // Check aiAnalysis technologyStack
    if (project?.aiAnalysis?.technologyStack?.dependencies?.length > 0) {
      return project.aiAnalysis.technologyStack.dependencies[0];
    }

    // Fallback to name-based detection
    const name = project?.name?.toLowerCase() || "";
    if (name.includes("vue") || name.includes("nuxt")) return "Vue.js";
    if (name.includes("react") || name.includes("next")) return "React";
    if (
      name.includes("python") ||
      name.includes("django") ||
      name.includes("fastapi")
    )
      return "Python";
    if (name.includes("node") || name.includes("express")) return "Node.js";
    if (name.includes("api")) return "API";
    return "Unknown";
  };

  const getStatusBadge = getProjectStatusBadge;

  const ACTIVE_DEPLOYMENT_STATUSES = new Set([
    "pending",
    "queued",
    "cloning",
    "detecting",
    "building",
    "deploying",
    "running",
    "stopping",
  ]);

  const countActiveDeployments = (deployments) =>
    (deployments || []).filter((deployment) =>
      ACTIVE_DEPLOYMENT_STATUSES.has(
        String(deployment?.status || "").toLowerCase(),
      ),
    ).length;

  const getFrameworkIcon = (framework) => {
    if (!framework) return <FaCode className="w-4 h-4 text-gray-400" />;
    const fw = framework.toLowerCase();
    switch (true) {
      case fw.includes("react"):
        return <FaCode className="w-4 h-4 text-blue-400" />;
      case fw.includes("vue"):
        return <FaCode className="w-4 h-4 text-green-400" />;
      case fw.includes("node"):
        return <FaCode className="w-4 h-4 text-green-500" />;
      case fw.includes("python"):
        return <FaCode className="w-4 h-4 text-yellow-400" />;
      default:
        return <FaCode className="w-4 h-4 text-gray-400" />;
    }
  };
  const shouldShowProjectLoading =
    loading.currentProject || (!hasLoadedProjectOnce && !currentProject);

  if (shouldShowProjectLoading) {
    return (
      <div className="min-h-screen">
        <SEO
          title="Loading Project - DeployIO"
          description="Loading project details..."
        />

        {/* Header Skeleton */}
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 bg-neutral-700/50 rounded-lg animate-pulse"></div>
            <div className="h-8 bg-neutral-700/50 rounded w-48 animate-pulse"></div>
          </div>
          <div className="h-4 bg-neutral-700/50 rounded w-96 animate-pulse mb-2"></div>
          <div className="h-4 bg-neutral-700/50 rounded w-64 animate-pulse"></div>
        </motion.div>

        {/* Tab Navigation Skeleton */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-10 bg-neutral-700/50 rounded-lg w-24 animate-pulse"
            ></div>
          ))}
        </div>

        {/* Content Loading */}
        <div className="space-y-8">
          <LoadingGrid columns={3} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <LoadingChart height="h-64" />
            <LoadingChart height="h-64" />
          </div>
        </div>
      </div>
    );
  }

  const projectNotFound =
    hasLoadedProjectOnce &&
    !loading.currentProject &&
    !currentProject;

  if (projectNotFound) {
    return (
      <div className="text-center py-16">
        <FaProjectDiagram className="w-16 h-16 mx-auto mb-4 opacity-50 text-gray-400" />
        <h3 className="text-xl font-semibold mb-2 text-white">
          Project Not Found
        </h3>
        <p className="text-gray-400 mb-4">
          This project may have been deleted or you do not have access to it.
        </p>
        <button
          onClick={() => navigate("/dashboard/projects")}
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
        >
          Back to Projects
        </button>
      </div>
    );
  }

  if (!currentProject) {
    return null;
  }

  const isArchived =
    currentProject.status === "archived" || currentProject.isArchived;
  const isOwner =
    currentProject.isOwner ?? currentProject.membershipRole === "owner";
  const activeDeploymentCount =
    countActiveDeployments(projectDeployments) ||
    currentProject.activeDeploymentCount ||
    0;
  const canDelete =
    deleteConfirmName.trim() === (currentProject.name || "").trim();
  const projectErrorMessage =
    typeof error.currentProject === "string"
      ? error.currentProject
      : error.currentProject?.message || null;

  const tabs = [
    { id: "overview", label: "Overview", icon: FaEye },
    { id: "analysis", label: "Analysis", icon: FaCode },
    { id: "deployments", label: "Deployments", icon: FaRocket },
    { id: "analytics", label: "Analytics", icon: FaChartLine },
    { id: "settings", label: "Settings", icon: FaCog },
  ];

  return (
    <>
      <SEO page="project-details" title={currentProject.name} />

      {isArchived && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-3 flex items-start gap-3"
        >
          <FaExclamationTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-orange-200">Project archived</p>
            <p className="text-xs text-orange-200/80 mt-1">
              Deployments are stopped and configuration is read-only. Unarchive to
              deploy or edit again.
            </p>
          </div>
        </motion.div>
      )}

      {/* Header - Mobile Responsive */}
      <motion.div
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="mb-6 sm:mb-8"
      >
        {/* Project Header - Mobile Responsive */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            <div className="p-2 sm:p-3 bg-blue-500/20 rounded-xl flex-shrink-0">
              <FaProjectDiagram className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
            </div>
            <div className="min-w-0 flex-1">
              {isEditing ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, name: e.target.value })
                    }
                    className="text-xl sm:text-3xl font-bold text-white bg-transparent border-b border-gray-500 focus:border-blue-500 outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleUpdateProject}
                      className="p-2 text-green-400 hover:text-green-300"
                    >
                      <FaCheck className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="p-2 text-red-400 hover:text-red-300"
                    >
                      <FaTimes className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <h1 className="text-xl sm:text-3xl font-bold text-white heading truncate">
                    {currentProject.name}
                  </h1>
                  {isOwner && (
                    <button
                      onClick={() => setIsEditing(true)}
                      disabled={isArchived}
                      className={`p-2 transition-colors self-start ${
                        isArchived
                          ? "text-gray-600 cursor-not-allowed"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      <FaEdit className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2">
                {getFrameworkIcon(detectTechnology(currentProject))}
                <span className="text-gray-400 text-sm truncate">
                  {detectTechnology(currentProject)}
                </span>
                <span
                  className={getStatusBadge(
                    isArchived ? "archived" : currentProject.status || "active",
                  )}
                >
                  {isArchived ? "Archived" : "Active"}
                </span>
                {!isOwner && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Collaborator
                  </span>
                )}
                {activeDeploymentCount > 0 && (
                  <span className={getStatusBadge("running")}>
                    {activeDeploymentCount} deployment
                    {activeDeploymentCount === 1 ? "" : "s"} running
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons - Mobile Responsive */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              disabled={isArchived}
              onClick={handleOpenDeployModal}
              className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm transition-colors ${
                isArchived
                  ? "bg-gray-500/20 border border-gray-500/30 text-gray-500 cursor-not-allowed"
                  : "bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30"
              }`}
            >
              <FaRocket className="w-4 h-4" />
              <span className="sm:inline">Deploy</span>
            </button>
            {isOwner && (
              <button
                onClick={handleArchiveToggle}
                className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-400 hover:bg-yellow-500/30 transition-colors text-sm"
              >
                <FaArchive className="w-4 h-4" />
                <span className="sm:inline">
                  {isArchived ? "Unarchive" : "Archive"}
                </span>
              </button>
            )}
            {isOwner && (
              <button
                onClick={handleDeleteProject}
                disabled={loading.deleting}
                className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaTrash className="w-4 h-4" />
                <span className="sm:inline">Delete</span>
              </button>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="mt-4">
          {isEditing ? (
            <textarea
              value={editFormData.description}
              onChange={(e) =>
                setEditFormData({
                  ...editFormData,
                  description: e.target.value,
                })
              }
              disabled={isArchived}
              className={`w-full p-3 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-gray-300 resize-none focus:border-blue-500/50 focus:outline-none ${
                isArchived ? "opacity-50 cursor-not-allowed" : ""
              }`}
              rows="3"
              placeholder="Project description..."
            />
          ) : (
            <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
              {currentProject.description || "No description available"}
            </p>
          )}
        </div>
      </motion.div>

      {/* Tabs - Mobile Responsive */}
      <motion.div
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="border-b border-neutral-800/50 mb-6 sm:mb-8"
      >
        <nav className="flex space-x-4 sm:space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 py-3 sm:py-4 px-2 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm sm:text-base">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </motion.div>

      {/* Tab Content */}
      <motion.div
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
      >
        {activeTab === "overview" ? (
          <ProjectOverview
            project={currentProject}
            deployments={projectDeployments}
            isArchived={isArchived}
            onOpenDeployModal={handleOpenDeployModal}
            onNavigateDeployments={() =>
              navigate(`/dashboard/projects/${id}/deployments`)
            }
          />
        ) : (
          <Outlet
            context={{
              project: currentProject,
              deployments: projectDeployments,
              analytics: projectAnalytics,
              isArchived,
              onOpenDeployModal: isArchived ? undefined : handleOpenDeployModal,
              onRedeployFromDeployment: isArchived
                ? undefined
                : handleRedeployFromDeployment,
            }}
          />
        )}
      </motion.div>

      {showDeployModal && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="deploy-modal-title"
        >
          <div
            className="absolute inset-0 bg-black/70"
            onClick={handleCloseDeployModal}
            aria-hidden="true"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.15 }}
            className="relative z-10 flex w-full max-w-2xl max-h-[min(90vh,840px)] flex-col overflow-hidden rounded-2xl border border-neutral-800/70 bg-neutral-950/95 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-neutral-800/60 px-5 py-4 sm:px-6 sm:py-5">
              <div className="min-w-0 pr-2">
                <h3
                  id="deploy-modal-title"
                  className="text-xl font-semibold text-white"
                >
                  {deployModalMode === "redeploy"
                    ? "Redeploy"
                    : "Create Deployment"}
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  {deployModalMode === "redeploy"
                    ? "Start a new deployment. You can change branch, commit, or subdomain."
                    : "Reserve a subdomain and send the project to the agent."}
                </p>
                {subdomainState.capacity && (
                  <div className="text-xs text-gray-400 mt-2">
                    Active deployments:{" "}
                    {subdomainState.capacity.activeDeployments} /{" "}
                    {subdomainState.capacity.maxDeployments}
                    {typeof subdomainState.capacity
                      .activeDeploymentsInEnvironment === "number" && (
                      <span>
                        {" "}
                        · In env:{" "}
                        {subdomainState.capacity.activeDeploymentsInEnvironment}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={handleCloseDeployModal}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6 space-y-5">
            {currentProject?.deployment?.dockerfile?.path && (
              <div className="rounded-xl border border-neutral-800/70 bg-neutral-900/50 px-4 py-3 flex items-center gap-3">
                <FaDocker className="w-4 h-4 text-blue-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-400">Dockerfile</p>
                  <p className="text-sm text-white font-mono truncate">
                    {currentProject.deployment.dockerfile.path}
                  </p>
                </div>
                {(() => {
                  const envVars = currentProject.deployment?.environment?.[deploymentForm.environment];
                  const count = Array.isArray(envVars) ? envVars.length : 0;
                  return count > 0 ? (
                    <span className="ml-auto shrink-0 text-xs text-gray-400">
                      {count} env var{count !== 1 ? "s" : ""} ({deploymentForm.environment})
                    </span>
                  ) : null;
                })()}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-3">
              <button
                type="button"
                onClick={() => handleDeploymentEnvironmentChange("development")}
                disabled={isEnvCapacityReached("development")}
                className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                  deploymentForm.environment === "development"
                    ? "border-amber-500/50 bg-amber-500/10 text-amber-200"
                    : "border-neutral-800 bg-neutral-900/70 text-gray-300 hover:border-neutral-700"
                }`}
              >
                <div className="font-medium">Development</div>
                <div className="text-xs text-gray-400 mt-1">
                  Local iteration and quick experiments.
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleDeploymentEnvironmentChange("staging")}
                disabled={isEnvCapacityReached("staging")}
                className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                  deploymentForm.environment === "staging"
                    ? "border-blue-500/50 bg-blue-500/10 text-blue-200"
                    : "border-neutral-800 bg-neutral-900/70 text-gray-300 hover:border-neutral-700"
                }`}
              >
                <div className="font-medium">Staging</div>
                <div className="text-xs text-gray-400 mt-1">
                  Safer pre-production rollout.
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleDeploymentEnvironmentChange("production")}
                disabled={isEnvCapacityReached("production")}
                className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                  deploymentForm.environment === "production"
                    ? "border-green-500/50 bg-green-500/10 text-green-200"
                    : "border-neutral-800 bg-neutral-900/70 text-gray-300 hover:border-neutral-700"
                }`}
              >
                <div className="font-medium">Production</div>
                <div className="text-xs text-gray-400 mt-1">
                  Live traffic deployment target.
                </div>
              </button>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-4 space-y-4">
              <div>
                <div className="text-sm font-medium text-white mb-1">
                  Source branch & commit
                </div>
                <div className="text-xs text-gray-400 mb-3">
                  Each environment can run a different branch. Pick the exact
                  commit to deploy.
                </div>
                {gitSourceState.error && (
                  <div className="mb-3 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                    {gitSourceState.error}
                  </div>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">
                      Branch
                    </label>
                    <select
                      value={deploymentForm.branch}
                      onChange={(e) => {
                        branchTouchedRef.current = true;
                        commitTouchedRef.current = false;
                        setDeploymentForm((prev) => ({
                          ...prev,
                          branch: e.target.value,
                          commit: null,
                        }));
                      }}
                      disabled={
                        gitSourceState.loadingBranches ||
                        !gitSourceState.branches.length
                      }
                      className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white disabled:opacity-50"
                    >
                      {gitSourceState.loadingBranches && (
                        <option value="">Loading branches...</option>
                      )}
                      {!gitSourceState.loadingBranches &&
                        gitSourceState.branches.map((branchName) => (
                          <option key={branchName} value={branchName}>
                            {branchName}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">
                      Commit
                    </label>
                    {deployModalMode === "redeploy" && (
                      <p className="text-[11px] text-neutral-500 mb-1.5">
                        Defaults to the latest commit on this branch. Your
                        selection is kept if the list reloads.
                      </p>
                    )}
                    <select
                      value={deploymentForm.commit?.hash || ""}
                      onChange={(e) => {
                        const selected = gitSourceState.commits.find(
                          (c) =>
                            c.hash === e.target.value ||
                            String(c.hash || "").startsWith(
                              String(e.target.value).slice(0, 7),
                            ),
                        );
                        commitTouchedRef.current = true;
                        setDeploymentForm((prev) => ({
                          ...prev,
                          commit: selected || null,
                        }));
                      }}
                      disabled={
                        gitSourceState.loadingCommits ||
                        !gitSourceState.commits.length
                      }
                      className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white disabled:opacity-50"
                    >
                      {gitSourceState.loadingCommits && (
                        <option value="">Loading commits...</option>
                      )}
                      {!gitSourceState.loadingCommits &&
                        gitSourceState.commits.map((commit) => (
                          <option key={commit.hash} value={commit.hash}>
                            {formatCommitLabel(commit)}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <div className="text-sm font-medium text-white">
                    Reserved Subdomain
                  </div>
                  <div className="text-xs text-gray-400">
                    Enter a subdomain or pick a suggestion. Availability is
                    checked in real time.
                  </div>
                </div>
                {(deploymentLoading.subdomains ||
                  deploymentLoading.subdomainCheck) && (
                  <div className="text-xs text-gray-400 shrink-0">
                    {deploymentLoading.subdomains
                      ? "Loading..."
                      : "Checking..."}
                  </div>
                )}
              </div>

              {deploymentError?.create && (
                <div className="mb-3 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                  {deploymentError.create}
                </div>
              )}

              {deploymentError?.subdomains && (
                <div className="mb-3 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                  {deploymentError.subdomains}
                </div>
              )}

              {isEnvCapacityReached(deploymentForm.environment) && (
                <div className="mb-3 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3 text-sm text-yellow-200">
                  This environment already has the maximum number of active
                  deployments ({subdomainState.capacity?.maxDeployments}). Stop
                  or delete an existing active deployment in this environment to
                  create a new one.
                </div>
              )}

              <div className="mb-3">
                <label className="text-xs text-gray-400 mb-1 block">
                  Subdomain
                </label>
                <input
                  type="text"
                  value={deploymentForm.subdomain}
                  onChange={(e) => handleSubdomainInputChange(e.target.value)}
                  disabled={isEnvCapacityReached(deploymentForm.environment)}
                  placeholder="my-app-staging"
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white placeholder:text-gray-500 disabled:opacity-50"
                  autoComplete="off"
                  spellCheck={false}
                />
                {deploymentForm.subdomain &&
                  subdomainAvailability.subdomain ===
                    deploymentForm.subdomain &&
                  subdomainAvailability.available !== null && (
                    <p
                      className={`mt-2 text-xs ${
                        subdomainAvailability.available
                          ? "text-green-400"
                          : "text-red-300"
                      }`}
                    >
                      {subdomainAvailability.available
                        ? SUBDOMAIN_REASON_LABELS.available
                        : SUBDOMAIN_REASON_LABELS[
                            subdomainAvailability.reason
                          ] || "Unavailable"}
                      {subdomainAvailability.available &&
                        subdomainAvailability.label && (
                          <span className="text-gray-400">
                            {" "}
                            · {subdomainAvailability.label}
                          </span>
                        )}
                    </p>
                  )}
              </div>

              {subdomainChipOptions.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs text-gray-500 mb-2">
                    {subdomainAvailability.available === false
                      ? "Try one of these:"
                      : "Suggestions:"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {subdomainChipOptions.map((suggestion) => {
                      const isSelected =
                        deploymentForm.subdomain === suggestion.subdomain;
                      return (
                        <button
                          key={suggestion.subdomain}
                          type="button"
                          onClick={() => handleSubdomainSelection(suggestion)}
                          disabled={isEnvCapacityReached(
                            deploymentForm.environment,
                          )}
                          className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                            isSelected
                              ? "border-blue-500/60 bg-blue-500/15 text-blue-100"
                              : "border-neutral-700 bg-neutral-950/60 text-gray-300 hover:border-neutral-600"
                          }`}
                          title={suggestion.label}
                        >
                          <span className="font-medium">
                            {suggestion.subdomain}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {!deploymentLoading.subdomains &&
                subdomainChipOptions.length === 0 && (
                  <div className="rounded-lg border border-dashed border-neutral-800 px-3 py-4 text-sm text-gray-400">
                    No suggestions yet. Type a subdomain to check availability.
                  </div>
                )}

              {subdomainState.capacity && (
                <div className="mt-3 text-xs text-gray-400">
                  Active deployments:{" "}
                  {subdomainState.capacity.activeDeployments || 0}
                  {typeof subdomainState.capacity.maxDeployments === "number"
                    ? ` / ${subdomainState.capacity.maxDeployments}`
                    : ""}
                </div>
              )}
            </div>
            </div>

            <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-neutral-800/60 bg-neutral-950/95 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              <button
                type="button"
                onClick={handleCloseDeployModal}
                className="rounded-lg border border-neutral-800 px-4 py-2 text-sm text-gray-300 hover:bg-neutral-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateDeployment}
                disabled={
                  deploymentLoading.create ||
                  !isSubdomainDeployReady ||
                  !isGitSourceDeployReady ||
                  gitSourceState.loadingBranches ||
                  gitSourceState.loadingCommits ||
                  deploymentLoading.subdomainCheck ||
                  isDeploymentCapacityReached ||
                  isEnvCapacityReached(deploymentForm.environment)
                }
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  deploymentLoading.create ||
                  !isSubdomainDeployReady ||
                  !isGitSourceDeployReady ||
                  gitSourceState.loadingBranches ||
                  gitSourceState.loadingCommits ||
                  deploymentLoading.subdomainCheck ||
                  isDeploymentCapacityReached ||
                  isEnvCapacityReached(deploymentForm.environment)
                    ? "cursor-not-allowed bg-gray-600 text-gray-300"
                    : "bg-green-500 text-white hover:bg-green-600"
                }`}
              >
                {deploymentLoading.create
                  ? deployModalMode === "redeploy"
                    ? "Redeploying..."
                    : "Creating..."
                  : deployModalMode === "redeploy"
                    ? "Redeploy"
                    : "Create Deployment"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {projectErrorMessage && !error.update && !error.delete && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-4 right-4 z-40 max-w-sm rounded-lg border border-red-500/20 bg-neutral-950/95 p-4 text-red-400 shadow-lg"
        >
          {projectErrorMessage}
        </motion.div>
      )}

      {error.delete && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-4 right-4 z-40 max-w-sm rounded-lg border border-red-500/20 bg-neutral-950/95 p-4 text-red-400 shadow-lg"
        >
          {error.delete}
        </motion.div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70" onClick={closeDeleteModal} />
          <div className="relative z-10 w-full max-w-md rounded-xl border border-red-500/30 bg-neutral-950/95 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              <FaTrash className="w-4 h-4 text-red-400" />
              Delete project permanently
            </h3>
            <p className="text-gray-400 text-sm mb-3">
              This will stop all running containers, remove deployment records,
              and permanently delete the project from DeployIO. This cannot be undone.
            </p>
            {activeDeploymentCount > 0 && (
              <p className="text-amber-300 text-xs mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
                {activeDeploymentCount} active deployment
                {activeDeploymentCount === 1 ? "" : "s"} will be stopped first.
              </p>
            )}
            <label className="block text-sm text-gray-300 mb-2">
              Type <span className="font-mono text-white">{currentProject.name}</span> to confirm
            </label>
            <input
              type="text"
              value={deleteConfirmName}
              onChange={(e) => setDeleteConfirmName(e.target.value)}
              placeholder={currentProject.name}
              className="w-full mb-4 px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
              autoFocus
            />
            {error.delete && (
              <p className="text-red-400 text-sm mb-3">{error.delete}</p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={loading.deleting}
                className="px-4 py-2 bg-neutral-800 text-gray-300 rounded-lg hover:bg-neutral-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={!canDelete || loading.deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading.deleting ? "Deleting..." : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Confirmation Modal */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => !loading.archiving && setShowArchiveModal(false)} />
          <div className="relative z-10 w-full max-w-md rounded-xl border border-neutral-800/70 bg-neutral-950/95 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-2">
              {isArchived ? "Unarchive Project" : "Archive Project"}
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              {isArchived
                ? "Restore this project to active status so you can deploy and edit configuration again."
                : "Archive stops all deployments and makes the project read-only. You can unarchive it later."}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowArchiveModal(false)}
                disabled={loading.archiving}
                className="px-4 py-2 bg-neutral-800 text-gray-300 rounded-lg hover:bg-neutral-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmArchive}
                disabled={loading.archiving}
                className={`px-4 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                  isArchived
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-yellow-600 hover:bg-yellow-700"
                }`}
              >
                {loading.archiving
                  ? isArchived
                    ? "Unarchiving..."
                    : "Archiving..."
                  : isArchived
                    ? "Unarchive"
                    : "Archive"}
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
};

// Project Overview Component
const ProjectOverview = ({
  project,
  deployments,
  _analytics,
  isArchived = false,
  onOpenDeployModal,
  onNavigateDeployments,
}) => {
  const recentDeployments = Array.isArray(deployments)
    ? deployments.slice(0, 3)
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
      {/* Project Info */}
      <div className="lg:col-span-2 space-y-4 sm:space-y-6">
        {/* Quick Stats - Mobile Responsive */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <FaRocket className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
              <span className="text-gray-400 text-xs sm:text-sm">
                Deployments
              </span>
            </div>
            <span className="text-lg sm:text-2xl font-bold text-white">
              {project.statistics?.totalDeployments ??
                project.deploymentCount ??
                0}
            </span>
          </div>
          <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <FaUsers className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
              <span className="text-gray-400 text-xs sm:text-sm">
                Collaborators
              </span>
            </div>
            <span className="text-lg sm:text-2xl font-bold text-white">
              {project.collaborators?.length || 0}
            </span>
          </div>
          <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <FaChartLine className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
              <span className="text-gray-400 text-xs sm:text-sm">
                Success Rate
              </span>
            </div>
            <span className="text-lg sm:text-2xl font-bold text-white">
              {(project.statistics?.totalDeployments ??
                project.deploymentCount ??
                0) > 0
                ? Math.round(
                    ((project.statistics?.successfulDeployments ??
                      project.successfulDeployments ??
                      0) /
                      (project.statistics?.totalDeployments ??
                        project.deploymentCount ??
                        1)) *
                      100,
                  )
                : 0}
              %
            </span>
          </div>
          <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <FaCalendarAlt className="w-3 h-3 sm:w-4 sm:h-4 text-orange-400" />
              <span className="text-gray-400 text-xs sm:text-sm">Uptime</span>
            </div>
            <span className="text-lg sm:text-2xl font-bold text-white">
              {project.statistics?.uptime || 100}%
            </span>
          </div>
        </div>

        {/* Recent Deployments - Mobile Responsive */}
        <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">
            Recent Deployments
          </h3>
          {recentDeployments.length > 0 ? (
            <div className="space-y-3">
              {recentDeployments.map((deployment) => (
                <div
                  key={deployment._id || deployment.id || deployment.deploymentId}
                  className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-lg"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        deployment.status === "success" ||
                        deployment.status === "running"
                          ? "bg-green-400"
                          : deployment.status === "failed"
                            ? "bg-red-400"
                            : "bg-yellow-400"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-medium text-sm sm:text-base capitalize">
                        {deployment?.environment ||
                          deployment?.config?.environment ||
                          "staging"}
                      </p>
                      <p className="text-gray-400 text-xs sm:text-sm truncate">
                        {new Date(deployment.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs flex-shrink-0 capitalize ${
                      deployment.status === "success" ||
                      deployment.status === "running"
                        ? "bg-green-500/20 text-green-400"
                        : deployment.status === "failed"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-yellow-500/20 text-yellow-400"
                    }`}
                  >
                    {deployment.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8">
              <FaRocket className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 opacity-50 text-gray-400" />
              <p className="text-gray-400 text-sm sm:text-base">
                No deployments yet
              </p>
            </div>
          )}
        </div>

        {/* Repository Info - Mobile Responsive */}
        <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">
            Repository
          </h3>
          <div className="flex items-center gap-3 p-3 sm:p-4 bg-neutral-800/50 rounded-lg">
            <FaGithub className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm sm:text-base truncate">
                {project.repository?.url || "No repository connected"}
              </p>
              <p className="text-gray-400 text-xs sm:text-sm">
                Last updated:{" "}
                {project.repository?.lastSync
                  ? new Date(project.repository.lastSync).toLocaleString()
                  : "Never"}
              </p>
            </div>
            {project.repository?.url && (
              <a
                href={project.repository.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded text-sm hover:bg-blue-500/30 transition-colors flex-shrink-0"
              >
                <FaExternalLinkAlt className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar - Mobile Responsive */}
      <div className="space-y-4 sm:space-y-6">
        {/* Quick Actions - Mobile Responsive */}
        <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-white mb-4">
            Quick Actions
          </h3>
          <div className="space-y-2 sm:space-y-3">
            <button
              type="button"
              onClick={onOpenDeployModal}
              disabled={isArchived || !onOpenDeployModal}
              className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm transition-colors ${
                isArchived || !onOpenDeployModal
                  ? "bg-gray-500/20 border border-gray-500/30 text-gray-500 cursor-not-allowed"
                  : "bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30"
              }`}
            >
              <FaPlay className="w-4 h-4" />
              New Deployment
            </button>
            <button
              type="button"
              onClick={onNavigateDeployments}
              className="w-full flex items-center gap-3 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors text-sm"
            >
              <FaRocket className="w-4 h-4" />
              View Deployments
            </button>
          </div>
        </div>

        {/* Project Status - Mobile Responsive */}
        <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-white mb-4">
            Status
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-400 text-sm">Lifecycle</span>
              <span className="text-white text-sm capitalize">
                {isArchived ? "Archived" : project.status || "Active"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-400 text-sm">Branch</span>
              <span className="text-white text-sm font-mono truncate max-w-[140px]">
                {project.repository?.defaultBranch ||
                  project.repository?.branch ||
                  "main"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-400 text-sm flex items-center gap-1">
                <FaDocker className="w-3 h-3" /> Dockerfile
              </span>
              <span className="text-white text-xs font-mono truncate max-w-[140px]">
                {project.deployment?.dockerfile?.path || "Dockerfile"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-400 text-sm">Last Deploy</span>
              <span className="text-white text-sm">
                {project.deployment?.lastDeploy
                  ? new Date(project.deployment.lastDeploy).toLocaleDateString()
                  : "Never"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-400 text-sm">Created</span>
              <span className="text-white text-sm">
                {new Date(project.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProjectDetails;
