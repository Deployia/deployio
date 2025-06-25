const GitLabStrategy = require("passport-gitlab2").Strategy;
const User = require("../../models/User");
const crypto = require("crypto");

function sanitizeUsername(username) {
  if (!username) return undefined;
  // Only allow letters, numbers, hyphens, and underscores
  return username.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30);
}

const gitlabStrategy = new GitLabStrategy(
  {
    clientID: process.env.GITLAB_CLIENT_ID,
    clientSecret: process.env.GITLAB_CLIENT_SECRET,
    callbackURL:
      process.env.GITLAB_CALLBACK_URL ||
      `${process.env.BASE_URL}/auth/gitlab/callback`,
    scope: ["read_user", "read_repository", "api"],
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      console.log("GitLab OAuth Profile:", {
        id: profile.id,
        username: profile.username,
        email: profile.emails?.[0]?.value,
        name: profile.displayName,
      });

      let user = await User.findOne({ gitlabId: profile.id });

      // Try to find by email for account linking
      if (!user && profile.emails && profile.emails[0]) {
        user = await User.findOne({ email: profile.emails[0].value });
        if (user) {
          // Link GitLab to existing account
          user.gitlabId = profile.id;
          user.isEmailVerified = true;

          // Initialize gitProviders if not exists
          if (!user.gitProviders) {
            user.gitProviders = {};
          }

          // Set GitLab provider data
          user.gitProviders.gitlab = {
            id: profile.id,
            username: profile.username,
            email: profile.emails[0].value,
            name: profile.displayName,
            avatarUrl: profile.avatar_url || profile.photos?.[0]?.value,
            profileUrl: profile.profileUrl || profile.web_url,
            accessToken: accessToken,
            refreshToken: refreshToken,
            tokenExpiry: refreshToken
              ? new Date(Date.now() + 2 * 60 * 60 * 1000)
              : null, // 2 hours
            scopes: ["read_user", "read_repository", "api"],
            repoAccess: {
              public: true,
              private: true, // GitLab typically allows private repo access
            },
            isConnected: true,
            connectedAt: new Date(),
            lastUsed: new Date(),
          };

          await user.save();
        }
      }

      if (!user) {
        // Create new user with GitLab account
        const userData = {
          username: sanitizeUsername(
            profile.username ||
              profile.displayName ||
              profile.emails?.[0]?.value?.split("@")[0]
          ),
          email: profile.emails?.[0]?.value,
          gitlabId: profile.id,
          password: crypto.randomBytes(20).toString("hex"),
          profileImage: profile.avatar_url || profile.photos?.[0]?.value || "",
          isEmailVerified: true,
          status: "active",
          gitProviders: {
            gitlab: {
              id: profile.id,
              username: profile.username,
              email: profile.emails?.[0]?.value,
              name: profile.displayName,
              avatarUrl: profile.avatar_url || profile.photos?.[0]?.value,
              profileUrl: profile.profileUrl || profile.web_url,
              accessToken: accessToken,
              refreshToken: refreshToken,
              tokenExpiry: refreshToken
                ? new Date(Date.now() + 2 * 60 * 60 * 1000)
                : null,
              scopes: ["read_user", "read_repository", "api"],
              repoAccess: {
                public: true,
                private: true,
              },
              isConnected: true,
              connectedAt: new Date(),
              lastUsed: new Date(),
            },
          },
        };

        user = await User.create(userData);
      } else {
        // Update existing GitLab connection
        if (!user.gitProviders) {
          user.gitProviders = {};
        }

        // Update GitLab provider data
        user.gitProviders.gitlab = {
          ...user.gitProviders.gitlab,
          accessToken: accessToken,
          refreshToken: refreshToken,
          tokenExpiry: refreshToken
            ? new Date(Date.now() + 2 * 60 * 60 * 1000)
            : null,
          avatarUrl: profile.avatar_url || profile.photos?.[0]?.value,
          isConnected: true,
          lastUsed: new Date(),
        };

        // Update profile image if changed and no current image
        if (
          profile.avatar_url &&
          (!user.profileImage || user.profileImage === "")
        ) {
          user.profileImage = profile.avatar_url;
        }

        await user.save();
      }

      return done(null, user);
    } catch (err) {
      console.error("GitLab OAuth Error:", err);
      return done(err, null);
    }
  }
);

module.exports = gitlabStrategy;
