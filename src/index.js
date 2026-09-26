require("dotenv").config();
const express = require("express");
const settings = require("../config/settings");
const logger = require("./utils/logger");
const { startKeepAlive } = require("./utils/keepAlive");

// Telegram
const { initTelegram, getBot } = require("./telegram/bot");
const { registerPairCommands } = require("./telegram/commands/pair");
const { registerStatusCommand } = require("./telegram/commands/status");
const { registerHelpCommand } = require("./telegram/commands/help");
const { registerRestartCommand } = require("./telegram/commands/restart");

// WhatsApp
const { startWhatsApp } = require("./whatsapp/client");
const { setupEvents } = require("./whatsapp/events");
const { getSocket } = require("./whatsapp/client");

const PORT = process.env.PORT || 10000;
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OWNER_ID = process.env.OWNER_TELEGRAM_ID;

async function main() {
  console.log("=================================");
  console.log(`   🌟 ${settings.botName} is starting...`);
  console.log(`   Owner: ${settings.ownerName}`);
  console.log("=================================");

  // Validate env
  if (!TELEGRAM_TOKEN || TELEGRAM_TOKEN.includes("your_telegram")) {
    logger.error("❌ TELEGRAM_BOT_TOKEN is missing in .env");
    process.exit(1);
  }
  if (!OWNER_ID || OWNER_ID.includes("your_telegram")) {
    logger.error("❌ OWNER_TELEGRAM_ID is missing in .env");
    process.exit(1);
  }

  // 1. Start Express (needed for Render + KeepAlive)
  const app = express();
  
  app.get("/", (req, res) => {
    res.send(`
      <h1>🌟 ${settings.botName}</h1>
      <p>Owner: ${settings.ownerName}</p>
      <p>Status: Online</p>
      <p>This is the health check endpoint.</p>
    `);
  });

  app.get("/health", (req, res) => {
    res.json({ status: "ok", bot: settings.botName });
  });

  app.listen(PORT, () => {
    logger.info(`Express server running on port ${PORT}`);
  });

  // 2. Initialize Telegram
  initTelegram(TELEGRAM_TOKEN, OWNER_ID);

  // 3. Register all Telegram commands
  registerHelpCommand();
  registerPairCommands();
  registerStatusCommand();
  registerRestartCommand();

  logger.info("Telegram commands registered: /pair /connect /status /restart /help");

  // 4. Keep-alive (important for Render free tier)
  const renderUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
  startKeepAlive(renderUrl);

  logger.info("✅ Lumina is ready!");
  logger.info("Send /pair or /connect to your Telegram bot to link WhatsApp.");
}

main().catch((err) => {
  logger.error("Fatal error:", err);
  process.exit(1);
});
