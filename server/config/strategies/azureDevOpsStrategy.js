// Azure DevOps Strategy - Repository Access Only (No Authentication)
const OAuth2Strategy = require("passport-oauth2").Strategy;
const axios = require("axios");

class AzureDevOpsStrategy extends OAuth2Strategy {
  constructor(options, verify) {
    const azureOptions = {
      authorizationURL: "https://app.vssps.visualstudio.com/oauth2/authorize",
      tokenURL: "https://app.vssps.visualstudio.com/oauth2/token",
      clientID: options.clientID,
      clientSecret: options.clientSecret,
      callbackURL: options.callbackURL,
      scope: options.scope || ["vso.code", "vso.identity", "vso.project"],
      scopeSeparator: " ",
      passReqToCallback: options.passReqToCallback,
    };

    super(azureOptions, verify);
    this.name = "azuredevops";
    this._userProfileURL =
      "https://app.vssps.visualstudio.com/_apis/profile/profiles/me?api-version=6.0";
  }

  userProfile(accessToken, done) {
    axios
      .get(this._userProfileURL, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      })
      .then((response) => {
        const profile = {
          provider: "azuredevops",
          id: response.data.id,
          displayName: response.data.displayName,
          emails: response.data.emailAddress
            ? [{ value: response.data.emailAddress }]
            : [],
          photos: response.data.avatar
            ? [{ value: response.data.avatar }]
            : [],
          _raw: JSON.stringify(response.data),
          _json: response.data,
        };
        done(null, profile);
      })
      .catch((error) => {
        console.error("Azure DevOps profile fetch error:", error);
        done(error);
      });
  }
}

// Azure DevOps Integration Strategy (repository access only)
const azureDevOpsIntegrationStrategy = new AzureDevOpsStrategy(
  {
    clientID: process.env.AZURE_DEVOPS_CLIENT_ID,
    clientSecret: process.env.AZURE_DEVOPS_CLIENT_SECRET,
    callbackURL: `${process.env.BASE_URL}/api/v1/git/connect/azuredevops/callback`,
    scope: ["vso.code", "vso.identity", "vso.project"],
    passReqToCallback: true, // Enable req parameter to access state
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      console.log("Azure DevOps Integration OAuth Profile:", {
        id: profile.id,
        displayName: profile.displayName,
        email: profile.emails?.[0]?.value,
        state: req.query.state,
      });

      // Return the Azure DevOps profile, tokens, and state
      return done(null, profile, {
        accessToken,
        refreshToken,
        state: req.query.state,
      });
    } catch (error) {
      console.error("Azure DevOps integration strategy error:", error);
      return done(error, null);
    }
  }
);

module.exports = {
  azureDevOpsIntegrationStrategy,
  AzureDevOpsStrategy,
};
