const {
  encryptSecret,
  decryptSecret,
  ensureEncrypted,
} = require("./secretsVault");
const { normalizeGitProviderKey, toApiProviderId } = require("./gitProviderKeys");

function encryptOAuthToken(plaintext) {
  return encryptSecret(plaintext);
}

function decryptOAuthToken(stored) {
  return decryptSecret(stored);
}

function encryptProviderTokenFields(providerData) {
  if (!providerData) {
    return providerData;
  }
  if (providerData.accessToken) {
    providerData.accessToken = ensureEncrypted(providerData.accessToken);
  }
  if (providerData.refreshToken) {
    providerData.refreshToken = ensureEncrypted(providerData.refreshToken);
  }
  return providerData;
}

function getDecryptedAccessToken(providerData) {
  if (!providerData?.accessToken) {
    return null;
  }
  return decryptOAuthToken(providerData.accessToken);
}

function getDecryptedRefreshToken(providerData) {
  if (!providerData?.refreshToken) {
    return null;
  }
  return decryptOAuthToken(providerData.refreshToken);
}

module.exports = {
  encryptOAuthToken,
  decryptOAuthToken,
  encryptProviderTokenFields,
  getDecryptedAccessToken,
  getDecryptedRefreshToken,
  normalizeGitProviderKey,
  toApiProviderId,
};
