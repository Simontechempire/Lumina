const fs = require("fs");
const path = require("path");
const { useMultiFileAuthState } = require("@whiskeysockets/baileys");
const settings = require("../../config/settings");

const sessionDir = path.resolve(settings.sessionPath);

// Ensure sessions folder exists
if (!fs.existsSync(sessionDir)) {
  fs.mkdirSync(sessionDir, { recursive: true });
}

/**
 * Load WhatsApp multi-file auth state
 */
async function getAuthState() {
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  return { state, saveCreds };
}

/**
 * Check if a session already exists
 */
function hasSession() {
  const credsPath = path.join(sessionDir, "creds.json");
  return fs.existsSync(credsPath);
}

/**
 * Delete current session (force re-pair)
 */
function clearSession() {
  if (fs.existsSync(sessionDir)) {
    fs.rmSync(sessionDir, { recursive: true, force: true });
    fs.mkdirSync(sessionDir, { recursive: true });
  }
}

module.exports = {
  getAuthState,
  hasSession,
  clearSession,
  sessionDir
};
