const axios = require("axios");
const BaseGitProvider = require("./BaseProvider");

class AzureDevOpsProvider extends BaseGitProvider {
  constructor(accessToken) {
    super(accessToken, {
      name: "Azure DevOps",
      apiVersion: "7.0",
    });
    this.apiVersion = "7.0";
  }

  getBaseURL() {
    return "https://dev.azure.com";
  }

  getDefaultHeaders() {
    return {
      Authorization: `Bearer ${this.accessToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    };
  }

  async _request(url, options = {}) {
    const response = await axios({
      method: options.method || "GET",
      url,
      headers: { ...this.headers, ...options.headers },
      params: { "api-version": this.apiVersion, ...options.params },
      data: options.data,
      timeout: 30000,
    });
    return response.data;
  }

  async getCurrentUser() {
    const profile = await this._request(
      "https://app.vssps.visualstudio.com/_apis/profile/profiles/me",
    );
    return this.normalizeUser({
      id: profile.id,
      displayName: profile.displayName,
      email: profile.emailAddress,
    });
  }

  async getUser() {
    return this.getCurrentUser();
  }

  async _listOrganizations() {
    const data = await this._request(
      "https://app.vssps.visualstudio.com/_apis/accounts",
    );
    return data.value || [];
  }

  async getRepositories(options = {}) {
    const { maxOrgs = 5, maxReposPerOrg = 50 } = options;
    const organizations = await this._listOrganizations();
    const repositories = [];

    for (const org of organizations.slice(0, maxOrgs)) {
      const orgName = org.accountName;
      if (!orgName) continue;

      try {
        const data = await this._request(
          `https://dev.azure.com/${encodeURIComponent(orgName)}/_apis/git/repositories`,
          { params: { $top: maxReposPerOrg } },
        );
        (data.value || []).forEach((repo) => {
          repositories.push(this.normalizeRepository(repo, orgName));
        });
      } catch (error) {
        console.error(`Azure DevOps list repos failed for org ${orgName}:`, error.message);
      }
    }

    return {
      repositories,
      pagination: {
        page: 1,
        per_page: repositories.length,
        total_count: repositories.length,
        has_more: false,
      },
    };
  }

  async getRepository(owner, repo) {
    const { organization, project } = this._parseOwnerProject(owner);
    const data = await this._request(
      `https://dev.azure.com/${encodeURIComponent(organization)}/${encodeURIComponent(project)}/_apis/git/repositories/${encodeURIComponent(repo)}`,
    );
    return this.normalizeRepository(data, organization);
  }

  async getBranches(owner, repo) {
    const { organization, project } = this._parseOwnerProject(owner);
    const data = await this._request(
      `https://dev.azure.com/${encodeURIComponent(organization)}/${encodeURIComponent(project)}/_apis/git/repositories/${encodeURIComponent(repo)}/refs`,
      { params: { filter: "heads" } },
    );
    return (data.value || [])
      .filter((ref) => ref.name?.startsWith("refs/heads/"))
      .map((ref) =>
        this.normalizeBranch({
          name: ref.name.replace(/^refs\/heads\//, ""),
          commit: { id: ref.objectId },
        }),
      );
  }

  async listDockerfilePaths(owner, repo, branch = "main") {
    const { organization, project } = this._parseOwnerProject(owner);
    const data = await this._request(
      `https://dev.azure.com/${encodeURIComponent(organization)}/${encodeURIComponent(project)}/_apis/git/repositories/${encodeURIComponent(repo)}/items`,
      {
        params: {
          recursionLevel: "Full",
          scopePath: "/",
          versionDescriptor: `GB${branch}`,
        },
      },
    );
    return (data.value || [])
      .filter(
        (item) =>
          !item.isFolder &&
          /(^|\/)Dockerfile(\.[^/]+)?$/i.test(item.path || ""),
      )
      .map((item) => (item.path || "").replace(/^\//, ""))
      .slice(0, 30);
  }

  async getFileContent(owner, repo, path, branch = "main") {
    const { organization, project } = this._parseOwnerProject(owner);
    const data = await this._request(
      `https://dev.azure.com/${encodeURIComponent(organization)}/${encodeURIComponent(project)}/_apis/git/repositories/${encodeURIComponent(repo)}/items`,
      {
        params: {
          path: path.startsWith("/") ? path : `/${path}`,
          includeContent: true,
          versionDescriptor: `GB${branch}`,
        },
      },
    );
    if (!data.content) {
      return null;
    }
    const encoding = data.contentMetadata?.encoding || data.encoding || "base64";
    if (encoding === "base64" || encoding === 2) {
      return Buffer.from(data.content, "base64").toString("utf8");
    }
    return String(data.content);
  }

  async getRepositoryContent(owner, repo, path = "", branch = "main") {
    const { organization, project } = this._parseOwnerProject(owner);
    return this._request(
      `https://dev.azure.com/${encodeURIComponent(organization)}/${encodeURIComponent(project)}/_apis/git/repositories/${encodeURIComponent(repo)}/items`,
      {
        params: { path, versionDescriptor: `GB${branch}` },
      },
    );
  }

  _parseOwnerProject(owner) {
    if (typeof owner === "string" && owner.includes("/")) {
      const [organization, project] = owner.split("/");
      return { organization, project };
    }
    throw new Error(
      "Azure DevOps owner must be organization/project (e.g. myorg/my-project)",
    );
  }

  normalizeRepository(repo, organization) {
    const projectName = repo.project?.name || repo.project?.id || "project";
    const repoName = repo.name;
    return {
      id: repo.id,
      name: repoName,
      fullName: `${organization}/${projectName}/${repoName}`,
      description: repo.description || "",
      private: !repo.isDisabled,
      defaultBranch: (repo.defaultBranch || "refs/heads/main").replace(
        /^refs\/heads\//,
        "",
      ),
      htmlUrl:
        repo.webUrl ||
        `https://dev.azure.com/${organization}/${projectName}/_git/${repoName}`,
      cloneUrl: repo.remoteUrl,
      sshUrl: repo.sshUrl,
      stars: 0,
      forks: 0,
      language: null,
      topics: [],
      lastUpdated: repo.project?.lastUpdateTime,
      createdAt: null,
      owner: {
        login: `${organization}/${projectName}`,
        avatar: null,
        type: "Organization",
      },
      permissions: {},
      provider: "azuredevops",
      organization,
      project: projectName,
    };
  }

  normalizeUser(user) {
    return {
      id: user.id,
      login: user.displayName || user.id,
      name: user.displayName,
      email: user.email || user.emailAddress,
      avatar: user.avatar || null,
      profileUrl: null,
      type: "User",
    };
  }
}

module.exports = AzureDevOpsProvider;
