import api, { invalidateAllCacheEntriesForUrl } from "@/utils/api.js";

const adminGet = (url, config = {}) =>
  api.get(url, { ...config, _noCache: true });

const afterAdminMutation = () => {
  invalidateAllCacheEntriesForUrl("/admin");
};

class AdminService {
  async getDashboardStats() {
    const response = await adminGet("/admin/dashboard-stats");
    return response.data;
  }

  async getUsers(params = {}) {
    const response = await adminGet("/admin/users", { params });
    return response.data;
  }

  async updateUserRole(userId, role) {
    const response = await api.put(`/admin/users/${userId}/role`, { role });
    afterAdminMutation();
    return response.data;
  }

  async getProjects(params = {}) {
    const response = await adminGet("/admin/projects", { params });
    return response.data;
  }

  async getProject(projectId) {
    const response = await adminGet(`/admin/projects/${projectId}`);
    return response.data;
  }

  async archiveProject(projectId) {
    const response = await api.patch(`/admin/projects/${projectId}/archive`);
    afterAdminMutation();
    return response.data;
  }

  async deleteProject(projectId) {
    const response = await api.delete(`/admin/projects/${projectId}`);
    afterAdminMutation();
    return response.data;
  }

  async getDeployments(params = {}) {
    const response = await adminGet("/admin/deployments", { params });
    return response.data;
  }

  async getDeployment(deploymentId) {
    const response = await adminGet(`/admin/deployments/${deploymentId}`);
    return response.data;
  }

  async cancelDeployment(deploymentId) {
    const response = await api.post(`/admin/deployments/${deploymentId}/cancel`);
    afterAdminMutation();
    return response.data;
  }

  async stopDeployment(deploymentId) {
    const response = await api.post(`/admin/deployments/${deploymentId}/stop`);
    afterAdminMutation();
    return response.data;
  }

  async getSubdomains(params = {}) {
    const response = await adminGet("/admin/subdomains", { params });
    return response.data;
  }

  async getPlatformReservedSubdomains() {
    const response = await adminGet("/admin/subdomains/platform-reserved");
    return response.data;
  }

  async getSubdomainBlocklist() {
    const response = await adminGet("/admin/subdomains/blocklist");
    return response.data;
  }

  async addSubdomainBlocklistEntry(payload) {
    const response = await api.post("/admin/subdomains/blocklist", payload);
    afterAdminMutation();
    return response.data;
  }

  async removeSubdomainBlocklistEntry(entryId) {
    const response = await api.delete(`/admin/subdomains/blocklist/${entryId}`);
    afterAdminMutation();
    return response.data;
  }

  async releaseSubdomain(reservationId) {
    const response = await api.post(`/admin/subdomains/${reservationId}/release`);
    afterAdminMutation();
    return response.data;
  }

  async getActivity(params = {}) {
    const response = await adminGet("/admin/activity", { params });
    return response.data;
  }

  async getNotifications(params = {}) {
    const response = await adminGet("/admin/notifications", { params });
    return response.data;
  }

  async sendNotification(payload) {
    const response = await api.post("/admin/notifications/send", payload);
    afterAdminMutation();
    return response.data;
  }
}

export default new AdminService();
