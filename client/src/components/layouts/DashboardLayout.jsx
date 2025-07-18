import { Outlet, useLocation } from "react-router-dom";
import BaseLayout from "./BaseLayout";
import DashboardBreadcrumbs from "@components/dashboard/DashboardBreadcrumbs";

function DashboardLayout({ children }) {
  const location = useLocation();
  // For /dashboard/projects/create, enforce no padding and full width
  const isCreatePage = location.pathname === "/dashboard/projects/create";
  const isDashboardHome = location.pathname === "/dashboard";

  return (
    <BaseLayout
      padding={isCreatePage ? "p-0" : "py-4"}
      maxWidth={isCreatePage ? "w-full max-w-none" : undefined}
    >
      {!isCreatePage && !isDashboardHome && <DashboardBreadcrumbs />}
      {children || <Outlet />}
    </BaseLayout>
  );
}

export default DashboardLayout;
