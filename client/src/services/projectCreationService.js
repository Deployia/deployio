import api from "../utils/api";

class ProjectCreationService {
  async discoverDockerfiles(repositoryData) {
    const response = await api.post(
      "/projects/creation/discover-dockerfiles",
      repositoryData,
    );
    return response.data?.data || response.data;
  }

  async analyzeRepository(repositoryData) {
    const response = await api.post(
      "/projects/creation/analyze",
      repositoryData,
    );
    return response.data?.data || response.data;
  }

  async completeWithPayload(payload) {
    const response = await api.post("/projects/creation/complete", payload);
    return response.data?.data || response.data;
  }

  async getGitProviders() {
    const response = await api.get("/git/providers");
    return response.data?.data || response.data;
  }

  async connectGitProvider(provider, authData) {
    const response = await api.post(`/git/connect/${provider}`, authData);
    return response.data?.data || response.data;
  }

  async getRepositories(provider, options = {}) {
    const params = new URLSearchParams();

    if (options.search) params.append("search", options.search);
    if (options.page) params.append("page", options.page);
    if (options.per_page) params.append("per_page", options.per_page);
    if (options.type) params.append("type", options.type);

    const response = await api.get(
      `/users/git-providers/${provider}/repositories?${params.toString()}`,
    );
    return response.data?.data || response.data;
  }

  async getCommits(provider, owner, repo, options = {}) {
    const apiProvider =
      provider === "azure-devops" || provider === "azure"
        ? "azuredevops"
        : provider;
    const params = new URLSearchParams();
    if (options.branch) {
      params.set("branch", options.branch);
    }
    if (options.per_page) {
      params.set("per_page", String(options.per_page));
    }
    if (options.fullName) {
      params.set("fullName", options.fullName);
    }
    const query = params.toString() ? `?${params.toString()}` : "";
    const response = await api.get(
      `/users/git-providers/${apiProvider}/repositories/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits${query}`,
    );
    return response.data?.data || response.data;
  }

  async getBranches(provider, owner, repo, options = {}) {
    const apiProvider =
      provider === "azure-devops" || provider === "azure"
        ? "azuredevops"
        : provider;
    const params = new URLSearchParams();
    if (options.fullName) {
      params.set("fullName", options.fullName);
    }
    const query = params.toString() ? `?${params.toString()}` : "";
    const response = await api.get(
      `/users/git-providers/${apiProvider}/repositories/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches${query}`,
    );
    return response.data?.data || response.data;
  }

  async getRepositoryDetails(provider, owner, repo) {
    const response = await api.get(
      `/users/git-providers/${provider}/repositories/${owner}/${repo}`,
    );
    return response.data?.data || response.data;
  }

  extractRepositoryInfo(repoUrl) {
    const patterns = {
      github: /github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?$/,
      gitlab: /gitlab\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?$/,
      "azure-devops":
        /dev\.azure\.com\/([^/]+)\/([^/]+)\/_git\/([^/]+?)(?:\.git)?$/,
    };

    for (const [provider, pattern] of Object.entries(patterns)) {
      const match = repoUrl.match(pattern);
      if (!match) continue;

      if (provider === "azure-devops") {
        return {
          provider,
          organization: match[1],
          project: match[2],
          repo: match[3],
          owner: `${match[1]}/${match[2]}`,
          name: match[3],
        };
      }

      return {
        provider,
        owner: match[1],
        name: match[2],
        repo: match[2],
      };
    }

    return null;
  }

  validateStepData(step, data) {
    const validators = {
      1: (value) => value.selectedProvider,
      2: (value) => value.selectedRepository && value.selectedRepository.url,
      3: (value) => value.selectedBranch,
      4: (value) => value.selectedDockerfile?.path,
      5: (value) =>
        value.analysisResults || value.analysisStatus === "completed",
      6: (value) => value.projectName,
      7: (value) => value.finalConfiguration === true,
    };

    return validators[step] ? validators[step](data) : true;
  }

  calculateProgress(currentStep, completedSteps = []) {
    const totalSteps = 7;
    const baseProgress = ((currentStep - 1) / totalSteps) * 100;
    const completionBonus = (completedSteps.length / totalSteps) * 10;

    return Math.min(baseProgress + completionBonus, 100);
  }

  handleApiError(error) {
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 400:
          return {
            type: "validation",
            message: data.message || "Invalid request data",
          };
        case 401:
          return { type: "auth", message: "Please log in to continue" };
        case 404:
          return { type: "not_found", message: "Resource not found" };
        case 429:
          return {
            type: "rate_limit",
            message: "Too many requests. Please wait and try again.",
          };
        case 500:
          return {
            type: "server",
            message: "Server error. Please try again later.",
          };
        default:
          return {
            type: "unknown",
            message: data.message || "An unexpected error occurred",
          };
      }
    }

    if (error.request) {
      return {
        type: "network",
        message: "Network error. Please check your connection.",
      };
    }

    return {
      type: "client",
      message: error.message || "An unexpected error occurred",
    };
  }
}

export default new ProjectCreationService();
