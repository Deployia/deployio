import { Route } from "react-router-dom";
import PlaygroundLayout from "../pages/playground/PlaygroundLayout";
import PlaygroundOverview from "../pages/playground/PlaygroundOverview";
import { Fragment } from "react";

const PlaygroundRoutes = () => {
  return (
    <Fragment>
      <Route path="playground" element={<PlaygroundLayout />}>
        <Route index element={<PlaygroundOverview />} />
        <Route path="editor" element={<div />} />
        <Route path="analysis" element={<div />} />
        <Route path="generation" element={<div />} />
        <Route path="learning" element={<div />} />
        <Route path="chatbot" element={<div />} />
      </Route>
    </Fragment>
  );
};

export default PlaygroundRoutes;
