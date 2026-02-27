import { Fragment, lazy } from "react";
import { Route } from "react-router-dom";

const ProtectedRoute = lazy(() => import("@components/ProtectedRoute"));
const DashboardLayout = lazy(
  () => import("@components/layouts/DashboardLayout"),
);
const Dashboard = lazy(() => import("@dashboard/Dashboard"));
const Projects = lazy(() => import("@dashboard/Projects"));
const CreateProject = lazy(() => import("@pages/projects/CreateProject"));
const ProjectDetails = lazy(() => import("@dashboard/ProjectDetails"));
const ProjectDeployments = lazy(() => import("@dashboard/ProjectDeployments"));
const ProjectAnalytics = lazy(() => import("@dashboard/ProjectAnalytics"));
const ProjectSettings = lazy(() => import("@dashboard/ProjectSettings"));
const Deployments = lazy(() => import("@dashboard/Deployments"));
const Analytics = lazy(() => import("@dashboard/Analytics"));
const Activity = lazy(() => import("@dashboard/Activity"));
const CLI = lazy(() => import("@dashboard/CLI"));
const APITester = lazy(() => import("@dashboard/APITester"));
const Monitoring = lazy(() => import("@dashboard/Monitoring"));
const Integrations = lazy(() => import("@dashboard/Integrations"));
const IntegrationsDetail = lazy(() => import("@dashboard/IntegrationsDetail"));
const Profile = lazy(() => import("@dashboard/Profile"));
const QuickDeploy = lazy(() => import("@dashboard/QuickDeploy"));

export default function DashboardRoutes() {
  return (
    <Fragment>
      <Route element={<ProtectedRoute />}>
        <Route path="dashboard" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/create" element={<CreateProject />} />
          <Route path="projects/:id" element={<ProjectDetails />}>
            <Route path="deployments" element={<ProjectDeployments />} />
            <Route path="analytics" element={<ProjectAnalytics />} />
            <Route path="settings" element={<ProjectSettings />} />
          </Route>
          <Route path="quick-deploy" element={<QuickDeploy />} />
          <Route path="deployments" element={<Deployments />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="activity" element={<Activity />} />
          <Route path="cli" element={<CLI />} />
          <Route path="api-tester" element={<APITester />} />
          <Route path="monitoring" element={<Monitoring />} />
          <Route path="integrations" element={<Integrations />} />
          <Route
            path="integrations/:provider"
            element={<IntegrationsDetail />}
          />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Route>
    </Fragment>
  );
}
