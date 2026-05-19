import { getActiveAuction, cancelAuction } from "../auction.js";
import { logEvent } from "../logger.js";

export function setupCommands(bot, OWNER_ID) {
  bot.command("start", async (ctx) => {
    if (ctx.from.id.toString() === OWNER_ID) {
      await ctx.reply("✅ Бот активовано! Буду передавати переможців.");
      logEvent("👤 OWNER", "Власник активував бота");
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

    const { groupChatId, groupPostMessageId } = active;

    cancelAuction();

    if (groupChatId) {
      try {
        await bot.api.sendMessage(
          groupChatId,
          `🛑 Аукціон завершено власником! Ставки більше не приймаються.`,
          { reply_parameters: { message_id: groupPostMessageId } }
        );
      } catch (e) {
        logEvent("⚠️ SEND_ERROR", "Помилка відправки повідомлення про скасування", { error: e.message });
      }
    }

    await ctx.reply("🛑 Аукціон скасовано.");
    logEvent("⏹️ STOP", "Аукціон скасовано власником");
  });

  bot.command("status", async (ctx) => {
  if (ctx.from.id.toString() !== OWNER_ID) return;

  const active = getActiveAuction();

  if (!active) {
    await ctx.reply("⚪️ Аукціон не активний.");
    return;
  }

  const { currentPrice, lastValidBid, endTime, startPrice } = active;

  await ctx.reply(
    `🟢 Аукціон активний\n\n` +
    `⏰ Завершення: ${endTime}\n` +
    `💰 Стартова ціна: ${startPrice} грн\n` +
    `📈 Поточна ставка: ${currentPrice} грн\n` +
    `👤 Лідер: ${lastValidBid ? `@${lastValidBid.username}` : "ставок ще немає"}`
  );
});

}