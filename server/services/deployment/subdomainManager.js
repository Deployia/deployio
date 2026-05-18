const Project = require("@models/Project");
const Deployment = require("@models/Deployment");
const ReservedSubdomain = require("@models/ReservedSubdomain");
const SubdomainBlocklistEntry = require("@models/SubdomainBlocklistEntry");
const {
  DEFAULT_BLOCKED_SUBDOMAIN_TERMS,
} = require("../../constants/defaultSubdomainBlocklist");
const logger = require("@config/logger");

const ACTIVE_DEPLOYMENT_STATUSES = [
  "pending",
  "queued",
  "building",
  "deploying",
  "running",
];

const DEFAULT_PLATFORM_RESERVED_SUBDOMAINS = [
  "www",
  "api",
  "ai",
  "service",
  "agent",
  "admin",
  "dashboard",
  "docs",
  "blog",
  "status",
  "support",
  "mail",
  "ftp",
  "cdn",
  "static",
  "assets",
  "landing",
  "monitor",
];

const SUBDOMAIN_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HOLD_DURATION_MS = 12 * 60 * 60 * 1000;

class SubdomainManager {
  constructor() {
    this.baseDomain = process.env.BASE_DOMAIN || "deployio.tech";
    this.maxSuggestions = 5;

    const configuredReservedSubdomains = String(
      process.env.PLATFORM_RESERVED_SUBDOMAINS || "",
    )
      .split(",")
      .map((value) => this._normalizeSegment(value))
      .filter(Boolean);

    this.platformReservedSubdomains = new Set([
      ...DEFAULT_PLATFORM_RESERVED_SUBDOMAINS,
      ...configuredReservedSubdomains,
    ]);

    this._builtinBlocklist = DEFAULT_BLOCKED_SUBDOMAIN_TERMS.map((row) => ({
      term: this._normalizeSegment(row.term),
      matchType: row.matchType === "exact" ? "exact" : "contains",
      category: row.category || "custom",
      source: "builtin",
    })).filter((row) => row.term);

    this._managedBlocklist = [];
    this._blocklistLoadedAt = 0;
    this._blocklistTtlMs = 60 * 1000;
  }

  invalidateBlocklistCache() {
    this._blocklistLoadedAt = 0;
    this._managedBlocklist = [];
  }

  async _ensureBlocklist() {
    if (
      this._managedBlocklist.length &&
      Date.now() - this._blocklistLoadedAt < this._blocklistTtlMs
    ) {
      return;
    }

    const rows = await SubdomainBlocklistEntry.find({ active: true })
      .select("term matchType category reason")
      .lean();

    this._managedBlocklist = rows
      .map((row) => ({
        term: this._normalizeSegment(row.term),
        matchType: row.matchType === "exact" ? "exact" : "contains",
        category: row.category || "custom",
        reason: row.reason || "",
        source: "managed",
        _id: row._id,
      }))
      .filter((row) => row.term);

    this._blocklistLoadedAt = Date.now();
  }

  _getActivePolicyEntries() {
    return [...this._builtinBlocklist, ...this._managedBlocklist];
  }

  getPolicyMatch(subdomain) {
    const normalized = this._normalizeSegment(subdomain);
    if (!normalized) {
      return null;
    }

    for (const entry of this._getActivePolicyEntries()) {
      if (entry.matchType === "exact" && normalized === entry.term) {
        return {
          reason: "blocked-subdomain-policy",
          category: entry.category,
          term: entry.term,
          matchType: entry.matchType,
          source: entry.source,
        };
      }

      if (
        entry.matchType === "contains" &&
        entry.term &&
        normalized.includes(entry.term)
      ) {
        return {
          reason: "blocked-subdomain-policy",
          category: entry.category,
          term: entry.term,
          matchType: entry.matchType,
          source: entry.source,
        };
      }
    }

    return null;
  }

  async getSubdomainPolicyOverview() {
    await this._ensureBlocklist();

    const envReserved = String(process.env.PLATFORM_RESERVED_SUBDOMAINS || "")
      .split(",")
      .map((value) => this._normalizeSegment(value))
      .filter(Boolean);

    return {
      baseDomain: this.baseDomain,
      builtinReserved: DEFAULT_PLATFORM_RESERVED_SUBDOMAINS.slice().sort(),
      envReserved: envReserved.sort(),
      managedBlocklist: this._managedBlocklist.map((row) => ({
        _id: row._id,
        term: row.term,
        matchType: row.matchType,
        category: row.category,
        reason: row.reason || "",
      })),
      builtinBlocklist: this._builtinBlocklist.map((row) => ({
        term: row.term,
        matchType: row.matchType,
        category: row.category,
      })),
    };
  }

  async addBlocklistEntry({ term, matchType, category, reason, createdBy }) {
    const normalized = this._normalizeSegment(term);
    if (!normalized) {
      throw new Error("Invalid blocklist term");
    }

    if (this._isBlockedByFormat(normalized) && matchType === "exact") {
      throw new Error("Term must be a valid subdomain segment");
    }

    const entry = await SubdomainBlocklistEntry.findOneAndUpdate(
      { term: normalized, matchType: matchType === "exact" ? "exact" : "contains" },
      {
        $set: {
          term: normalized,
          matchType: matchType === "exact" ? "exact" : "contains",
          category: category || "custom",
          reason: reason || "",
          active: true,
          createdBy: createdBy || null,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    this.invalidateBlocklistCache();
    return entry;
  }

  async removeBlocklistEntry(entryId) {
    const updated = await SubdomainBlocklistEntry.findByIdAndUpdate(
      entryId,
      { $set: { active: false } },
      { new: true },
    );

    if (updated) {
      this.invalidateBlocklistCache();
    }

    return updated;
  }

  _normalizeSegment(value) {
    return String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-+/g, "-")
      .slice(0, 40);
  }

  _buildCandidates(project, environment, limit = this.maxSuggestions) {
    const projectSlug = this._normalizeSegment(
      project?.slug || project?.name || "project",
    );
    const envSlug = this._normalizeSegment(environment || "staging");
    const bases = [
      `${projectSlug}-${envSlug}`,
      `${projectSlug}-${envSlug}-app`,
      `${projectSlug}-${envSlug}-live`,
      `${projectSlug}-${envSlug}-deploy`,
      `${projectSlug}-${envSlug}-site`,
      `${projectSlug}-${envSlug}-service`,
    ];

    return bases.slice(0, limit).map((candidate) => this._toSuggestion(candidate));
  }

  _toSuggestion(subdomain) {
    const normalized = this._normalizeSegment(subdomain);
    return {
      subdomain: normalized,
      url: `https://${normalized}.${this.baseDomain}`,
      label: `${normalized}.${this.baseDomain}`,
    };
  }

  _generateRandomSuffix(length = 4) {
    return Math.random()
      .toString(36)
      .replace(/[^a-z0-9]/g, "")
      .slice(0, length)
      .padEnd(length, "0");
  }

  _buildRandomCandidate(project, environment) {
    const projectSlug = this._normalizeSegment(
      project?.slug || project?.name || "project",
    );
    const envSlug = this._normalizeSegment(environment || "staging");
    const candidate = `${projectSlug}-${envSlug}-${this._generateRandomSuffix()}`;

    return this._toSuggestion(candidate);
  }

  _extractSubdomainFromHostname(hostname) {
    const normalizedHost = String(hostname || "")
      .toLowerCase()
      .trim()
      .split(":")[0];

    if (!normalizedHost) {
      return null;
    }

    const base = this.baseDomain.toLowerCase();
    if (normalizedHost === base || normalizedHost === `www.${base}`) {
      return null;
    }

    const suffix = `.${base}`;
    if (!normalizedHost.endsWith(suffix)) {
      return null;
    }

    const candidate = normalizedHost.slice(0, -suffix.length);
    if (!candidate || candidate.includes(".")) {
      return null;
    }

    const normalizedCandidate = this._normalizeSegment(candidate);
    return normalizedCandidate || null;
  }

  getPlatformReservedSubdomains() {
    return Array.from(this.platformReservedSubdomains).sort();
  }

  _isBlockedByFormat(subdomain) {
    if (!subdomain) {
      return true;
    }

    return !SUBDOMAIN_REGEX.test(subdomain);
  }

  isPlatformReservedSubdomain(subdomain) {
    const normalizedSubdomain = this._normalizeSegment(subdomain);
    if (!normalizedSubdomain) {
      return false;
    }

    return this.platformReservedSubdomains.has(normalizedSubdomain);
  }

  _isBlockedSubdomain(subdomain) {
    const normalizedSubdomain = this._normalizeSegment(subdomain);
    return (
      this._isBlockedByFormat(normalizedSubdomain) ||
      this.isPlatformReservedSubdomain(normalizedSubdomain) ||
      Boolean(this.getPolicyMatch(normalizedSubdomain))
    );
  }

  async _getTakenSubdomains(environment = null) {
    const now = new Date();
    const [takenReservations, takenDeployments] = await Promise.all([
      ReservedSubdomain.find({
        $or: [
          { status: { $in: ["reserved", "active"] } },
          { status: "hold", holdUntil: { $gt: now } },
        ],
        ...(environment ? { environment } : {}),
      })
        .select("subdomain")
        .lean(),
      Deployment.find({
        status: { $in: ACTIVE_DEPLOYMENT_STATUSES },
        ...(environment ? { "config.environment": environment } : {}),
      })
        .select("config.subdomain")
        .lean(),
    ]);

    return new Set([
      ...this.getPlatformReservedSubdomains(),
      ...takenReservations.map((row) => row.subdomain),
      ...takenDeployments.map((row) => row?.config?.subdomain).filter(Boolean),
    ]);
  }

  async getPublicSubdomainContext(hostname) {
    await this._ensureBlocklist();

    const subdomain = this._extractSubdomainFromHostname(hostname);
    if (!subdomain) {
      return {
        hostname,
        subdomain: null,
        baseDomain: this.baseDomain,
        isReserved: false,
        isTaken: false,
        status: "out-of-scope",
        reason: "not-a-managed-subdomain",
      };
    }

    if (this._isBlockedByFormat(subdomain)) {
      return {
        hostname,
        subdomain,
        baseDomain: this.baseDomain,
        isReserved: true,
        isTaken: true,
        status: "taken",
        reason: "invalid-subdomain-format",
      };
    }

    if (this.isPlatformReservedSubdomain(subdomain)) {
      return {
        hostname,
        subdomain,
        baseDomain: this.baseDomain,
        isReserved: true,
        isTaken: true,
        status: "taken",
        reason: "platform-reserved-subdomain",
      };
    }

    const policyMatch = this.getPolicyMatch(subdomain);
    if (policyMatch) {
      return {
        hostname,
        subdomain,
        baseDomain: this.baseDomain,
        isReserved: true,
        isTaken: true,
        status: "taken",
        reason: policyMatch.reason,
        policyCategory: policyMatch.category,
      };
    }

    const [reservedRecord, deploymentRecord] = await Promise.all([
      ReservedSubdomain.findOne({
        subdomain,
        $or: [
          { status: { $in: ["reserved", "active"] } },
          { status: "hold", holdUntil: { $gt: new Date() } },
        ],
      })
        .select("_id")
        .lean(),
      Deployment.findOne({
        status: { $in: ACTIVE_DEPLOYMENT_STATUSES },
        "config.subdomain": subdomain,
      })
        .select("_id")
        .lean(),
    ]);

    if (reservedRecord || deploymentRecord) {
      return {
        hostname,
        subdomain,
        baseDomain: this.baseDomain,
        isReserved: true,
        isTaken: true,
        status: "taken",
        reason: "already-allocated",
      };
    }

    return {
      hostname,
      subdomain,
      baseDomain: this.baseDomain,
      isReserved: false,
      isTaken: false,
      status: "available",
      reason: "available",
    };
  }

  async getProjectDeploymentCapacity(
    projectId,
    environment = null,
    project = null,
  ) {
    const query = {
      project: projectId,
      status: { $in: ACTIVE_DEPLOYMENT_STATUSES },
    };
    const [
      activeDeployments,
      activeDeploymentsInEnvironment,
      activeReservations,
      projectRecord,
    ] = await Promise.all([
      Deployment.find(query).select("_id").limit(3).lean(),
      environment
        ? Deployment.find({
            ...query,
            "config.environment": environment,
          })
            .select("_id")
            .limit(3)
            .lean()
        : Promise.resolve([]),
      ReservedSubdomain.find({
        project: projectId,
        $or: [
          { status: { $in: ["reserved", "active"] } },
          { status: "hold", holdUntil: { $gt: new Date() } },
        ],
        ...(environment ? { environment } : {}),
      })
        .select("_id")
        .limit(3)
        .lean(),
      project
        ? Promise.resolve(project)
        : Project.findById(projectId).select(
            "name slug deployment statistics activeDeploymentCount",
          ),
    ]);

    return {
      project: projectRecord,
      activeDeployments: activeDeployments.length,
      activeDeploymentsInEnvironment: activeDeploymentsInEnvironment.length,
      activeReservations: activeReservations.length,
      maxDeployments: 3,
      remainingDeployments: Math.max(0, 3 - activeDeployments.length),
    };
  }

  async getSuggestions(
    projectId,
    environment = "staging",
    limit = this.maxSuggestions,
  ) {
    await this._ensureBlocklist();

    const project = await Project.findById(projectId).select("name slug");
    if (!project) {
      throw new Error("Project not found");
    }

    const taken = await this._getTakenSubdomains();

    const suggestions = [];
    const seen = new Set();

    for (const candidate of this._buildCandidates(
      project,
      environment,
      limit,
    )) {
      if (
        !this._isBlockedSubdomain(candidate.subdomain) &&
        !taken.has(candidate.subdomain) &&
        !seen.has(candidate.subdomain)
      ) {
        suggestions.push(candidate);
        seen.add(candidate.subdomain);
      }
    }

    let attempts = 0;
    const maxAttempts = limit * 20;
    while (suggestions.length < limit && attempts < maxAttempts) {
      const candidate = this._buildRandomCandidate(project, environment);
      attempts += 1;

      if (
        this._isBlockedSubdomain(candidate.subdomain) ||
        taken.has(candidate.subdomain) ||
        seen.has(candidate.subdomain)
      ) {
        continue;
      }

      suggestions.push(candidate);
      seen.add(candidate.subdomain);
    }

    // If we still couldn't fill all 5 with random candidates, keep returning the unique available ones.

    return {
      project: {
        id: project._id,
        name: project.name,
        slug: project.slug,
      },
      environment,
      suggestions,
      capacity: await this.getProjectDeploymentCapacity(
        projectId,
        environment,
        project,
      ),
    };
  }

  async checkAvailability(subdomain, { projectId = null, environment = null } = {}) {
    await this._ensureBlocklist();

    const normalized = this._normalizeSegment(subdomain);
    if (!normalized) {
      return {
        subdomain: normalized,
        baseDomain: this.baseDomain,
        available: false,
        status: "invalid",
        reason: "invalid-subdomain-format",
      };
    }

    if (this._isBlockedByFormat(normalized)) {
      return {
        subdomain: normalized,
        baseDomain: this.baseDomain,
        available: false,
        status: "invalid",
        reason: "invalid-subdomain-format",
      };
    }

    if (this.isPlatformReservedSubdomain(normalized)) {
      return {
        subdomain: normalized,
        baseDomain: this.baseDomain,
        available: false,
        status: "reserved",
        reason: "platform-reserved-subdomain",
      };
    }

    const policyMatch = this.getPolicyMatch(normalized);
    if (policyMatch) {
      return {
        subdomain: normalized,
        baseDomain: this.baseDomain,
        available: false,
        status: "reserved",
        reason: policyMatch.reason,
        policyCategory: policyMatch.category,
        blockedTerm: policyMatch.term,
      };
    }

    const taken = await this._getTakenSubdomains(environment);
    if (taken.has(normalized)) {
      const reason = this.platformReservedSubdomains.has(normalized)
        ? "platform-reserved-subdomain"
        : "already-allocated";
      return {
        subdomain: normalized,
        baseDomain: this.baseDomain,
        available: false,
        status: reason === "platform-reserved-subdomain" ? "reserved" : "taken",
        reason,
        projectId,
        environment,
      };
    }

    return {
      subdomain: normalized,
      baseDomain: this.baseDomain,
      available: true,
      status: "available",
      reason: "available",
      projectId,
      environment,
    };
  }

  async getAlternativesForPreferred(
    preferred,
    project,
    environment = "staging",
    limit = this.maxSuggestions,
  ) {
    await this._ensureBlocklist();

    const normalized = this._normalizeSegment(preferred);
    const taken = await this._getTakenSubdomains(environment);
    const suggestions = [];
    const seen = new Set();

    const tryAdd = (candidate) => {
      const slug = this._normalizeSegment(candidate);
      if (
        !slug ||
        this._isBlockedSubdomain(slug) ||
        taken.has(slug) ||
        seen.has(slug)
      ) {
        return false;
      }
      suggestions.push(this._toSuggestion(slug));
      seen.add(slug);
      return true;
    };

    if (normalized) {
      tryAdd(normalized);
      [`${normalized}-2`, `${normalized}-app`, `${normalized}-live`].forEach(
        (candidate) => {
          if (suggestions.length >= limit) return;
          tryAdd(candidate);
        },
      );
    }

    for (const candidate of this._buildCandidates(project, environment, limit * 2)) {
      if (suggestions.length >= limit) break;
      tryAdd(candidate.subdomain);
    }

    let attempts = 0;
    const maxAttempts = limit * 20;
    while (suggestions.length < limit && attempts < maxAttempts) {
      const candidate = this._buildRandomCandidate(project, environment);
      attempts += 1;
      tryAdd(candidate.subdomain);
    }

    return suggestions.slice(0, limit);
  }

  async checkSubdomainWithAlternatives(
    subdomain,
    projectId,
    environment = "staging",
    limit = this.maxSuggestions,
  ) {
    const project = await Project.findById(projectId).select("name slug");
    if (!project) {
      throw new Error("Project not found");
    }

    const availability = await this.checkAvailability(subdomain, {
      projectId,
      environment,
    });

    const alternatives =
      availability.available === false
        ? await this.getAlternativesForPreferred(
            subdomain,
            project,
            environment,
            limit,
          )
        : [];

    return {
      ...availability,
      url: availability.available
        ? `https://${availability.subdomain}.${this.baseDomain}`
        : undefined,
      label: availability.available
        ? `${availability.subdomain}.${this.baseDomain}`
        : undefined,
      alternatives,
    };
  }

  async reserveSubdomain({
    projectId,
    environment = "staging",
    preferredSubdomain = null,
    deploymentId = null,
  }) {
    await this._ensureBlocklist();

    const project = await Project.findById(projectId).select("name slug");
    if (!project) {
      throw new Error("Project not found");
    }

    const suggestions = this._buildCandidates(
      project,
      environment,
      this.maxSuggestions,
    );
    const requested = preferredSubdomain
      ? this._normalizeSegment(preferredSubdomain)
      : null;

    if (requested && this._isBlockedByFormat(requested)) {
      throw new Error("Selected subdomain has an invalid format");
    }

    if (requested && this.isPlatformReservedSubdomain(requested)) {
      throw new Error("Selected subdomain is reserved for platform use");
    }

    if (requested && this.getPolicyMatch(requested)) {
      throw new Error("Selected subdomain is not allowed by platform policy");
    }

    const candidateList = requested
      ? [requested, ...suggestions.map((item) => item.subdomain)]
      : suggestions.map((item) => item.subdomain);

    const taken = await this._getTakenSubdomains();

    const chosen = candidateList.find(
      (candidate) =>
        candidate &&
        !this._isBlockedSubdomain(candidate) &&
        !taken.has(candidate),
    );

    if (!chosen) {
      throw new Error(
        "No available subdomain found for this project environment",
      );
    }

    try {
      const reservation = await ReservedSubdomain.findOneAndUpdate(
        { subdomain: chosen },
        {
          $set: {
            project: projectId,
            deployment: deploymentId,
            environment,
            subdomain: chosen,
            status: "reserved",
            reservedAt: new Date(),
            releasedAt: null,
            holdUntil: null,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            metadata: {
              source: "subdomain-manager",
              reason: "deployment-reservation",
              suggestions: suggestions.map((item) => item.subdomain),
            },
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );

      return {
        reservation,
        url: `https://${chosen}.${this.baseDomain}`,
        suggestions: suggestions.map((item) => item.subdomain),
      };
    } catch (error) {
      if (error.code === 11000) {
        logger.warn("Subdomain collision detected during reservation", {
          projectId,
          environment,
          preferredSubdomain: requested,
        });
        throw new Error("Selected subdomain is already reserved");
      }

      throw error;
    }
  }

  async linkDeployment({ deploymentId, projectId, environment, subdomain }) {
    if (!deploymentId) {
      throw new Error("deploymentId is required to link a reservation");
    }

    return ReservedSubdomain.findOneAndUpdate(
      {
        ...(projectId ? { project: projectId } : {}),
        ...(environment ? { environment } : {}),
        ...(subdomain ? { subdomain } : {}),
        status: { $in: ["reserved", "active"] },
      },
      {
        $set: {
          deployment: deploymentId,
          status: "active",
          linkedAt: new Date(),
        },
      },
      { new: true },
    );
  }

  async releaseReservation({
    projectId,
    environment,
    subdomain,
    reason = "released",
  }) {
    return ReservedSubdomain.findOneAndUpdate(
      {
        ...(projectId ? { project: projectId } : {}),
        ...(environment ? { environment } : {}),
        ...(subdomain ? { subdomain } : {}),
        status: { $in: ["reserved", "active", "hold"] },
      },
      {
        $set: {
          status: "hold",
          holdUntil: new Date(Date.now() + HOLD_DURATION_MS),
          releasedAt: new Date(),
          "metadata.reason": reason,
        },
      },
      { new: true },
    );
  }

  async releaseDeploymentReservation({ deploymentId, reason = "released" }) {
    if (!deploymentId) {
      return null;
    }

    return ReservedSubdomain.findOneAndUpdate(
      {
        deployment: deploymentId,
        status: { $in: ["reserved", "active", "hold"] },
      },
      {
        $set: {
          status: "hold",
          holdUntil: new Date(Date.now() + HOLD_DURATION_MS),
          releasedAt: new Date(),
          "metadata.reason": reason,
        },
      },
      { new: true },
    );
  }
}

module.exports = new SubdomainManager();
