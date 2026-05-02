import { Bot } from "grammy";
import { config } from "dotenv";
import { parseAuction } from "./parser.js";
import { validateBid } from "./validator.js";
import {
  startAuction,
  getActiveAuction,
  registerBid,
  registerDeletedBid,
  hasDeletedBid,
  setGroupChatId,
} from "./auction.js";

config();

const bot = new Bot(process.env.BOT_TOKEN);
const OWNER_ID = process.env.OWNER_TELEGRAM_ID;

bot.command("start", async (ctx) => {
  if (ctx.from.id.toString() === OWNER_ID) {
    await ctx.reply("✅ Бот активовано! Буду передавати переможців.");
  } else {
    await ctx.reply("👋 Цей бот працює в приватному режимі.");
  }
});

bot.command("stop", async (ctx) => {
  if (ctx.from.id.toString() !== OWNER_ID) return;
  const active = getActiveAuction();
  if (!active) {
    await ctx.reply("⚠️ Немає активного аукціону.");
    return;
  }
  active.lastValidBid = null;
  await ctx.reply("🛑 Аукціон скасовано.");
});

bot.on("channel_post", async (ctx) => {
  const text = ctx.channelPost.text;
  const messageId = ctx.channelPost.message_id;
  const chatId = ctx.chat.id;

  const auction = parseAuction(text);
  if (auction) {
    startAuction(auction, messageId, chatId, bot, OWNER_ID);
  }
});

bot.on("message", async (ctx) => {
  if (ctx.from?.is_bot) return;
  if (ctx.message.sender_chat) return;

  const chat = ctx.chat;
  if (chat.type !== "group" && chat.type !== "supergroup") return;

  const text = ctx.message.text;
  const messageId = ctx.message.message_id;
  const userId = ctx.from.id;
  const username = ctx.from.username || ctx.from.first_name;

  const active = getActiveAuction();
  if (!active) return;

  if (!active.groupChatId) {
    setGroupChatId(chat.id);
  }

  const result = validateBid(
    text,
    active.currentPrice,
    active,
    hasDeletedBid(userId),
    active.lastValidBid?.userId,
    userId
  );

  if (result.valid) {
    try {
      await bot.api.setMessageReaction(chat.id, messageId, [
        { type: "emoji", emoji: "❤️" },
      ]);
    } catch (_) {}
    registerBid(userId, username, result.amount, messageId);
  } else if (result.reason === "too_high") {
    await bot.api.sendMessage(
      chat.id,
      `⚠️ @${username}, ставка перевищує максимальний крок!\n` +
      `Максимальна ставка зараз: <code>${active.currentPrice + active.maxStep} грн</code>`,
      { reply_parameters: { message_id: messageId }, parse_mode: "HTML" }
    );
  } else if (result.reason === "too_low") {
    await bot.api.sendMessage(
      chat.id,
      `⚠️ @${username}, ставка занадто мала!\n` +
      `Мінімальна ставка зараз: <code>${active.currentPrice + active.minStep} грн</code>`,
      { reply_parameters: { message_id: messageId }, parse_mode: "HTML" }
    );
  } else if (result.reason === "own_bid") {
    await bot.api.sendMessage(
      chat.id,
      `⚠️ @${username}, не можна перебивати власну ставку!`,
      { reply_parameters: { message_id: messageId }, parse_mode: "HTML" }
    );
  }
});

bot.on("edited_message", async (ctx) => {
  if (ctx.from?.is_bot) return;
  if (ctx.editedMessage.sender_chat) return;

  const active = getActiveAuction();
  if (!active) return;

  if (!ctx.editedMessage.text) {
    registerDeletedBid(ctx.from.id);
  }
});

bot.start();

// HTTP server для Render
import http from "http";

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("Bot is running");
});

server.listen(3000);