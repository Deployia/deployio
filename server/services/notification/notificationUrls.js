function getFrontendUrl() {
  return process.env.FRONTEND_URL || "https://deployio.tech";
}

function projectDashboardUrl(projectId) {
  return `${getFrontendUrl()}/dashboard/projects/${projectId}`;
}

module.exports = {
  getFrontendUrl,
  projectDashboardUrl,
};
