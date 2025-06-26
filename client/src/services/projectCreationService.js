import api from '../utils/api';

class ProjectCreationService {
  // Session management - Updated to match backend routes
  async createSession(sessionData = {}) {
    const response = await api.post('/projects/creation/session', {
      userAgent: navigator.userAgent,
      ipAddress: null, // Will be detected by backend
      ...sessionData,
    });
    return response.data?.data || response.data;
  }

  async getSession(sessionId) {
    const response = await api.get(`/projects/creation/session/${sessionId}`);
    return response.data?.data || response.data;
  }

  async updateStep(sessionId, step, stepData) {
    const response = await api.put(`/projects/creation/session/${sessionId}/step`, {
      step,
      stepData,
    });
    return response.data?.data || response.data;
  }

  async getUserSessions(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.page) params.append('page', filters.page);

    const response = await api.get(`/projects/creation/sessions?${params.toString()}`);
    return response.data?.data || response.data;
  }

  async deleteSession(sessionId) {
    const response = await api.delete(`/projects/creation/session/${sessionId}`);
    return response.data?.data || response.data;
  }

  // Repository analysis
  async analyzeRepository(sessionId, repositoryData) {
    const response = await api.post(`/projects/creation/session/${sessionId}/analyze`, repositoryData);
    return response.data?.data || response.data;
  }

  // Complete project creation - Updated endpoint name
  async completeSession(sessionId) {
    const response = await api.post(`/projects/creation/session/${sessionId}/complete`);
    return response.data?.data || response.data;
  }

  // Git provider integration - Updated to use proper endpoints
  async getGitProviders() {
    const response = await api.get('/users/git-providers');
    return response.data?.data || response.data;
  }

  async connectGitProvider(provider, authData) {
    const response = await api.post(`/git/connect/${provider}`, authData);
    return response.data?.data || response.data;
  }

  async getRepositories(provider, options = {}) {
    const params = new URLSearchParams();
    
    if (options.search) params.append('search', options.search);
    if (options.page) params.append('page', options.page);
    if (options.per_page) params.append('per_page', options.per_page);
    if (options.type) params.append('type', options.type);

    const response = await api.get(`/git/${provider}/repositories?${params.toString()}`);
    return response.data?.data || response.data;
  }

  async getBranches(provider, owner, repo) {
    const response = await api.get(`/git/${provider}/repositories/${owner}/${repo}/branches`);
    return response.data?.data || response.data;
  }

  async getRepositoryDetails(provider, owner, repo) {
    const response = await api.get(`/git/${provider}/repositories/${owner}/${repo}`);
    return response.data?.data || response.data;
  }

  // Utility methods
  extractRepositoryInfo(repoUrl) {
    // Extract provider, owner, and repo name from various URL formats
    const patterns = {
      github: /github\.com[\/:]([^\/]+)\/([^\/]+?)(?:\.git)?$/,
      gitlab: /gitlab\.com[\/:]([^\/]+)\/([^\/]+?)(?:\.git)?$/,
      'azure-devops': /dev\.azure\.com\/([^\/]+)\/([^\/]+)\/_git\/([^\/]+?)(?:\.git)?$/,
    };

    for (const [provider, pattern] of Object.entries(patterns)) {
      const match = repoUrl.match(pattern);
      if (match) {
        if (provider === 'azure-devops') {
          return {
            provider,
            organization: match[1],
            project: match[2],
            repo: match[3],
            owner: `${match[1]}/${match[2]}`,
            name: match[3],
          };
        } else {
          return {
            provider,
            owner: match[1],
            name: match[2],
            repo: match[2],
          };
        }
      }
    }

    return null;
  }

  validateStepData(step, data) {
    const validators = {
      1: (data) => data.selectedProvider && data.providerConnected,
      2: (data) => data.selectedRepository && data.selectedRepository.url,
      3: (data) => data.selectedBranch,
      4: (data) => data.analysis || data.skipAnalysis,
      5: (data) => data.projectConfig && data.projectConfig.name,
      6: (data) => data.finalReview === true,
    };

    return validators[step] ? validators[step](data) : true;
  }

  // Progress calculation
  calculateProgress(currentStep, completedSteps = []) {
    const totalSteps = 6;
    const baseProgress = (currentStep - 1) / totalSteps * 100;
    const completionBonus = completedSteps.length / totalSteps * 10;
    
    return Math.min(baseProgress + completionBonus, 100);
  }

  // Error handling
  handleApiError(error) {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          return { type: 'validation', message: data.message || 'Invalid request data' };
        case 401:
          return { type: 'auth', message: 'Please log in to continue' };
        case 404:
          return { type: 'not_found', message: 'Session not found or expired' };
        case 410:
          return { type: 'expired', message: 'Session has expired. Please start over.' };
        case 429:
          return { type: 'rate_limit', message: 'Too many requests. Please wait and try again.' };
        case 500:
          return { type: 'server', message: 'Server error. Please try again later.' };
        default:
          return { type: 'unknown', message: data.message || 'An unexpected error occurred' };
      }
    } else if (error.request) {
      // Network error
      return { type: 'network', message: 'Network error. Please check your connection.' };
    } else {
      // Other error
      return { type: 'client', message: error.message || 'An unexpected error occurred' };
    }
  }
}

export default new ProjectCreationService();
