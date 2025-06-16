import { Outlet } from "react-router-dom";
import BaseLayout from "./BaseLayout";

function DashboardLayout({ children }) {
  return <BaseLayout padding="py-4">{children || <Outlet />}</BaseLayout>;
}

export default DashboardLayout;
