import { Route } from "react-router-dom";
import { lazy, Fragment } from "react";
const ProtectedRoute = lazy(() => import("@components/ProtectedRoute"));
const AdminLayout = lazy(() => import("@pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("@pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("@pages/admin/AdminUsers"));
const AdminProjects = lazy(() => import("@pages/admin/AdminProjects"));
const AdminDeployments = lazy(() => import("@pages/admin/AdminDeployments"));
const AdminSubdomains = lazy(() => import("@pages/admin/AdminSubdomains"));
const AdminActivity = lazy(() => import("@pages/admin/AdminActivity"));
const AdminNotifications = lazy(() => import("@pages/admin/AdminNotifications"));

export default function AdminRoutes() {
  return (
    <Fragment>
      <Route element={<ProtectedRoute admin={true} />}>
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="projects" element={<AdminProjects />} />
          <Route path="deployments" element={<AdminDeployments />} />
          <Route path="subdomains" element={<AdminSubdomains />} />
          <Route path="activity" element={<AdminActivity />} />
          <Route path="notifications" element={<AdminNotifications />} />
        </Route>
      </Route>
    </Fragment>
  );
}
