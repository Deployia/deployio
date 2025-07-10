import { Outlet, useLocation } from "react-router-dom";
import BaseLayout from "./BaseLayout";

function DashboardLayout({ children }) {
  const location = useLocation();
  // For /dashboard/projects/create, enforce no padding and full width
  const isCreatePage = location.pathname === "/dashboard/projects/create";
  return (
    <BaseLayout
      padding={isCreatePage ? "p-0" : "py-4"}
      maxWidth={isCreatePage ? "w-full max-w-none" : undefined}
    >
      {children || <Outlet />}
    </BaseLayout>
  );
}

export default DashboardLayout;
