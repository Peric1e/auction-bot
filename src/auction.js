import cron from "node-cron";

let activeAuction = null;

export function getActiveAuction() {
  return activeAuction;
}

export function setGroupChatId(chatId) {
  if (!activeAuction) return;
  activeAuction.groupChatId = chatId;
}

export function startAuction(auction, postMessageId, chatId, bot, ownerChatId) {
  const [hour, minute] = auction.endTime.split(":");

  const now = new Date();
  const endDate = new Date();
  endDate.setHours(Number(hour), Number(minute), 0, 0);

  if (endDate <= now) return;

  activeAuction = {
    ...auction,
    postMessageId,
    chatId,
    groupChatId: null,
    currentPrice: auction.startPrice,
    lastValidBid: null,
    deletedBidUsers: new Set(),
  };

  const job = cron.schedule(`${minute} ${hour} * * *`, async () => {
    await finishAuction(bot, ownerChatId);
    job.stop();
  });
}

export function registerBid(userId, username, amount, messageId) {
  if (!activeAuction) return;
  activeAuction.currentPrice = amount;
  activeAuction.lastValidBid = { userId, username, amount, messageId };
}

export function registerDeletedBid(userId) {
  if (!activeAuction) return;
  activeAuction.deletedBidUsers.add(userId);
}

export function hasDeletedBid(userId) {
  return activeAuction?.deletedBidUsers.has(userId) ?? false;
}

async function finishAuction(bot, ownerChatId) {
  if (!activeAuction) return;

  const { lastValidBid, chatId, groupChatId, postMessageId } = activeAuction;

  if (lastValidBid) {
    await bot.api.sendMessage(
      ownerChatId,
      `🏆 Аукціон завершено!\n\nПереможець: @${lastValidBid.username}\nСтавка: ${lastValidBid.amount} грн`
    );

    await bot.api.forwardMessage(ownerChatId, chatId, postMessageId);

    await bot.api.sendMessage(
      groupChatId,
      `🎉 Вітаємо, @${lastValidBid.username}! Ви перемогли зі ставкою ${lastValidBid.amount} грн!\n\n` +
      `З вами зв'яжуться з цього акаунту @corporateSava`,
      {
        reply_parameters: { message_id: lastValidBid.messageId },
        parse_mode: "HTML",
      }
    );
  } else {
    await bot.api.sendMessage(ownerChatId, "⚠️ Аукціон завершено, але ставок не було.");
  }

  activeAuction = null;
}