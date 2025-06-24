const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const User = require("../models/User");
const crypto = require("crypto");

function sanitizeUsername(username) {
  if (!username) return undefined;
  // Only allow letters, numbers, hyphens, and underscores
  return username.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30);
}

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Try to find user by provider ID
        let user = await User.findOne({ googleId: profile.id });
        // If not found, try to find by email (for account linking)
        if (!user && profile.emails && profile.emails[0]) {
          user = await User.findOne({ email: profile.emails[0].value });
          if (user) {
            user.googleId = profile.id;
            user.isVerified = true; // Verify existing user when linking OAuth account
            if (profile.photos && profile.photos[0]) {
              user.profileImage = profile.photos[0].value;
            }
            await user.save();
          }
        }
        if (!user) {
          user = await User.create({
            username: sanitizeUsername(
              profile.displayName ||
                profile.username ||
                profile.emails?.[0]?.value?.split("@")[0]
            ),
            email: profile.emails[0].value,
            googleId: profile.id,
            password: crypto.randomBytes
              ? crypto.randomBytes(20).toString("hex")
              : Math.random().toString(36).slice(-20),
            profileImage:
              profile.photos && profile.photos[0]
                ? profile.photos[0].value
                : "",
            isVerified: true, // OAuth users are automatically verified
          });
        } else {
          // Update profile image if changed
          if (
            profile.photos &&
            profile.photos[0] &&
            user.profileImage !== profile.photos[0].value
          ) {
            user.profileImage = profile.photos[0].value;
            await user.save();
          }
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// GitHub OAuth Strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
      scope: ["user:email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ githubId: profile.id });
        // Try to find by email for account linking
        if (!user && profile.emails && profile.emails[0]) {
          user = await User.findOne({ email: profile.emails[0].value });
          if (user) {
            user.githubId = profile.id;
            user.isVerified = true; // Verify existing user when linking OAuth account
            if (profile.photos && profile.photos[0]) {
              user.profileImage = profile.photos[0].value;
            }
            await user.save();
          }
        }
        if (!user) {
          user = await User.create({
            username: sanitizeUsername(
              profile.displayName ||
                profile.username ||
                profile.emails?.[0]?.value?.split("@")[0]
            ),
            email:
              (profile.emails &&
                profile.emails[0] &&
                profile.emails[0].value) ||
              undefined,
            githubId: profile.id,
            password: crypto.randomBytes
              ? crypto.randomBytes(20).toString("hex")
              : Math.random().toString(36).slice(-20),
            profileImage:
              profile.photos && profile.photos[0]
                ? profile.photos[0].value
                : "",
            isVerified: true, // OAuth users are automatically verified
          });
        } else {
          if (
            profile.photos &&
            profile.photos[0] &&
            user.profileImage !== profile.photos[0].value
          ) {
            user.profileImage = profile.photos[0].value;
            await user.save();
          }
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
