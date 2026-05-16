/**
 * @deprecated Use secretsVault.js — re-exported for backward compatibility.
 */
const {
  encryptSecret,
  decryptSecret,
  isEncrypted,
  hasStoredSecret,
  ENC_PREFIX,
} = require("./secretsVault");

module.exports = {
  encryptEnvValue: encryptSecret,
  decryptEnvValue: decryptSecret,
  isEncrypted,
  envValueHasSecret: hasStoredSecret,
  ENC_PREFIX,
};
