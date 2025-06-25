const OAuth2Strategy = require("passport-oauth2").Strategy;
const User = require("../../models/User");
const crypto = require("crypto");
const axios = require("axios");

function sanitizeUsername(username) {
  if (!username) return undefined;
  return username.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30);
}

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
        const profile = response.data;
        const normalizedProfile = {
          provider: "azuredevops",
          id: profile.id,
          displayName: profile.displayName,
          email: profile.emailAddress,
          emails: [{ value: profile.emailAddress }],
          photos: profile.avatar ? [{ value: profile.avatar }] : [],
          profileUrl: profile.profileUrl,
          _raw: JSON.stringify(profile),
          _json: profile,
        };

        done(null, normalizedProfile);
      })
      .catch((error) => {
        done(error);
      });
  }
}

const azureDevOpsStrategy = new AzureDevOpsStrategy(
  {
    clientID: process.env.AZURE_DEVOPS_CLIENT_ID,
    clientSecret: process.env.AZURE_DEVOPS_CLIENT_SECRET,
    callbackURL:
      process.env.AZURE_DEVOPS_CALLBACK_URL ||
      `${process.env.BASE_URL}/auth/azuredevops/callback`,
    scope: ["vso.code", "vso.identity", "vso.project"],
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      console.log("Azure DevOps OAuth Profile:", {
        id: profile.id,
        displayName: profile.displayName,
        email: profile.email,
      });

      let user = await User.findOne({ azureDevOpsId: profile.id });

      // Try to find by email for account linking
      if (!user && profile.email) {
        user = await User.findOne({ email: profile.email });
        if (user) {
          // Link Azure DevOps to existing account
          user.azureDevOpsId = profile.id;
          user.isEmailVerified = true;

          // Initialize gitProviders if not exists
          if (!user.gitProviders) {
            user.gitProviders = {};
          }

          // Set Azure DevOps provider data
          user.gitProviders.azureDevOps = {
            id: profile.id,
            displayName: profile.displayName,
            email: profile.email,
            avatarUrl: profile.photos?.[0]?.value,
            profileUrl: profile.profileUrl,
            accessToken: accessToken,
            refreshToken: refreshToken,
            tokenExpiry: refreshToken
              ? new Date(Date.now() + 1 * 60 * 60 * 1000)
              : null, // 1 hour
            scopes: ["vso.code", "vso.identity", "vso.project"],
            repoAccess: {
              public: true,
              private: true,
            },
            isConnected: true,
            connectedAt: new Date(),
            lastUsed: new Date(),
          };

          await user.save();
        }
      }

      if (!user) {
        // Create new user with Azure DevOps account
        const userData = {
          username: sanitizeUsername(
            profile.displayName || profile.email?.split("@")[0]
          ),
          email: profile.email,
          azureDevOpsId: profile.id,
          password: crypto.randomBytes(20).toString("hex"),
          profileImage: profile.photos?.[0]?.value || "",
          isEmailVerified: true,
          status: "active",
          gitProviders: {
            azureDevOps: {
              id: profile.id,
              displayName: profile.displayName,
              email: profile.email,
              avatarUrl: profile.photos?.[0]?.value,
              profileUrl: profile.profileUrl,
              accessToken: accessToken,
              refreshToken: refreshToken,
              tokenExpiry: refreshToken
                ? new Date(Date.now() + 1 * 60 * 60 * 1000)
                : null,
              scopes: ["vso.code", "vso.identity", "vso.project"],
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
        // Update existing Azure DevOps connection
        if (!user.gitProviders) {
          user.gitProviders = {};
        }

        // Update Azure DevOps provider data
        user.gitProviders.azureDevOps = {
          ...user.gitProviders.azureDevOps,
          accessToken: accessToken,
          refreshToken: refreshToken,
          tokenExpiry: refreshToken
            ? new Date(Date.now() + 1 * 60 * 60 * 1000)
            : null,
          avatarUrl: profile.photos?.[0]?.value,
          isConnected: true,
          lastUsed: new Date(),
        };

        // Update profile image if changed and no current image
        if (
          profile.photos?.[0]?.value &&
          (!user.profileImage || user.profileImage === "")
        ) {
          user.profileImage = profile.photos[0].value;
        }

        await user.save();
      }

      return done(null, user);
    } catch (err) {
      console.error("Azure DevOps OAuth Error:", err);
      return done(err, null);
    }
  }
);

module.exports = azureDevOpsStrategy;
