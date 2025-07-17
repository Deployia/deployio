import { Route } from "react-router-dom";
import { lazy, Fragment } from "react";
const PlaygroundRoutesComponent = lazy(() =>
  import("@pages/playground/PlaygroundRoutes")
);

export default function PlaygroundProtectedRoutes() {
  return (
    <Fragment>
      <Route path="playground/*" element={<PlaygroundRoutesComponent />} />
    </Fragment>
  );
}
