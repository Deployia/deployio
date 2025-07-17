import { Route, Navigate } from "react-router-dom";
import { lazy, Fragment } from "react";
const DownloadsLayout = lazy(() =>
  import("@components/layouts/DownloadsLayout")
);
const CLITool = lazy(() => import("@downloads/CLITool"));
const SDK = lazy(() => import("@downloads/SDK"));

export default function DownloadsRoutes() {
  return (
    <Fragment>
      <Route path="downloads" element={<DownloadsLayout />}>
        <Route index element={<Navigate to="cli" replace />} />
        <Route path="cli" element={<CLITool />} />
        <Route path="sdk" element={<SDK />} />
      </Route>
    </Fragment>
  );
}
