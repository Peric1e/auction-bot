import { parseAuction } from "../parser.js";
import { startAuction, getActiveAuction } from "../auction.js";
import { logParsing, logAuctionStart, logEvent } from "../logger.js";

export function setupChannelPost(bot, OWNER_ID, CONTACT_USERNAME) {
  bot.on("channel_post", async (ctx) => {
    // Ignore edited posts
    if (ctx.channelPost.edit_date) {
      logEvent("⚠️ CHANNEL_POST_SKIP", "Пропускаємо відредагований пост");
      return;
    }

    // Do not launch auction when active
    if (getActiveAuction()) {
      logEvent("⚠️ CHANNEL_POST_SKIP", "Аукціон вже активний");
      return;
    }

    const text = ctx.channelPost.text || ctx.channelPost.caption;
    const messageId = ctx.channelPost.message_id;
    const chatId = ctx.chat.id;

    const auction = parseAuction(text);
    logParsing(text, auction);

    if (auction) {
      logAuctionStart(auction);
      await startAuction(auction, messageId, chatId, bot, OWNER_ID, CONTACT_USERNAME);
    }
  });
}