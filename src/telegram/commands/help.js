const { getBot } = require("../bot");
const settings = require("../../../config/settings");

function registerHelpCommand() {
  const bot = getBot();
  if (!bot) return;

  bot.onText(/\/help|\/start/, async (msg) => {
    const chatId = msg.chat.id;

    const text = `
🌟 *Welcome to ${settings.botName}*
Owned by *${settings.ownerName}*

*Available Commands:*

🔗 /pair or /connect  
→ Generate QR to link WhatsApp

🔄 /repair  
→ Clear session & generate new QR

📊 /status  
→ Check connection & uptime

🔁 /restart  
→ Restart the bot process

ℹ️ /help  
→ Show this message

────────────────
Only the owner can control this bot.
    `.trim();

    await bot.sendMessage(chatId, text, { parse_mode: "Markdown" });
  });
}

module.exports = { registerHelpCommand };
