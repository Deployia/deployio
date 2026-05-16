/**
 * One-time migration: encrypt secrets already stored in MongoDB.
 *
 * Targets:
 * - User.gitProviders.*.accessToken / refreshToken
 * - User.twoFactorSecret / twoFactorTempSecret
 * - Legacy gitProviders.azuredevops → azureDevOps
 * - Project.deployment.environment.*.value (env vars)
 *
 * Usage (from server/):
 *   node scripts/migrateSecretsAtRest.js              # dry-run (default)
 *   node scripts/migrateSecretsAtRest.js --execute    # write changes
 *
 * Requires SECRETS_ENCRYPTION_KEY or ENV_ENCRYPTION_KEY in .env
 * (same key the running app uses — or plaintext cannot be recovered after encrypt).
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const User = require("../models/User");
const Project = require("../models/Project");
const {
  isEncrypted,
  ensureEncrypted,
  resolveEncryptionKey,
} = require("../utils/secretsVault");
const { encryptEnvironmentMap } = require("../utils/envVarPayload");

const PROVIDER_KEYS = ["github", "gitlab", "azureDevOps", "bitbucket"];

function migrateGitProviders(gitProviders, stats) {
  if (!gitProviders || typeof gitProviders !== "object") {
    return false;
  }

  let modified = false;

  const legacy = gitProviders.azuredevops;
  if (legacy && !gitProviders.azureDevOps) {
    gitProviders.azureDevOps = legacy;
    delete gitProviders.azuredevops;
    stats.legacyAzureKeys += 1;
    modified = true;
  }

  for (const key of PROVIDER_KEYS) {
    const provider = gitProviders[key];
    if (!provider) continue;

    for (const field of ["accessToken", "refreshToken"]) {
      const value = provider[field];
      if (!value || isEncrypted(value)) continue;
      provider[field] = ensureEncrypted(value);
      stats.gitTokens += 1;
      modified = true;
    }
  }

  return modified;
}

function migrateTwoFactorFields(user, stats) {
  let modified = false;
  for (const field of ["twoFactorSecret", "twoFactorTempSecret"]) {
    const value = user[field];
    if (!value || isEncrypted(value)) continue;
    user[field] = ensureEncrypted(value);
    stats.twoFactorSecrets += 1;
    modified = true;
  }
  return modified;
}

function envMapNeedsMigration(envMap) {
  if (!envMap) return false;
  for (const target of ["development", "staging", "production"]) {
    const list = envMap[target];
    if (!Array.isArray(list)) continue;
    for (const row of list) {
      if (row?.value && !isEncrypted(row.value)) {
        return true;
      }
    }
  }
  return false;
}

async function main() {
  const execute = process.argv.includes("--execute");
  const dryRun = !execute;

  console.log(
    dryRun
      ? "DRY RUN — no writes (pass --execute to apply)\n"
      : "EXECUTE — writing encrypted values to MongoDB\n",
  );

  try {
    resolveEncryptionKey();
  } catch (error) {
    console.error(
      "Missing encryption key. Set SECRETS_ENCRYPTION_KEY in server/.env",
    );
    console.error(error.message);
    process.exit(1);
  }

  const mongoUri =
    process.env.MONGODB_URI || "mongodb://localhost:27017/deployio-platform";
  await mongoose.connect(mongoUri);
  console.log(`Connected to ${mongoose.connection.name}\n`);

  const stats = {
    usersScanned: 0,
    usersUpdated: 0,
    gitTokens: 0,
    twoFactorSecrets: 0,
    legacyAzureKeys: 0,
    projectsScanned: 0,
    projectsUpdated: 0,
    envValues: 0,
  };

  const users = await User.find({})
    .select(
      "+gitProviders.github.accessToken +gitProviders.github.refreshToken " +
        "+gitProviders.gitlab.accessToken +gitProviders.gitlab.refreshToken " +
        "+gitProviders.azureDevOps.accessToken +gitProviders.azureDevOps.refreshToken " +
        "+gitProviders.bitbucket.accessToken +gitProviders.bitbucket.refreshToken " +
        "+gitProviders +twoFactorSecret +twoFactorTempSecret",
    )
    .lean(false);

  for (const user of users) {
    stats.usersScanned += 1;
    let modified = false;

    if (user.gitProviders && migrateGitProviders(user.gitProviders, stats)) {
      user.markModified("gitProviders");
      modified = true;
    }

    if (migrateTwoFactorFields(user, stats)) {
      modified = true;
    }

    if (modified) {
      stats.usersUpdated += 1;
      if (execute) {
        await user.save();
      }
    }
  }

  const projects = await Project.find({
    $or: [
      { "deployment.environment.development.0": { $exists: true } },
      { "deployment.environment.staging.0": { $exists: true } },
      { "deployment.environment.production.0": { $exists: true } },
    ],
  });

  for (const project of projects) {
    stats.projectsScanned += 1;
    const env = project.deployment?.environment;
    if (!envMapNeedsMigration(env)) continue;

    const before = JSON.stringify(env);
    const encrypted = encryptEnvironmentMap(env);
    const after = JSON.stringify(encrypted);

    if (before !== after) {
      for (const target of ["development", "staging", "production"]) {
        for (const row of encrypted[target] || []) {
          if (row?.value && isEncrypted(row.value)) {
            stats.envValues += 1;
          }
        }
      }
      stats.projectsUpdated += 1;
      if (execute) {
        project.deployment.environment = encrypted;
        project.markModified("deployment.environment");
        await project.save();
      }
    }
  }

  console.log("Summary:");
  console.log(`  Users scanned:     ${stats.usersScanned}`);
  console.log(`  Users to update:   ${stats.usersUpdated}`);
  console.log(`  Git tokens:        ${stats.gitTokens}`);
  console.log(`  2FA secrets:       ${stats.twoFactorSecrets}`);
  console.log(`  Legacy azure keys: ${stats.legacyAzureKeys}`);
  console.log(`  Projects scanned:  ${stats.projectsScanned}`);
  console.log(`  Projects to update:${stats.projectsUpdated}`);
  console.log(`  Env values:        ${stats.envValues}`);

  if (dryRun && (stats.usersUpdated > 0 || stats.projectsUpdated > 0)) {
    console.log("\nRe-run with: node scripts/migrateSecretsAtRest.js --execute");
  }

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
