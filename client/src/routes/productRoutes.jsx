import { Route, Navigate } from "react-router-dom";
import { lazy, Fragment } from "react";
const ProductsLayout = lazy(() => import("@components/layouts/ProductsLayout"));
const AIDeployment = lazy(() => import("@products/AIDeployment"));
const CodeAnalysis = lazy(() => import("@products/CodeAnalysis"));
const CloudIntegration = lazy(() => import("@products/CloudIntegration"));
const DevOpsAutomation = lazy(() => import("@products/DevOpsAutomation"));
const SecurityShield = lazy(() => import("@products/SecurityShield"));

export default function ProductRoutes() {
  return (
    <Fragment>
      <Route path="products" element={<ProductsLayout />}>
        <Route index element={<Navigate to="ai-deployment" replace />} />
        <Route path="ai-deployment" element={<AIDeployment />} />
        <Route path="code-analysis" element={<CodeAnalysis />} />
        <Route path="cloud-integration" element={<CloudIntegration />} />
        <Route path="devops-automation" element={<DevOpsAutomation />} />
        <Route path="security-shield" element={<SecurityShield />} />
      </Route>
    </Fragment>
  );
}
