import api from "@/utils/api.js";

class AdminService {
  async getDashboardStats() {
    const response = await api.get("/admin/dashboard-stats");
    return response.data;
  }

  async getUsers(params = {}) {
    const response = await api.get("/admin/users", { params });
    return response.data;
  }

  async updateUserRole(userId, role) {
    const response = await api.put(`/admin/users/${userId}/role`, { role });
    return response.data;
  }

  async getProjects(params = {}) {
    const response = await api.get("/admin/projects", { params });
    return response.data;
  }

  async getProject(projectId) {
    const response = await api.get(`/admin/projects/${projectId}`);
    return response.data;
  }

  async archiveProject(projectId) {
    const response = await api.patch(`/admin/projects/${projectId}/archive`);
    return response.data;
  }

  async deleteProject(projectId) {
    const response = await api.delete(`/admin/projects/${projectId}`);
    return response.data;
  }

  async getDeployments(params = {}) {
    const response = await api.get("/admin/deployments", { params });
    return response.data;
  }

  async getDeployment(deploymentId) {
    const response = await api.get(`/admin/deployments/${deploymentId}`);
    return response.data;
  }

  async cancelDeployment(deploymentId) {
    const response = await api.post(`/admin/deployments/${deploymentId}/cancel`);
    return response.data;
  }

  async stopDeployment(deploymentId) {
    const response = await api.post(`/admin/deployments/${deploymentId}/stop`);
    return response.data;
  }

  async getSubdomains(params = {}) {
    const response = await api.get("/admin/subdomains", { params });
    return response.data;
  }

  async getPlatformReservedSubdomains() {
    const response = await api.get("/admin/subdomains/platform-reserved");
    return response.data;
  }

  async releaseSubdomain(reservationId) {
    const response = await api.post(`/admin/subdomains/${reservationId}/release`);
    return response.data;
  }

  async getActivity(params = {}) {
    const response = await api.get("/admin/activity", { params });
    return response.data;
  }

  async getNotifications(params = {}) {
    const response = await api.get("/admin/notifications", { params });
    return response.data;
  }

  async sendNotification(payload) {
    const response = await api.post("/admin/notifications/send", payload);
    return response.data;
  }
}

export default new AdminService();
