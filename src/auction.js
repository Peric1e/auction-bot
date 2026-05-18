import cron from "node-cron";
import { logEvent, logAuctionFinish } from "./logger.js";

let activeAuction = null;
let activeJob = null;
const AUCTION_TIMEOUT = 30000;

export function getActiveAuction() {
  return activeAuction;
}

export function setGroupChatId(chatId, groupPostMessageId) {
  if (!activeAuction) return;
  activeAuction.groupChatId = chatId;
  if (groupPostMessageId && !activeAuction.groupPostMessageId) {
    activeAuction.groupPostMessageId = groupPostMessageId;
  }
}

export function startAuction(auction, postMessageId, chatId, bot, ownerChatId) {
  if (activeAuction) {
    logEvent("⚠️ AUCTION_SKIP", "Аукціон вже активний, пропускаємо");
    return;
  }

  const [hour, minute] = auction.endTime.split(":");
  const now = new Date();
  const endDate = new Date();
  endDate.setHours(Number(hour), Number(minute), 0, 0);

  if (endDate <= now) {
    logEvent("⚠️ AUCTION_SKIP", "Час аукціону вже минув", { endTime: auction.endTime });
    return;
  }

  activeAuction = {
    ...auction,
    postMessageId,
    chatId,
    groupChatId: null,
    groupPostMessageId: null,
    currentPrice: auction.startPrice,
    lastValidBid: null,
    isCancelled: false,
  };

  activeJob = cron.schedule(`${minute} ${hour} * * *`, async () => {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("finishAuction timeout exceeded")), AUCTION_TIMEOUT)
    );

    try {
      await Promise.race([finishAuction(bot, ownerChatId), timeoutPromise]);
    } catch (e) {
      logEvent("❌ CRON_ERROR", "Помилка при завершенні аукціону", { error: e.message });
      activeAuction = null;
    } finally {
      if (activeJob) {
        activeJob.stop();
        activeJob = null;
      }
    }
  });
}

export function registerBid(userId, username, amount, messageId) {
  if (!activeAuction) return;
  activeAuction.currentPrice = amount;
  activeAuction.lastValidBid = { userId, username, amount, messageId };
}

export function cancelAuction() {
  if (!activeAuction) return false;

  if (activeJob) {
    activeJob.stop();
    activeJob = null;
  }

  activeAuction.isCancelled = true;
  activeAuction = null;

  return true;
}

async function sendWithRetry(fn, label, retries = 3, delayMs = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await fn();
      return;
    } catch (e) {
      logEvent(`❌ ${label}`, `Спроба ${attempt}/${retries}`, { error: e.message });
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  logEvent(`❌ ${label}`, "Всі спроби вичерпано, повідомлення не відправлено");
}

async function finishAuction(bot, ownerChatId) {
  if (!activeAuction) return;

  // Grace period
  await new Promise((resolve) => setTimeout(resolve, 2000));

  if (!activeAuction) return;

  const { lastValidBid, chatId, groupChatId, postMessageId } = activeAuction;

  try {
    if (lastValidBid) {
      await sendWithRetry(
        () => bot.api.sendMessage(
          ownerChatId,
          `🏆 Аукціон завершено!\n\nПереможець: @${lastValidBid.username}\nСтавка: ${lastValidBid.amount} грн`
        ),
        "SEND_WINNER_OWNER"
      );

      await sendWithRetry(
        () => bot.api.forwardMessage(ownerChatId, chatId, postMessageId),
        "FORWARD_POST"
      );

      if (groupChatId) {
        await sendWithRetry(
          () => bot.api.sendMessage(
            groupChatId,
            `🎉 Вітаємо, @${lastValidBid.username}! Ви перемогли зі ставкою ${lastValidBid.amount} грн!\n\n` +
            `З вами зв'яжуться з цього акаунту @corporateSava`,
            {
              reply_parameters: { message_id: lastValidBid.messageId },
              parse_mode: "HTML",
            }
          ),
          "ANNOUNCE_WINNER_GROUP"
        );
      }

      logAuctionFinish(lastValidBid);
    } else {
      await sendWithRetry(
        () => bot.api.sendMessage(ownerChatId, "⚠️ Аукціон завершено, але ставок не було."),
        "SEND_NO_BIDS"
      );
    }
  } catch (e) {
    logEvent("❌ FINISH_AUCTION_ERROR", "Критична помилка завершення аукціону", { error: e.message });
  } finally {
    activeAuction = null;
  }
}