const crypto = require("crypto");

const ENC_PREFIX = "enc:v1:";
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

let cachedKey = null;

function resolveEncryptionKey() {
  if (cachedKey) {
    return cachedKey;
  }

  const raw =
    process.env.SECRETS_ENCRYPTION_KEY || process.env.ENV_ENCRYPTION_KEY;
  if (!raw) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "SECRETS_ENCRYPTION_KEY (or ENV_ENCRYPTION_KEY) is required in production to store secrets securely",
      );
    }
    cachedKey = crypto
      .createHash("sha256")
      .update("deployio-dev-secrets-key")
      .digest();
    return cachedKey;
  }

  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error(
      "SECRETS_ENCRYPTION_KEY must be a base64-encoded 32-byte key (openssl rand -base64 32)",
    );
  }

  cachedKey = key;
  return cachedKey;
}

function isEncrypted(value) {
  return typeof value === "string" && value.startsWith(ENC_PREFIX);
}

function hasStoredSecret(value) {
  return String(value ?? "").length > 0;
}

function encryptSecret(plaintext) {
  const plain = String(plaintext ?? "");
  if (!plain) {
    return "";
  }

  if (isEncrypted(plain)) {
    return plain;
  }

  const key = resolveEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${ENC_PREFIX}${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

function decryptSecret(stored) {
  const value = String(stored ?? "");
  if (!value) {
    return "";
  }

  if (!isEncrypted(value)) {
    return value;
  }

  const payload = value.slice(ENC_PREFIX.length);
  const [ivB64, tagB64, ctB64] = payload.split(":");
  if (!ivB64 || !tagB64 || !ctB64) {
    throw new Error("Invalid encrypted secret format");
  }

  const key = resolveEncryptionKey();
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(ivB64, "base64"),
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(ctB64, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

/** Encrypt if plaintext; pass through if already encrypted; lazy-migrate legacy plaintext. */
function ensureEncrypted(stored) {
  const value = String(stored ?? "");
  if (!value) {
    return "";
  }
  if (isEncrypted(value)) {
    return value;
  }
  return encryptSecret(value);
}

/** Decrypt ciphertext or return legacy plaintext unchanged. */
function ensureDecrypted(stored) {
  return decryptSecret(stored);
}

module.exports = {
  ENC_PREFIX,
  resolveEncryptionKey,
  isEncrypted,
  hasStoredSecret,
  encryptSecret,
  decryptSecret,
  ensureEncrypted,
  ensureDecrypted,
};
