import fs from "fs";
import path from "path";

const LOG_DIR = "logs";
const MAX_AGE_DAYS = 7;

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR);
}

function rotateLogs() {
  const files = fs.readdirSync(LOG_DIR);
  const cutoff = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

  for (const file of files) {
    if (!file.startsWith("bot-") || !file.endsWith(".log")) continue;
    const filePath = path.join(LOG_DIR, file);
    const { mtimeMs } = fs.statSync(filePath);
    if (mtimeMs < cutoff) {
      fs.unlinkSync(filePath);
    }
  }
}

function getTodayFileName() {
  const d = new Date();
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return path.join(LOG_DIR, `bot-${date}.log`);
}

rotateLogs();

const LOG_FILE = getTodayFileName();
const startTime = Date.now();

function getTimestamp() {
  const elapsed = Date.now() - startTime;
  const time = new Date().toLocaleTimeString("uk-UA");
  return `${time} (+${elapsed}ms)`;
}

export function logEvent(type, message, data = null) {
  const log = `[${getTimestamp()}] [${type}] ${message}${data ? " → " + JSON.stringify(data) : ""}\n`;
  console.log(log.trim());
  fs.appendFileSync(LOG_FILE, log);
}

export function logParsing(text, result) {
  if (!result) {
    const preview = text?.slice(0, 50).replace(/\n/g, " ") + "...";
    logEvent("❌ NOT_AUCTION", preview);
  } else if (result._parseError) {
    const preview = text?.slice(0, 50).replace(/\n/g, " ") + "...";
    logEvent("⚠️ PARSE_ERROR", result._parseError, { preview });
  } else {
    logEvent("✅ AUCTION_FOUND", "Аукціон розпізнаний", result);
  }
}

export function logBid(username, amount, valid, reason = null) {
  if (valid) {
    logEvent("✅ BID_ACCEPTED", `@${username}`, { amount });
  } else {
    logEvent("❌ BID_REJECTED", `@${username}`, { amount, reason });
  }
}

export function logAuctionStart(auction) {
  logEvent("🔨 AUCTION_START", "Аукціон почався", auction);
}

export function logAuctionFinish(winner) {
  logEvent("🏆 AUCTION_FINISH", "Переможець", winner);
}

export function logTiming(action, duration) {
  logEvent("⏱️ TIMING", action, { duration: `${duration}ms` });
}