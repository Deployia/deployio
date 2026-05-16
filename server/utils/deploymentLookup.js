const mongoose = require("mongoose");

/** Runtime deployment id format: dep_<24 hex chars> */
const RUNTIME_DEPLOYMENT_ID_RE = /^dep_[a-f0-9]{24}$/i;

/**
 * Build a Mongoose query for a deployment by Mongo _id or runtime deploymentId (dep_*).
 */
function buildDeploymentLookup(deploymentId) {
  const normalized = String(deploymentId || "").trim();
  if (!normalized) return null;

  if (RUNTIME_DEPLOYMENT_ID_RE.test(normalized)) {
    return { deploymentId: normalized };
  }

  if (mongoose.Types.ObjectId.isValid(normalized)) {
    return { $or: [{ _id: normalized }, { deploymentId: normalized }] };
  }

  return { deploymentId: normalized };
}

function isDeploymentIdentifier(value) {
  const normalized = String(value || "").trim();
  if (!normalized) return false;
  if (RUNTIME_DEPLOYMENT_ID_RE.test(normalized)) return true;
  return mongoose.Types.ObjectId.isValid(normalized);
}

module.exports = {
  buildDeploymentLookup,
  isDeploymentIdentifier,
  RUNTIME_DEPLOYMENT_ID_RE,
};
