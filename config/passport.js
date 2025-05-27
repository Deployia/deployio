const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const User = require("../models/User");
const crypto = require("crypto");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          user = await User.create({
            username: profile.displayName,
            email: profile.emails[0].value,
            googleId: profile.id,
            password: crypto.randomBytes
              ? crypto.randomBytes(20).toString("hex")
              : Math.random().toString(36).slice(-20), // fallback for environments without crypto.randomBytes
            profileImage:
              profile.photos && profile.photos[0]
                ? profile.photos[0].value
                : "",
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

// Facebook OAuth Strategy
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      callbackURL: process.env.FACEBOOK_CALLBACK_URL,
      profileFields: ["id", "displayName", "emails", "photos"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ facebookId: profile.id });
        if (!user) {
          user = await User.create({
            username: profile.displayName,
            email:
              profile.emails && profile.emails[0]
                ? profile.emails[0].value
                : undefined,
            facebookId: profile.id,
            password: crypto.randomBytes
              ? crypto.randomBytes(20).toString("hex")
              : Math.random().toString(36).slice(-20),
            profileImage:
              profile.photos && profile.photos[0]
                ? profile.photos[0].value
                : "",
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
        if (!user) {
          user = await User.create({
            username: profile.displayName || profile.username,
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
