const mongoose = require("mongoose");

const COLLABORATOR_ROLES = ["collaborator", "editor", "admin"];
const READ_ROLES = ["viewer", ...COLLABORATOR_ROLES];

function toObjectIdString(value) {
  if (value == null) return null;
  if (typeof value === "object" && value._id) {
    return value._id.toString();
  }
  return value.toString();
}

function buildOwnedProjectQuery(userId) {
  return { owner: userId };
}

function buildAccessibleProjectQuery(userId) {
  return {
    $or: [
      { owner: userId },
      {
        collaborators: {
          $elemMatch: {
            user: userId,
            role: { $in: COLLABORATOR_ROLES },
          },
        },
      },
    ],
  };
}

function buildCollaboratorElemMatch(userId) {
  return {
    user: userId,
    role: { $in: COLLABORATOR_ROLES },
  };
}

function getMembershipRole(project, userId) {
  if (!project || !userId) return null;

  const userIdStr = toObjectIdString(userId);
  const ownerIdStr = toObjectIdString(project.owner);

  if (ownerIdStr === userIdStr) {
    return "owner";
  }

  const collaborators = project.collaborators || [];
  const match = collaborators.find(
    (entry) =>
      toObjectIdString(entry.user) === userIdStr &&
      COLLABORATOR_ROLES.includes(entry.role),
  );

  return match ? "collaborator" : null;
}

function isProjectOwner(project, userId) {
  return getMembershipRole(project, userId) === "owner";
}

function isProjectCollaborator(project, userId) {
  return getMembershipRole(project, userId) === "collaborator";
}

function hasDeployAccess(project, userId) {
  const role = getMembershipRole(project, userId);
  return role === "owner" || role === "collaborator";
}

function formatUserDisplayName(user) {
  if (!user) return "User";
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return fullName || user.username || user.email || "User";
}

function toPublicUser(user) {
  if (!user) return null;
  const id = user._id || user.id;
  return {
    id,
    name: formatUserDisplayName(user),
    email: user.email,
    profileImage: user.profileImage || "",
    username: user.username,
  };
}

function transformCollaboratorEntry(entry) {
  const user = entry.user;
  return {
    user: toPublicUser(user),
    role: entry.role,
    addedAt: entry.addedAt,
    addedBy: entry.addedBy ? toObjectIdString(entry.addedBy) : null,
  };
}

module.exports = {
  COLLABORATOR_ROLES,
  READ_ROLES,
  buildOwnedProjectQuery,
  buildAccessibleProjectQuery,
  buildCollaboratorElemMatch,
  getMembershipRole,
  isProjectOwner,
  isProjectCollaborator,
  hasDeployAccess,
  formatUserDisplayName,
  toPublicUser,
  transformCollaboratorEntry,
  toObjectIdString,
};
