import { Route } from "react-router-dom";
import { lazy, Fragment } from "react";
const ProtectedRoute = lazy(() => import("@components/ProtectedRoute"));
const AdminLayout = lazy(() => import("@pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("@pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("@pages/admin/AdminUsers"));
const AdminProjects = lazy(() => import("@pages/admin/AdminProjects"));
const AdminBlogs = lazy(() => import("@pages/admin/AdminBlogs"));
const AdminDeployments = lazy(() => import("@pages/admin/AdminDeployments"));
const AdminSecurity = lazy(() => import("@pages/admin/AdminSecurity"));
const AdminSettings = lazy(() => import("@pages/admin/AdminSettings"));

export default function AdminRoutes() {
  return (
    <Fragment>
      <Route element={<ProtectedRoute admin={true} />}>
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="projects" element={<AdminProjects />} />
          <Route path="blogs" element={<AdminBlogs />} />
          <Route path="deployments" element={<AdminDeployments />} />
          <Route path="security" element={<AdminSecurity />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Route>
    </Fragment>
  );
}
