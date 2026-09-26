const makeWASocket = require("@whiskeysockets/baileys").default;
const {
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const qrcode = require("qrcode");
const { getAuthState, hasSession, clearSession } = require("./session");
const logger = require("../utils/logger");

let sock = null;
let qrCodeData = null;
let connectionStatus = "disconnected"; // disconnected | connecting | open
let lastDisconnect = null;

/**
 * Start or restart WhatsApp connection
 */
async function startWhatsApp(onQR, onStatusChange) {
  try {
    const { state, saveCreds } = await getAuthState();
    const { version } = await fetchLatestBaileysVersion();

    connectionStatus = "connecting";
    if (onStatusChange) onStatusChange(connectionStatus);

    sock = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" }))
      },
      printQRInTerminal: false,
      logger: pino({ level: "silent" }),
      browser: ["Lumina", "Chrome", "1.0.0"],
      generateHighQualityLinkPreview: true,
      syncFullHistory: false,
      markOnlineOnConnect: true
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect: ld, qr } = update;

      if (qr) {
        qrCodeData = qr;
        connectionStatus = "qr";
        if (onQR) onQR(qr);
        if (onStatusChange) onStatusChange("qr");
        logger.info("QR Code generated - waiting for scan...");
      }

      if (connection === "open") {
        connectionStatus = "open";
        qrCodeData = null;
        if (onStatusChange) onStatusChange("open");
        logger.info("✅ WhatsApp connected successfully!");
      }

      if (connection === "close") {
        const statusCode = ld?.error?.output?.statusCode;
        lastDisconnect = statusCode;
        connectionStatus = "disconnected";
        if (onStatusChange) onStatusChange("disconnected");

        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        logger.warn(`Connection closed. Status: ${statusCode}. Reconnect: ${shouldReconnect}`);

        if (shouldReconnect) {
          setTimeout(() => startWhatsApp(onQR, onStatusChange), 3000);
        } else {
          logger.info("Logged out. Clearing session...");
          clearSession();
        }
      }
    });

    return sock;
  } catch (err) {
    logger.error("Failed to start WhatsApp:", err.message);
    connectionStatus = "disconnected";
    if (onStatusChange) onStatusChange("disconnected");
    throw err;
  }
}

/**
 * Get current QR as base64 image (for Telegram)
 */
async function getQRBase64() {
  if (!qrCodeData) return null;
  try {
    const base64 = await qrcode.toDataURL(qrCodeData);
    return base64.replace(/^data:image\/png;base64,/, "");
  } catch (err) {
    logger.error("QR generation error:", err.message);
    return null;
  }
}

/**
 * Get current status
 */
function getStatus() {
  return {
    status: connectionStatus,
    hasSession: hasSession(),
    lastDisconnect
  };
}

/**
 * Get the socket instance
 */
function getSocket() {
  return sock;
}

/**
 * Logout and clear session
 */
async function logout() {
  if (sock) {
    try {
      await sock.logout();
    } catch (e) {}
  }
  clearSession();
  connectionStatus = "disconnected";
  qrCodeData = null;
  sock = null;
}

module.exports = {
  startWhatsApp,
  getQRBase64,
  getStatus,
  getSocket,
  logout
};
