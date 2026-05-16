// GitLab Strategy - Repository Access Only (No Authentication)
const GitLabStrategy = require("passport-gitlab2").Strategy;
const { GITLAB_CONNECT_SCOPES } = require("../../constants/gitOAuthScopes");

// GitLab Integration Strategy (repository access only)
const gitlabIntegrationStrategy = new GitLabStrategy(
  {
    clientID: process.env.GITLAB_CLIENT_ID,
    clientSecret: process.env.GITLAB_CLIENT_SECRET,
    callbackURL: `${process.env.BASE_URL}/api/v1/git/connect/gitlab/callback`,
    scope: GITLAB_CONNECT_SCOPES,
    scopeSeparator: " ", // GitLab requires space-separated scopes (library default is comma → invalid_scope)
    passReqToCallback: true, // Enable req parameter to access state
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      console.log("GitLab Integration OAuth Profile:", {
        id: profile.id,
        username: profile.username,
        email: profile.emails?.[0]?.value,
        state: req.query.state,
      });

      // Return the GitLab profile, tokens, and state
      return done(null, profile, {
        accessToken,
        refreshToken,
        state: req.query.state,
      });
    } catch (error) {
      console.error("GitLab integration strategy error:", error);
      return done(error, null);
    }
  }
);

module.exports = {
  gitlabIntegrationStrategy,
};
