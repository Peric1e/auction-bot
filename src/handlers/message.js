import { validateBid } from "../validator.js";
import {
  getActiveAuction,
  registerBid,
  setGroupChatId,
} from "../auction.js";
import { logBid, logTiming, logEvent } from "../logger.js";

async function sendBidErrorMessage(bot, chatId, replyToMessageId, text) {
  try {
    await bot.api.sendMessage(chatId, text, {
      reply_parameters: { message_id: replyToMessageId },
      parse_mode: "HTML",
    });
  } catch (e) {
    logEvent("⚠️ SEND_ERROR", "Помилка при відправці повідомлення про помилку ставки", {
      error: e.message,
    });
  }
}

export function setupMessage(bot) {
  bot.on("message", async (ctx) => {
    const messageStartTime = Date.now();

    if (ctx.from?.is_bot) return;
    if (ctx.message.sender_chat?.type === "channel") return;

    const chat = ctx.chat;
    if (chat.type !== "group" && chat.type !== "supergroup") return;

    const text = ctx.message.text || "";
    if (!text) return;

    const messageId = ctx.message.message_id;
    const userId = ctx.from.id;
    const username = ctx.from.username || ctx.from.first_name;

    const active = getActiveAuction();
    if (!active || active.isCancelled) return;

    if (!active.groupChatId) {
      const groupPostMessageId = ctx.message.reply_to_message?.message_id ?? null;
      setGroupChatId(chat.id, groupPostMessageId);
    }

    const result = validateBid(
      text,
      active.currentPrice,
      active,
      active.lastValidBid?.userId ?? null,
      userId
    );

    if (result.valid) {
      registerBid(userId, username, result.amount, messageId);
      logBid(username, result.amount, true);

      try {
        const reactionStartTime = Date.now();
        await bot.api.setMessageReaction(chat.id, messageId, [
          { type: "emoji", emoji: "❤️" },
        ]);
        logTiming("setMessageReaction", Date.now() - reactionStartTime);
      } catch (e) {
        logEvent("❌ REACTION_ERROR", "Помилка реакції", {
          error: e.message,
          chatId: chat.id,
          messageId: messageId,
        });
      }
    } else if (result.reason === "too_high") {
      logBid(username, text, false, "too_high");
      await sendBidErrorMessage(
        bot, chat.id, messageId,
        `⚠️ @${username}, ставка перевищує максимальний крок!\n` +
        `Максимальна ставка зараз: <code>${active.currentPrice + active.maxStep} грн</code>`
      );
    } else if (result.reason === "too_low") {
      logBid(username, text, false, "too_low");
      await sendBidErrorMessage(
        bot, chat.id, messageId,
        `⚠️ @${username}, ставка занадто мала!\n` +
        `Мінімальна ставка зараз: <code>${active.currentPrice + active.minStep} грн</code>`
      );
    } else if (result.reason === "own_bid") {
      logBid(username, text, false, "own_bid");
      await sendBidErrorMessage(
        bot, chat.id, messageId,
        `⚠️ @${username}, не можна перебивати власну ставку!`
      );
    }

    logTiming("обробка повідомлення", Date.now() - messageStartTime);
  });
}