# Auction Bot

A Telegram bot for automating knife auctions in channels. Monitors bids in linked group comments, validates them against auction rules, reacts to valid bids with ❤️, and announces the winner when the auction ends.

---

## How It Works

1. Owner posts an auction announcement in the channel
2. Bot detects the post and parses the rules (start price, min/max bid step, end time)
3. Users place bids in the linked discussion group
4. Bot validates each bid and reacts with ❤️ to valid ones
5. At end time — announces the winner in the group and notifies the owner in DM
6. Owner can cancel an active auction early with `/stop`

---

## Stack

- Node.js v18+
- [grammY](https://grammy.dev) — Telegram Bot framework
- [node-cron](https://github.com/node-cron/node-cron) — auction end time scheduler
- [p-queue](https://github.com/sindresorhus/p-queue) — API request queue (rate limit protection)
- [dotenv](https://github.com/motdotla/dotenv) — environment config

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create `.env` in the project root

```
BOT_TOKEN=your_telegram_bot_token
OWNER_TELEGRAM_ID=your_telegram_user_id
CONTACT_USERNAME=@your_manager_username
TZ=Europe/Kyiv
```

You can get your Telegram ID from [@userinfobot](https://t.me/userinfobot).

### 3. Bot configuration (BotFather)

- Disable Privacy Mode: BotFather → Bot Settings → Group Privacy → Turn off
- Set commands: BotFather → Edit Bot → Edit Commands:
```
start - Активувати бота
stop - Зупинити аукціон
status - Статус аукціону
```

### 4. Run

```bash
npm run dev    # development (auto-restart)
npm start      # production
```

---

## Auction Post Format

The bot detects posts containing **«аукціон»** and **«починаємо»**:

```
🚨 Аукціон 🚨
Починаємо 500 грн
Мінімальний крок ставки 100 грн
‼️ Ставка НЕ повинна перевищувати 300 грн
Час закінчення 15:30
```

| Field | Pattern | Required |
|-------|---------|----------|
| Start price | `Починаємо {number}` | ✅ |
| End time | `Час закінчення {HH:MM}` | ✅ |
| Min step | `Мінімальний крок ... {number}` | ❌ (default: 100) |
| Max step | `перевищувати {number}` | ❌ (no limit if omitted) |

---

## Bid Rules

- First bid must equal start price exactly
- Each next bid: `currentPrice + minStep ≤ bid ≤ currentPrice + maxStep`
- User cannot outbid their own bid
- Only plain numbers accepted: `600` ✅ / `600 грн` ❌

---

## Commands

| Command | Description | Access |
|---------|-------------|--------|
| `/start` | Activate bot | Owner |
| `/stop` | Cancel active auction | Owner |
| `/status` | Show current auction state | Owner |

---

## Project Structure

```
auction-bot/
├── src/
│   ├── index.js              # Entry point, bot initialization
│   ├── auction.js            # Auction state, lifecycle, finish, retry
│   ├── parser.js             # Parses auction rules from post text
│   ├── validator.js          # Bid validation logic
│   ├── logger.js             # Event logging with daily log rotation
│   ├── api-queue.js          # p-queue wrapper for Telegram API rate limiting
│   └── handlers/
│       ├── channelPost.js    # Detects and starts auction from channel post
│       ├── message.js        # Bid handler in group comments
│       └── commands.js       # Bot commands (/start, /stop, /status)
├── unit-tests.js             # Unit tests (parser + validator)
├── load-test.js              # Load test (queue simulation)
├── .env                      # Environment variables (not committed)
├── .gitignore
└── package.json
```

---

## Reliability

- **API queue** — p-queue prevents Telegram 429 errors with 10+ simultaneous bids
- **Retry logic** — final messages (winner announcement) retry up to 3 times
- **Grace period** — 2 second delay before finishing to catch last-second bids
- **Timeout** — 60 second hard timeout for auction finish process
- **Duplicate protection** — ignores edited posts and blocks second auction while one is active
- **Error handling** — all API calls wrapped in try/catch with full logging

---

## Logging

Daily log files saved to `logs/bot-YYYY-MM-DD.log`, auto-deleted after 7 days.

```
[12:46:30 (+183ms)] [🔨 AUCTION_START] Аукціон почався → {startPrice: 500, ...}
[12:46:45 (+15183ms)] [✅ BID_ACCEPTED] @username → {amount: 600}
[15:30:00 (+10800183ms)] [🏆 AUCTION_FINISH] Переможець → {username, amount}
```

---

## .gitignore

```
node_modules/
.env
logs/
```