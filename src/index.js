import { Bot } from "grammy";
import { config } from "dotenv";
import { setupCommands } from "./handlers/commands.js";
import { setupChannelPost } from "./handlers/channelPost.js";
import { setupMessage } from "./handlers/message.js";
import { logEvent } from "./logger.js";
import { restoreAuction } from "./auction.js";

config();

const bot = new Bot(process.env.BOT_TOKEN);
const OWNER_ID = String(process.env.OWNER_TELEGRAM_ID).trim();
const CONTACT_USERNAME = process.env.CONTACT_USERNAME;

if (!OWNER_ID) {
  throw new Error("❌ OWNER_TELEGRAM_ID не додано в .env!");
}
if (!CONTACT_USERNAME) {
  throw new Error("❌ CONTACT_USERNAME не додано в .env!");
}

logEvent("🤖 BOT", "Бот стартував");
restoreAuction(bot, OWNER_ID);

setupCommands(bot, OWNER_ID);
setupChannelPost(bot, OWNER_ID, CONTACT_USERNAME);
setupMessage(bot);

bot.catch((err) => {
  console.error("❌ Необроблена помилка бота:", err);
  logEvent("❌ CRITICAL_ERROR", "Необроблена помилка в боті", {
    message: err.message,
    stack: err.stack?.split("\n")[0],
  });
});

bot.start();
logEvent("✅ BOT", "Бот почав слухати");