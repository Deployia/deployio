import { Outlet } from "react-router-dom";
import BaseLayout from "./BaseLayout";

function ResourcesLayout({ children }) {
  return <BaseLayout padding="py-4">{children || <Outlet />}</BaseLayout>;
}

export default ResourcesLayout;
