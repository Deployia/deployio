import { Route, Navigate } from "react-router-dom";
import { lazy, Fragment } from "react";

const ResourcesLayout = lazy(() =>
  import("@components/layouts/ResourcesLayout")
);
const DocsLayout = lazy(() => import("@pages/docs/DocsLayout"));
const DocsOverview = lazy(() => import("@pages/docs/DocsOverview"));
const DocumentPage = lazy(() => import("@pages/docs/DocumentPage"));
const BlogLayout = lazy(() => import("@pages/blog/BlogLayout"));
const BlogOverview = lazy(() => import("@pages/blog/BlogOverview"));
const BlogPostPage = lazy(() => import("@pages/blog/BlogPostPage"));
const SupportCenter = lazy(() => import("@support/SupportCenter"));
const Community = lazy(() => import("@marketing/Community"));

export default function ResourcesRoutes() {
  return (
    <Fragment>
      <Route path="resources" element={<ResourcesLayout />}>
        {/* Documentation */}
        <Route path="docs" element={<DocsLayout />}>
          <Route index element={<Navigate to="getting-started" replace />} />
          <Route path=":category" element={<DocsOverview />} />
          <Route path=":category/:slug" element={<DocumentPage />} />
        </Route>
        {/* Blog */}
        <Route path="blogs" element={<BlogLayout />}>
          <Route index element={<BlogOverview />} />
          <Route path=":category" element={<BlogOverview />} />
          <Route path=":category/:slug" element={<BlogPostPage />} />
        </Route>
        {/* Support & Community */}
        <Route path="support" element={<SupportCenter />} />
        <Route path="community" element={<Community />} />
      </Route>
    </Fragment>
  );
}
