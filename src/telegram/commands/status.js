const { getBot } = require("../bot");
const { getStatus } = require("../../whatsapp/client");
const { formatUptime } = require("../../utils/helpers");
const settings = require("../../../config/settings");

function registerStatusCommand() {
  const bot = getBot();
  if (!bot) return;

  bot.onText(/\/status/, async (msg) => {
    const chatId = msg.chat.id;
    const wa = getStatus();
    const uptime = formatUptime(process.uptime());

    const statusEmoji = {
      open: "🟢 Connected",
      connecting: "🟡 Connecting...",
      qr: "📱 Waiting for QR scan",
      disconnected: "🔴 Disconnected"
    };

    const text = `
🤖 *${settings.botName} Status*

👤 Owner: ${settings.ownerName}
📡 WhatsApp: ${statusEmoji[wa.status] || wa.status}
💾 Session exists: ${wa.hasSession ? "Yes" : "No"}
⏱ Uptime: ${uptime}
🖥 Platform: Render / Node.js
    `.trim();

    await bot.sendMessage(chatId, text, { parse_mode: "Markdown" });
  });
}

module.exports = { registerStatusCommand };
