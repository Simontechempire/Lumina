const { getBot, sendPhotoToOwner } = require("../bot");
const { startWhatsApp, getQRBase64, getStatus, logout } = require("../../whatsapp/client");
const { clearSession } = require("../../whatsapp/session");
const logger = require("../../utils/logger");

/**
 * Handle /pair and /connect commands
 */
function registerPairCommands() {
  const bot = getBot();
  if (!bot) return;

  const handlePair = async (msg) => {
    const chatId = msg.chat.id;

    try {
      await bot.sendMessage(chatId, "🔄 Starting WhatsApp connection...\nPlease wait.");

      // Start WhatsApp and listen for QR
      await startWhatsApp(
        // onQR
        async (qr) => {
          const base64 = await getQRBase64();
          if (base64) {
            await sendPhotoToOwner(
              base64,
              "📱 *Scan this QR Code with WhatsApp*\n\n1. Open WhatsApp\n2. Linked Devices\n3. Link a Device\n4. Scan this QR\n\n_QR expires in \~60 seconds_"
            );
          } else {
            await bot.sendMessage(chatId, "⚠️ Failed to generate QR image. Check logs.");
          }
        },
        // onStatusChange
        async (status) => {
          if (status === "open") {
            await bot.sendMessage(
              chatId,
              "✅ *Lumina is now connected to WhatsApp!*\n\nYou can use other commands."
            );
          } else if (status === "disconnected") {
            await bot.sendMessage(chatId, "⚠️ WhatsApp disconnected.");
          }
        }
      );
    } catch (err) {
      logger.error("Pair error:", err.message);
      await bot.sendMessage(chatId, `❌ Error: ${err.message}`);
    }
  };

  bot.onText(/\/pair/, handlePair);
  bot.onText(/\/connect/, handlePair);

  // Force re-pair
  bot.onText(/\/repair/, async (msg) => {
    const chatId = msg.chat.id;
    await bot.sendMessage(chatId, "🗑️ Clearing old session and generating new QR...");
    await logout();
    clearSession();
    // Trigger pair again
    handlePair(msg);
  });
}

module.exports = { registerPairCommands };
